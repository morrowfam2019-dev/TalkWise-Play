/**
 * The GAME-001 three-stage curriculum.
 *
 * One target sound, three stages of production:
 *
 * ```
 * /m/            BEGINNER     Sound Explorer     make the sound
 *   ↓
 * MOON, MILK…    INTERMEDIATE Word Adventures    use it in a word
 *   ↓
 * "I see the     EXPERT       Sentence Adventures use it in a sentence
 *  big moon."
 * ```
 *
 * The join between the three is a single shared id: `BeginnerSound.id`,
 * `SpeechSound.id` on an Intermediate level, and `ExpertQuest.soundId` are
 * the same string. Nothing else has to line up, so a sound can exist at one
 * stage before the others catch up — which is exactly the state the library
 * is in for anything past the current seven sounds.
 *
 * This module is a *view* over the existing content. It owns no words, no
 * sentences, and no sounds of its own, so adding content never means editing
 * it.
 */

import {
  BEGINNER_SOUNDS,
  getBeginnerSound,
  type BeginnerSound,
} from "./beginner";
import { getExpertQuestForSound } from "./expert";
import type { ExpertQuest } from "./expert";
import { listLevels } from "./index";
import { getSoundLadder } from "./tiers";
import type { SpeechLevel } from "./types";

/** The three stages of GAME-001. Order is the progression. */
export const ADVENTURE_TIERS = ["beginner", "intermediate", "expert"] as const;

export type AdventureTier = (typeof ADVENTURE_TIERS)[number];

export function isAdventureTier(value: unknown): value is AdventureTier {
  return value === "beginner" || value === "intermediate" || value === "expert";
}

/** Everything GAME-001 currently has for one target sound. */
export interface SoundCurriculum {
  soundId: string;
  /** Display form used across the tiers, e.g. "/M/". */
  label: string;
  /** Stage 1, when the sound has a Beginner station record. */
  beginner: BeginnerSound | undefined;
  /** Stage 2 — the existing word adventure, untouched by this layer. */
  intermediate: SpeechLevel | undefined;
  /** Stage 3, when the sound has a sentence quest. */
  expert: ExpertQuest | undefined;
  /** The Expert sentences behind that quest, for display and inspection. */
  sentences: string[];
}

export function getSoundCurriculum(soundId: string): SoundCurriculum {
  const level = listLevels().find((entry) => entry.sound.id === soundId);
  const beginner = getBeginnerSound(soundId);
  return {
    soundId,
    label: level?.sound.label ?? beginner?.phoneme ?? soundId.toUpperCase(),
    beginner,
    intermediate: level,
    expert: getExpertQuestForSound(soundId),
    sentences: getSoundLadder(soundId)?.sentences ?? [],
  };
}

/**
 * Every sound GAME-001 knows about at any stage, in Intermediate
 * registration order with Beginner-only sounds appended. Used by the parent
 * view to show the ladder honestly, gaps included.
 */
export function listSoundCurricula(): SoundCurriculum[] {
  const ids = listLevels().map((level) => level.sound.id);
  for (const sound of BEGINNER_SOUNDS) {
    if (!ids.includes(sound.id)) ids.push(sound.id);
  }
  return ids.map(getSoundCurriculum);
}
