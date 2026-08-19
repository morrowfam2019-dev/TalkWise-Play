/**
 * Difficulty ladders for the shared speech content layer.
 *
 * The existing level files carry exactly one tier — five whole words per
 * sound — which is the Beginner level. This file adds the harder tier as
 * *data*, so a game can ask for "expert /m/ targets" without any game UI
 * hard-coding a sentence.
 *
 * An isolated-sound "Sound Builder" tier (`mmm`, `ba`, …) shipped originally
 * as an even-earlier rung below Beginner, but speech recognition reliably
 * mis-heard bare sounds and short mouth-noises as silence or noise, so a
 * correct attempt often couldn't register at all. It was removed rather than
 * ship a level that structurally can't recognise success.
 *
 * ## Beginner — Words / Phrases
 *
 * The level's own five words, then short phrases that put the target sound
 * in more than one word position.
 *
 * ## Expert — Sentences / Functional speech
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
  /** BEGINNER phrases, layered on top of the level's own words. */
  phrases: string[];
  /** EXPERT sentences. */
  sentences: string[];
}

const LADDERS: SoundLadder[] = [
  {
    soundId: "m",
    phrases: ["blue moon", "my milk", "more money", "my mom"],
    sentences: [
      "I see the big moon.",
      "My mom made me some milk.",
      "The monkey wants more bananas.",
    ],
  },
  {
    soundId: "p",
    phrases: ["big pig", "pizza party", "purple panda", "pop the bubble"],
    sentences: [
      "I want a piece of pizza.",
      "The penguin plays with a panda.",
      "Please pop the pink balloon.",
    ],
  },
  {
    soundId: "b",
    phrases: ["big ball", "blue boat", "baby bear", "bouncy bubble"],
    sentences: [
      "The baby bear has a blue ball.",
      "I can bounce the big ball.",
      "My boat is by the bubbles.",
    ],
  },
  {
    soundId: "w",
    phrases: ["warm water", "big wagon", "open window", "wiggly worm"],
    sentences: [
      "The wolf walks past the window.",
      "I want warm water please.",
      "We pull the wagon up the hill.",
    ],
  },
  {
    soundId: "s",
    phrases: ["sunny sky", "silly snake", "soft sock", "super star"],
    sentences: [
      "The silly snake sits in the sun.",
      "I see a star in the sky.",
      "She had soup for supper.",
    ],
  },
  {
    soundId: "l",
    phrases: ["little lion", "green leaf", "yellow lemon", "long log"],
    sentences: [
      "The little lion licks a lemon.",
      "I like the yellow lamp.",
      "Leaves land along the log.",
    ],
  },
  {
    soundId: "f",
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
