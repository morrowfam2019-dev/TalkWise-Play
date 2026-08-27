"use client";

import { use } from "react";
import { coerceMiniLearningLevel } from "@/content/minigames/types";
import { coercePack, getMiniGame } from "@/minigames/registry";
import { GAME_GUESS_THE_SOUND } from "@/platform/games/registry";
import { GuessTheSoundGame } from "@/games/minigames/guessthesound/GuessTheSoundGame";

export default function GuessTheSoundPlay({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const definition = getMiniGame(GAME_GUESS_THE_SOUND);

  return (
    <GuessTheSoundGame
      packId={coercePack(definition, params.pack)}
      level={coerceMiniLearningLevel(params.level)}
    />
  );
}
