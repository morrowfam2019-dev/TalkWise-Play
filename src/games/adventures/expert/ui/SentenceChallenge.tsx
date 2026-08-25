"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { splitTargetWords } from "@/content/speech/engine";
import { playExampleSentence, playExampleWord } from "@/speech/maya-voice";
import {
  PhraseRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
} from "@/speech/recognition";

interface SentenceChallengeProps {
  sentence: string;
  /** What the child is being asked to do, in the scene's own words. */
  ask: string;
  micEnabled: boolean;
  assist: boolean;
  onMicEnabledChange: (enabled: boolean) => void;
  /** Every word has been recognised, or the child confirmed they said it. */
  onComplete: () => void;
}

const ASSIST_LISTEN_TIMEOUT_MS = 12000;
const LISTEN_TIMEOUT_MS = 8000;
/** Attempts before the manual confirm appears. The sentence is never a
 * wall: a child who has said it four times has said it. */
const ATTEMPTS_BEFORE_MANUAL = 2;

/**
 * EXPERT — the sentence challenge, with word-by-word repair.
 *
 * ## The behaviour that makes this Expert rather than "a longer word"
 *
 * Recognised words stay recognised. A child who says "I read a blue book
 * today" and is heard on everything but *blue* sees five green words and one
 * waiting word, and their next attempt only has to land *blue*. Nothing they
 * already said is thrown away, because `PhraseRecognizer` accumulates by
 * word id and this component keeps that set across attempts.
 *
 * ## Teaching does not get taken away at the top level
 *
 * Miss Maya models the whole sentence on demand, and tapping any single word
 * has her say that word on its own — the word-clip library the Intermediate
 * tier already uses. Expert means more production is being asked for, not
 * less help being offered.
 */
export function SentenceChallenge({
  sentence,
  ask,
  micEnabled,
  assist,
  onMicEnabledChange,
  onComplete,
}: SentenceChallengeProps) {
  const words = useMemo(() => splitTargetWords(sentence), [sentence]);
  const [matched, setMatched] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const recognizerRef = useRef<PhraseRecognizer | null>(null);

  useEffect(() => () => recognizerRef.current?.stop(), []);

  const listen = useCallback(() => {
    const recognizer = recognizerRef.current ?? new PhraseRecognizer();
    recognizerRef.current = recognizer;
    setListening(true);
    recognizer.listenFor(words, matched, {
      onProgress: setMatched,
      onComplete: () => {
        setListening(false);
        setMatched(words.map((word) => word.id));
        onComplete();
      },
      onNoMatch: (heard) => {
        setListening(false);
        setMatched(heard);
        setAttempts((current) => current + 1);
      },
      onStatus: (status) => {
        if (status === "unsupported") {
          setListening(false);
          setMicDenied(true);
        }
      },
      timeoutMs: assist ? ASSIST_LISTEN_TIMEOUT_MS : LISTEN_TIMEOUT_MS,
    });
  }, [assist, matched, onComplete, words]);

  const handleMicTap = useCallback(async () => {
    if (!isSpeechRecognitionSupported()) {
      setMicDenied(true);
      return;
    }
    const granted = await requestMicPermission();
    if (!granted) {
      setMicDenied(true);
      return;
    }
    listen();
  }, [listen]);

  const useMic = micEnabled && !micDenied;
  const showManual = !useMic || attempts >= ATTEMPTS_BEFORE_MANUAL;
  const matchedSet = useMemo(() => new Set(matched), [matched]);
  const remaining = words.filter((word) => !matchedSet.has(word.id)).length;

  return (
    <div className="rounded-[1.5rem] border-4 border-[#8fa8ff] bg-[#101736] p-5 shadow-xl">
      <p className="text-xs font-black tracking-[0.2em] text-[#8fa8ff] uppercase">
        {ask}
      </p>

      {/* The sentence, one chip per word. A chip turns green the moment that
          word is heard and never turns back. */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {words.map((word) => {
          const done = matchedSet.has(word.id);
          return (
            <button
              key={word.id}
              type="button"
              onClick={() => playExampleWord(word.normalized)}
              aria-label={`Hear ${word.text}`}
              className={`rounded-xl border-4 px-3 py-2 text-xl font-black transition-colors sm:text-2xl ${
                done
                  ? "border-[#2ecc71] bg-[#2ecc71] text-white"
                  : "border-[#3a4a86] bg-[#182347] text-white/85"
              }`}
            >
              {word.text}
              <span className="ml-1.5 text-sm" aria-hidden>
                {done ? "✅" : "⬜"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-[0.7rem] font-bold text-white/45">
        Tap a word to hear it on its own
      </p>

      <button
        type="button"
        onClick={() => playExampleSentence(sentence)}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-[#8fa8ff] bg-[#1b2450] px-4 py-3.5 text-base font-black text-[#cfe0ff] active:scale-[0.98]"
      >
        <Image
          src="/characters/miss-maya.png"
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full border-2 border-[#8fa8ff] object-cover"
        />
        🔊 Hear Miss Maya say the sentence
      </button>

      {useMic ? (
        listening ? (
          <div className="mt-3 w-full rounded-2xl border-b-8 border-[#d97706] bg-[#f59e0b] px-6 py-5 text-center text-xl font-black text-white shadow-lg">
            🎤 LISTENING...
          </div>
        ) : (
          <button
            type="button"
            onClick={handleMicTap}
            className="mt-3 w-full rounded-2xl border-b-8 border-[#2563eb] bg-[#3b82f6] px-6 py-5 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
          >
            {matched.length > 0 && remaining > 0
              ? `🎤 SAY THE ${remaining === 1 ? "LAST WORD" : "REST"}`
              : "🎤 SAY IT"}
          </button>
        )
      ) : null}

      {matched.length > 0 && remaining > 0 && !listening ? (
        <p className="mt-2 text-center text-sm font-bold text-[#8fe6ff]">
          Nearly! Just {remaining} {remaining === 1 ? "word" : "words"} to go —
          the green ones are safe.
        </p>
      ) : null}

      {showManual ? (
        <button
          type="button"
          onClick={onComplete}
          className="mt-3 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-lg font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
        >
          👍 I SAID IT
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          recognizerRef.current?.stop();
          setListening(false);
          onMicEnabledChange(!micEnabled);
          if (!micEnabled) setMicDenied(false);
        }}
        className="mt-3 w-full rounded-xl px-3 py-2 text-xs font-bold text-[#8fa8ff] underline"
      >
        {useMic ? "🎤 Turn the microphone off" : "🎤 Turn the microphone on"}
      </button>
    </div>
  );
}
