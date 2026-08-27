/**
 * The mini-game content model.
 *
 * ## Why this exists next to `content/speech` rather than inside it
 *
 * `content/speech` answers "what should this child *say*". It is organised
 * around the seven sounds TalkWise supports and their word → phrase →
 * sentence ladders, and GAME-001 and GAME-002 are built on it. Nothing here
 * changes that; the speech ladders stay the authority on speech targets, and
 * mini-games reach them through `minigames/speech.ts`.
 *
 * What the mini-games additionally need, and speech content deliberately
 * does not carry, is **the object itself**: what colour a ball is, what
 * shape a window is, what a dog sounds like, what verb a character is
 * doing. Bubble Blast needs distractors, Colour & Shape Hunt needs a colour
 * and a shape on the same object, Guess the Sound needs the noise it makes,
 * Story Builder needs a noun that can take a verb. Those are properties of
 * a *thing*, not of a speech target.
 *
 * So one `ContentItem` describes one thing, completely, and every compatible
 * mini-game reads the fields it cares about. That is the §9 promise in the
 * build plan: animal content feeds Bubble Blast, Sound Match, Guess the
 * Sound and Story Builder from **one** dataset, not four.
 *
 * ## Ids are permanent
 *
 * `ContentItem.id` and `ContentPackId` are written into saved progress
 * (which sets a child has completed, which items they have found). They are
 * immutable. `word` and a pack's `title` are kid-facing and safe to reword.
 */

import type {
  LanguageBackground,
  PracticeTrack,
} from "@/content/speech/engine";

/**
 * How hard the *language* is, in mini-game terms.
 *
 * Three tiers, matching §5 of the build plan: a sound or single concept, a
 * word or short phrase, a sentence in context.
 *
 * Deliberately **not** `SpeechDifficulty` from `content/speech/engine`. That
 * type has two tiers (beginner = words and phrases, expert = sentences)
 * because an isolated-sound tier was removed from the big games after
 * browser recognition proved unable to hear bare consonants reliably. The
 * mini-games can carry that third tier honestly because — unlike a word
 * adventure — a Beginner mini-game round does not *depend* on hearing the
 * sound back: Bubble Blast at Beginner is a letter-matching arcade round
 * that a child pops with their finger, and the speech gate in front of it
 * can always be passed by tapping. Nothing here can be failed by a
 * recogniser's opinion.
 *
 * The two ladders still meet: `toSpeechDifficulty()` in
 * `minigames/speech.ts` maps a mini level onto the speech engine's tiers
 * whenever a mini-game wants a real speech target from the shared library.
 */
export type MiniLearningLevel = "beginner" | "intermediate" | "expert";

export const MINI_LEARNING_LEVELS: {
  id: MiniLearningLevel;
  label: string;
  kicker: string;
  blurb: string;
  glyph: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    kicker: "Sounds & Simple Things",
    blurb: "One sound, one colour, one object.",
    glyph: "🟡",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    kicker: "Words & Short Phrases",
    blurb: "Whole words and two-word phrases.",
    glyph: "🟠",
  },
  {
    id: "expert",
    label: "Expert",
    kicker: "Sentences",
    blurb: "Full sentences and following directions.",
    glyph: "🟣",
  },
];

export const DEFAULT_MINI_LEVEL: MiniLearningLevel = "beginner";

export function isMiniLearningLevel(
  value: unknown,
): value is MiniLearningLevel {
  return value === "beginner" || value === "intermediate" || value === "expert";
}

/** Falls back to Beginner for anything unrecognised (e.g. a stale URL). */
export function coerceMiniLearningLevel(value: unknown): MiniLearningLevel {
  return isMiniLearningLevel(value) ? value : DEFAULT_MINI_LEVEL;
}

// ---------------------------------------------------------------------------
// Attributes shared across packs
// ---------------------------------------------------------------------------

/** Permanent colour ids. Written into saved data by Colour & Shape Hunt. */
export type ColorId =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "orange"
  | "purple"
  | "pink"
  | "brown";

/** Permanent shape ids. */
export type ShapeId =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "heart"
  | "rectangle"
  | "diamond"
  | "oval";

/** Permanent action-verb ids, used by the Actions pack and Story Builder. */
export type ActionId =
  | "jump"
  | "run"
  | "clap"
  | "spin"
  | "eat"
  | "sleep"
  | "wave"
  | "dance"
  | "drink"
  | "sit";

