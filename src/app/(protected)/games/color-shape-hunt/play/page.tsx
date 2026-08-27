"use client";

import { use } from "react";
import { coerceMiniLearningLevel } from "@/content/minigames/types";
import { coercePack, getMiniGame } from "@/minigames/registry";
import { GAME_COLOR_SHAPE_HUNT } from "@/platform/games/registry";
import { ColorShapeHuntGame } from "@/games/minigames/colorshapehunt/ColorShapeHuntGame";

export default function ColorShapeHuntPlay({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const definition = getMiniGame(GAME_COLOR_SHAPE_HUNT);

  return (
    <ColorShapeHuntGame
      packId={coercePack(definition, params.pack)}
      level={coerceMiniLearningLevel(params.level)}
    />
  );
}
