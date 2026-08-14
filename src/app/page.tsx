"use client";

import Link from "next/link";
import { COMING_SOON } from "@/content/comingSoon";
import { getLevel, listLevels } from "@/content/speech";
import { getLevelProgress, isLevelUnlocked } from "@/player/storage";
import { usePlayerProfile } from "@/player/usePlayerProfile";

/** TalkWise Play home — the hub the adventures live inside. */
export default function HomePage() {
  const { profile, setName } = usePlayerProfile();
  const levels = listLevels();

  const greeting = profile.name ? `Hi, ${profile.name}!` : "Hi there!";

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
          <div className="rounded-2xl border-2 border-[#f5c33b]/40 bg-white/5 px-3 py-2 text-right">
            <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
              Coins
            </p>
            <p className="text-xl font-black text-[#f5c33b] tabular-nums">
              {profile.totalCoins}
            </p>
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

        <p className="mt-10 text-center text-xs font-semibold text-[#4a6b78]">
          TalkWise Play · part of TalkWise Academy
        </p>
      </div>
    </main>
  );
}
