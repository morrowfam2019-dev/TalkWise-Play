"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback } from "react";
import { coerceSpeechDifficulty } from "@/content/speech/engine";

/**
 * MODE 02 Time Attack — the playable round.
 *
 * Client-only for the same reason as every other court screen: it builds a
 * WebGL context and an AudioContext, neither of which exists during server
 * rendering.
 */
const TimeAttackMode = dynamic(
  () =>
    import("@/games/basketball/modes/timeattack/TimeAttackMode").then(
      (module) => module.TimeAttackMode,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[100dvh] place-items-center bg-[#141420] text-center">
        <div>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#f5c33b]" />
          <p className="mt-4 text-sm font-black tracking-[0.2em] text-white/70 uppercase">
            Racking the balls
          </p>
        </div>
      </div>
    ),
  },
);

export default function TimeAttackPlayPage({
  params,
}: {
  params: Promise<{ soundId: string }>;
}) {
  const { soundId } = use(params);
  const router = useRouter();
  const difficulty = coerceSpeechDifficulty(
    useSearchParams().get("difficulty"),
  );

  const handleExit = useCallback(() => router.push("/"), [router]);
  const handleBackToBasketball = useCallback(
    () => router.push("/games/basketball"),
    [router],
  );
  const handleChangeSetup = useCallback(
    () => router.push("/games/basketball/time-attack"),
    [router],
  );

  return (
    <TimeAttackMode
      soundId={soundId}
      difficulty={difficulty}
      onExit={handleExit}
      onChangeSound={handleChangeSetup}
      onChangeDifficulty={handleChangeSetup}
      onBackToBasketball={handleBackToBasketball}
    />
  );
}
