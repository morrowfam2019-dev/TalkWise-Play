"use client";

import { use } from "react";
import { coerceMiniLearningLevel } from "@/content/minigames/types";
import { coercePack, getMiniGame } from "@/minigames/registry";
import { GAME_BUBBLE_BLAST } from "@/platform/games/registry";
import { BubbleBlastGame } from "@/games/minigames/bubbleblast/BubbleBlastGame";

/**
 * The play route.
 *
 * Pack and level arrive as query parameters and are **coerced**, never
 * trusted: a stale bookmark naming a pack this game cannot run, or a level
 * that no longer exists, falls back to a playable default rather than
 * rendering an error at a four-year-old.
 */
export default function BubbleBlastPlay({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);
  const definition = getMiniGame(GAME_BUBBLE_BLAST);

  return (
    <BubbleBlastGame
      packId={coercePack(definition, params.pack)}
      level={coerceMiniLearningLevel(params.level)}
    />
  );
}
