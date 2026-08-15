import type { SpeechLevel } from "./types";
import { bBay } from "./levels/bBay";
import { mAdventure } from "./levels/mAdventure";
import { pParty } from "./levels/pParty";
import { wWoods } from "./levels/wWoods";

/**
 * Registry of playable speech levels. Adding a new sound means adding its
 * level file and registering it here.
 */
const LEVELS: SpeechLevel[] = [mAdventure, pParty, bBay, wWoods];

export function listLevels(): SpeechLevel[] {
  return LEVELS;
}

export function getLevel(id: string): SpeechLevel | undefined {
  return LEVELS.find((level) => level.id === id);
}

export type { SpeechLevel, SpeechChallenge, SpeechSound } from "./types";
