"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SpeechChallenge } from "@/content/speech";
import {
  WordRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
  type SpeechListenStatus,
} from "@/game/core/speech-recognition";

interface ChallengeModalProps {
  challenge: SpeechChallenge;
  /** Whether this player wants the microphone used at all. */
  micEnabled: boolean;
  /** Easy-mode assist: a longer listen window before an attempt times out.
   * Never changes which word is asked or how many attempts there are. */
  assist: boolean;
  /** Persists a change to that preference, so it holds for every checkpoint. */
  onMicEnabledChange: (enabled: boolean) => void;
  /** Called when the child confirms they practiced the word. */
  onConfirm: () => void;
  /** Called when the child backs out without practicing. */
  onDismiss: () => void;
  /** Called once the celebration finishes and play should resume. */
  onClose: () => void;
}

const CELEBRATION_MS = 1600;
const MAX_ATTEMPTS = 3;
const EXAMPLE_AFTER_ATTEMPT = 2;
/** Assist mode gives a child longer to speak before an attempt times out. */
const ASSIST_LISTEN_TIMEOUT_MS = 7000;

/** Browser text-to-speech fallback, used only when no recorded clip exists
 * for a word — picks a best-effort female voice. */
function speakExampleWord(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    utterance.pitch = 1.15;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) =>
      /female|samantha|victoria|zira|karen|moira|tessa|susan/i.test(voice.name),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis is best-effort — the face popup still shows the word.
  }
}

/** Plays the recorded "Miss Maya" clip for a word; falls back to browser
 * text-to-speech if that word hasn't been recorded yet. */
function playExampleWord(word: string) {
  if (typeof window === "undefined") return;
  const clip = new Audio(`/audio/maya/${word.toLowerCase()}.mp3`);
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakExampleWord(word);
  };
  clip.addEventListener("error", fallback);
  clip.play().catch(fallback);
}

/**
 * The speech challenge.
 *
 * "Hear Miss Maya say it" is available from the first moment the challenge
 * appears, not just after failed attempts — a child shouldn't have to fail
 * twice to learn what the word even sounds like. The microphone path
 * transcribes speech and checks it against the target word — background
 * noise and wrong words don't pass, only the word itself does. This is
 * still not pronunciation *scoring*: a match either happened or it didn't.
 * After two attempts without a match, Miss Maya's example pops up
 * automatically as reinforcement; the third attempt always advances the
 * challenge regardless, so a shy voice or a flaky microphone never
 * hard-locks a run. The manual "I SAID IT!" button remains the fallback
 * when the microphone is denied or speech recognition isn't supported.
 */
