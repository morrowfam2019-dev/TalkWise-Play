"use client";

import { use } from "react";
import { coerceMiniLearningLevel } from "@/content/minigames/types";
import { coercePack, getMiniGame } from "@/minigames/registry";
import { GAME_SOUND_MATCH } from "@/platform/games/registry";
import { SoundMatchGame } from "@/games/minigames/soundmatch/SoundMatchGame";

export default function SoundMatchPlay({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const definition = getMiniGame(GAME_SOUND_MATCH);

  return (
    <SoundMatchGame
      packId={coercePack(definition, params.pack)}
      level={coerceMiniLearningLevel(params.level)}
    />
  );
}
