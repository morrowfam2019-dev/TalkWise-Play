"use client";

import { use } from "react";
import { coerceMiniLearningLevel } from "@/content/minigames/types";
import { coercePack, getMiniGame } from "@/minigames/registry";
import { GAME_STORY_BUILDER } from "@/platform/games/registry";
import { StoryBuilderGame } from "@/games/minigames/storybuilder/StoryBuilderGame";

export default function StoryBuilderPlay({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const definition = getMiniGame(GAME_STORY_BUILDER);

  return (
    <StoryBuilderGame
      packId={coercePack(definition, params.pack)}
      level={coerceMiniLearningLevel(params.level)}
    />
  );
}
