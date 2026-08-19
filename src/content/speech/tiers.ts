/**
 * Difficulty ladders for the shared speech content layer.
 *
 * The existing level files carry exactly one tier — five whole words per
 * sound — which is the Intermediate level. This file adds the two tiers
 * either side of it as *data*, so a game can ask for "easy /m/ targets"
 * without any game UI hard-coding `mmm` or `ma`.
 *
 * ## Easy — Sound Builder
 *
 * For a learner not yet producing the whole word. The ladder runs isolated
 * sound → sound+vowel → vowel+sound → simple syllable → short simple word,
 * which is the order the spec asks for. It is deliberately a *sequence*, not
 * a set: index 0 is always the easiest thing in the list.
 *
 * ## Intermediate — Words / Phrases
 *
 * The level's own five words, then short phrases that put the target sound
 * in more than one word position.
 *
 * ## Hard — Sentences / Functional speech
 *
 * Complete sentences. These are the targets that carry word-by-word
 * recognition state, so each one is written to be a natural spoken sentence
 * rather than a word list with a full stop on the end.
 *
 * Additive only: nothing here edits an existing level, so GAME-001 is
 * completely unaffected by this file existing.
 */

export interface SoundLadder {
  /** Speech sound id, matching `SpeechSound.id` — "m", "p", … */
  soundId: string;
  /** EASY, easiest first. */
  easy: string[];
  /** INTERMEDIATE phrases, layered on top of the level's own words. */
  phrases: string[];
  /** HARD sentences. */
  sentences: string[];
}

const LADDERS: SoundLadder[] = [
  {
    soundId: "m",
    easy: ["mmm", "ma", "moo", "me", "am", "mom"],
    phrases: ["blue moon", "my milk", "more money", "my mom"],
    sentences: [
      "I see the big moon.",
      "My mom made me some milk.",
      "The monkey wants more bananas.",
    ],
  },
  {
    soundId: "p",
    easy: ["puh", "pa", "pie", "pop", "up", "pig"],
    phrases: ["big pig", "pizza party", "purple panda", "pop the bubble"],
    sentences: [
      "I want a piece of pizza.",
      "The penguin plays with a panda.",
      "Please pop the pink balloon.",
    ],
  },
  {
    soundId: "b",
    easy: ["buh", "ba", "bee", "boo", "bye", "ball"],
    phrases: ["big ball", "blue boat", "baby bear", "bouncy bubble"],
    sentences: [
      "The baby bear has a blue ball.",
      "I can bounce the big ball.",
      "My boat is by the bubbles.",
    ],
  },
  {
    soundId: "w",
    easy: ["wuh", "wa", "we", "woo", "why", "wow"],
    phrases: ["warm water", "big wagon", "open window", "wiggly worm"],
    sentences: [
      "The wolf walks past the window.",
      "I want warm water please.",
      "We pull the wagon up the hill.",
    ],
  },
  {
    soundId: "s",
    easy: ["sss", "sa", "so", "see", "us", "sun"],
    phrases: ["sunny sky", "silly snake", "soft sock", "super star"],
    sentences: [
      "The silly snake sits in the sun.",
      "I see a star in the sky.",
      "She had soup for supper.",
    ],
  },
  {
    soundId: "l",
    easy: ["lll", "la", "lee", "loo", "all", "log"],
    phrases: ["little lion", "green leaf", "yellow lemon", "long log"],
    sentences: [
      "The little lion licks a lemon.",
      "I like the yellow lamp.",
      "Leaves land along the log.",
    ],
  },
  {
    soundId: "f",
    easy: ["fff", "fa", "fee", "foo", "off", "fan"],
    phrases: ["fast fox", "funny fish", "fluffy feather", "five frogs"],
    sentences: [
      "The fast fox found five frogs.",
      "I can feel the fluffy feather.",
      "My fan is off for now.",
    ],
  },
];

export function getSoundLadder(soundId: string): SoundLadder | undefined {
  return LADDERS.find((ladder) => ladder.soundId === soundId);
}

export function listSoundLadders(): SoundLadder[] {
  return LADDERS;
}
