/**
 * Action Dash's round planner — pure data, no React.
 *
 * ## What makes this game different from the other five
 *
 * In every other mini-game the speech moment sits *beside* the gameplay —
 * say it, then play. Here the speech **is** the gameplay: a child says
 * "JUMP" and TJ jumps. §7 asks for exactly that ("the speech creates the
 * action"), and it is the clearest expression of the whole collection's
 * thesis — your communication makes the game react, rather than you
 * completing an exercise.
 *
 * So the loop is deliberately inverted. The child first *identifies* the
 * action (which of these three is jumping?), and then *produces* it, and
 * the production is what plays the animation. Getting the identification
 * right earns the points; saying the word earns the show.
 *
 * ## The levels
 *
 * - **Beginner** — the bare verb. "JUMP."
 * - **Intermediate** — a two-word phrase. "Jump high."
 * - **Expert** — a sentence describing the scene. "The boy is jumping over
 *   the box." The child picks the scene the sentence describes, then says
 *   the sentence.
 */

import { contentPoolFor, createRng, shuffle } from "@/content/minigames";
import { getAction } from "@/content/minigames/attributes";
import type {
  ActionId,
  ContentItem,
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { GAME_ACTION_DASH } from "@/platform/games/registry";

/** Actions in a session. §14: 1–3 minutes. */
export const ACTIONS_PER_SESSION = 8;

export function choiceCount(level: MiniLearningLevel): number {
  return level === "expert" ? 4 : 3;
}

export interface ActionChoice {
  id: string;
  item: ContentItem;
  action: ActionId;
  isTarget: boolean;
  /** What the card shows under the picture. */
  label: string;
}

export interface ActionRound {
  index: number;
  target: ContentItem;
  action: ActionId;
  choices: ActionChoice[];
  /** The question, in a child's words. */
  prompt: string;
  /** What Miss Maya reads out. */
  spoken: string;
  /** What the child says to trigger the animation. */
  sayText: string;
}

export function planActions(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): ActionRound[] | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const pool = contentPoolFor({
    gameId: GAME_ACTION_DASH,
    packId,
    level,
    count: 0,
    requires: ["action"],
  });
  const choices = choiceCount(level);
  if (pool.length < choices) return null;

  const targets = shuffle(pool, rng).slice(0, ACTIONS_PER_SESSION);

  return targets.map((target, index) => {
    const distractors = shuffle(
      pool.filter((item) => item.id !== target.id),
      rng,
    ).slice(0, choices - 1);

    const cards = shuffle(
      [target, ...distractors].map((item) => ({
        id: item.id,
        item,
        action: item.action as ActionId,
        isTarget: item.id === target.id,
        label: labelFor(item, level),
      })),
      rng,
    );

    return {
      index,
      target,
      action: target.action as ActionId,
      choices: cards,
      prompt: promptFor(target, level),
      spoken: spokenFor(target, level),
      sayText: sayTextFor(target, level),
    };
  });
}

function labelFor(item: ContentItem, level: MiniLearningLevel): string {
  const action = getAction(item.action as ActionId);
  if (level === "beginner") return action.label;
  if (level === "expert") return action.progressive;
  return action.phrase;
}

function promptFor(item: ContentItem, level: MiniLearningLevel): string {
  const action = getAction(item.action as ActionId);
  if (level === "beginner") return `Which one is ${action.progressive}?`;
  if (level === "expert") return item.sentence ?? `Which one is ${action.progressive}?`;
  return `Which one can ${action.phrase}?`;
}

function spokenFor(item: ContentItem, level: MiniLearningLevel): string {
  if (level === "expert") return `Find the picture for: ${item.sentence}`;
  return promptFor(item, level);
}

function sayTextFor(item: ContentItem, level: MiniLearningLevel): string {
  const action = getAction(item.action as ActionId);
  if (level === "beginner") return action.label;
  if (level === "expert") return item.sentence ?? action.phrase;
  return action.phrase;
}
