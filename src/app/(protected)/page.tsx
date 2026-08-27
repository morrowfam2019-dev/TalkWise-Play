"use client";

import Link from "next/link";
import { useState } from "react";
import { listLevels } from "@/content/speech";
import {
  FUTURE_GAME_SLOTS,
  listGamesInSection,
  type GameDefinition,
} from "@/platform/games/registry";
import { GameCardArt, hasCardArt } from "@/ui/gameArt";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/player/achievements";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * TalkWise Play — the platform home and game library.
 *
 * This screen belongs to no game. It picks the child, shows the shared
 * wallet and streak, and hands off into whichever independent game they
 * choose. The list of games comes from the registry, so shipping GAME-003
 * means registering it, not editing this file.
 */
function GameCard({
  game,
  compact = false,
  priority = false,
}: {
  game: GameDefinition;
  /** Quick Play cards are smaller — six of them share the shelf. */
  compact?: boolean;
  /** Eagerly load this card's art: it is above the fold on a phone. */
  priority?: boolean;
}) {
  const comingSoon = game.status === "coming-soon";
  const art = hasCardArt(game.artKey);

  return (
    <article
      className={`overflow-hidden rounded-[1.5rem] border-4 shadow-xl ${
        comingSoon ? "border-white/70 bg-white/55" : "border-white bg-white"
      }`}
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden ${
          compact ? "h-24" : "h-36"
        } ${art ? "" : `bg-gradient-to-br ${comingSoon ? "from-[#c9d4de] to-[#a8b6c4]" : game.cardGradient}`}`}
      >
        {/* Original card art where a game has it; GAME-001 and GAME-002 keep
            the glyph cards the founder already approved. */}
        {art ? (
          <GameCardArt artKey={game.artKey} priority={priority} />
        ) : (
          <span
            className={`${compact ? "text-4xl" : "text-6xl"} drop-shadow-lg ${
              comingSoon ? "opacity-70" : ""
            }`}
            aria-hidden
          >
            {game.glyph}
          </span>
        )}
      </div>

      <div className={compact ? "p-3" : "p-5"}>
        <h3
          className={`font-black tracking-tight ${compact ? "text-lg leading-tight" : "text-2xl"} ${
            comingSoon ? "text-[#5c6472]" : "text-[#141420]"
          }`}
        >
          {game.displayName}
        </h3>
        <p
          className={`mt-1 font-semibold text-[#6b6b80] ${
            compact ? "text-xs" : "min-h-[2.5rem] text-sm"
          }`}
        >
          {game.tagline}
        </p>

        {game.sessionLength ? (
          <p className="mt-1 text-[0.6rem] font-black tracking-widest text-[#8a8aa0] uppercase">
            ⏱ {game.sessionLength}
          </p>
        ) : null}

        {comingSoon ? (
          <p
            className={`mt-3 block w-full rounded-2xl bg-[#d7dde4] text-center font-black text-[#7b8494] ${
              compact ? "px-3 py-2.5 text-sm" : "px-6 py-4 text-lg"
            }`}
          >
            COMING SOON
          </p>
        ) : (
          <Link
            href={game.route}
            className={`mt-3 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] text-center font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4 ${
              compact ? "px-3 py-3 text-lg" : "px-6 py-4 text-xl"
            }`}
          >
            PLAY
          </Link>
        )}
      </div>
    </article>
  );
}

export default function TalkWisePlayHome() {
  const { profile, setName, children, activeChildId, switchChild, addChild } =
    usePlayerProfile();
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");

  const featured = listGamesInSection("featured");
  const quickPlay = listGamesInSection("quick-play");
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
      <PlatformHeader
        eyebrow="TalkWise Academy"
        title={
          <>
            TalkWise <span className="text-[#f5c33b]">Play</span>
          </>
        }
        coins={spendableCoins(profile)}
        streak={profile.currentStreak}
      />

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-16">
        {/* Who is playing — platform-level, shared by every game. */}
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
                Pick a game and practice your sounds out loud.
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
                          onChange={(event) =>
                            setNewChildName(event.target.value)
                          }
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

        {/* The game library. Two shelves, both driven entirely by the
            registry: shipping GAME-009 means registering it, not editing
            this file. §13's search and favourites are deliberately not
            built yet — the tags they would need are already on every
            registry entry, so adding them later is not a migration. */}
        <h3 className="mt-8 mb-1 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Featured
        </h3>
        <p className="mb-3 text-xs font-semibold text-[#4a6b78]">
          Big adventures to explore.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        <h3 className="mt-8 mb-1 text-xs font-black tracking-[0.22em] text-[#3c5a68] uppercase">
          Quick Play
        </h3>
        <p className="mb-3 text-xs font-semibold text-[#4a6b78]">
          Short games for a quick practice.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickPlay.map((game, index) => (
            <GameCard key={game.id} game={game} compact priority={index < 2} />
          ))}

          {Array.from({ length: FUTURE_GAME_SLOTS }).map((_, index) => (
            <article
              key={`future-${index}`}
              className="overflow-hidden rounded-[1.5rem] border-4 border-dashed border-white/70 bg-white/40 shadow-md"
            >
              <div className="flex h-24 items-center justify-center bg-gradient-to-br from-[#dbe4ec]/60 to-[#c3cfda]/60">
                <span className="text-4xl opacity-50" aria-hidden>
                  ✨
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-lg leading-tight font-black tracking-tight text-[#7b8494]">
                  More games
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#8a8aa0]">
                  New TalkWise Play games are on the way.
                </p>
                <p className="mt-3 block w-full rounded-2xl bg-[#e6ebf0] px-3 py-2.5 text-center text-sm font-black text-[#8a94a3]">
                  COMING SOON
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Platform achievements — earned across every game. */}
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
                <span
                  className={`text-3xl ${unlocked ? "" : "grayscale"}`}
                  aria-hidden
                >
                  {achievement.glyph}
                </span>
                <p
                  className={`mt-1 text-[0.65rem] font-black tracking-wide uppercase ${
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
