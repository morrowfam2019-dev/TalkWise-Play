/**
 * Story Builder's scene planner — pure data, no React.
 *
 * ## The shape of a story
 *
 * A scene is built one slot at a time. Each slot offers three choices; the
 * child picks one; the sentence grows. When the last slot is filled, Miss
 * Maya models the finished sentence, the child says it, and the scene
 * animates.
 *
 * How many slots there are is what the level actually changes — §5's
 * ladder, expressed as sentence structure rather than as a difficulty
 * label:
 *
 * - **Beginner** — one slot. Pick the thing. "dog." A noun, named.
 * - **Intermediate** — two slots. Pick the describing word, then the thing.
 *   "big dog." The two-word combination §5 asks Intermediate for.
 * - **Expert** — three slots. Subject, then verb, then where. "The dog is
 *   running in the park." A whole sentence a child assembled themselves.
 *
 * ## Why the choices are never nonsense
 *
 * Every option in a slot produces a sentence that makes sense — there is no
 * "wrong" word that yields "The dog is drinking the tree". A child building
 * a silly-but-valid sentence has still built a sentence, and §17 rules out
 * framing a choice as a failure. What is *scored* is completing a slot, not
 * matching a hidden answer.
 *
 * That is the honest difference between this game and the other five: it is
 * a construction toy with a speech target at the end, not a quiz.
 */

import {
  contentPoolFor,
  createRng,
  shuffle,
  type ContentItem,
} from "@/content/minigames";
import { getAction } from "@/content/minigames/attributes";
import type {
  ActionId,
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { GAME_STORY_BUILDER } from "@/platform/games/registry";

/** Scenes in a session. §14: 2–4 minutes. */
export const SCENES_PER_SESSION = 4;

/** Choices offered per slot. */
export const CHOICES_PER_SLOT = 3;

export type SlotKind = "subject" | "describer" | "verb" | "place";

export interface StoryChoice {
  id: string;
  /** The word as shown on the card. */
  word: string;
  glyph: string;
}

export interface StorySlot {
  kind: SlotKind;
  /** The question above the choices, in a child's words. */
  question: string;
  choices: StoryChoice[];
}

export interface StoryScene {
  index: number;
  slots: StorySlot[];
  /** Builds the sentence so far from the words picked. */
  sentenceFor: (picked: string[]) => string;
  /** The backdrop, so four scenes in a session do not look identical. */
  backdrop: string;
}

/** Describing words, paired with the kinds of thing they can describe. */
const DESCRIBERS = ["big", "little", "happy", "fast", "silly", "sleepy"];

/** Places a scene can happen. */
const PLACES = [
  { word: "in the park", glyph: "🛝" },
  { word: "at home", glyph: "🏠" },
  { word: "in the garden", glyph: "🌷" },
  { word: "by the water", glyph: "🌊" },
];

/** Backdrops, cycled so a four-scene session has visible variety (§15). */
const BACKDROPS = [
  "from-[#cfeaff] via-[#e8f6ff] to-[#a8e6a3]",
  "from-[#ffe4f2] via-[#fff0f7] to-[#ffd9a8]",
  "from-[#e6e0ff] via-[#f2eeff] to-[#c9e8ff]",
  "from-[#fff6cc] via-[#fffbe8] to-[#ffd9a8]",
];

/**
 * Plans a session of scenes.
 *
 * Returns null when the pack has too few subjects to build from. Story
 * Builder requires items with sentences, and its registry entry already
 * restricts it to the five packs that have them.
 */
export function planStory(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): StoryScene[] | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const pool = contentPoolFor({
    gameId: GAME_STORY_BUILDER,
    packId,
    level,
    count: 0,
    requires: ["sentence"],
  });
  if (pool.length < CHOICES_PER_SLOT) return null;

  const actionPool = contentPoolFor({
    gameId: GAME_STORY_BUILDER,
    packId: "action-time",
    level: "beginner",
    count: 0,
    requires: ["action"],
  });

  const scenes: StoryScene[] = [];
  const usedSubjects = new Set<string>();

  for (let index = 0; index < SCENES_PER_SESSION; index += 1) {
    const subjects = shuffle(
      pool.filter((item) => !usedSubjects.has(item.id)),
      rng,
    ).slice(0, CHOICES_PER_SLOT);
    // A short pack runs out of unused subjects before four scenes. Reusing
    // is better than a session that stops early — a story with a familiar
    // character in it is still a new story.
    const slotSubjects =
      subjects.length >= CHOICES_PER_SLOT
        ? subjects
        : shuffle(pool, rng).slice(0, CHOICES_PER_SLOT);
    for (const item of slotSubjects) usedSubjects.add(item.id);

    scenes.push(buildScene(index, level, slotSubjects, actionPool, rng));
  }

  return scenes;
}

function buildScene(
  index: number,
  level: MiniLearningLevel,
  subjects: ContentItem[],
  actionPool: ContentItem[],
  rng: () => number,
): StoryScene {
  const subjectSlot: StorySlot = {
    kind: "subject",
    question: "Who is the story about?",
    choices: subjects.map((item) => ({
      id: item.id,
      word: item.word,
      glyph: item.glyph,
    })),
  };

  const backdrop = BACKDROPS[index % BACKDROPS.length];

  if (level === "beginner") {
    return {
      index,
      slots: [subjectSlot],
      // One word is the whole story at this tier, and that is the point:
      // naming a thing out loud is the achievement.
      sentenceFor: (picked) => picked[0] ?? "",
      backdrop,
    };
  }

  const describerSlot: StorySlot = {
    kind: "describer",
    question: "What is it like?",
    choices: shuffle(DESCRIBERS, rng)
      .slice(0, CHOICES_PER_SLOT)
      .map((word) => ({ id: `describer-${word}`, word, glyph: "✨" })),
  };

  if (level === "intermediate") {
    return {
      index,
      slots: [describerSlot, subjectSlot],
      sentenceFor: (picked) => picked.filter(Boolean).join(" "),
      backdrop,
    };
  }

  const verbSlot: StorySlot = {
    kind: "verb",
    question: "What is it doing?",
    choices: shuffle(actionPool, rng)
      .slice(0, CHOICES_PER_SLOT)
      .map((item) => {
        const action = getAction(item.action as ActionId);
        return {
          id: `verb-${action.id}`,
          word: action.progressive,
          glyph: action.glyph,
        };
      }),
  };

  const placeSlot: StorySlot = {
    kind: "place",
    question: "Where is it happening?",
    choices: shuffle(PLACES, rng)
      .slice(0, CHOICES_PER_SLOT)
      .map((place) => ({
        id: `place-${place.word.replace(/\s+/g, "-")}`,
        word: place.word,
        glyph: place.glyph,
      })),
  };

  return {
    index,
    slots: [subjectSlot, verbSlot, placeSlot],
    // "The dog is running in the park." Assembled rather than looked up, so
    // the sentence a child hears is provably the one they built.
    sentenceFor: (picked) => {
      const [subject, verb, place] = picked;
      if (!subject) return "";
      if (!verb) return `The ${subject}`;
      if (!place) return `The ${subject} is ${verb}`;
      return `The ${subject} is ${verb} ${place}.`;
    },
    backdrop,
  };
}
