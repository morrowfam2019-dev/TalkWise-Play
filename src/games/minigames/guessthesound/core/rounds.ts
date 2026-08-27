/**
 * Guess the Sound's round planner — pure data, no React.
 *
 * ## The difficulty axis here is listening, not language
 *
 * This is the one mini-game whose levels are not primarily about how hard
 * the *talking* is, and §5 explicitly allows that: "do NOT force every
 * mini-game into exactly the same speech structure when it does not make
 * educational sense". What gets harder here is the discrimination:
 *
 * - **Beginner** — three choices from obviously different families. A dog,
 *   a car and a drum do not sound remotely alike, so a child is learning
 *   that sounds *mean* things before being asked to tell similar ones apart.
 *   Its distractors are drawn from the **whole library**, not the chosen
 *   pack: every pack here is single-family by construction (Animal World is
 *   all animals), so a within-pack Beginner round would quietly be an
 *   Intermediate one. The *target* still comes from the chosen pack, so the
 *   pack a family picked is still the thing being practised.
 * - **Intermediate** — three choices, and the two wrong ones come from the
 *   same family as the right one. Telling a cow from a sheep is a genuinely
 *   different skill from telling a cow from a doorbell.
 * - **Expert** — four choices, same family, and the question is asked as a
 *   sentence rather than a word: "Which one is making that sound?" followed
 *   by naming it in a sentence afterwards.
 *
 * The reward for a correct answer is always the same: the object reveals
 * itself and animates, and Miss Maya names it.
 */

import {
  contentPoolFor,
  createRng,
  shuffle,
  type ContentItem,
} from "@/content/minigames";
import { getListenRecipe } from "@/content/minigames/listen";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { GAME_GUESS_THE_SOUND } from "@/platform/games/registry";

/** Sounds in a session. §14: 1–2 minutes. */
export const SOUNDS_PER_SESSION = 8;

export function choiceCount(level: MiniLearningLevel): number {
  return level === "expert" ? 4 : 3;
}

export interface SoundChoice {
  id: string;
  item: ContentItem;
  isTarget: boolean;
}

export interface SoundRound {
  index: number;
  target: ContentItem;
  choices: SoundChoice[];
  /** The question, in a child's words. */
  prompt: string;
  /** What Miss Maya says when the answer is revealed. */
  reveal: string;
  /** The onomatopoeia shown on the reveal, e.g. "Woof woof!". */
  onomatopoeia: string;
}

/**
 * Plans a session.
 *
 * Only items that carry a sound recipe are eligible, and the registry
 * already restricts this game to the four packs that have them — this
 * filter is what makes that true rather than assumed.
 */
export function planSounds(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): SoundRound[] | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const withRecipe = (items: ContentItem[]) =>
    items.filter((item) => item.listen && getListenRecipe(item.listen));

  const pool = withRecipe(
    contentPoolFor({
      gameId: GAME_GUESS_THE_SOUND,
      packId,
      level,
      count: 0,
      requires: ["listen"],
    }),
  );

  const library = withRecipe(
    contentPoolFor({
      gameId: GAME_GUESS_THE_SOUND,
      packId: "mixed",
      level,
      count: 0,
      requires: ["listen"],
    }),
  );

  const choices = choiceCount(level);

  // Beginner reaches across the library for its wrong answers by design.
  // Above Beginner it does so only when the chosen pack cannot fill a round
  // on its own — Outside Adventures carries three sounds, and an Expert
  // round needs four choices. Reaching for a fourth is better than telling
  // a child a pack the setup screen just offered them is not ready.
  const distractorSource =
    level === "beginner" || pool.length < choices ? library : pool;

  if (pool.length < 1 || distractorSource.length < choices) return null;

  const targets = shuffle(pool, rng).slice(0, SOUNDS_PER_SESSION);

  return targets.map((target, index) => {
    const targetFamily = getListenRecipe(target.listen!)?.family;

    // Above Beginner the distractors come from the same sound family, which
    // is what turns "what is that?" into "which of these three?".
    const sameFamily = distractorSource.filter(
      (item) =>
        item.id !== target.id &&
        getListenRecipe(item.listen!)?.family === targetFamily,
    );
    const otherFamily = distractorSource.filter(
      (item) =>
        item.id !== target.id &&
        getListenRecipe(item.listen!)?.family !== targetFamily,
    );

    const preferred = level === "beginner" ? otherFamily : sameFamily;
    const fallback = level === "beginner" ? sameFamily : otherFamily;

    const distractors = [
      ...shuffle(preferred, rng),
      ...shuffle(fallback, rng),
    ].slice(0, choices - 1);

    const cards = shuffle(
      [
        { id: target.id, item: target, isTarget: true },
        ...distractors.map((item) => ({ id: item.id, item, isTarget: false })),
      ],
      rng,
    );

    return {
      index,
      target,
      choices: cards,
      prompt:
        level === "expert"
          ? "Listen. Which one is making that sound?"
          : "What made that sound?",
      reveal:
        level === "expert"
          ? (target.sentence ?? `It was the ${target.word}!`)
          : `It was the ${target.word}!`,
      onomatopoeia: getListenRecipe(target.listen!)?.onomatopoeia ?? "",
    };
  });
}