export function ChallengeModal({
  challenge,
  micEnabled,
  assist,
  onMicEnabledChange,
  onConfirm,
  onDismiss,
  onClose,
}: ChallengeModalProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "not-requested" | "granted" | "denied"
  >("not-requested");
  const [listeningStatus, setListeningStatus] =
    useState<SpeechListenStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const recognizerRef = useRef<WordRecognizer | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(onClose, CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating, onClose]);

  useEffect(() => {
    if (!showExample) return;
    playExampleWord(challenge.word);
  }, [showExample, challenge.word]);

  const startListeningAttempt = () => {
    const recognizer = recognizerRef.current ?? new WordRecognizer();
    recognizerRef.current = recognizer;
    recognizer.listenFor(challenge.word, {
      onMatch: () => {
        setCelebrating(true);
        onConfirm();
      },
      onNoMatch: handleListenTimeout,
      onStatus: setListeningStatus,
      timeoutMs: assist ? ASSIST_LISTEN_TIMEOUT_MS : undefined,
    });
  };

  function handleListenTimeout() {
    attemptsRef.current += 1;
    const next = attemptsRef.current;
    setAttempts(next);

    if (next >= MAX_ATTEMPTS) {
      // Three tries is the limit — advance regardless so a quiet room or a
      // shy voice never blocks the run.
      setCelebrating(true);
      onConfirm();
    } else if (next === EXAMPLE_AFTER_ATTEMPT) {
      setShowExample(true);
    } else {
      startListeningAttempt();
    }
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
    } catch (error) {
      console.error("Microphone error:", error);
      setMicPermission("denied");
    }
  };

  const handleTryAgainAfterExample = () => {
    setShowExample(false);
    startListeningAttempt();
  };

  const handleConfirm = () => {
    if (celebrating) return;
    setCelebrating(true);
    onConfirm();
  };

  /**
   * Switches this challenge — and every one after it — to the manual button.
   * Any listening attempt in flight is dropped, so a half-finished recognition
   * can't advance the challenge behind the child's back.
   */
  const handleMicOff = () => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setListeningStatus("idle");
    setShowExample(false);
    onMicEnabledChange(false);
  };

  const handleMicOn = () => {
    onMicEnabledChange(true);
    void handleRequestMic();
  };

  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={challenge.prompt}
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#141420]/70 p-4 backdrop-blur-sm"
    >
      {celebrating ? (
        <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#2ecc71] bg-white p-8 text-center shadow-2xl">
          <div className="text-7xl" aria-hidden>
            🌟
          </div>
          <p className="mt-3 text-4xl font-black tracking-tight text-[#2ecc71]">
            {challenge.praise}
          </p>
          <p className="mt-3 inline-block rounded-full bg-[#fff4d6] px-5 py-2 text-2xl font-black text-[#b8860b]">
            +{challenge.reward} 🪙
          </p>
          <div className="mt-4 flex justify-center gap-3 text-3xl" aria-hidden>
            <span className="tw-star" style={{ animationDelay: "0ms" }}>
              ⭐
            </span>
            <span className="tw-star" style={{ animationDelay: "120ms" }}>
              ⭐
            </span>
            <span className="tw-star" style={{ animationDelay: "240ms" }}>
              ⭐
            </span>
          </div>
        </div>
      ) : (
        <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl sm:p-8">
          <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
            Speech Challenge
          </p>

          <div className="mt-3 text-7xl sm:text-8xl" aria-hidden>
            {challenge.glyph}
          </div>

          <p
            data-testid="challenge-word"
            className="mt-2 text-5xl font-black tracking-tight text-[#141420] sm:text-6xl"
          >
            {challenge.word}
          </p>

          <p className="mt-4 text-2xl font-extrabold text-[#2f7fd4]">
            {challenge.prompt}
          </p>

          <p className="mt-2 text-sm font-semibold text-[#6b6b80]">
            Say it out loud, nice and clear.
          </p>

          <button
            type="button"
            onClick={() => playExampleWord(challenge.word)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] px-4 py-2.5 text-sm font-black text-[#2f7fd4]"
          >
            <Image
              src="/characters/miss-maya.png"
              alt=""
              aria-hidden
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 rounded-full border-2 border-[#2f7fd4] object-cover"
            />
            🔊 Hear Miss Maya say it
          </button>

          {showExample ? (
            <div className="tw-pop mt-4 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] p-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/characters/miss-maya.png"
                  alt="Miss Maya"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-[#2f7fd4] object-cover"
                />
                <div className="text-left">
                  <p className="text-[0.65rem] font-black tracking-wide text-[#2f7fd4] uppercase">
                    Miss Maya says
                  </p>
                  <p className="text-2xl font-black text-[#141420]">{challenge.word}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => playExampleWord(challenge.word)}
                  className="flex-1 rounded-xl bg-[#2f7fd4] px-3 py-2.5 text-sm font-black text-white"
                >
                  🔊 Hear it again
                </button>
                <button
                  type="button"
                  onClick={handleTryAgainAfterExample}
                  className="flex-1 rounded-xl bg-[#2ecc71] px-3 py-2.5 text-sm font-black text-white"
                >
                  Now you try!
                </button>
              </div>
              <button
                type="button"
                onClick={handleMicOff}
                className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-[#4a6b78] underline"
              >
                Microphone not hearing you? Use the button instead
              </button>
            </div>
          ) : !micEnabled || micPermission === "denied" ? (
            /* Button mode. A microphone that can't hear — or one the family
               turned off — must never be able to stop a child moving on. */
            <>
              <button
                ref={confirmRef}
                type="button"
                onClick={handleConfirm}
                className="mt-6 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                I SAID IT!
              </button>
              <p className="mt-2 text-xs text-[#8a8aa0]">
                {micPermission === "denied"
                  ? "Microphone is off — tap the button when you have said it"
                  : "Tap the button when you have said it"}
              </p>
              {micPermission !== "denied" ? (
                <button
                  type="button"
                  onClick={handleMicOn}
                  className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-bold text-[#2f7fd4] underline"
                >
                  🎤 Turn the microphone back on
                </button>
              ) : null}

              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 w-full rounded-xl px-4 py-2 text-base font-bold text-[#8a8aa0] hover:text-[#141420]"
              >
                Not yet
              </button>
            </>
          ) : (
            <>
              {micPermission === "not-requested" && (
                <button
                  ref={confirmRef}
                  type="button"
                  onClick={handleRequestMic}
                  className="mt-6 w-full rounded-2xl border-b-8 border-[#3b82f6] bg-[#3b82f6] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                >
                  🎤 Use Microphone
                </button>
              )}

              {micPermission === "granted" && listeningStatus === "listening" && (
                <>
                  <button
                    disabled
                    className="mt-6 w-full rounded-2xl border-b-8 border-[#f59e0b] bg-[#f59e0b] px-6 py-5 text-2xl font-black text-white shadow-lg"
                  >
                    🎤 Listening...
                  </button>
                  {attempts > 0 && (
                    <p className="mt-2 text-xs font-bold text-[#8a8aa0]">
                      Try {attempts + 1} of {MAX_ATTEMPTS}
                    </p>
                  )}
                </>
              )}

              {/* The way out of microphone mode, always reachable — including
                  mid-listen, which is exactly when a child discovers the mic
                  isn't picking them up. */}
              <button
                type="button"
                onClick={handleMicOff}
                className="mt-3 w-full rounded-xl border-2 border-[#e2e4ee] px-4 py-2.5 text-sm font-black text-[#4a4a60]"
              >
                🎤 Turn microphone off
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="mt-2 w-full rounded-xl px-4 py-2 text-base font-bold text-[#8a8aa0] hover:text-[#141420]"
              >
                Not yet
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
