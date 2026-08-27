"use client";

import { MiniGameSetup } from "@/minigames/ui/MiniGameSetup";
import { getMiniGame } from "@/minigames/registry";
import { GAME_COLOR_SHAPE_HUNT } from "@/platform/games/registry";

/** GAME-005 Colour & Shape Hunt — pack and level, then play. */
export default function ColorShapeHuntHome() {
  return (
    <MiniGameSetup
      definition={getMiniGame(GAME_COLOR_SHAPE_HUNT)}
      howToPlay="Listen to Miss Maya, then find it in the scene and tap it!"
    />
  );
}
