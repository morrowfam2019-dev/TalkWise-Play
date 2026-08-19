/**
 * Word-confirmation speech recognition.
 *
 * Uses the browser's built-in SpeechRecognition to transcribe what the child
 * says and compares it against the challenge word, so background noise and
 * wrong words are rejected instead of any sound counting as an attempt.
 * Still no pronunciation *scoring* — a match either happened or it didn't.
 */

export type SpeechListenStatus =
  | "idle"
  | "listening"
  | "matched"
  | "no-match"
  | "unsupported";

export interface SpeechListenCallbacks {
  /** The target word was heard. */
  onMatch: () => void;
  /** Listening ended without hearing the target word (silence, noise, or a
   * different word). */
  onNoMatch: () => void;
  onStatus?: (status: SpeechListenStatus) => void;
  /** Overrides the default listen window — used by assist mode to give a
   * child longer to speak before an attempt times out. */
  timeoutMs?: number;
}

/** Minimal shape of the Web Speech API this module relies on — not present
 * in the default DOM lib, so declared locally instead of globally. */
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/** Prompts for microphone access up front, then releases the stream —
 * SpeechRecognition captures its own audio and reuses the granted
 * permission without a second prompt. Lets the UI show an explicit
 * "denied" state before attempting recognition. */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

const LISTEN_TIMEOUT_MS = 4500;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z]/g, "");
}

function isWordMatch(heard: string, target: string): boolean {
  const normalizedHeard = normalize(heard);
  const normalizedTarget = normalize(target);
  if (!normalizedHeard || !normalizedTarget) return false;
  return (
    normalizedHeard === normalizedTarget ||
    normalizedHeard.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedHeard)
  );
}

/** One word of a multi-word target, as produced by the content engine. */
export interface PhraseWord {
  id: string;
  /** Lowercased, punctuation stripped. */
  normalized: string;
}

export interface PhraseListenCallbacks {
  /** Fired whenever the set of recognised words grows. Cumulative. */
  onProgress: (matchedWordIds: string[]) => void;
  /** Every word in the phrase has now been recognised. */
  onComplete: () => void;
  /** The listen window ended with words still outstanding. */
  onNoMatch: (matchedWordIds: string[]) => void;
  onStatus?: (status: SpeechListenStatus) => void;
  timeoutMs?: number;
}

/**
 * Sentence recognition that keeps per-word state.
 *
 * The product reason this exists: on Hard targets a learner who says
 * "I read a blue book today" and is heard on every word except *blue* should
 * repair *blue*, not repeat the sentence. So matches are accumulated by word
 * id and carried across attempts by the caller — a word that was heard once
 * stays heard.
 *
 * Matching is deliberately generous, the same judgement `isWordMatch` makes:
 * this confirms a child spoke, it is not a pronunciation score, and a speech
 * difference must never read as failure.
 */
export class PhraseRecognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private timeoutId: number | null = null;
  private statusCallback: ((status: SpeechListenStatus) => void) | null = null;
  private finished = false;

  /**
   * Listens once for whichever words of `words` are not already in
   * `alreadyMatched`. Always calls exactly one of onComplete/onNoMatch.
   */
  listenFor(
    words: PhraseWord[],
    alreadyMatched: string[],
    {
      onProgress,
      onComplete,
      onNoMatch,
      onStatus,
      timeoutMs,
    }: PhraseListenCallbacks,
  ): void {
    this.statusCallback = onStatus ?? null;
    this.finished = false;

    const matched = new Set(alreadyMatched);
    const remaining = () => words.filter((word) => !matched.has(word.id));

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.updateStatus("unsupported");
      onNoMatch([...matched]);
      return;
    }

    const recognition = new Ctor();
    this.recognition = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    const finish = (completed: boolean) => {
      if (this.finished) return;
      this.finished = true;
      this.clearTimer();
      this.updateStatus(completed ? "matched" : "no-match");
      try {
        recognition.stop();
      } catch {
        // Already stopped — nothing to clean up.
      }
      if (completed) onComplete();
      else onNoMatch([...matched]);
    };

    const consider = (transcript: string) => {
      const heard = normalize(transcript);
      if (!heard) return;
      let grew = false;
      for (const word of remaining()) {
        if (!word.normalized) {
          // A token with no letters (stray punctuation) can never be heard,
          // so it is treated as already satisfied rather than blocking.
          matched.add(word.id);
          grew = true;
          continue;
        }
        if (heard.includes(word.normalized)) {
          matched.add(word.id);
          grew = true;
        }
      }
      if (grew) onProgress([...matched]);
      if (remaining().length === 0) finish(true);
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j += 1) {
          consider(result[j].transcript);
          if (this.finished) return;
        }
      }
    };
    recognition.onerror = () => finish(false);
    recognition.onend = () => finish(false);

    this.updateStatus("listening");
    try {
      recognition.start();
    } catch {
      finish(false);
      return;
    }

    this.timeoutId = window.setTimeout(
      () => finish(false),
      timeoutMs ?? LISTEN_TIMEOUT_MS,
    );
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private updateStatus(status: SpeechListenStatus): void {
    this.statusCallback?.(status);
  }

  /** Stops listening without firing either terminal callback. */
  stop(): void {
    this.finished = true;
    this.clearTimer();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped — nothing to clean up.
      }
    }
  }
}

export class WordRecognizer {
  private recognition: SpeechRecognitionLike | null = null;
  private timeoutId: number | null = null;
  private statusCallback: ((status: SpeechListenStatus) => void) | null =
    null;
  private finished = false;

  /** Listens once for `targetWord`, reporting a match or no-match. Always
   * calls exactly one of onMatch/onNoMatch. */
  listenFor(
    targetWord: string,
    { onMatch, onNoMatch, onStatus, timeoutMs }: SpeechListenCallbacks,
  ): void {
    this.statusCallback = onStatus ?? null;
    this.finished = false;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.updateStatus("unsupported");
      onNoMatch();
      return;
    }

    const recognition = new Ctor();
    this.recognition = recognition;
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    const finish = (matched: boolean) => {
      if (this.finished) return;
      this.finished = true;
      this.clearTimer();
      this.updateStatus(matched ? "matched" : "no-match");
      try {
        recognition.stop();
      } catch {
        // Already stopped — nothing to clean up.
      }
      if (matched) onMatch();
      else onNoMatch();
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j += 1) {
          if (isWordMatch(result[j].transcript, targetWord)) {
            finish(true);
            return;
          }
        }
      }
    };
    recognition.onerror = () => finish(false);
    recognition.onend = () => finish(false);

    this.updateStatus("listening");
    try {
      recognition.start();
    } catch {
      finish(false);
      return;
    }

    this.timeoutId = window.setTimeout(
      () => finish(false),
      timeoutMs ?? LISTEN_TIMEOUT_MS,
    );
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private updateStatus(status: SpeechListenStatus): void {
    this.statusCallback?.(status);
  }

  /** Stops listening without firing either callback. */
  stop(): void {
    this.finished = true;
    this.clearTimer();
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped — nothing to clean up.
      }
    }
  }
}
