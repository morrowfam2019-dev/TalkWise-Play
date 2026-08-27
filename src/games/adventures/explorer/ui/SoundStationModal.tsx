"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BeginnerSound } from "@/content/speech/beginner";
import { playExampleSound, playExampleWord } from "@/speech/maya-voice";
import {
  SoundRecognizer,
  isSpeechRecognitionSupported,
  requestMicPermission,
  type SpeechListenStatus,
} from "@/speech/recognition";
import { CoinIcon } from "@/ui/CoinIcon";

interface SoundStationModalProps {
  sound: BeginnerSound;
  /** Kid-facing name of the spot, e.g. "The Swings". */
  place: string;
  /** Finished turns here so far, before this visit. */
  completions: number;
  micEnabled: boolean;
  assist: boolean;
  onMicEnabledChange: (enabled: boolean) => void;
  /**
   * One turn finished. Deliberately carries no result: whether the
   * microphone matched changes the celebration copy here and nothing else,
   * and the save layer must not be handed an accuracy signal it would then
   * be tempting to score.
   */
  onTurn: () => void;
  /** The child is done here and wants to go back to exploring. */
  onLeave: () => void;
}

const ASSIST_LISTEN_TIMEOUT_MS = 9000;
/** Tries before a turn is credited anyway. */
const MAX_ATTEMPTS = 3;
/** Miss Maya models the sound again unprompted after this many misses. */
const MODEL_AFTER_ATTEMPT = 2;

type Phase = "ready" | "listening" | "encourage" | "celebrating";

/**
 * The Beginner sound station.
 *
 * ## What it asks for
 *
 * The letter's name, not the isolated phoneme. The grapheme is on screen
 * because a pre-reader uses it to tell one station from another, and every
 * prompt, every model and every match is that same name: /m/ is modelled,
 * asked for, and recognized as "Em" — never a held "mmmmm".
 *
 * ## Why it can't be failed
 *
 * Browser speech recognition is unreliable on isolated consonants held with
 * no vowel around them — that is a documented fact about the platform, not
 * a tuning problem, and an earlier isolated-sound difficulty tier was
 * pulled from this codebase because of it. Modelling the letter name instead
 * gives the browser something it transcribes well, but the safety net below
 * still exists for the child who gets a shy microphone anyway. So three
 * things are true here at once:
 *
 * 1. `SoundRecognizer` accepts a deliberately wide set of transcripts.
 * 2. After three tries the turn is credited anyway, with warm copy — a
 *    microphone that cannot hear a four-year-old must never be able to stop
 *    them playing in the park.
 * 3. The big "I SAID IT" button is on screen from the first moment, not
 *    hidden behind a failure, so a child who does not want the microphone
 *    today still practises and still lights the lanterns.
 *
 * Nothing here scores, grades, or records accuracy. The save layer counts
 * turns taken and turns finished, and that is all it counts.
 *
 * ## Reading
 *
 * Assume the player cannot read. Every control is an icon plus one short
 * word, targets are at least 64px tall, and Miss Maya models the sound
 * aloud as soon as the station opens.
 */
