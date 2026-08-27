/**
 * Bubble Blast's bubble field — pure data, no React, no DOM.
 *
 * The field is a **spawner**, not a physics simulation. Each bubble is
 * given a start position, a horizontal drift, a size and a duration when it
 * is created, and then CSS animates it from bottom to top on the compositor
 * (`.tw-bubble` in globals.css). Nothing recomputes a position per frame.
 *
 * ## Why that is the right call rather than a shortcut
 *
 * A thirty-second round on a mid-range phone can have twenty bubbles in the
 * air. Driving twenty positions from JavaScript means twenty React updates
 * per frame, which is exactly how a "mini" game stops being fast (§31). A
 * transform-only CSS animation runs off the main thread entirely, so the
 * field stays smooth while the speech gate, the HUD and the particle layer
 * all do their own work.
 *
 * The cost is that a bubble's exact screen position is not known to JS. It
 * does not need to be: a bubble is popped by *tapping the element*, and the
 * element knows where it is.
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
import { GAME_BUBBLE_BLAST } from "@/platform/games/registry";

/** How long one round lasts. §14: 30–60 seconds, and 30 is the brief. */
export const ROUND_MS = 30000;

/** Bubbles in the air at once. Bounded, per §31's object-pooling rule. */
export const MAX_BUBBLES = 14;

/** Milliseconds between spawns. */
export const SPAWN_INTERVAL_MS = 520;

/** How long a bubble takes to cross the field, fastest to slowest. */
export const RISE_MS_MIN = 6200;
export const RISE_MS_MAX = 9400;

/**
 * How far up a bubble travels, as a multiple of the viewport height.
 *
 * Tuned so a bubble is off the top of the field just as its animation ends.
 * Overshooting wastes slots: a bubble that finished rising ten seconds ago
 * but is still counted against `MAX_BUBBLES` is a bubble a child cannot pop
 * occupying space in a field they can. Undershooting is worse — a bubble
 * that stops mid-screen and vanishes reads as a bug.
 */
export const RISE_DVH = 112;

/**
 * Share of bubbles that are correct targets.
 *
 * Slightly over half on purpose. A field that is mostly distractors is a
 * frustrating hunt for a four-year-old; a field that is mostly targets is a
 * tapping exercise that teaches no discrimination at all. Just over half
 * means a child always has something right within reach while still having
 * to look.
 */
export const TARGET_SHARE = 0.55;

export interface Bubble {
  /** Unique for this round. Also the React key. */
  key: number;
  item: ContentItem;
  /** Whether popping this one scores. */
  isTarget: boolean;
  /** What the bubble shows: a letter at Beginner, a picture otherwise. */
  face: "letter" | "picture";
  /** Text under the picture, or the letter itself. */
  label: string;
  glyph: string;
  /** Horizontal start, as a percentage of the field width. */
  xPercent: number;
  /** Sideways drift over the whole rise, in pixels. */
  driftPx: number;
  /** Diameter in rem. */
  sizeRem: number;
  /** How long the rise takes. */
  durationMs: number;
  /** Tint index, for variety. */
  tint: number;
  /** When it was spawned, so the field can retire it. */
  spawnedAt: number;
}

export interface FieldConfig {
  packId: ContentPackId;
  level: MiniLearningLevel;
  /** The sound the round is about, when the level is sound-based. */
  targetSound: string | null;
  /** The specific item the round is about, at Intermediate and Expert. */
  targetItem: ContentItem | null;
  seed: number;
}

/**
 * Everything a round needs, resolved once at the start.
 *
 * The three levels ask genuinely different questions of the same content,
 * which is §5's requirement that a game not be forced into one speech
 * structure:
 *
 * - **Beginner** — one sound. Bubbles show letters; pop every M. The
 *   distractor letters are drawn from sounds that are *not* confusable with
 *   the target, so a child sorting M from S is not also being asked to
 *   sort M from N.
 * - **Intermediate** — one sound, as pictures. Pop the things that start
 *   with /m/: moon, milk, mouse. Same non-confusable rule.
 * - **Expert** — one sentence. Miss Maya reads "The dog is running", and
 *   the child pops the pictures that belong in it. Distractors are things
 *   from the same pack that do not.
 */
export interface RoundPlan {
  config: FieldConfig;
  /** Items that score when popped. */
  targets: ContentItem[];
  /** Items that do not. */
  distractors: ContentItem[];
  /** The prompt shown above the field, in a child's words. */
  prompt: string;
  /** What Miss Maya reads out at the start. */
  spoken: string;
}

/**
 * Builds a round.
 *
 * Returns null when the chosen pack genuinely cannot support the level —
 * a pack with only one sound cannot run a Beginner round that needs
 * distractor letters. Callers fall back to another level rather than
 * showing a child an unplayable field.
 */
