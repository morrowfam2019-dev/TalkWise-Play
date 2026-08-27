/**
 * Guess the Sound's sound library — as *recipes*, not recordings.
 *
 * ## The decision, stated plainly
 *
 * Every sound a child hears in GAME-006 is synthesised in the browser from
 * oscillators and shaped noise. Nothing is sampled, nothing is downloaded,
 * and no third-party audio is bundled. GAME-001 and GAME-002 already
 * synthesise their effects this way, so this is the house style rather than
 * a workaround — and it makes the "no copyrighted sounds used" acceptance
 * test structurally true: there is no sample here that could have needed a
 * licence.
 *
 * It also keeps a listening mini-game genuinely *mini*. A themed set of
 * twenty-six recorded animal and vehicle sounds is megabytes; this file is
 * kilobytes and starts instantly, which §14 and §31 both ask for.
 *
 * ## How a recipe works
 *
 * A recipe is a short list of layers. Each layer is either a tone (an
 * oscillator with an optional frequency sweep and optional vibrato) or a
 * noise burst (shaped white noise through a filter). `minigames/listenAudio.ts`
 * plays them; this file only describes them, so the sound library is content
 * that can be tuned without touching audio code.
 *
 * These are **impressions**, not field recordings, and they are meant to be
 * one: a cartoon "moo" that a four-year-old identifies immediately is better
 * listening practice than an accurate one they cannot place. Each recipe was
 * tuned against its distractor set — the point of the game is telling this
 * sound apart from the other two on screen.
 */

import type { ListenRecipeId } from "./types";

export type ListenLayerType = "tone" | "noise";

export interface ListenToneLayer {
  type: "tone";
  wave: OscillatorType;
  /** Starting frequency in Hz. */
  freq: number;
  /** Optional glide target — the sweep that gives a sound its shape. */
  sweepTo?: number;
  /** Seconds. */
  duration: number;
  /** Seconds from the start of the recipe. */
  delay?: number;
  /** Peak gain, 0..1. Kept low — several layers stack. */
  gain?: number;
  /** Vibrato depth in Hz, and its rate. Gives bleats and warbles. */
  wobbleDepth?: number;
  wobbleHz?: number;
}

export interface ListenNoiseLayer {
  type: "noise";
  duration: number;
  delay?: number;
  gain?: number;
  /** Bandpass centre in Hz. Low reads as rumble, high as hiss. */
  filterHz?: number;
  filterQ?: number;
  /** Fade shape across the burst. */
  shape?: "decay" | "swell" | "flat";
}

export type ListenLayer = ListenToneLayer | ListenNoiseLayer;

export interface ListenRecipe {
  id: ListenRecipeId;
  /** What the sound is called when it is revealed, e.g. "Woof woof!". */
  onomatopoeia: string;
  /** Broad family, used to pick same-family distractors at Expert. */
  family: "animal" | "vehicle" | "household" | "nature" | "instrument";
  layers: ListenLayer[];
}

/** Convenience builders keep the table below readable. */
function tone(layer: Omit<ListenToneLayer, "type">): ListenToneLayer {
  return { type: "tone", ...layer };
}
function noise(layer: Omit<ListenNoiseLayer, "type">): ListenNoiseLayer {
  return { type: "noise", ...layer };
}

