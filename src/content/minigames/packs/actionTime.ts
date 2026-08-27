import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * ACTION TIME — the action-verb pack.
 *
 * Every item carries an `action`, which is what makes a *spoken word* able
 * to drive a character animation: the child says "jump", GAME-007 looks up
 * the action, and TJ jumps. The verb list mirrors `attributes.ts`, so an
 * item can never name an action the character does not know how to perform.
 *
 * Action words are also the vocabulary most often missing from early
 * sound-focused practice, which is precisely why §7 gives them their own
 * game rather than a corner of another one.
 */
export const ACTION_TIME: ContentPack = {
  id: "action-time",
  title: "Action Time",
  blurb: "Say it and watch it happen.",
  glyph: "🏃",
  gradient: "from-[#ffe066] to-[#f0973d]",
  items: buildItems("action-time", [
    { id: "jump", word: "jump", glyph: "🦘", action: "jump", phrase: "jump high", sentence: "The boy is jumping over the box.", tags: ["action", "move"] },
    { id: "run", word: "run", glyph: "🏃", action: "run", phrase: "run fast", sentence: "The girl is running to the tree.", tags: ["action", "move"] },
    { id: "clap", word: "clap", glyph: "👏", action: "clap", phrase: "clap loud", sentence: "We are clapping our hands.", tags: ["action"] },
    { id: "spin", word: "spin", glyph: "🌀", action: "spin", phrase: "spin around", sentence: "The boy is spinning around.", tags: ["action", "move"] },
    { id: "eat", word: "eat", glyph: "🍎", action: "eat", phrase: "eat lunch", sentence: "The girl is eating an apple.", tags: ["action", "food"] },
    { id: "sleep", word: "sleep", glyph: "😴", action: "sleep", phrase: "sleep well", sentence: "The baby is sleeping in the bed.", sound: "s", tags: ["action", "rest"] },
    { id: "wave", word: "wave", glyph: "👋", action: "wave", phrase: "wave hello", sentence: "The boy is waving to his friend.", sound: "w", tags: ["action", "hello"] },
    { id: "dance", word: "dance", glyph: "💃", action: "dance", phrase: "dance along", sentence: "The girl is dancing to the music.", tags: ["action", "move"] },
    { id: "drink", word: "drink", glyph: "🥤", action: "drink", phrase: "drink water", sentence: "The boy is drinking his water.", tags: ["action", "food"] },
    { id: "sit", word: "sit", glyph: "🪑", action: "sit", phrase: "sit down", sentence: "The girl is sitting on the chair.", sound: "s", tags: ["action", "rest"] },
  ]),
};
