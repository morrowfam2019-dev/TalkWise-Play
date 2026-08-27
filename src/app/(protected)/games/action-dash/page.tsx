"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_ACTION_DASH } from "@/platform/games/registry";

/** GAME-007 Action Dash — pack and level, then play. */
export default function ActionDashHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_ACTION_DASH)}
      howToPlay="Find the right action, then say the word out loud — and watch TJ do it!"
    />
  );
}
