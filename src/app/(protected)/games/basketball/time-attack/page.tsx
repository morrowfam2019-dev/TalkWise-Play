"use client";

import { getBasketballMode } from "@/games/basketball/modes/registry";
import { ModeSetup } from "@/games/basketball/ui/ModeSetup";

/** MODE 02 setup — choose a sound and a difficulty, then start the clock. */
export default function TimeAttackSetupPage() {
  return (
    <ModeSetup
      mode={getBasketballMode("timeAttack")}
      modeKey="timeAttack"
      playHref={(soundId, difficulty) =>
        `/games/basketball/time-attack/play/${soundId}?difficulty=${difficulty}`
      }
    />
  );
}
