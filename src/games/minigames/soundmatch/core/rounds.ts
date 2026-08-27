/**
 * Sound Match's round planner — pure data, no React.
 *
 * A round is: one target, three or four choices, one drop target. What the
 * target *is* changes by level, which is the §5 requirement that a game not
 * force one speech structure onto three different learning goals:
 *
 * - **Beginner** — a letter. "Find the M." Choices are letters; the child
 *   drags the matching one into the chest.
 * - **Intermediate** — a word. "Find MOON." Choices are pictures.
 * - **Expert** — a sentence. "The dog is under the table." Choices are
 *   scenes, and the child drags the one the sentence describes.
 *
 * Distractors come from `pickDistractors`, so at every level they avoid
 * sounds confusable with the target — a matching game must not quietly
 * become an articulation discrimination test (§7).
 */

import {
  contentPoolFor,
  createRng,
  pickDistractors,
  shuffle,
  type ContentItem,
} from "@/content/minigames";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { GAME_SOUND_MATCH } from "@/platform/games/registry";

/** Rounds in a session. §14: 1–2 minutes, and eight rounds lands there. */
export const ROUNDS_PER_SESSION = 8;

/** Choices on screen. Three at Beginner, four above it. */
export function choiceCount(level: MiniLearningLevel): number {
  return level === "beginner" ? 3 : 4;
}

export interface MatchChoice {
  id: string;
  item: ContentItem;
  isTarget: boolean;
  /** What the card shows. */
  label: string;
  glyph: string;
}

export interface MatchRound {
  index: number;
  target: ContentItem;
  /** The instruction, in a child's words. */
  prompt: string;
  /** What Miss Maya reads out. */
  spoken: string;
  choices: MatchChoice[];
  /** The label on the drop target. */
  chestLabel: string;
}

/**
 * Plans a whole session at once.
 *
 * All eight rounds up front rather than one at a time, so a target can
 * never repeat within a session — a child who has just found the moon
 * being asked for the moon again reads as the game not noticing.
 *
 * Returns fewer rounds than asked for when the pack is small, and null when
 * it cannot support even three; callers handle a short session rather than
 * padding it with repeats.
 */
export function planSession(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): MatchRound[] | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const pool = contentPoolFor({
    gameId: GAME_SOUND_MATCH,
    packId,
    level,
    count: 0,
  });
  const choices = choiceCount(level);
  if (pool.length < choices + 1) return null;

  // At Beginner the "thing" is a letter, so two items sharing a sound would
  // produce two identical cards. Deduplicate by sound before choosing.
  const candidates =
    level === "beginner"
      ? dedupeBySound(pool.filter((item) => item.targetSound))
      : pool;
  if (candidates.length < 3) return null;

  const targets = shuffle(candidates, rng).slice(0, ROUNDS_PER_SESSION);

  return targets.map((target, index) => {
    const distractorPool =
      level === "beginner" ? candidates : pool;
    const distractors = pickDistractors({
      target,
      pool: distractorPool,
      count: choices - 1,
      rng,
    });

    const cards = shuffle(
      [
        { id: target.id, item: target, isTarget: true, ...faceOf(target, level) },
        ...distractors.map((item) => ({
          id: item.id,
          item,
          isTarget: false,
          ...faceOf(item, level),
        })),
      ],
      rng,
    );

    return {
      index,
      target,
      prompt: promptFor(target, level),
      spoken: spokenFor(target, level),
      choices: cards,
      chestLabel: chestLabelFor(target, level),
    };
  });
}

function dedupeBySound(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  const unique: ContentItem[] = [];
  for (const item of items) {
    const sound = item.targetSound;
    if (!sound || seen.has(sound)) continue;
    seen.add(sound);
    unique.push(item);
  }
  return unique;
}

function faceOf(
  item: ContentItem,
  level: MiniLearningLevel,
): { label: string; glyph: string } {
  if (level === "beginner") {
    return {
      label: (item.targetSound ?? item.word[0]).toUpperCase(),
      glyph: item.glyph,
    };
  }
  if (level === "expert") {
    return { label: item.sentence ?? item.word, glyph: item.glyph };
  }
  return { label: item.word, glyph: item.glyph };
}

function promptFor(item: ContentItem, level: MiniLearningLevel): string {
  if (level === "beginner") {
    return `Find the ${(item.targetSound ?? item.word[0]).toUpperCase()}`;
  }
  if (level === "expert") return item.sentence ?? item.word;
  return `Find ${item.word.toUpperCase()}`;
}

function spokenFor(item: ContentItem, level: MiniLearningLevel): string {
  if (level === "beginner") {
    const letter = (item.targetSound ?? item.word[0]).toUpperCase();
    return `Find the ${letter}, like ${item.word}.`;
  }
  if (level === "expert") return `Find the picture for: ${item.sentence}`;
  return `Find ${item.word}.`;
}

function chestLabelFor(item: ContentItem, level: MiniLearningLevel): string {
  if (level === "beginner") {
    return (item.targetSound ?? item.word[0]).toUpperCase();
  }
  if (level === "expert") return "the right one";
  return item.word;
}
