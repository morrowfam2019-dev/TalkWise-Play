"use client";

import { getBasketballMode } from "@/games/basketball/modes/registry";
import { ModeSetup } from "@/games/basketball/ui/ModeSetup";

/** MODE 01 setup — choose a sound and a difficulty, then tip off. */
export default function ShootoutSetupPage() {
  return (
    <ModeSetup
      mode={getBasketballMode("shootout")}
      modeKey="shootout"
      playHref={(soundId, difficulty) =>
        `/games/basketball/play/${soundId}?difficulty=${difficulty}`
      }
    />
  );
}
