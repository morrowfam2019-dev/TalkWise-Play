"use client";

import Link from "next/link";
import { useState } from "react";
import { COMING_SOON } from "@/content/comingSoon";
import { getLevel, listLevels } from "@/content/speech";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/player/achievements";
import { getLevelProgress, isLevelUnlocked } from "@/player/storage";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";

/** TalkWise Play home — the hub the adventures live inside. */
export default function HomePage() {
  const { profile, setName, children, activeChildId, switchChild, addChild } =
    usePlayerProfile();
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const levels = listLevels();

  const handleAddChild = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newChildName.trim();
    if (!trimmed) return;
    addChild(trimmed);
    setNewChildName("");
    setAddingChild(false);
  };

  const greeting = profile.name ? `Hi, ${profile.name}!` : "Hi there!";

  const levelChallengeCounts = Object.fromEntries(
    levels.map((level) => [level.id, level.challenges.length]),
  );
  const unlockedAchievementIds = new Set(
    getUnlockedAchievements({
      profile,
      totalLevels: levels.length,
      levelChallengeCounts,
    }).map((achievement) => achievement.id),
  );

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#8fd8f5] via-[#bfeafb] to-[#eaf8e6]">
      {/* Brand chrome */}
      <header className="bg-[#141420] px-5 py-4 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.28em] text-[#f5c33b] uppercase">
              TalkWise Academy
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              TalkWise <span className="text-[#f5c33b]">Play</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {profile.currentStreak > 0 ? (
              <div className="rounded-2xl border-2 border-[#ff8a3d]/40 bg-white/5 px-3 py-2 text-right">
                <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
                  Streak
                </p>
                <p className="text-xl font-black text-[#ff8a3d] tabular-nums">
                  🔥 {profile.currentStreak}
                </p>
              </div>
            ) : null}
            <div className="rounded-2xl border-2 border-[#f5c33b]/40 bg-white/5 px-3 py-2 text-right">
              <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
                Coins
              </p>
              <p className="text-xl font-black text-[#f5c33b] tabular-nums">
                {spendableCoins(profile)}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-16">
        {/* Welcome + player name */}
        <section className="rounded-[1.75rem] border-4 border-white bg-white/85 p-5 shadow-xl backdrop-blur-sm sm:p-6">
          <div className="flex items-start gap-4">
            <div className="tw-float text-5xl sm:text-6xl" aria-hidden>
              🙌
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black tracking-tight text-[#141420] sm:text-3xl">
                {greeting}
              </h2>
              <p className="mt-1 text-base font-semibold text-[#4a4a60]">
                Pick an adventure, explore the world, and practice your sounds
                out loud.
              </p>

              {children.length > 1 || addingChild ? (
                <div className="mt-4">
                  <span className="text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
                    Playing as
                  </span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => switchChild(child.id)}
                        className={`rounded-full px-4 py-2 text-sm font-black transition ${
                          child.id === activeChildId
                            ? "bg-[#141420] text-white"
                            : "border-2 border-[#e2e4ee] bg-white text-[#4a4a60]"
                        }`}
                      >
                        {child.name || "Player"}
                      </button>
                    ))}
                    {addingChild ? (
                      <form
                        onSubmit={handleAddChild}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newChildName}
                          onChange={(event) => setNewChildName(event.target.value)}
                          placeholder="Name"
                          maxLength={20}
                          className="w-28 rounded-full border-2 border-[#e2e4ee] bg-white px-3 py-2 text-sm font-bold text-[#141420] outline-none focus:border-[#f5c33b]"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-[#2ecc71] px-3 py-2 text-sm font-black text-white"
                        >
                          Add
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingChild(true)}
                        className="rounded-full border-2 border-dashed border-[#8a8aa0] px-4 py-2 text-sm font-black text-[#6b6b80]"
                      >
                        + Add child
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingChild(true)}
                  className="mt-3 text-xs font-bold text-[#4a6b78] underline"
                >
                  + Add another child&apos;s profile
                </button>
              )}

              <label className="mt-4 block">
                <span className="text-xs font-black tracking-widest text-[#8a8aa0] uppercase">
                  Your name
                </span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Type your name"
                  maxLength={20}
                  className="mt-1 w-full max-w-xs rounded-xl border-4 border-[#e2e4ee] bg-white px-4 py-2.5 text-lg font-bold text-[#141420] outline-none focus:border-[#f5c33b]"
                />
              </label>
            </div>
          </div>
        </section>

        <Link
          href="/shop"
          className="mt-4 flex items-center gap-4 rounded-[1.5rem] border-4 border-white bg-white/85 p-4 shadow-lg backdrop-blur-sm transition-transform active:translate-y-0.5"
        >
          <span className="text-4xl" aria-hidden>
            🛍️
          </span>
          <span className="flex-1 text-left">
            <span className="block text-lg font-black tracking-tight text-[#141420]">
              The Store
            </span>
            <span className="block text-sm font-semibold text-[#6b6b80]">
              Spend your coins on characters, auras, and boosts.
            </span>
          </span>
          <span className="rounded-full bg-[#fff4d6] px-3 py-1.5 text-sm font-black text-[#b8860b] tabular-nums">
            🪙 {spendableCoins(profile)}
          </span>
        </Link>

        {/* Playable adventures */}
        <h3 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Adventures
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level) => {
            const progress = getLevelProgress(profile, level.id);
            const unlocked = isLevelUnlocked(profile, level);

            if (!unlocked) {
              const requiredTitle =
                getLevel(level.unlockRequires ?? "")?.title ?? "the previous adventure";
              return (
                <article
                  key={level.id}
                  className="overflow-hidden rounded-[1.5rem] border-4 border-white/70 bg-white/55 shadow-md"
                >
                  <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#c9d4de] to-[#a8b6c4]">
                    <span className="text-5xl font-black text-white/70 drop-shadow-lg">
                      {level.sound.label}
                    </span>
                    <span className="absolute top-3 right-3 text-2xl" aria-hidden>
                      🔒
                    </span>
                  </div>
                  <div className="p-5">
                    <h4 className="text-xl font-black tracking-tight text-[#5c6472]">
                      {level.title}
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-[#8a8aa0]">
                      Target sound: {level.sound.label}
                    </p>
                    <p className="mt-4 block w-full rounded-2xl bg-[#d7dde4] px-6 py-4 text-center text-sm font-black text-[#7b8494]">
                      Complete {requiredTitle} to unlock
                    </p>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={level.id}
                className="overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-xl"
              >
                <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-[#6fd36b] to-[#2fa85a]">
                  <span className="text-6xl font-black text-white drop-shadow-lg">
                    {level.sound.label}
                  </span>
                  {progress.completed ? (
                    <span className="absolute top-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black text-[#2ecc71]">
                      ★ COMPLETE
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <h4 className="text-xl font-black tracking-tight text-[#141420]">
                    {level.title}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-[#6b6b80]">
                    Target sound: {level.sound.label} · {level.challenges.length}{" "}
                    speech challenges
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#4a4a60]">
                    {level.tagline}
                  </p>

                  {progress.bestCheckpoints > 0 ? (
                    <p className="mt-3 rounded-lg bg-[#f3f4f8] px-3 py-1.5 text-xs font-bold text-[#4a4a60]">
                      Best: {progress.bestCheckpoints}/{level.challenges.length}{" "}
                      challenges · {progress.bestCoins} coins
                    </p>
                  ) : null}

                  <Link
                    href={`/play/${level.id}`}
                    className="mt-4 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-4 text-center text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
                  >
                    PLAY
                  </Link>
                </div>
              </article>
            );
          })}

          {COMING_SOON.map((entry) => (
            <article
              key={entry.title}
              className="overflow-hidden rounded-[1.5rem] border-4 border-white/70 bg-white/55 shadow-md"
            >
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#c9d4de] to-[#a8b6c4]">
                <span className="text-5xl opacity-70" aria-hidden>
                  {entry.glyph}
                </span>
              </div>
              <div className="p-5">
                <h4 className="text-xl font-black tracking-tight text-[#5c6472]">
                  {entry.title}
                </h4>
                <p className="mt-1 text-sm font-semibold text-[#8a8aa0]">
                  Target sound: {entry.soundLabel}
                </p>
                <p className="mt-4 block w-full rounded-2xl bg-[#d7dde4] px-6 py-4 text-center text-lg font-black text-[#7b8494]">
                  COMING SOON
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Achievements */}
        <h3 className="mt-8 mb-3 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = unlockedAchievementIds.has(achievement.id);
            return (
              <div
                key={achievement.id}
                title={achievement.description}
                className={`flex flex-col items-center rounded-2xl border-4 p-3 text-center shadow-md ${
                  unlocked
                    ? "border-[#f5c33b] bg-white"
                    : "border-white/70 bg-white/40 opacity-60"
                }`}
              >
                <span className={`text-3xl ${unlocked ? "" : "grayscale"}`} aria-hidden>
                  {achievement.glyph}
                </span>
                <p
                  className={`mt-1 text-[0.65rem] font-black uppercase tracking-wide ${
                    unlocked ? "text-[#141420]" : "text-[#8a8aa0]"
                  }`}
                >
                  {achievement.title}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center gap-5 text-center">
          <Link
            href="/shop"
            className="text-xs font-bold text-[#4a6b78] underline"
          >
            🛍️ The Store
          </Link>
          <Link
            href="/parent"
            className="text-xs font-bold text-[#4a6b78] underline"
          >
            👪 Parent View
          </Link>
        </div>

        <p className="mt-3 text-center text-xs font-semibold text-[#4a6b78]">
          TalkWise Play · part of TalkWise Academy
        </p>
      </div>
    </main>
  );
}
