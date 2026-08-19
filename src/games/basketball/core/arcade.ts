/**
 * Time Attack's arcade engine — pure data and functions, no React, no THREE.
 *
 * Speech Shootout resolves a shot from a timing tier and a probability. Time
 * Attack cannot: the whole point of the mode is that where the ball goes is
 * decided by how the child flicked it. So this module integrates real
 * trajectories and detects the make from the ball's actual path through the
 * rim plane.
 *
 * ## Scene contract
 *
 * Shares the world the rest of Basketball already uses: the hoop sits at the
 * origin with its rim at y=2.6 (see `scene/Hoop.tsx`). Time Attack adds a
 * ball rack at +Z that the child shoots from.
 *
 * ## The forgiveness decision (deliberate, documented)
 *
 * A pure launch-and-pray parabola gives roughly a 4%-of-gesture window for a
 * make, which is a fine arcade cabinet and a miserable experience for a five
 * year old with a speech difference who is here to practise talking. So two
 * assists are applied, both bounded:
 *
 * 1. The scoring radius is wider than the modelled rim, so a ball that
 *    visually brushes the rim counts.
 * 2. Near-perfect power is pulled toward perfect (`ASSIST_BAND` /
 *    `ASSIST_STRENGTH`), so "almost right" becomes right.
 *
 * Outside the assist band nothing is corrected — genuinely bad flicks
 * genuinely miss, which is what makes a make feel earned. Easy gets the
 * widest band, because the spec asks for low basketball pressure at the tier
 * meant for learners who are not yet producing the whole word.
 */

import type { SpeechDifficulty } from "@/content/speech/engine";

// --- World constants -------------------------------------------------------

/** Height of the rim plane. Matches `scene/Hoop.tsx`. */
export const RIM_Y = 2.6;
/** Rim centre in the horizontal plane. Matches `scene/Hoop.tsx`. */
export const RIM_X = 0;
export const RIM_Z = 0.02;
/** The modelled rim's own radius — what is drawn. Matches `scene/Hoop.tsx`. */
export const RIM_RADIUS = 0.28;
/** Generous scoring radius. See the forgiveness note above. */
export const SCORE_RADIUS = 0.48;
/** Outside this, a descending ball is nowhere near the hoop and just falls. */
export const RIM_CONTACT_RADIUS = 0.68;

/** Where a ready ball sits, waiting to be flicked. */
export const RACK_POSITION: readonly [number, number, number] = [0, 1.0, 6.0];

export const BALL_RADIUS = 0.14;
export const GRAVITY = 9.8;
export const FLOOR_Y = BALL_RADIUS;

/**
 * The exact launch that swishes from the rack, derived rather than tuned:
 * with a 1.0s flight over 6.0 units of Z and a 1.6 rise,
 * `vz = -6.0` and `vy = 1.6 + 0.5 * g` = 6.5.
 * Every drag is expressed as a multiple of this.
 */
export const PERFECT_VY = 6.5;
export const PERFECT_VZ = -6.0;

/** How far a full-power drag reaches, as a fraction of viewport height. */
const DRAG_REFERENCE_FRACTION = 0.35;
/**
 * Power multiplier range across the whole drag.
 *
 * `POWER_MAX` is deliberately 1.0, not >1: because `vy` and `vz` are both
 * scaled by the same power figure, the ball's horizontal miss distance at
 * the rim blows up fast for *any* power above perfect (a 5% overshoot
 * already misses the whole scoring radius) — so a real swipe that reaches or
 * exceeds the reference distance, which is most of them, must land on
 * "perfect" rather than sail long. Only a short, gentle flick is
 * underpowered and falls short; you cannot swipe "too hard".
 */
const POWER_MIN = 0.92;
const POWER_MAX = 1.0;
/** Sideways velocity at a full half-width drag. */
const LATERAL_SCALE = 1.3;

/** Ball lifetime cap — nothing lives in the scene indefinitely. */
export const BALL_MAX_LIFE_MS = 3600;

// --- Difficulty tuning -----------------------------------------------------

export interface ArcadeAssist {
  /** Power error within this band is corrected toward perfect. */
  band: number;
  /** How much of the error inside the band is removed, 0..1. */
  strength: number;
}

/**
 * Basketball forgiveness per *speech* difficulty. The spec is explicit that
 * difficulty is primarily speech complexity — so the basketball assist
 * varies only mildly, and never enough to make Expert feel punishing.
 */
const ASSISTS: Record<SpeechDifficulty, ArcadeAssist> = {
  beginner: { band: 0.1, strength: 0.85 },
  expert: { band: 0.08, strength: 0.7 },
};

export function getArcadeAssist(difficulty: SpeechDifficulty): ArcadeAssist {
  return ASSISTS[difficulty] ?? ASSISTS.beginner;
}

// --- Launching -------------------------------------------------------------

