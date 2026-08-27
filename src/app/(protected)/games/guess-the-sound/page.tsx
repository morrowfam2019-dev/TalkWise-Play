"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_GUESS_THE_SOUND } from "@/platform/games/registry";

/** GAME-006 Guess the Sound — pack and level, then play. */
export default function GuessTheSoundHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_GUESS_THE_SOUND)}
      howToPlay="Listen carefully, then tap the one that made that sound!"
    />
  );
}
