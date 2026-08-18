"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { playExampleWord } from "@/speech/maya-voice";
import {
  WordRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
  type SpeechListenStatus,
} from "@/speech/recognition";

const MAX_ATTEMPTS = 3;
const EXAMPLE_AFTER_ATTEMPT = 2;
const ASSIST_LISTEN_TIMEOUT_MS = 7000;

/**
 * Say the word to unlock the shot. Same philosophy as the adventure
 * engine's challenge popup — listen, retry, Miss Maya's example after two
 * misses, the third attempt always unlocks so a quiet room or a shy voice
 * never blocks a round — reusing the same `WordRecognizer` and Miss Maya
 * voice helper, with basketball's own compact presentation.
 */
export function WordPrompt({
  word,
  prompt,
  micEnabled,
  assist,
  onMicEnabledChange,
  onUnlock,
}: {
  word: string;
  prompt: string;
  micEnabled: boolean;
  assist: boolean;
  onMicEnabledChange: (enabled: boolean) => void;
  onUnlock: () => void;
}) {
  const [micPermission, setMicPermission] = useState<
    "not-requested" | "granted" | "denied"
  >("not-requested");
  const [listeningStatus, setListeningStatus] = useState<SpeechListenStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const attemptsRef = useRef(0);
  const recognizerRef = useRef<WordRecognizer | null>(null);
  const unlockedRef = useRef(false);

  // The caller remounts this component per word (a `key` change in
  // BasketballShell), so every piece of state above already starts fresh
  // for a new word — no reset effect needed, same as ChallengeModal.
  useEffect(() => {
    return () => {
      recognizerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!showExample) return;
    playExampleWord(word);
  }, [showExample, word]);

  const unlock = () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    onUnlock();
  };

  const startListeningAttempt = () => {
    setShowExample(false);
    const recognizer = new WordRecognizer();
    recognizerRef.current = recognizer;
    recognizer.listenFor(word, {
      onMatch: unlock,
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
      unlock();
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
    } catch {
      setMicPermission("denied");
    }
  };

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={prompt}
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#141420]/70 p-4 backdrop-blur-sm"
    >
      <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl sm:p-8">
        <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          Say It To Shoot
        </p>

        <div className="mt-3 text-6xl" aria-hidden>
          🏀
        </div>

        <p className="mt-2 text-5xl font-black tracking-tight text-[#141420] sm:text-6xl">
          {word}
        </p>

        <p className="mt-4 text-2xl font-extrabold text-[#2f7fd4]">{prompt}</p>

        <button
          type="button"
          onClick={() => playExampleWord(word)}
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
                <p className="text-2xl font-black text-[#141420]">{word}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => playExampleWord(word)}
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
        ) : !micEnabled || micPermission === "denied" ? (
          <>
            <button
              type="button"
              onClick={unlock}
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
          </>
        ) : (
          <>
            {micPermission === "not-requested" && (
              <button
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

            <button
              type="button"
              onClick={handleMicOff}
              className="mt-3 w-full rounded-xl border-2 border-[#e2e4ee] px-4 py-2.5 text-sm font-black text-[#4a4a60]"
            >
              🎤 Turn microphone off
            </button>
          </>
        )}
      </div>
    </div>
  );
}