export interface DragGesture {
  /** Horizontal drag in CSS pixels. Positive is rightward. */
  dx: number;
  /** Vertical drag in CSS pixels. Negative is upward — the shooting direction. */
  dy: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface LaunchVelocity {
  vx: number;
  vy: number;
  vz: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Turns a drag into a launch.
 *
 * Upward distance is power; horizontal offset is aim. A drag with no upward
 * component is not a shot at all and the caller should ignore it — this
 * returns the weakest legal launch rather than something that flies backwards.
 */
export function launchFromDrag(
  drag: DragGesture,
  assist: ArcadeAssist,
): LaunchVelocity {
  const up = Math.max(0, -drag.dy);
  const reference = Math.max(1, drag.viewportHeight * DRAG_REFERENCE_FRACTION);
  const u = clamp(up / reference, 0, 1);

  let power = POWER_MIN + (POWER_MAX - POWER_MIN) * u;

  // Assist: pull near-perfect power toward perfect. Errors outside the band
  // are left completely alone, so a bad flick still misses.
  const error = power - 1;
  if (Math.abs(error) <= assist.band) {
    power = 1 + error * (1 - assist.strength);
  }

  const aim = clamp(drag.dx / Math.max(1, drag.viewportWidth * 0.5), -1, 1);

  return {
    vx: aim * LATERAL_SCALE,
    vy: PERFECT_VY * power,
    vz: PERFECT_VZ * power,
  };
}

/** A drag has to travel this far upward before it counts as a shot at all. */
export const MIN_DRAG_PIXELS = 24;

export function isShootableDrag(drag: DragGesture): boolean {
  return -drag.dy >= MIN_DRAG_PIXELS;
}

// --- Ball simulation -------------------------------------------------------

export type BallOutcome = "in-flight" | "made" | "missed";

/**
 * One ball in the pool. Mutable on purpose — these are stepped every frame
 * and there may be several live at once, so allocating a new object per ball
 * per frame would be the wrong trade in the one place this game is
 * performance-sensitive.
 */
export interface ArcadeBall {
  id: number;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Cumulative live time in ms, for the lifetime cap. */
  ageMs: number;
  /** Set once, the frame the ball passes through the rim plane. */
  outcome: BallOutcome;
  /** True once the round has counted this ball's outcome. */
  counted: boolean;
  /** Whether the ball was released while the clock was still running. */
  releasedBeforeBuzzer: boolean;
  /** Set the frame the ball touches rim/backboard, for the clank sound. */
  hitRim: boolean;
  /** Whether the ball touched the floor this frame, for the bounce sound. */
  hitFloor: boolean;
}

export function createBallPool(size: number): ArcadeBall[] {
  return Array.from({ length: size }, (_, id) => ({
    id,
    active: false,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    ageMs: 0,
    outcome: "in-flight" as BallOutcome,
    counted: false,
    releasedBeforeBuzzer: true,
    hitRim: false,
    hitFloor: false,
  }));
}

/**
 * Claims an idle ball from the pool and launches it. Returns null when every
 * ball is live, which is the pool doing its job — the alternative is
 * unbounded object growth during a 30-second flick frenzy.
 */
export function launchBall(
  pool: ArcadeBall[],
  velocity: LaunchVelocity,
  releasedBeforeBuzzer: boolean,
): ArcadeBall | null {
  const ball = pool.find((entry) => !entry.active);
  if (!ball) return null;

  ball.active = true;
  ball.x = RACK_POSITION[0];
  ball.y = RACK_POSITION[1];
  ball.z = RACK_POSITION[2];
  ball.vx = velocity.vx;
  ball.vy = velocity.vy;
  ball.vz = velocity.vz;
  ball.ageMs = 0;
  ball.outcome = "in-flight";
  ball.counted = false;
  ball.releasedBeforeBuzzer = releasedBeforeBuzzer;
  ball.hitRim = false;
  ball.hitFloor = false;
  return ball;
}

function horizontalDistanceFromRim(x: number, z: number): number {
  const dx = x - RIM_X;
  const dz = z - RIM_Z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Advances one ball by `dtSeconds`.
 *
 * The make test is a plane crossing, not a proximity test: the ball must be
 * *descending* through y=RIM_Y and be within `SCORE_RADIUS` horizontally at
 * the interpolated moment it crosses. A ball rising through the rim plane on
 * its way up can never score, which is what stops a flat rocket shot from
 * counting.
 */
export function stepBall(ball: ArcadeBall, dtSeconds: number): void {
  if (!ball.active) return;

  ball.hitRim = false;
  ball.hitFloor = false;
  ball.ageMs += dtSeconds * 1000;

  const previousY = ball.y;
  const previousX = ball.x;
  const previousZ = ball.z;

  ball.vy -= GRAVITY * dtSeconds;
  ball.x += ball.vx * dtSeconds;
  ball.y += ball.vy * dtSeconds;
  ball.z += ball.vz * dtSeconds;

  const crossingDown = previousY > RIM_Y && ball.y <= RIM_Y && ball.vy < 0;
  if (crossingDown && ball.outcome === "in-flight") {
    // Interpolate to the exact crossing point rather than testing the frame's
    // end position — at 60fps a fast ball moves ~10cm per frame, which is
    // half the rim.
    const span = previousY - ball.y;
    const t = span > 0 ? (previousY - RIM_Y) / span : 0;
    const crossX = previousX + (ball.x - previousX) * t;
    const crossZ = previousZ + (ball.z - previousZ) * t;
    const distance = horizontalDistanceFromRim(crossX, crossZ);

    if (distance <= SCORE_RADIUS) {
      ball.outcome = "made";
    } else if (distance <= RIM_CONTACT_RADIUS) {
      // Clipped the rim: bounce up and away instead of passing through.
      ball.outcome = "missed";
      ball.hitRim = true;
      ball.vy = Math.abs(ball.vy) * 0.42;
      ball.vz *= -0.3;
      ball.vx += (crossX >= RIM_X ? 1 : -1) * 0.6;
      ball.y = RIM_Y + 0.01;
    } else {
      ball.outcome = "missed";
    }
  }

  // Backboard: a plane behind the hoop, so long shots come back rather than
  // flying off into the fog.
  if (ball.z < -0.35 && ball.vz < 0 && ball.y > 2.3 && ball.y < 3.5) {
    ball.vz = Math.abs(ball.vz) * 0.45;
    ball.z = -0.35;
    ball.hitRim = true;
    if (ball.outcome === "in-flight") ball.outcome = "missed";
  }

  if (ball.y <= FLOOR_Y) {
    ball.y = FLOOR_Y;
    if (ball.vy < 0) {
      ball.vy = -ball.vy * 0.42;
      ball.vx *= 0.72;
      ball.vz *= 0.72;
      ball.hitFloor = true;
    }
    if (ball.outcome === "in-flight") ball.outcome = "missed";
  }

  const outOfBounds =
    Math.abs(ball.x) > 14 || ball.z > 14 || ball.z < -8 || ball.y > 14;
  if (ball.ageMs >= BALL_MAX_LIFE_MS || outOfBounds) {
    ball.active = false;
  }
}

// --- Round rules -----------------------------------------------------------

export const TIME_ATTACK_SECONDS = 30;
/** Baskets in the final stretch are worth more. */
export const BONUS_WINDOW_SECONDS = 10;
export const NORMAL_BASKET_POINTS = 2;
export const BONUS_BASKET_POINTS = 3;
/** How long after a release the next ball is grabbable. */
export const BALL_RETURN_MS = 220;
/** Live balls allowed at once. */
export const BALL_POOL_SIZE = 8;

/**
 * Points for a basket made with `secondsRemaining` left on the clock.
 *
 * The escalation is an arcade convention — pressure rising as the clock runs
 * out — and is defined here from first principles rather than copied from any
 * commercial machine's ruleset.
 */
export function pointsForBasket(secondsRemaining: number): number {
  return secondsRemaining <= BONUS_WINDOW_SECONDS
    ? BONUS_BASKET_POINTS
    : NORMAL_BASKET_POINTS;
}

/**
 * THE BUZZER RULE, as implemented:
 *
 * A ball **released before the buzzer** still counts if it goes in after the
 * clock hits zero. A ball released after the buzzer never counts, and the
 * rack stops handing out balls at zero.
 *
 * This is the fairest of the options: the child's *action* happened in time,
 * and punishing them for the ball's flight time would make the last second of
 * the round worthless and teach them to stop shooting early.
 */
export function ballCounts(ball: ArcadeBall): boolean {
  return ball.releasedBeforeBuzzer;
}

export interface StreakTier {
  /** Makes in a row needed. */
  at: number;
  label: string;
}

/**
 * Streak callouts. All three are celebrations; there is deliberately no
 * negative counterpart, because a miss in a speech-practice game must never
 * produce discouraging language.
 */
export const STREAK_TIERS: StreakTier[] = [
  { at: 3, label: "HOT!" },
  { at: 5, label: "ON FIRE!" },
  { at: 8, label: "UNSTOPPABLE!" },
];

/** The callout for exactly this streak length, or null if it isn't a tier. */
export function streakCallout(streak: number): string | null {
  if (streak >= 8) {
    // Every make from 8 onward keeps the top callout, rather than going quiet
    // exactly when the child is doing best.
    return STREAK_TIERS[2].label;
  }
  return STREAK_TIERS.find((tier) => tier.at === streak)?.label ?? null;
}

export interface TimeAttackSummary {
  score: number;
  basketsMade: number;
  shotsTaken: number;
  /** Whole percent, 0 when nothing was attempted. */
  accuracy: number;
  bestStreak: number;
}

export function summarizeTimeAttack(input: {
  score: number;
  basketsMade: number;
  shotsTaken: number;
  bestStreak: number;
}): TimeAttackSummary {
  return {
    ...input,
    accuracy:
      input.shotsTaken > 0
        ? Math.round((input.basketsMade / input.shotsTaken) * 100)
        : 0,
  };
}
