"use client";

import Link from "next/link";
import { useState } from "react";
import { listLevels } from "@/content/speech";
import {
  DEFAULT_SPEECH_DIFFICULTY,
  SPEECH_DIFFICULTIES,
  type SpeechDifficulty,
} from "@/content/speech/engine";
import { getBaller } from "@/content/basketball/roster";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";
import {
  getModeRecord,
  type BasketballModeKey,
} from "@/player/games/basketball";
import type { BasketballModeDefinition } from "../modes/registry";

/**
 * Choose a sound, choose a difficulty, tip off.
 *
 * Shared by every mode's setup screen rather than written per mode: the two
 * choices are identical everywhere, only the mode's identity and the "play"
 * link differ. A new mode gets its setup screen for free.
 *
 * Flow decision (the spec left this open): MODE → SOUND → DIFFICULTY. Mode
 * first is the least confusing order here because the modes are genuinely
 * different games — a child picking "Time Attack" has picked what they want
 * to *do*, and sound/difficulty are settings on it. Putting sound first would
 * ask a child to configure something before knowing what it configures.
 */
export function ModeSetup({
  mode,
  modeKey,
  playHref,
}: {
  mode: BasketballModeDefinition;
  modeKey: BasketballModeKey;
  /** Builds the play URL for a chosen sound + difficulty. */
  playHref: (soundId: string, difficulty: SpeechDifficulty) => string;
}) {
  const { profile, basketball } = usePlayerProfile();
  const [difficulty, setDifficulty] = useState<SpeechDifficulty>(
    DEFAULT_SPEECH_DIFFICULTY,
  );
  const levels = listLevels();
  const baller = getBaller(basketball.loadout.ballerId);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffdcae] via-[#ffb877] to-[#c98a4b]">
      <PlatformHeader
        eyebrow="Speech Basketball"
        title={
          <>
            {mode.glyph} {mode.title}
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
        backHref="/games/basketball"
        backLabel="← Modes"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-2xl border-4 border-white bg-white/85 p-4 text-sm font-semibold text-[#4a4a60] shadow">
          {mode.blurb} Playing as{" "}
          <span className="font-black text-[#141420]">{baller.name}</span>.
        </p>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c2a12] uppercase">
          Choose a difficulty
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SPEECH_DIFFICULTIES.filter((entry) =>
            mode.difficulties.includes(entry.id),
          ).map((entry) => {
            const selected = entry.id === difficulty;
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setDifficulty(entry.id)}
                className={`rounded-[1.25rem] border-4 p-4 text-left transition-transform active:translate-y-0.5 ${
                  selected
                    ? "border-[#2ecc71] bg-white shadow-lg"
                    : "border-white bg-white/70"
                }`}
              >
                <p className="text-[0.65rem] font-black tracking-[0.18em] text-[#8a8aa0] uppercase">
                  {entry.kicker}
                </p>
                <p className="text-lg font-black text-[#141420]">
                  {entry.label}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6b6b80]">
                  {entry.blurb}
                </p>
              </button>
            );
          })}
        </div>

        <h2 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c2a12] uppercase">
          Choose a sound
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level) => {
            const record = getModeRecord(
              basketball,
              modeKey,
              level.sound.id,
              difficulty,
            );
            return (
              <Link
                key={level.id}
                href={playHref(level.sound.id, difficulty)}
                className="flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/90 p-4 shadow-lg transition-transform active:translate-y-0.5"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fff4d6] text-xl font-black text-[#b8860b]">
                  {level.sound.label}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-black tracking-tight text-[#141420]">
                    {level.sound.label} {mode.title}
                  </p>
                  <p className="text-sm font-semibold text-[#6b6b80]">
                    {record.bestScore > 0
                      ? `Personal best: ${record.bestScore}`
                      : "No record yet — go set one!"}
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>
                  {mode.glyph}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/games/basketball"
            className="text-xs font-bold text-[#3c2a12] underline"
          >
            ← Back to Speech Basketball
          </Link>
        </div>
      </div>
    </main>
  );
}
