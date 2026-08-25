"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { getExplorerMap } from "@/games/adventures/explorer/maps";

/**
 * Same reasoning as the word adventures' `LevelRunner`: the explorer builds
 * a WebGL context, canvas textures and an AudioContext, none of which exist
 * during server rendering, so it mounts client-side only.
 */
const ExplorerShell = dynamic(
  () =>
    import("@/games/adventures/explorer/ExplorerShell").then(
      (module) => module.ExplorerShell,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[100dvh] place-items-center bg-[#141420] text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f5c33b]" />
          <p className="mt-4 text-sm font-black tracking-[0.2em] text-white/70 uppercase">
            Loading world
          </p>
        </div>
      </div>
    ),
  },
);

export function ExplorerRunner({ mapId }: { mapId: string }) {
  const router = useRouter();
  const map = getExplorerMap(mapId);

  const handleExit = useCallback(() => {
    router.push("/games/adventures/beginner");
  }, [router]);

  if (!map) return null;

  return <ExplorerShell map={map} onExit={handleExit} />;
}