export function SoundStationModal({
  sound,
  place,
  completions,
  micEnabled,
  assist,
  onMicEnabledChange,
  onTurn,
  onLeave,
}: SoundStationModalProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [attempts, setAttempts] = useState(0);
  const [heardThisTurn, setHeardThisTurn] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [done, setDone] = useState(completions);

  const recognizerRef = useRef<SoundRecognizer | null>(null);
  const attemptsRef = useRef(0);
  const phaseRef = useRef<Phase>("ready");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // All seven Beginner sounds are recorded in Miss Maya's own voice, so this
  // is never silent and the station keeps modelling on open — that is the
  // point of a sound station, and it was never the synthesised voice.
  const model = useCallback(() => {
    playExampleSound(sound.id);
  }, [sound.id]);

  // Miss Maya models the sound the moment the station opens. A child who
  // cannot read has now been told what to do without reading anything.
  useEffect(() => {
    const timer = window.setTimeout(model, 350);
    return () => window.clearTimeout(timer);
  }, [model]);

  useEffect(() => {
    return () => recognizerRef.current?.stop();
  }, []);

  const creditTurn = useCallback(
    (heard: boolean) => {
      recognizerRef.current?.stop();
      attemptsRef.current = 0;
      setAttempts(0);
      setHeardThisTurn(heard);
      setDone((current) => current + 1);
      setPhase("celebrating");
      onTurn();
    },
    [onTurn],
  );

  const listen = useCallback(() => {
    const recognizer = recognizerRef.current ?? new SoundRecognizer();
    recognizerRef.current = recognizer;
    setPhase("listening");
    recognizer.listenFor(
      {
        accepted: sound.recognition.accepted,
        acceptedPrefixes: sound.recognition.acceptedPrefixes,
        anchorWord: sound.anchorWord,
      },
      {
        onMatch: () => creditTurn(true),
        onNoMatch: () => {
          attemptsRef.current += 1;
          const next = attemptsRef.current;
          setAttempts(next);
          if (next >= MAX_ATTEMPTS) {
            // Out of tries is still a turn taken. The park lights up.
            creditTurn(false);
            return;
          }
          if (next === MODEL_AFTER_ATTEMPT) model();
          setPhase("encourage");
        },
        onStatus: (status: SpeechListenStatus) => {
          if (status === "unsupported") setMicDenied(true);
        },
        timeoutMs: assist ? ASSIST_LISTEN_TIMEOUT_MS : undefined,
      },
    );
  }, [assist, creditTurn, model, sound]);

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

  const handleNextTurn = useCallback(() => {
    setPhase("ready");
    setHeardThisTurn(false);
    window.setTimeout(model, 250);
  }, [model]);

  const stationLit = done >= sound.repetitions;
  const useMic = micEnabled && !micDenied;

  // The celebration is its own screen: big, loud, and impossible to misread.
  if (phase === "celebrating") {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Great job"
        className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#141420]/70 p-4 backdrop-blur-sm"
      >
        <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#2ecc71] bg-white p-7 text-center shadow-2xl">
          <div className="text-8xl" aria-hidden>
            {stationLit ? "🎆" : "🌟"}
          </div>
          <p className="mt-2 text-4xl font-black tracking-tight text-[#2ecc71]">
            {heardThisTurn ? "I HEARD IT!" : "GREAT TRYING!"}
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-5 py-2 text-2xl font-black text-[#b8860b]">
            +{sound.reward}
            <CoinIcon className="h-6 w-6" />
          </p>

          <Repetitions done={done} total={sound.repetitions} />

          {stationLit ? (
            <p className="mt-4 rounded-2xl bg-[#eaf9ee] px-4 py-3 text-lg font-black text-[#1f8a4c]">
              ✨ {place} lit up!
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={handleNextTurn}
              className="w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
            >
              🔁 AGAIN
            </button>
            <button
              type="button"
              onClick={onLeave}
              className="w-full rounded-2xl border-4 border-[#e2e4ee] px-6 py-4 text-xl font-black text-[#4a4a60]"
            >
              🧭 EXPLORE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Make the ${sound.phoneme} sound`}
      className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-[#141420]/70 p-3 backdrop-blur-sm sm:p-4"
    >
      <div className="tw-pop max-h-[96dvh] w-full max-w-sm overflow-y-auto rounded-[2rem] border-8 border-[#f5c33b] bg-white p-5 text-center shadow-2xl sm:p-6">
        <p className="text-xs font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
          {place}
        </p>

        {/* The grapheme, as big as the card allows. Recognition aid for a
            pre-reader; the sound underneath it is the actual target. */}
        <div className="mx-auto mt-2 grid h-32 w-32 place-items-center rounded-[2rem] bg-gradient-to-br from-[#f5c33b] to-[#e09a1e] shadow-inner">
          <span className="text-8xl leading-none font-black text-white drop-shadow">
            {sound.display}
          </span>
        </div>

        <p className="mt-3 text-3xl font-black tracking-tight text-[#141420]">
          Say {sound.model}
        </p>
        <p className="mt-1 text-base font-bold text-[#6b6b80]">
          {sound.cue}
        </p>

        <Repetitions done={done} total={sound.repetitions} />

        {/* Miss Maya. Always here, always replayable, from the first second
            of the first visit — never unlocked by failing. */}
        <button
          type="button"
          onClick={model}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] px-4 py-4 text-lg font-black text-[#2f7fd4] active:scale-[0.98]"
        >
          <Image
            src="/characters/miss-maya.png"
            alt=""
            aria-hidden
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full border-2 border-[#2f7fd4] object-cover"
          />
          🔊 HEAR IT
        </button>

        <button
          type="button"
          onClick={() => playExampleWord(sound.anchorWord)}
          className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-bold text-[#2f7fd4] underline"
        >
          🔊 like in {sound.anchorWord.toUpperCase()}
        </button>

        {phase === "listening" ? (
          <div className="mt-4">
            <div className="w-full rounded-2xl border-b-8 border-[#d97706] bg-[#f59e0b] px-6 py-6 text-2xl font-black text-white shadow-lg">
              <span className="tw-star inline-block" aria-hidden>
                🎤
              </span>{" "}
              LISTENING...
            </div>
            {attempts > 0 ? (
              <p className="mt-2 text-xs font-bold text-[#8a8aa0]">
                Try {attempts + 1} of {MAX_ATTEMPTS}
              </p>
            ) : null}
          </div>
        ) : phase === "encourage" ? (
          <div className="tw-pop mt-4 rounded-2xl border-4 border-[#2f7fd4] bg-[#eaf4ff] p-4">
            <p className="text-xl font-black text-[#2f7fd4]">
              Let&apos;s try together!
            </p>
            <p className="mt-1 text-sm font-bold text-[#4a4a60]">
              {sound.model}
            </p>
            <button
              type="button"
              onClick={listen}
              className="mt-3 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white active:translate-y-1 active:border-b-4"
            >
              🎤 MY TURN
            </button>
          </div>
        ) : useMic ? (
          <button
            type="button"
            onClick={handleMicTap}
            className="mt-4 w-full rounded-2xl border-b-8 border-[#2563eb] bg-[#3b82f6] px-6 py-6 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
          >
            🎤 MY TURN
          </button>
        ) : null}

        {/* Always available, never a consolation prize. A child who does not
            want the microphone still practises and still lights the park. */}
        <button
          type="button"
          onClick={() => creditTurn(false)}
          className={`w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4 ${
            useMic && phase !== "encourage" ? "mt-3" : "mt-4"
          }`}
        >
          👍 I SAID IT
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              recognizerRef.current?.stop();
              setPhase("ready");
              onMicEnabledChange(!micEnabled);
              if (!micEnabled) setMicDenied(false);
            }}
            className="rounded-xl px-3 py-2 text-xs font-bold text-[#4a6b78] underline"
          >
            {useMic ? "🎤 Microphone off" : "🎤 Microphone on"}
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-xl px-4 py-2 text-base font-black text-[#8a8aa0]"
          >
            🧭 EXPLORE
          </button>
        </div>
      </div>
    </div>
  );
}

/** Turn counter as dots. No numbers to read, no score. */
function Repetitions({ done, total }: { done: number; total: number }) {
  const shown = Math.min(done, total);
  return (
    <div
      className="mt-3 flex justify-center gap-2"
      aria-label={`${shown} of ${total} turns`}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={`h-5 w-5 rounded-full border-4 ${
            index < shown
              ? "border-[#f5c33b] bg-[#f5c33b]"
              : "border-[#e2e4ee] bg-white"
          }`}
        />
      ))}
    </div>
  );
}
