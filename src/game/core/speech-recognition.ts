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
    { onMatch, onNoMatch, onStatus }: SpeechListenCallbacks,
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

    this.timeoutId = window.setTimeout(() => finish(false), LISTEN_TIMEOUT_MS);
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
