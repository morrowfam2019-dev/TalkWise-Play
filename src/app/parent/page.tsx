"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { listLevels } from "@/content/speech";
import { ACHIEVEMENTS, getUnlockedAchievements } from "@/player/achievements";
import { getLevelProgress, householdStore, setAssistMode } from "@/player/storage";

/**
 * Read-only history for a parent to check in on practice — total coins,
 * streaks, per-level bests, and unlocked achievements for every child
 * profile on this device. No login yet; this page is only as private as the
 * device it's opened on, which is honest given there's no backend behind it
 * (see Phase 5 in the roadmap).
 */
export default function ParentPage() {
  const household = useSyncExternalStore(
    householdStore.subscribe,
    householdStore.getSnapshot,
    householdStore.getServerSnapshot,
  );
  const levels = listLevels();
  const levelChallengeCounts = Object.fromEntries(
    levels.map((level) => [level.id, level.challenges.length]),
  );

  const toggleAssist = (childId: string) => {
    const current = householdStore.getSnapshot();
    const childProfile = current.children[childId];
    if (!childProfile) return;
    householdStore.save({
      ...current,
      children: {
        ...current.children,
        [childId]: setAssistMode(childProfile, !childProfile.assistMode),
      },
    });
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#eaf8e6] via-[#f5f6fb] to-[#eaf4ff]">
      <header className="bg-[#141420] px-5 py-4 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.28em] text-[#f5c33b] uppercase">
              TalkWise Academy
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Parent <span className="text-[#f5c33b]">View</span>
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border-2 border-white/30 px-4 py-2 text-sm font-black text-white"
          >
            ← Back
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-7 pb-16">
        <p className="text-sm font-semibold text-[#4a4a60]">
          Practice history for every child profile on this device. This view
          isn&apos;t password-protected yet — anyone with access to the
          device can open it.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          {household.order.map((childId) => {
            const profile = household.children[childId];
            if (!profile) return null;

            const unlocked = getUnlockedAchievements({
              profile,
              totalLevels: levels.length,
              levelChallengeCounts,
            });

            return (
              <section
                key={childId}
                className="rounded-[1.75rem] border-4 border-white bg-white/90 p-5 shadow-xl sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-black tracking-tight text-[#141420]">
                    {profile.name || "Player"}
                  </h2>
                  <div className="flex gap-2 text-xs font-black">
                    <span className="rounded-full bg-[#fff4d6] px-3 py-1.5 text-[#b8860b]">
                      🪙 {profile.totalCoins} coins
                    </span>
                    <span className="rounded-full bg-[#ffe9dc] px-3 py-1.5 text-[#ff8a3d]">
                      🔥 {profile.currentStreak} day streak
                    </span>
                    <span className="rounded-full bg-[#eaf4ff] px-3 py-1.5 text-[#2f7fd4]">
                      🏆 {unlocked.length}/{ACHIEVEMENTS.length} badges
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAssist(childId)}
                  className={`mt-3 rounded-xl border-2 px-3 py-2 text-xs font-black ${
                    profile.assistMode
                      ? "border-[#2ecc71] bg-[#e6f9ee] text-[#2ecc71]"
                      : "border-[#e2e4ee] text-[#4a4a60]"
                  }`}
                >
                  🧩 Easy mode (jump timing + listen window):{" "}
                  {profile.assistMode ? "On" : "Off"}
                </button>

                <table className="mt-4 w-full text-left text-sm">
                  <thead>
                    <tr className="text-[0.65rem] font-black tracking-wide text-[#8a8aa0] uppercase">
                      <th className="pb-1.5">Adventure</th>
                      <th className="pb-1.5">Checkpoints</th>
                      <th className="pb-1.5">Best coins</th>
                      <th className="pb-1.5">Finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((level) => {
                      const progress = getLevelProgress(profile, level.id);
                      return (
                        <tr key={level.id} className="border-t border-[#eef0f5]">
                          <td className="py-2 font-bold text-[#141420]">
                            {level.title}
                          </td>
                          <td className="py-2 font-semibold text-[#4a4a60]">
                            {progress.bestCheckpoints}/{level.challenges.length}
                          </td>
                          <td className="py-2 font-semibold text-[#4a4a60]">
                            {progress.bestCoins}
                          </td>
                          <td className="py-2">
                            {progress.completed ? (
                              <span className="font-black text-[#2ecc71]">
                                ★ Yes
                              </span>
                            ) : (
                              <span className="font-semibold text-[#b0b0c0]">
                                Not yet
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {profile.lastPlayedDate ? (
                  <p className="mt-3 text-xs font-semibold text-[#8a8aa0]">
                    Last played {profile.lastPlayedDate} · best streak{" "}
                    {profile.bestStreak} day{profile.bestStreak === 1 ? "" : "s"}
                  </p>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-[#8a8aa0]">
                    No runs recorded yet.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
