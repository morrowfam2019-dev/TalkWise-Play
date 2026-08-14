"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getLevel } from "@/content/speech";

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
  const level = getLevel(levelId);

  const handleExit = useCallback(() => {
    router.push("/");
  }, [router]);

  if (!level) return null;

  return <GameShell level={level} onExit={handleExit} />;
}
