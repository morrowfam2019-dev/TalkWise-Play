"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback } from "react";
import { coerceSpeechDifficulty } from "@/content/speech/engine";

/**
 * MODE 01 Speech Shootout — the playable round.
 *
 * The URL is unchanged from before the multi-mode expansion, so every link,
 * bookmark and back-button history entry that existed still lands here. The
 * difficulty is an optional query parameter that defaults to Intermediate —
 * which is exactly what this route always played.
 *
 * The court mounts client-side only: it builds a WebGL context and an
 * AudioContext, neither of which exists during server rendering — same
 * reasoning as the adventure engine's `LevelRunner`.
 */
const ShootoutMode = dynamic(
  () =>
    import("@/games/basketball/modes/shootout/ShootoutMode").then(
      (module) => module.ShootoutMode,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[100dvh] place-items-center bg-[#141420] text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f5c33b]" />
          <p className="mt-4 text-sm font-black tracking-[0.2em] text-white/70 uppercase">
            Warming up
          </p>
        </div>
      </div>
    ),
  },
);

export default function BasketballRoundPage({
  params,
}: {
  params: Promise<{ soundId: string }>;
}) {
  const { soundId } = use(params);
  const router = useRouter();
  const difficulty = coerceSpeechDifficulty(
    useSearchParams().get("difficulty"),
  );

  // Exiting returns to Basketball's own home, not the platform library —
  // each game owns its internal navigation.
  const handleExit = useCallback(
    () => router.push("/games/basketball"),
    [router],
  );
  const handleChangeSound = useCallback(
    () => router.push("/games/basketball/shootout"),
    [router],
  );

  return (
    <ShootoutMode
      soundId={soundId}
      difficulty={difficulty}
      onExit={handleExit}
      onChangeSound={handleChangeSound}
      onChangeDifficulty={handleChangeSound}
    />
  );
}
