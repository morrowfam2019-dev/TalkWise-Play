"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SpeechTarget } from "@/content/speech/engine";
import { playExampleWord } from "@/speech/maya-voice";
import {
  PhraseRecognizer,
  WordRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
  type SpeechListenStatus,
} from "@/speech/recognition";

const MAX_ATTEMPTS = 3;
const EXAMPLE_AFTER_ATTEMPT = 2;
const ASSIST_LISTEN_TIMEOUT_MS = 7000;
const SENTENCE_LISTEN_TIMEOUT_MS = 8000;
const SENTENCE_ASSIST_LISTEN_TIMEOUT_MS = 11000;

/**
 * The speech gate every Basketball mode shares.
 *
 * Grown out of Shootout's `WordPrompt` rather than written twice: same
 * philosophy (listen, retry, Miss Maya's example after two misses, the third
 * attempt always unlocks so a quiet room or a shy voice never blocks a
 * child), with two additions the expansion needs:
 *
 * - `headline` / `cta`, so Time Attack can say "Say it to start the clock"
 *   where Shootout says "Say it to shoot".
 * - word-by-word state for Hard sentence targets. Words already recognised
 *   stay recognised across attempts, so a learner repairs the one word they
 *   missed instead of the sentence resetting under them.
 *
 * The third-attempt unlock is not a bug and must not be "tightened": speech
 * differences are the population this game is for, and the gate exists to
 * invite talking, not to gate play behind a recogniser's opinion.
 */
export function SpeechGate({
  target,
  headline,
  micEnabled,
  assist,
  onMicEnabledChange,
  onUnlock,
}: {
  target: SpeechTarget;
  /** Small caps line above the target, e.g. "Say It To Shoot". */
  headline: string;
  micEnabled: boolean;
  assist: boolean;
  onMicEnabledChange: (enabled: boolean) => void;
  onUnlock: () => void;
}) {
  const [micPermission, setMicPermission] = useState<
    "not-requested" | "granted" | "denied"
  >("not-requested");
  const [listeningStatus, setListeningStatus] =
    useState<SpeechListenStatus>("idle");
  const [attempts, setAttempts] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const [matchedWordIds, setMatchedWordIds] = useState<string[]>([]);
  const attemptsRef = useRef(0);
  const matchedRef = useRef<string[]>([]);
  const wordRecognizerRef = useRef<WordRecognizer | null>(null);
  const phraseRecognizerRef = useRef<PhraseRecognizer | null>(null);
  const unlockedRef = useRef(false);

  const wordByWord = target.wordByWord;

  // The caller remounts this component per target (a `key` change), so every
  // piece of state above already starts fresh — no reset effect needed.
  useEffect(() => {
    return () => {
      wordRecognizerRef.current?.stop();
      phraseRecognizerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!showExample) return;
    playExampleWord(target.text);
  }, [showExample, target.text]);

  const unlock = () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    wordRecognizerRef.current?.stop();
    phraseRecognizerRef.current?.stop();
    onUnlock();
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

  function startListeningAttempt() {
    setShowExample(false);

    if (wordByWord) {
      const recognizer = new PhraseRecognizer();
      phraseRecognizerRef.current = recognizer;
      recognizer.listenFor(target.words, matchedRef.current, {
        onProgress: (ids) => {
          matchedRef.current = ids;
          setMatchedWordIds(ids);
        },
        onComplete: () => {
          matchedRef.current = target.words.map((word) => word.id);
          setMatchedWordIds(matchedRef.current);
          unlock();
        },
        onNoMatch: (ids) => {
          matchedRef.current = ids;
          setMatchedWordIds(ids);
          handleListenTimeout();
        },
        onStatus: setListeningStatus,
        timeoutMs: assist
          ? SENTENCE_ASSIST_LISTEN_TIMEOUT_MS
          : SENTENCE_LISTEN_TIMEOUT_MS,
      });
      return;
    }

    const recognizer = new WordRecognizer();
    wordRecognizerRef.current = recognizer;
    recognizer.listenFor(target.text, {
      onMatch: unlock,
      onNoMatch: handleListenTimeout,
      onStatus: setListeningStatus,
      timeoutMs: assist ? ASSIST_LISTEN_TIMEOUT_MS : undefined,
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
    wordRecognizerRef.current?.stop();
    phraseRecognizerRef.current?.stop();
    wordRecognizerRef.current = null;
    phraseRecognizerRef.current = null;
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
      aria-label={target.prompt}
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[#141420]/70 p-4 backdrop-blur-sm"
    >
      <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl sm:p-8">
        <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          {headline}
        </p>

        <div className="mt-3 text-5xl" aria-hidden>
          {target.glyph}
        </div>

        {wordByWord ? (
          <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1">
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
          <p className="mt-2 text-5xl font-black tracking-tight text-[#141420] sm:text-6xl">
            {target.text.toUpperCase()}
          </p>
        )}

        <p className="mt-4 text-xl font-extrabold text-[#2f7fd4]">
          {target.prompt}
        </p>

        {wordByWord && matchedWordIds.length > 0 ? (
          <p className="mt-1 text-xs font-bold text-[#25a25a]">
            {matchedWordIds.length} of {target.words.length} words — keep going!
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => playExampleWord(target.text)}
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
                <p className="text-xl font-black text-[#141420]">
                  {target.text}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => playExampleWord(target.text)}
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
