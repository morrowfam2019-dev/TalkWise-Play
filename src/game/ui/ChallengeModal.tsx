"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeechChallenge } from "@/content/speech";
import {
  AudioCaptureManager,
  type SpeechDetectionStatus,
} from "@/game/core/audio-capture";

interface ChallengeModalProps {
  challenge: SpeechChallenge;
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
 * There is no pronunciation scoring here — the microphone path only detects
 * that a sound was made, never whether it's the right word. After two
 * listening attempts with nothing heard, "Miss Maya" models the word once;
 * the third attempt always advances the challenge (heard or not), so a shy
 * voice or a flaky microphone never hard-locks a run. The manual "I SAID
 * IT!" button remains the fallback when the microphone is denied.
 */
export function ChallengeModal({
  challenge,
  onConfirm,
  onDismiss,
  onClose,
}: ChallengeModalProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [micPermission, setMicPermission] = useState<
    "not-requested" | "granted" | "denied"
  >("not-requested");
  const [listeningStatus, setListeningStatus] =
    useState<SpeechDetectionStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const audioCaptureRef = useRef<AudioCaptureManager | null>(null);
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

  const startListeningAttempt = async () => {
    const manager = audioCaptureRef.current;
    if (!manager) return;
    await manager.startListening({
      onDetected: () => {
        setCelebrating(true);
        onConfirm();
      },
      onTimeout: handleListenTimeout,
      onStatus: setListeningStatus,
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
      void startListeningAttempt();
    }
  }

  const handleRequestMic = async () => {
    const manager = new AudioCaptureManager();
    try {
      const granted = await manager.requestPermission();

      if (granted) {
        setMicPermission("granted");
        audioCaptureRef.current = manager;
        await startListeningAttempt();
      } else {
        setMicPermission("denied");
        manager.dispose();
      }
    } catch (error) {
      console.error("Microphone error:", error);
      setMicPermission("denied");
      manager.dispose();
    }
  };

  const handleTryAgainAfterExample = () => {
    setShowExample(false);
    void startListeningAttempt();
  };

  const handleConfirm = () => {
    if (celebrating) return;
    setCelebrating(true);
    onConfirm();
  };

  useEffect(() => {
    return () => {
      if (audioCaptureRef.current) {
        audioCaptureRef.current.dispose();
      }
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

          {showExample ? (
            <div className="tw-pop mt-6 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2f7fd4] text-3xl"
                  aria-hidden
                >
                  👩‍🏫
                </div>
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
            </div>
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

              {micPermission === "denied" && (
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
                    Microphone access denied — using button mode
                  </p>
                </>
              )}

              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 w-full rounded-xl px-4 py-2 text-base font-bold text-[#8a8aa0] hover:text-[#141420]"
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