/**
 * Which synthesised sound an object makes, if any.
 *
 * A *recipe id*, not an audio file: every sound in Guess the Sound is
 * generated in the browser from oscillators and shaped noise (see
 * `minigames/listenAudio.ts`), the same approach GAME-001 and GAME-002
 * already use for their effects. That is what makes the "no copyrighted
 * sounds used" acceptance test true by construction rather than by
 * paperwork — there is no sample to have licensed.
 */
export type ListenRecipeId =
  | "dog-woof"
  | "cat-meow"
  | "cow-moo"
  | "duck-quack"
  | "bird-tweet"
  | "lion-roar"
  | "sheep-baa"
  | "frog-ribbit"
  | "car-horn"
  | "train-whistle"
  | "siren"
  | "plane-woosh"
  | "boat-horn"
  | "helicopter"
  | "doorbell"
  | "phone-ring"
  | "clock-tick"
  | "knock"
  | "water-drip"
  | "rain"
  | "wind"
  | "thunder"
  | "drum"
  | "bell"
  | "whistle"
  | "guitar-strum";

/** Optional data a game can require an item to carry before it will use it. */
export type ContentCapability =
  | "color"
  | "shape"
  | "action"
  | "listen"
  | "phrase"
  | "sentence";

// ---------------------------------------------------------------------------
// Content items and packs
// ---------------------------------------------------------------------------

/**
 * One thing a child can practise with, described once for every game that
 * can use it.
 *
 * Fields are optional wherever a thing genuinely does not have that
 * property: a feeling has no shape, a shoe makes no sound. Games declare
 * what they need through `ContentRequest.requires`, so an item that lacks a
 * field is filtered out rather than rendered half-empty.
 */
export interface ContentItem {
  /** Permanent, globally unique. Written into saved progress. */
  id: string;
  packId: ContentPackId;
  /** Kid-facing single word, lowercase. Safe to reword. */
  word: string;
  /** Emoji stand-in for the object's artwork, matching the rest of the
   * codebase's asset-free content convention. */
  glyph: string;
  /**
   * The sound this word starts with, as a `content/speech` sound id where
   * one exists ("m", "b", "p", "w", "s", "l", "f"). That shared id is the
   * join that lets Bubble Blast ask for "things that start with /m/" and
   * get answers from the same seven-sound library GAME-001 teaches.
   * Null for words starting with a sound TalkWise does not teach yet — such
   * an item is still perfectly usable by every non-sound mini-game.
   */
  targetSound: string | null;
  /** Two-word phrase for the Intermediate tier, e.g. "big moon". */
  phrase: string | null;
  /** Full sentence for the Expert tier, e.g. "I see the big moon." */
  sentence: string | null;
  color: ColorId | null;
  shape: ShapeId | null;
  action: ActionId | null;
  listen: ListenRecipeId | null;
  /** Free-form grouping used for distractor selection and future search. */
  tags: string[];
  /**
   * Which learning tracks this item is appropriate for. Everything ships as
   * Speech Development today; English Pronunciation is reserved so adding it
   * later is a data change here, not an API change — the same discipline
   * `content/speech/engine.ts` already applies.
   */
  practiceTracks: PracticeTrack[];
  /**
   * First-language backgrounds this item is *particularly* useful for on the
   * English Pronunciation track. Null means "no background-specific claim",
   * which is every item today. Never used to exclude an item.
   */
  languageBackgrounds: LanguageBackground[] | null;
  /** Levels this item can serve. An item with no phrase cannot serve
   * Intermediate, and the pack files keep this honest. */
  levels: MiniLearningLevel[];
}

/** Permanent pack ids. Written into saved records as part of the record key. */
export type ContentPackId =
  | "animal-world"
  | "food-fun"
  | "things-that-go"
  | "colors-and-shapes"
  | "my-body"
  | "action-time"
  | "feelings"
  | "around-the-house"
  | "outside-adventures";

export interface ContentPack {
  id: ContentPackId;
  /** Kid-facing name. Safe to rebrand. */
  title: string;
  /** One short line for the pack card. */
  blurb: string;
  glyph: string;
  /** Tailwind gradient classes for the pack card. */
  gradient: string;
  items: ContentItem[];
}
