"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_SOUND_MATCH } from "@/platform/games/registry";

/** GAME-004 Sound Match — pack and level, then play. */
export default function SoundMatchHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_SOUND_MATCH)}
      howToPlay="Miss Maya asks for something. Drag the right one into the treasure chest!"
    />
  );
}
