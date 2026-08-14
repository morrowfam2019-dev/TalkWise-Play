"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getLevel } from "@/content/speech";
import { isLevelUnlocked } from "@/player/storage";
import { usePlayerProfile } from "@/player/usePlayerProfile";

/**
 * The game mounts client-side only: it builds WebGL contexts, canvas textures,
 * and an AudioContext, none of which exist during server rendering.
 */
const GameShell = dynamic(
  () => import("@/game/GameShell").then((module) => module.GameShell),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[100dvh] place-items-center bg-[#141420] text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f5c33b]" />
          <p className="mt-4 text-sm font-black tracking-[0.2em] text-white/70 uppercase">
            Loading adventure
          </p>
        </div>
      </div>
    ),
  },
);

export function LevelRunner({ levelId }: { levelId: string }) {
  const router = useRouter();
  const { profile } = usePlayerProfile();
  const level = getLevel(levelId);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

  if (!level) return null;

  if (!isLevelUnlocked(profile, level)) {
    const requiredTitle = getLevel(level.unlockRequires ?? "")?.title ?? "the previous adventure";
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#141420] p-6 text-center text-white">
        <div>
          <p className="text-5xl" aria-hidden>
            🔒
          </p>
          <p className="mt-4 text-xl font-black">Not unlocked yet.</p>
          <p className="mt-2 text-sm font-semibold text-white/70">
            Complete {requiredTitle} first.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-[#f5c33b] px-6 py-3 font-black text-[#141420]"
          >
            Back to TalkWise Play
          </Link>
        </div>
      </div>
    );
  }

  return <GameShell level={level} onExit={handleExit} />;
}
