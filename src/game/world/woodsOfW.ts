import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * WHISPER WOODS OF W — one long trail. Action: SLIDE.
 *
 * A single winding path between two hedge walls, blocked five times by
 * fallen logs. Every log hangs at 0.9 — duckable, never climbable — so the
 * trail is a rhythm of walk, slide, walk rather than a place to explore.
 * The clearings between logs widen and narrow so the walk has shape.
 *
 * Nothing in this world is above ground level, and nothing asks for a jump.
 */

const SOIL = "#7a5c3a";
const MOSS = "#5aa85f";
const HEDGE = "#3f7a45";
const HEDGE_TOP = "#6fbf6f";
const LOG = "#8a5a34";
const LOG_TOP = "#a87146";

const LOG_CLEARANCE = 0.9;
const WALL_TOP = 2.8;

let solidSeq = 0;
function slab(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  top: number,
  bottom: number,
  color: string,
  capColor?: string,
): Solid {
  solidSeq += 1;
  return {
    id: `w-solid-${solidSeq}`,
    minX,
    maxX,
    minZ,
    maxZ,
    top,
    bottom,
    color,
    capColor,
  };
}

/** A hedge wall segment. */
const hedge = (a: number, b: number, c: number, d: number) =>
  slab(a, b, c, d, WALL_TOP, -1, HEDGE, HEDGE_TOP);

/** A fallen log spanning the trail, hung high enough to slide beneath. */
const log = (a: number, b: number, c: number, d: number) =>
  slab(a, b, c, d, WALL_TOP, LOG_CLEARANCE, LOG, LOG_TOP);

// The trail runs from z=24 down to z=-24 between two hedges, with four
// alcoves cut into them — alternating west, east, west, east — so the walk
// has somewhere to go besides straight on. Five fallen logs cross the trail
// itself; there is no way past any of them except underneath.
const solids: Solid[] = [
  slab(-26, 26, -26, 26, 0, -9, SOIL, MOSS),

  // West hedge, with alcoves 1 and 3 recessed into it.
  hedge(-9, -6, 19, 26),
  hedge(-15, -6, 16, 19),
  hedge(-15, -12, 10, 16),
  hedge(-15, -6, 7, 10),
  hedge(-9, -6, -2, 7),
  hedge(-16, -6, -5, -2),
  hedge(-16, -13, -11, -5),
  hedge(-16, -6, -14, -11),
  hedge(-9, -6, -26, -14),

  // East hedge, with alcoves 2 and 4.
  hedge(6, 9, 9, 26),
  hedge(6, 15, 6, 9),
  hedge(12, 15, 0, 6),
  hedge(6, 15, -3, 0),
  hedge(6, 9, -12, -3),
  hedge(6, 16, -15, -12),
  hedge(13, 16, -19, -15),
  hedge(6, 16, -22, -19),
  hedge(6, 9, -26, -22),

  // The thicket behind the trail's end.
  hedge(-9, 9, -26, -24),

  // Five fallen logs, each hung at slide height across the full trail.
  log(-6, 6, 17.3, 18.7),
  log(-6, 6, 7.3, 8.7),
  log(-6, 6, -2.7, -1.3),
  log(-6, 6, -13.7, -12.3),
  log(-6, 6, -21.7, -20.3),
];