export const LISTEN_RECIPES: ListenRecipe[] = [
  // --- Animals -------------------------------------------------------------
  {
    id: "dog-woof",
    onomatopoeia: "Woof woof!",
    family: "animal",
    layers: [
      tone({
        wave: "sawtooth",
        freq: 320,
        sweepTo: 170,
        duration: 0.16,
        gain: 0.16,
      }),
      noise({ duration: 0.12, gain: 0.07, filterHz: 900, shape: "decay" }),
      tone({
        wave: "sawtooth",
        freq: 300,
        sweepTo: 150,
        duration: 0.16,
        delay: 0.3,
        gain: 0.15,
      }),
      noise({
        duration: 0.12,
        delay: 0.3,
        gain: 0.06,
        filterHz: 900,
        shape: "decay",
      }),
    ],
  },
  {
    id: "cat-meow",
    onomatopoeia: "Meow!",
    family: "animal",
    layers: [
      tone({
        wave: "sawtooth",
        freq: 520,
        sweepTo: 760,
        duration: 0.22,
        gain: 0.11,
        wobbleDepth: 18,
        wobbleHz: 9,
      }),
      tone({
        wave: "sawtooth",
        freq: 760,
        sweepTo: 420,
        duration: 0.34,
        delay: 0.2,
        gain: 0.11,
        wobbleDepth: 22,
        wobbleHz: 7,
      }),
    ],
  },
  {
    id: "cow-moo",
    onomatopoeia: "Moooo!",
    family: "animal",
    layers: [
      tone({
        wave: "sawtooth",
        freq: 150,
        sweepTo: 190,
        duration: 0.4,
        gain: 0.14,
        wobbleDepth: 6,
        wobbleHz: 5,
      }),
      tone({
        wave: "sawtooth",
        freq: 190,
        sweepTo: 120,
        duration: 0.6,
        delay: 0.36,
        gain: 0.13,
        wobbleDepth: 5,
        wobbleHz: 4,
      }),
    ],
  },
  {
    id: "duck-quack",
    onomatopoeia: "Quack quack!",
    family: "animal",
    layers: [
      tone({
        wave: "square",
        freq: 420,
        sweepTo: 300,
        duration: 0.12,
        gain: 0.09,
        wobbleDepth: 40,
        wobbleHz: 26,
      }),
      tone({
        wave: "square",
        freq: 420,
        sweepTo: 290,
        duration: 0.12,
        delay: 0.22,
        gain: 0.09,
        wobbleDepth: 40,
        wobbleHz: 26,
      }),
    ],
  },
  {
    id: "bird-tweet",
    onomatopoeia: "Tweet tweet!",
    family: "animal",
    layers: [
      tone({
        wave: "sine",
        freq: 1900,
        sweepTo: 2900,
        duration: 0.09,
        gain: 0.09,
      }),
      tone({
        wave: "sine",
        freq: 2600,
        sweepTo: 1800,
        duration: 0.09,
        delay: 0.1,
        gain: 0.09,
      }),
      tone({
        wave: "sine",
        freq: 2100,
        sweepTo: 3100,
        duration: 0.1,
        delay: 0.28,
        gain: 0.08,
      }),
    ],
  },
  {
    id: "lion-roar",
    onomatopoeia: "Roaaar!",
    family: "animal",
    layers: [
      tone({
        wave: "sawtooth",
        freq: 110,
        sweepTo: 78,
        duration: 0.85,
        gain: 0.15,
        wobbleDepth: 9,
        wobbleHz: 17,
      }),
      noise({
        duration: 0.85,
        gain: 0.09,
        filterHz: 320,
        filterQ: 1.4,
        shape: "swell",
      }),
    ],
  },
  {
    id: "sheep-baa",
    onomatopoeia: "Baaaa!",
    family: "animal",
    layers: [
      tone({
        wave: "sawtooth",
        freq: 430,
        sweepTo: 380,
        duration: 0.62,
        gain: 0.11,
        wobbleDepth: 34,
        wobbleHz: 15,
      }),
    ],
  },
  {
    id: "frog-ribbit",
    onomatopoeia: "Ribbit!",
    family: "animal",
    layers: [
      tone({
        wave: "square",
        freq: 230,
        sweepTo: 300,
        duration: 0.1,
        gain: 0.1,
        wobbleDepth: 30,
        wobbleHz: 32,
      }),
      tone({
        wave: "square",
        freq: 180,
        sweepTo: 140,
        duration: 0.16,
        delay: 0.13,
        gain: 0.1,
        wobbleDepth: 24,
        wobbleHz: 28,
      }),
    ],
  },

  // --- Vehicles ------------------------------------------------------------
  {
    id: "car-horn",
    onomatopoeia: "Beep beep!",
    family: "vehicle",
    layers: [
      tone({ wave: "square", freq: 440, duration: 0.16, gain: 0.09 }),
      tone({ wave: "square", freq: 554, duration: 0.16, gain: 0.07 }),
      tone({
        wave: "square",
        freq: 440,
        duration: 0.16,
        delay: 0.26,
        gain: 0.09,
      }),
      tone({
        wave: "square",
        freq: 554,
        duration: 0.16,
        delay: 0.26,
        gain: 0.07,
      }),
    ],
  },
  {
    id: "train-whistle",
    onomatopoeia: "Wooo woooo!",
    family: "vehicle",
    layers: [
      tone({ wave: "triangle", freq: 392, duration: 0.75, gain: 0.09 }),
      tone({ wave: "triangle", freq: 523, duration: 0.75, gain: 0.08 }),
      tone({ wave: "triangle", freq: 659, duration: 0.75, gain: 0.05 }),
      noise({ duration: 0.75, gain: 0.03, filterHz: 1800, shape: "swell" }),
    ],
  },
  {
    id: "siren",
    onomatopoeia: "Nee-naw!",
    family: "vehicle",
    layers: [
      tone({
        wave: "sine",
        freq: 700,
        sweepTo: 1100,
        duration: 0.4,
        gain: 0.09,
      }),
      tone({
        wave: "sine",
        freq: 1100,
        sweepTo: 700,
        duration: 0.4,
        delay: 0.4,
        gain: 0.09,
      }),
      tone({
        wave: "sine",
        freq: 700,
        sweepTo: 1100,
        duration: 0.4,
        delay: 0.8,
        gain: 0.09,
      }),
    ],
  },
  {
    id: "plane-woosh",
    onomatopoeia: "Whoooosh!",
    family: "vehicle",
    layers: [
      noise({
        duration: 1.1,
        gain: 0.11,
        filterHz: 700,
        filterQ: 0.8,
        shape: "swell",
      }),
      tone({
        wave: "sawtooth",
        freq: 90,
        sweepTo: 140,
        duration: 1.1,
        gain: 0.05,
      }),
    ],
  },
  {
    id: "boat-horn",
    onomatopoeia: "Hooonk!",
    family: "vehicle",
    layers: [
      tone({ wave: "sawtooth", freq: 116, duration: 0.9, gain: 0.13 }),
      tone({ wave: "sawtooth", freq: 174, duration: 0.9, gain: 0.07 }),
    ],
  },
  {
    id: "helicopter",
    onomatopoeia: "Chop chop chop!",
    family: "vehicle",
    layers: [
      noise({ duration: 0.09, gain: 0.12, filterHz: 380, shape: "decay" }),
      noise({
        duration: 0.09,
        delay: 0.12,
        gain: 0.12,
        filterHz: 380,
        shape: "decay",
      }),
      noise({
        duration: 0.09,
        delay: 0.24,
        gain: 0.12,
        filterHz: 380,
        shape: "decay",
      }),
      noise({
        duration: 0.09,
        delay: 0.36,
        gain: 0.12,
        filterHz: 380,
        shape: "decay",
      }),
      noise({
        duration: 0.09,
        delay: 0.48,
        gain: 0.12,
        filterHz: 380,
        shape: "decay",
      }),
      noise({
        duration: 0.09,
        delay: 0.6,
        gain: 0.12,
        filterHz: 380,
        shape: "decay",
      }),
    ],
  },

  // --- Household -----------------------------------------------------------
  {
    id: "doorbell",
    onomatopoeia: "Ding dong!",
    family: "household",
    layers: [
      tone({ wave: "sine", freq: 784, duration: 0.5, gain: 0.11 }),
      tone({ wave: "sine", freq: 587, duration: 0.7, delay: 0.42, gain: 0.11 }),
    ],
  },
  {
    id: "phone-ring",
    onomatopoeia: "Ring ring!",
    family: "household",
    layers: [
      tone({ wave: "sine", freq: 1046, duration: 0.06, gain: 0.08 }),
      tone({
        wave: "sine",
        freq: 1318,
        duration: 0.06,
        delay: 0.08,
        gain: 0.08,
      }),
      tone({
        wave: "sine",
        freq: 1046,
        duration: 0.06,
        delay: 0.16,
        gain: 0.08,
      }),
      tone({
        wave: "sine",
        freq: 1318,
        duration: 0.06,
        delay: 0.24,
        gain: 0.08,
      }),
      tone({
        wave: "sine",
        freq: 1046,
        duration: 0.06,
        delay: 0.44,
        gain: 0.08,
      }),
      tone({
        wave: "sine",
        freq: 1318,
        duration: 0.06,
        delay: 0.52,
        gain: 0.08,
      }),
    ],
  },
  {
    id: "clock-tick",
    onomatopoeia: "Tick tock!",
    family: "household",
    layers: [
      noise({
        duration: 0.03,
        gain: 0.14,
        filterHz: 2600,
        filterQ: 3,
        shape: "decay",
      }),
      noise({
        duration: 0.03,
        delay: 0.5,
        gain: 0.12,
        filterHz: 1700,
        filterQ: 3,
        shape: "decay",
      }),
      noise({
        duration: 0.03,
        delay: 1.0,
        gain: 0.14,
        filterHz: 2600,
        filterQ: 3,
        shape: "decay",
      }),
      noise({
        duration: 0.03,
        delay: 1.5,
        gain: 0.12,
        filterHz: 1700,
        filterQ: 3,
        shape: "decay",
      }),
    ],
  },
  {
    id: "knock",
    onomatopoeia: "Knock knock!",
    family: "household",
    layers: [
      noise({
        duration: 0.07,
        gain: 0.16,
        filterHz: 260,
        filterQ: 2,
        shape: "decay",
      }),
      noise({
        duration: 0.07,
        delay: 0.2,
        gain: 0.16,
        filterHz: 260,
        filterQ: 2,
        shape: "decay",
      }),
      noise({
        duration: 0.07,
        delay: 0.4,
        gain: 0.14,
        filterHz: 240,
        filterQ: 2,
        shape: "decay",
      }),
    ],
  },
  {
    id: "water-drip",
    onomatopoeia: "Drip drop!",
    family: "household",
    layers: [
      tone({
        wave: "sine",
        freq: 900,
        sweepTo: 1700,
        duration: 0.07,
        gain: 0.11,
      }),
      tone({
        wave: "sine",
        freq: 760,
        sweepTo: 1500,
        duration: 0.07,
        delay: 0.45,
        gain: 0.1,
      }),
      tone({
        wave: "sine",
        freq: 980,
        sweepTo: 1800,
        duration: 0.07,
        delay: 0.9,
        gain: 0.11,
      }),
    ],
  },

  // --- Nature --------------------------------------------------------------
  {
    id: "rain",
    onomatopoeia: "Pitter patter!",
    family: "nature",
    layers: [
      noise({
        duration: 1.4,
        gain: 0.09,
        filterHz: 3200,
        filterQ: 0.6,
        shape: "flat",
      }),
      noise({
        duration: 1.4,
        gain: 0.04,
        filterHz: 900,
        filterQ: 0.6,
        shape: "flat",
      }),
    ],
  },
  {
    id: "wind",
    onomatopoeia: "Wooooosh!",
    family: "nature",
    layers: [
      noise({
        duration: 1.5,
        gain: 0.1,
        filterHz: 480,
        filterQ: 1.6,
        shape: "swell",
      }),
    ],
  },
  {
    id: "thunder",
    onomatopoeia: "Rumble crash!",
    family: "nature",
    layers: [
      noise({ duration: 0.18, gain: 0.16, filterHz: 1400, shape: "decay" }),
      noise({
        duration: 1.3,
        delay: 0.05,
        gain: 0.14,
        filterHz: 130,
        filterQ: 0.7,
        shape: "decay",
      }),
      tone({
        wave: "sawtooth",
        freq: 62,
        sweepTo: 40,
        duration: 1.3,
        delay: 0.05,
        gain: 0.09,
      }),
    ],
  },

  // --- Instruments ---------------------------------------------------------
  {
    id: "drum",
    onomatopoeia: "Boom boom!",
    family: "instrument",
    layers: [
      tone({ wave: "sine", freq: 160, sweepTo: 52, duration: 0.3, gain: 0.18 }),
      noise({ duration: 0.06, gain: 0.08, filterHz: 1900, shape: "decay" }),
      tone({
        wave: "sine",
        freq: 160,
        sweepTo: 52,
        duration: 0.3,
        delay: 0.4,
        gain: 0.18,
      }),
      noise({
        duration: 0.06,
        delay: 0.4,
        gain: 0.08,
        filterHz: 1900,
        shape: "decay",
      }),
    ],
  },
  {
    id: "bell",
    onomatopoeia: "Ting-a-ling!",
    family: "instrument",
    layers: [
      tone({ wave: "sine", freq: 1568, duration: 1.0, gain: 0.08 }),
      tone({ wave: "sine", freq: 2349, duration: 0.8, gain: 0.04 }),
      tone({ wave: "sine", freq: 3136, duration: 0.6, gain: 0.02 }),
    ],
  },
  {
    id: "whistle",
    onomatopoeia: "Tweeeet!",
    family: "instrument",
    layers: [
      tone({
        wave: "sine",
        freq: 2200,
        duration: 0.5,
        gain: 0.08,
        wobbleDepth: 120,
        wobbleHz: 22,
      }),
      noise({
        duration: 0.5,
        gain: 0.03,
        filterHz: 2600,
        filterQ: 4,
        shape: "flat",
      }),
    ],
  },
  {
    id: "guitar-strum",
    onomatopoeia: "Strummm!",
    family: "instrument",
    layers: [
      tone({ wave: "triangle", freq: 330, duration: 0.9, gain: 0.07 }),
      tone({
        wave: "triangle",
        freq: 415,
        duration: 0.9,
        delay: 0.04,
        gain: 0.06,
      }),
      tone({
        wave: "triangle",
        freq: 494,
        duration: 0.9,
        delay: 0.08,
        gain: 0.06,
      }),
      tone({
        wave: "triangle",
        freq: 659,
        duration: 0.9,
        delay: 0.12,
        gain: 0.05,
      }),
    ],
  },
];

const RECIPE_BY_ID = new Map(
  LISTEN_RECIPES.map((recipe) => [recipe.id, recipe]),
);

export function getListenRecipe(id: ListenRecipeId): ListenRecipe | undefined {
  return RECIPE_BY_ID.get(id);
}

/** Total wall-clock length of a recipe, so a caller can gate replay on it. */
export function listenRecipeDurationMs(recipe: ListenRecipe): number {
  return Math.round(
    Math.max(
      ...recipe.layers.map((layer) => (layer.delay ?? 0) + layer.duration),
    ) * 1000,
  );
}
