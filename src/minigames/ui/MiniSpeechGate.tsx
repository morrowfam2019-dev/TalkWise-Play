"use client";

/**
 * The speech moment every mini-game shares.
 *
 * Grown from GAME-002's `SpeechGate` rather than written twice — same
 * philosophy, same third-attempt unlock, same "I SAID IT" escape hatch —
 * with the differences a mini-game genuinely needs:
 *
 * - **Three kinds of target, not two.** A mini Beginner target is an
 *   isolated *sound*, recognised through `SoundRecognizer` with GAME-001's
 *   wide accept lists, because §5's Beginner tier is sounds and simple
 *   concepts. Words and sentences behave exactly as they do in Basketball.
 * - **The manual button is on screen from the first second**, not unlocked
 *   by failing twice. That is GAME-001's Beginner rule, and it belongs here
 *   for the same reason: a mini-game is 30 seconds long, and making a child
 *   fail twice before offering them a way through is most of their session.
 * - **A voice-detected reaction.** §17 asks for immediate visual feedback
 *   when a voice is heard, improved into a game-world reaction. The sound
 *   wave animates while listening and the target card bounces when a match
 *   lands.
 *
 * ## What this never does
 *
 * It never says WRONG, FAILED, or anything about pronunciation (§17). Every
 * path out of it is positive: heard you, try again, hear Miss Maya, your
 * turn, or "I said it". A child cannot be stuck here, and a bad microphone
 * cannot cost them a game.
 */

import { useEffect, useRef, useState } from "react";
import {
  SoundRecognizer,
  PhraseRecognizer,
  WordRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
  type SpeechListenStatus,
} from "@/speech/recognition";
import type { MiniSpeechTarget } from "../speech";
import { MayaAvatar, speakerFor } from "./MayaCoach";

/** Attempts before the gate opens regardless. See the note above. */
const MAX_ATTEMPTS = 3;
/** Miss Maya models the target after this many misses. */
const EXAMPLE_AFTER_ATTEMPT = 2;

const ASSIST_WORD_TIMEOUT_MS = 7000;
const SENTENCE_TIMEOUT_MS = 8000;
const SENTENCE_ASSIST_TIMEOUT_MS = 11000;

