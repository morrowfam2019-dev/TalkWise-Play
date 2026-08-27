"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_STORY_BUILDER } from "@/platform/games/registry";

/** GAME-008 Story Builder — pack and level, then play. */
export default function StoryBuilderHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_STORY_BUILDER)}
      howToPlay="Pick the words to build your own story, then say it out loud and watch it happen!"
    />
  );
}