const decorations: Decoration[] = [
  // Dense forest crowding both hedges.
  { id: "wt1", kind: "pine", position: [-20, 0, 22], scale: 1.2 },
  { id: "wt2", kind: "tree", position: [-13, 0, 24], scale: 1 },
  { id: "wt3", kind: "pine", position: [16, 0, 23], scale: 1.15 },
  { id: "wt4", kind: "tree", position: [22, 0, 18], scale: 0.95 },
  { id: "wt5", kind: "pine", position: [-22, 0, 12], scale: 1.05 },
  { id: "wt6", kind: "tree", position: [19, 0, 10], scale: 1 },
  { id: "wt7", kind: "pine", position: [-21, 0, 2], scale: 1.1 },
  { id: "wt8", kind: "tree", position: [22, 0, 0], scale: 0.9 },
  { id: "wt9", kind: "pine", position: [-23, 0, -8], scale: 1 },
  { id: "wt10", kind: "tree", position: [20, 0, -8], scale: 1.05 },
  { id: "wt11", kind: "pine", position: [-21, 0, -18], scale: 1.15 },
  { id: "wt12", kind: "tree", position: [21, 0, -20], scale: 0.95 },
  { id: "wt13", kind: "pine", position: [-12, 0, -22], scale: 1 },
  { id: "wt14", kind: "pine", position: [12, 0, -18], scale: 0.9 },

  // Clearing undergrowth, inside the wide bays.
  { id: "wr1", kind: "rock", position: [-12, 0, 13], scale: 0.8 },
  { id: "wr2", kind: "rock", position: [12, 0, 3], scale: 0.85 },
  { id: "wr3", kind: "rock", position: [-13, 0, -7], scale: 0.75 },
  { id: "wr4", kind: "rock", position: [13, 0, -18], scale: 0.9 },

  { id: "wf1", kind: "flower", position: [-3, 0, 22], scale: 1, color: "#ffd76a" },
  { id: "wf2", kind: "flower", position: [3, 0, 13], scale: 1, color: "#ff9ec4" },
  { id: "wf3", kind: "flower", position: [-3, 0, 3], scale: 1, color: "#c7a6ff" },
  { id: "wf4", kind: "flower", position: [3, 0, -7], scale: 1, color: "#ffd76a" },
  { id: "wf5", kind: "flower", position: [-3, 0, -17], scale: 1, color: "#ff9ec4" },

  // Fireflies over each log, so the next duck is always visible.
  { id: "wc1", kind: "crystal", position: [-5, 0, 16], scale: 0.7 },
  { id: "wc2", kind: "crystal", position: [5, 0, 6], scale: 0.7 },
  { id: "wc3", kind: "crystal", position: [-5, 0, -4], scale: 0.7 },
  { id: "wc4", kind: "crystal", position: [5, 0, -15], scale: 0.7 },
  { id: "wc5", kind: "crystal", position: [-5, 0, -23], scale: 0.7 },

  { id: "wcl1", kind: "cloud", position: [-16, 17, 8], scale: 2.6 },
  { id: "wcl2", kind: "cloud", position: [18, 19, -8], scale: 3 },
  { id: "wcl3", kind: "cloud", position: [0, 22, -22], scale: 2.4 },
  { id: "wcl4", kind: "cloud", position: [6, 16, 22], scale: 2.2 },
];

const collectibles: Collectible[] = [
  { id: "w-coin-1", position: [0, 1, 22], value: 2 },
  { id: "w-coin-2", position: [-3, 1, 20], value: 2 },
  { id: "w-coin-3", position: [-11, 1, 14], value: 2 },
  { id: "w-coin-4", position: [-11, 1, 11], value: 2 },
  { id: "w-coin-5", position: [0, 1, 4], value: 2 },
  { id: "w-coin-6", position: [9, 1, 5], value: 2 },
  { id: "w-coin-7", position: [9, 1, 1], value: 2 },
  { id: "w-coin-8", position: [-10, 1, -6], value: 2 },
  { id: "w-coin-9", position: [-10, 1, -10], value: 2 },
  { id: "w-coin-10", position: [0, 1, -16], value: 2 },
  { id: "w-coin-11", position: [10, 1, -17], value: 2 },
  { id: "w-coin-12", position: [0, 1, -23.5], value: 2 },
];

export const woodsOfW: WorldDefinition = {
  id: "whisper-woods-of-w",
  name: "Whisper Woods of W",
  spawn: [0, 0, 23],
  spawnYaw: 0,
  action: "slide",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "w-cp-1", position: [-9, 0, 13] },
    { id: "w-cp-2", position: [0, 0, 3] },
    { id: "w-cp-3", position: [9, 0, 3] },
    { id: "w-cp-4", position: [-9.5, 0, -8] },
    { id: "w-cp-5", position: [9.5, 0, -17] },
  ],
  finish: [0, 0, -23],
  // Every leg approaches its log square-on: a slide taken at an angle can
  // clip a hedge instead of threading the gap.
  verifyRoute: [
    { name: "log 1", target: [0, 0, 20] },
    { name: "alcove 1 mouth", target: [-5, 0, 13] },
    { name: "CP1 w-cp-1", target: [-9, 0, 13] },
    { name: "back to trail", target: [0, 0, 11] },
    { name: "log 2", target: [0, 0, 10] },
    { name: "CP2 w-cp-2", target: [0, 0, 3] },
    { name: "CP3 w-cp-3", target: [9, 0, 3] },
    { name: "trail again", target: [0, 0, 2] },
    { name: "log 3", target: [0, 0, 0] },
    { name: "CP4 w-cp-4", target: [-9.5, 0, -8] },
    { name: "trail once more", target: [0, 0, -10] },
    { name: "log 4", target: [0, 0, -11] },
    { name: "CP5 w-cp-5", target: [9.5, 0, -17] },
    { name: "back on trail", target: [0, 0, -18] },
    { name: "log 5", target: [0, 0, -19] },
  ],
  skyColor: "#a9d8b8",
  fogColor: "#cfe9d4",
  waterColor: "#3f7a6a",
  waterLevel: -2.2,
  killPlane: -12,
};
