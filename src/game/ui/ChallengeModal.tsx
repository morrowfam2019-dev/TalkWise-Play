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

/**
 * The speech challenge.
 *
 * There is no pronunciation scoring here and nothing pretends to listen. The
 * child practices out loud and confirms it themselves — an honest interaction
 * that a real microphone phase can replace later without changing the shape of
 * the flow.
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
  const confirmRef = useRef<HTMLButtonElement>(null);
  const audioCaptureRef = useRef<AudioCaptureManager | null>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(onClose, CELEBRATION_MS);
    return () => window.clearTimeout(timer);
  }, [celebrating, onClose]);

  const handleRequestMic = async () => {
    const manager = new AudioCaptureManager();
    const granted = await manager.requestPermission();

    if (granted) {
      setMicPermission("granted");
      audioCaptureRef.current = manager;
      manager.startListening(
        () => {
          setCelebrating(true);
          onConfirm();
        },
        setListeningStatus,
      );
    } else {
      setMicPermission("denied");
      manager.dispose();
    }
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
            <button
              disabled
              className="mt-6 w-full rounded-2xl border-b-8 border-[#f59e0b] bg-[#f59e0b] px-6 py-5 text-2xl font-black text-white shadow-lg"
            >
              🎤 Listening...
            </button>
          )}

          {micPermission === "granted" && listeningStatus === "detected" && (
            <button
              disabled
              className="mt-6 w-full rounded-2xl border-b-8 border-[#2ecc71] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg"
            >
              ✓ Speech Detected!
            </button>
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

          {micPermission === "not-requested" && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 w-full rounded-xl px-4 py-2 text-base font-bold text-[#8a8aa0] hover:text-[#141420]"
            >
              Not yet
            </button>
          )}

          {micPermission !== "not-requested" && (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 w-full rounded-xl px-4 py-2 text-base font-bold text-[#8a8aa0] hover:text-[#141420]"
            >
              Not yet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