export function planRound(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): RoundPlan | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const request = {
    gameId: GAME_BUBBLE_BLAST,
    packId,
    level,
    count: 0,
  } as const;

  const pool = contentPoolFor({ ...request, count: 0 });
  if (pool.length < 4) return null;

  if (level === "expert") {
    // One sentence. The things in it are the targets.
    const sentenced = pool.filter((item) => item.sentence);
    if (sentenced.length < 4) return null;
    const subject = shuffle(sentenced, rng)[0];
    const companions = shuffle(
      sentenced.filter(
        (item) =>
          item.id !== subject.id &&
          item.tags.some((tag) => subject.tags.includes(tag)),
      ),
      rng,
    ).slice(0, 2);

    const targets = [subject, ...companions];
    const targetIds = new Set(targets.map((item) => item.id));
    const distractors = shuffle(
      pool.filter((item) => !targetIds.has(item.id)),
      rng,
    ).slice(0, 8);
    if (distractors.length < 3) return null;

    return {
      config: {
        packId,
        level,
        targetSound: subject.targetSound,
        targetItem: subject,
        seed,
      },
      targets,
      distractors,
      prompt: `Pop what belongs in: ${subject.sentence}`,
      spoken: subject.sentence ?? subject.word,
    };
  }

  // Beginner and Intermediate are both "one sound". They differ only in
  // what the bubble shows, which the field decides — not the plan.
  const sounded = pool.filter((item) => item.targetSound);
  if (sounded.length < 2) return null;

  const anchor = shuffle(sounded, rng)[0];
  const sound = anchor.targetSound as string;
  const targets = sounded.filter((item) => item.targetSound === sound);

  const distractors = pickDistractors({
    target: anchor,
    pool,
    count: 8,
    rng,
  });
  if (distractors.length < 3) return null;

  const soundLabel = sound.toUpperCase();
  return {
    config: { packId, level, targetSound: sound, targetItem: anchor, seed },
    targets,
    distractors,
    prompt:
      level === "beginner"
        ? `Pop every ${soundLabel}!`
        : `Pop things that start with ${soundLabel}!`,
    spoken:
      level === "beginner"
        ? `Pop every ${soundLabel}.`
        : `Pop the things that start with ${soundLabel}, like ${anchor.word}.`,
  };
}

/** Bubble tints. Six, cycled — variety without a palette per bubble. */
export const BUBBLE_TINTS = [
  "from-[#bfeafb]/90 to-[#7fd0f0]/80",
  "from-[#ffe6f2]/90 to-[#ff9ecd]/80",
  "from-[#fff3cc]/90 to-[#ffd76e]/80",
  "from-[#dff5e1]/90 to-[#8ee08a]/80",
  "from-[#ece2ff]/90 to-[#c3a4ff]/80",
  "from-[#ffe4d1]/90 to-[#ffb45c]/80",
];

/**
 * Spawns one bubble.
 *
 * `rng` is the round's generator, so a round is reproducible from its seed
 * and the layout genuinely differs between rounds (§15's "changing object
 * placement") rather than repeating a fixed pattern.
 */
export function spawnBubble(
  plan: RoundPlan,
  key: number,
  rng: () => number,
  now: number,
): Bubble {
  const isTarget = rng() < TARGET_SHARE && plan.targets.length > 0;
  const source = isTarget ? plan.targets : plan.distractors;
  const item = source[Math.floor(rng() * source.length)];

  const beginner = plan.config.level === "beginner";
  const face: Bubble["face"] = beginner ? "letter" : "picture";
  const label = beginner
    ? (item.targetSound ?? item.word[0]).toUpperCase()
    : item.word;

  return {
    key,
    item,
    isTarget,
    face,
    label,
    glyph: item.glyph,
    // Kept inside 8–86% so a bubble is never half off the edge, where it
    // would be unpoppable through no fault of the child.
    xPercent: 8 + rng() * 78,
    driftPx: (rng() - 0.5) * 90,
    // Big. §11 and §16 both want large touch targets, and a bubble a
    // four-year-old cannot reliably hit is a bubble that teaches nothing.
    sizeRem: 4.6 + rng() * 1.6,
    durationMs: RISE_MS_MIN + rng() * (RISE_MS_MAX - RISE_MS_MIN),
    tint: Math.floor(rng() * BUBBLE_TINTS.length),
    spawnedAt: now,
  };
}

/** Bubbles that have finished their rise and can be dropped from the list. */
export function pruneBubbles(bubbles: Bubble[], now: number): Bubble[] {
  return bubbles.filter((bubble) => now - bubble.spawnedAt < bubble.durationMs);
}