export function MiniSpeechGate({
  target,
  headline,
  micEnabled,
  assist,
  onMicEnabledChange,
  onUnlock,
  onSkip,
}: {
  target: MiniSpeechTarget;
  /** Small caps line above the target, e.g. "Say It To Start". */
  headline: string;
  micEnabled: boolean;
  assist: boolean;
  onMicEnabledChange: (enabled: boolean) => void;
  /** Called once, when the child may proceed. */
  onUnlock: (spoke: boolean) => void;
  /** Optional "not right now" exit. Games that gate a whole round offer it;
   * per-round games do not, because there is nothing to skip to. */
  onSkip?: () => void;
}) {
  const [micPermission, setMicPermission] = useState<
    "not-requested" | "granted" | "denied"
  >("not-requested");
  const [listeningStatus, setListeningStatus] =
    useState<SpeechListenStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [matchedWordIds, setMatchedWordIds] = useState<string[]>([]);
  const [heard, setHeard] = useState(false);

  const attemptsRef = useRef(0);
  const matchedRef = useRef<string[]>([]);
  const wordRef = useRef<WordRecognizer | null>(null);
  const phraseRef = useRef<PhraseRecognizer | null>(null);
  const soundRef = useRef<SoundRecognizer | null>(null);
  const unlockedRef = useRef(false);

  // The caller remounts this per target (a `key` change), so all state above
  // already starts fresh — no reset effect needed.
  useEffect(() => {
    return () => {
      wordRef.current?.stop();
      phraseRef.current?.stop();
      soundRef.current?.stop();
    };
  }, []);

  // What pressing the speaker plays, or null when this target has no
  // recording — in which case no speaker button is offered at all.
  const speak = speakerFor(target);

  useEffect(() => {
    if (!showExample || !speak) return;
    speak();
    // `speak` is derived from `target`, which is fixed for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showExample]);

  const stopAll = () => {
    wordRef.current?.stop();
    phraseRef.current?.stop();
    soundRef.current?.stop();
  };

  const unlock = (spoke: boolean) => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    stopAll();
    onUnlock(spoke);
  };

  function handleListenTimeout() {
    attemptsRef.current += 1;
    const next = attemptsRef.current;
    setAttempts(next);

    if (next >= MAX_ATTEMPTS) {
      // The gate opens. `spoke` is still true: the child took three turns at
      // saying it, which is participation, and §19's speech reward is for
      // participation rather than for a recogniser's verdict.
      unlock(true);
    } else if (next === EXAMPLE_AFTER_ATTEMPT && speak) {
      // Only worth showing Miss Maya's model when she can actually say it.
      setShowExample(true);
    } else {
      startListeningAttempt();
    }
  }

  function handleMatch() {
    setHeard(true);
    // A beat of celebration before the game starts, so a child sees that
    // they were heard rather than being yanked straight into play.
    window.setTimeout(() => unlock(true), 420);
  }

  function startListeningAttempt() {
    setShowExample(false);

    if (target.kind === "sound" && target.soundConfig) {
      const recognizer = new SoundRecognizer();
      soundRef.current = recognizer;
      recognizer.listenFor(target.soundConfig, {
        onMatch: handleMatch,
        onNoMatch: handleListenTimeout,
        onStatus: setListeningStatus,
        timeoutMs: assist ? ASSIST_WORD_TIMEOUT_MS + 2000 : undefined,
      });
      return;
    }

    if (target.wordByWord) {
      const recognizer = new PhraseRecognizer();
      phraseRef.current = recognizer;
      recognizer.listenFor(target.words, matchedRef.current, {
        onProgress: (ids) => {
          matchedRef.current = ids;
          setMatchedWordIds(ids);
        },
        onComplete: () => {
          matchedRef.current = target.words.map((word) => word.id);
          setMatchedWordIds(matchedRef.current);
          handleMatch();
        },
        onNoMatch: (ids) => {
          matchedRef.current = ids;
          setMatchedWordIds(ids);
          handleListenTimeout();
        },
        onStatus: setListeningStatus,
        timeoutMs: assist ? SENTENCE_ASSIST_TIMEOUT_MS : SENTENCE_TIMEOUT_MS,
      });
      return;
    }

    const recognizer = new WordRecognizer();
    wordRef.current = recognizer;
    recognizer.listenFor(target.text, {
      onMatch: handleMatch,
      onNoMatch: handleListenTimeout,
      onStatus: setListeningStatus,
      timeoutMs: assist ? ASSIST_WORD_TIMEOUT_MS : undefined,
    });
  }

  const handleRequestMic = async () => {
    if (!isSpeechRecognitionSupported()) {
      setMicPermission("denied");
      return;
    }
    try {
      const granted = await requestMicPermission();
      if (granted) {
        setMicPermission("granted");
        startListeningAttempt();
      } else {
        setMicPermission("denied");
      }
    } catch {
      setMicPermission("denied");
    }
  };

  const handleMicOff = () => {
    stopAll();
    wordRef.current = null;
    phraseRef.current = null;
    soundRef.current = null;
    setListeningStatus("idle");
    setShowExample(false);
    onMicEnabledChange(false);
  };

  const listening =
    micPermission === "granted" && listeningStatus === "listening";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={target.prompt}
      className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#141420]/70 p-4 backdrop-blur-sm"
    >
      <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-5 text-center shadow-2xl sm:p-7">
        <p className="text-xs font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          {headline}
        </p>

        <div
          className={`mt-2 text-5xl ${heard ? "tw-star" : "tw-float"}`}
          aria-hidden
        >
          {target.glyph}
        </div>

        {target.wordByWord ? (
          <div className="mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1">
            {target.words.map((word) => {
              const done = matchedWordIds.includes(word.id);
              return (
                <span
                  key={word.id}
                  className={`rounded-lg px-1.5 py-0.5 text-2xl font-black transition-colors ${
                    done ? "bg-[#d8f5e4] text-[#25a25a]" : "text-[#141420]"
                  }`}
                >
                  {word.text}
                  {done ? (
                    <span className="ml-0.5 align-middle text-base" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="mt-1 text-5xl font-black tracking-tight text-[#141420] sm:text-6xl">
            {target.text.toUpperCase()}
          </p>
        )}

        {target.cue ? (
          <p className="mt-1 text-sm font-bold text-[#6b6b80]">{target.cue}</p>
        ) : null}

        <p className="mt-3 text-xl font-extrabold text-[#2f7fd4]">
          {target.prompt}
        </p>

        {/* §17's voice-detected reaction: the wave animates while the
            microphone is open, so a child can see that it is listening. */}
        {listening ? (
          <div
            className="mt-3 flex h-8 items-end justify-center gap-1"
            aria-hidden
          >
            {[0, 1, 2, 3, 4].map((bar) => (
              <span
                key={bar}
                className="tw-wave w-2 rounded-full bg-[#2f7fd4]"
                style={{ animationDelay: `${bar * 90}ms` }}
              />
            ))}
          </div>
        ) : null}

        {heard ? (
          <p className="tw-pop mt-3 text-2xl font-black text-[#25a25a]">
            I HEARD YOU! 🎉
          </p>
        ) : null}

        {target.wordByWord && matchedWordIds.length > 0 && !heard ? (
          <p className="mt-1 text-xs font-bold text-[#25a25a]">
            {matchedWordIds.length} of {target.words.length} words — keep going!
          </p>
        ) : null}

        {showExample ? (
          <div className="tw-pop mt-4 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] p-3">
            <div className="flex items-center gap-3">
              <MayaAvatar className="h-12 w-12" />
              <div className="min-w-0 text-left">
                <p className="text-[0.6rem] font-black tracking-wide text-[#2f7fd4] uppercase">
                  Miss Maya says
                </p>
                <p className="truncate text-lg font-black text-[#141420]">
                  {target.model}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => speak?.()}
                className="flex-1 rounded-xl bg-[#2f7fd4] px-3 py-2.5 text-sm font-black text-white"
              >
                🔊 Hear it again
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExample(false);
                  startListeningAttempt();
                }}
                className="flex-1 rounded-xl bg-[#2ecc71] px-3 py-2.5 text-sm font-black text-white"
              >
                Now you try!
              </button>
            </div>
          </div>
        ) : (
          <>
            {speak ? (
              <button
                type="button"
                onClick={speak}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] px-4 py-2.5 text-sm font-black text-[#2f7fd4]"
              >
                <MayaAvatar className="h-7 w-7" />
                🔊 Hear Miss Maya say it
              </button>
            ) : null}

            {micEnabled && micPermission === "not-requested" ? (
              <button
                type="button"
                onClick={handleRequestMic}
                className="mt-3 w-full rounded-2xl border-b-8 border-[#2563eb] bg-[#3b82f6] px-6 py-4 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                🎤 Use Microphone
              </button>
            ) : null}

            {listening ? (
              <>
                <button
                  disabled
                  className="mt-3 w-full rounded-2xl border-b-8 border-[#d97706] bg-[#f59e0b] px-6 py-4 text-xl font-black text-white shadow-lg"
                >
                  🎤 Listening...
                </button>
                {attempts > 0 ? (
                  <p className="mt-1 text-xs font-bold text-[#8a8aa0]">
                    Try {attempts + 1} of {MAX_ATTEMPTS}
                  </p>
                ) : null}
              </>
            ) : null}

            {/* Always available, from the very first second. */}
            <button
              type="button"
              onClick={() => unlock(true)}
              className="mt-3 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
            >
              I SAID IT!
            </button>

            {micEnabled && micPermission !== "denied" ? (
              <button
                type="button"
                onClick={handleMicOff}
                className="mt-2 w-full rounded-xl border-2 border-[#e2e4ee] px-4 py-2 text-xs font-black text-[#4a4a60]"
              >
                🎤 Turn microphone off
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onMicEnabledChange(true);
                  setMicPermission("not-requested");
                }}
                className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-bold text-[#2f7fd4] underline"
              >
                🎤 Turn the microphone back on
              </button>
            )}

            {onSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-bold text-[#8a8aa0] underline"
              >
                Just play for now
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
