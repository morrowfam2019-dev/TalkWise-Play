/**
 * Speech Basketball's own content model — deliberately separate from
 * `src/content/speech`. Basketball never invents its own words: it asks the
 * shared speech-content layer for a sound's challenge list and cycles
 * through it. This file only describes the basketball-specific shape —
 * court spots, difficulty, and scoring — none of which the adventure engine
 * knows or cares about.
 */

/** Where on the court a shot is taken from. Distance drives both difficulty
 * and point value; nothing here is a coordinate — the scene decides how a
 * tier is actually placed in 3D. */
export type CourtSpotTier = "close" | "wing" | "corner" | "long";

export interface CourtSpot {
  id: string;
  tier: CourtSpotTier;
  /** Kid-facing label shown on the HUD, e.g. "Wing". */
  label: string;
  /** Points awarded for a make from this spot. */
  points: 1 | 2 | 3;
  /** Horizontal angle from the hoop, radians. 0 is dead centre. */
  angle: number;
  /** Distance from the hoop, in scene units. */
  distance: number;
}

/**
 * Five unique spots, each taken twice across a round — 2 close, 2 wing,
 * 2 opposite wing, 2 corner, 2 long — exactly the Speech Shootout spec.
 * Center-line spots use two symmetric angles so "opposite wing" reads as a
 * genuinely different shot, not a repeat.
 */
export const COURT_SPOTS: CourtSpot[] = [
  { id: "close", tier: "close", label: "Close", points: 1, angle: 0, distance: 3.2 },
  { id: "wing-right", tier: "wing", label: "Wing", points: 2, angle: 0.55, distance: 5.4 },
  { id: "wing-left", tier: "wing", label: "Opposite Wing", points: 2, angle: -0.55, distance: 5.4 },
  { id: "corner-right", tier: "corner", label: "Corner", points: 2, angle: 1.15, distance: 6.2 },
  { id: "long", tier: "long", label: "Long Range", points: 3, angle: 0.25, distance: 8.4 },
];

/** Playing order for one 10-shot round: each spot twice, easiest first. */
export const ROUND_SPOT_SEQUENCE: string[] = [
  "close",
  "close",
  "wing-right",
  "wing-left",
  "wing-left",
  "wing-right",
  "corner-right",
  "corner-right",
  "long",
  "long",
];

export type Difficulty = "rookie" | "pro" | "all-star";

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  /** Half-width of the "green" (best-chance) zone, as a fraction of the meter. */
  greenZone: number;
  /** Half-width of the "yellow" (harder) zone, as a fraction of the meter. */
  yellowZone: number;
  /** Meter sweep duration in seconds — lower is harder to time. */
  sweepSeconds: number;
  /** Whether the target zone itself drifts during the sweep. */
  movingZone: boolean;
  /** Locked until a future phase; only Rookie ships playable in v1. */
  unlocked: boolean;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "rookie",
    label: "Rookie",
    greenZone: 0.21,
    yellowZone: 0.4,
    sweepSeconds: 1.1,
    movingZone: false,
    unlocked: true,
  },
  {
    id: "pro",
    label: "Pro",
    greenZone: 0.1,
    yellowZone: 0.22,
    sweepSeconds: 0.85,
    movingZone: false,
    unlocked: false,
  },
  {
    id: "all-star",
    label: "All-Star",
    greenZone: 0.08,
    yellowZone: 0.18,
    sweepSeconds: 0.7,
    movingZone: true,
    unlocked: false,
  },
];

export function getDifficulty(id: Difficulty): DifficultyConfig {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0];
}

/** Coins for a correctly-spoken word, independent of whether the shot goes
 * in — speech practice is never punished by a missed basket. */
export const SPEECH_COINS = 5;
/** Bonus coins for a made basket, on top of the speech coins. */
export const MAKE_BONUS_COINS = 2;
/** Bonus coins for a "perfect" (green-zone) shot timing. */
export const PERFECT_TIMING_BONUS_COINS = 1;

export const SHOTS_PER_ROUND = ROUND_SPOT_SEQUENCE.length;

export function getCourtSpot(id: string): CourtSpot {
  return COURT_SPOTS.find((spot) => spot.id === id) ?? COURT_SPOTS[0];
}
