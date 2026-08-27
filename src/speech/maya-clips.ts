/**
 * Which Miss Maya recordings exist. GENERATED — do not edit by hand.
 *
 * Run `npm run gen:maya-clips` after adding or removing an mp3 under
 * `public/audio/maya/`. `npm run verify:maya` fails if this is stale.
 *
 * The UI reads this to decide whether to show a speaker button at all:
 * since text-to-speech was removed, a word with no recording is silent, and
 * a button that does nothing is worse than no button.
 */

/** Words with a clip at `/audio/maya/<word>.mp3`. */
export const MAYA_WORD_CLIPS: readonly string[] = [
  "ball",
  "banana",
  "bear",
  "boat",
  "bubble",
  "fan",
  "feather",
  "fish",
  "fox",
  "frog",
  "lamp",
  "leaf",
  "lemon",
  "lion",
  "log",
  "milk",
  "mom",
  "monkey",
  "moon",
  "mouse",
  "panda",
  "penguin",
  "pig",
  "pizza",
  "pop",
  "snake",
  "sock",
  "soup",
  "star",
  "sun",
  "wagon",
  "water",
  "window",
  "wolf",
  "worm",
];

/** Sound ids with a clip at `/audio/maya/sounds/<id>.mp3`. */
export const MAYA_SOUND_CLIPS: readonly string[] = [
  "b",
  "f",
  "l",
  "m",
  "p",
  "s",
  "w",
];

/** Sentence slugs with a clip at `/audio/maya/sentences/<slug>.mp3`. */
export const MAYA_SENTENCE_CLIPS: readonly string[] = [];
