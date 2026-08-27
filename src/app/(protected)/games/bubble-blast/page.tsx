"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_BUBBLE_BLAST } from "@/platform/games/registry";

/** GAME-003 Bubble Blast — pack and level, then play. */
export default function BubbleBlastHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_BUBBLE_BLAST)}
      howToPlay="Say your sound, then pop every bubble that matches before the time runs out!"
    />
  );
}
