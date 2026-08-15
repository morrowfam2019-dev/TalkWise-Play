import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * BUBBLE BAY OF B — a chain of islands. Action: JUMP.
 *
 * Six sandbars spiralling inward around a lagoon, each one 0.95 above the
 * last and overlapping its neighbour at a corner, so the whole world is a
 * sequence of hops rather than a climb up one hill. Unlike the Mountain, the
 * route never doubles back — it's a single loop inward to the lighthouse.
 *
 * A shallow lagoon floor runs under everything at y=0, so a missed jump is a
 * splash and a walk back, never a fall out of the world. Two rescue pads sit
 * on that floor to launch a player back up the chain without retracing the
 * whole loop.
 */

const SAND = "#f5e2b8";
const SAND_HIGH = "#ffe9c2";
const DOCK = "#8bd4e0";
const DOCK_DARK = "#5fb8c9";
const LIGHTHOUSE = "#d6f6ff";

const RISE = 0.95;

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
    id: `b-solid-${solidSeq}`,
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

const A = RISE; // 0.95
const B = RISE * 2;
const C = RISE * 3;
const D = RISE * 4;
const E = RISE * 5;
const F = RISE * 6; // 5.70 — the lighthouse

const solids: Solid[] = [
  // Lagoon floor — the safety net under the whole chain.
  slab(-26, 26, -26, 26, 0, -9, DOCK_DARK, SAND),

  // The chain, each island overlapping the previous at one corner.
  slab(-23, -12, 11, 23, A, -1, DOCK, SAND_HIGH),
  slab(-13, -2, 12, 24, B, -1, DOCK, SAND_HIGH),
  slab(-3, 9, 7, 18, C, -1, DOCK, SAND_HIGH),
  slab(8, 20, 1, 12, D, -1, DOCK, SAND_HIGH),
  slab(7, 19, -11, 2, E, -1, DOCK, SAND_HIGH),
  slab(-9, 8, -21, -10, F, -1, DOCK, LIGHTHOUSE),
];

const decorations: Decoration[] = [
  // Palms and pines around the lagoon shore.
  { id: "bt1", kind: "pine", position: [-24, 0, 3], scale: 1.05 },
  { id: "bt2", kind: "tree", position: [-24, 0, -8], scale: 0.95 },
  { id: "bt3", kind: "pine", position: [-18, 0, -20], scale: 1.1 },
  { id: "bt4", kind: "tree", position: [-4, 0, -24], scale: 0.9 },
  { id: "bt5", kind: "pine", position: [14, 0, -22], scale: 1 },
  { id: "bt6", kind: "tree", position: [23, 0, -18], scale: 0.95 },
  { id: "bt7", kind: "pine", position: [24, 0, 16], scale: 1.05 },
  { id: "bt8", kind: "tree", position: [16, 0, 22], scale: 0.9 },
  { id: "bt9", kind: "pine", position: [2, 0, 24], scale: 1 },

  // Island plantings.
  { id: "bt10", kind: "pine", position: [-20, A, 20], scale: 0.9 },
  { id: "bt11", kind: "tree", position: [-10, B, 21], scale: 0.85 },
  { id: "bt12", kind: "pine", position: [6, C, 15], scale: 0.8 },
  { id: "bt13", kind: "tree", position: [17, D, 9], scale: 0.8 },
  { id: "bt14", kind: "pine", position: [16, E, -8], scale: 0.75 },

  // Rocks.
  { id: "br1", kind: "rock", position: [-21, 0, -2], scale: 1.05 },
  { id: "br2", kind: "rock", position: [21, 0, 18], scale: 0.75 },
  { id: "br3", kind: "rock", position: [-16, 0, -14], scale: 1.25 },
  { id: "br4", kind: "rock", position: [-21, A, 13], scale: 0.7 },
  { id: "br5", kind: "rock", position: [-4, C, 9], scale: 0.65 },

  // Bubble-blue blooms.
  { id: "bf1", kind: "flower", position: [-8, 0, 6], scale: 1, color: "#5ecbe8" },
  { id: "bf2", kind: "flower", position: [4, 0, -6], scale: 1, color: "#8fe3f0" },
  { id: "bf3", kind: "flower", position: [-14, 0, 2], scale: 1, color: "#bff2ff" },
  { id: "bf4", kind: "flower", position: [-18, A, 16], scale: 1, color: "#5ecbe8" },
  { id: "bf5", kind: "flower", position: [12, D, 4], scale: 1, color: "#8fe3f0" },

  // Crystals marking the lighthouse.
  { id: "bc1", kind: "crystal", position: [-4, F, -19], scale: 1.1 },
  { id: "bc2", kind: "crystal", position: [3, F, -19], scale: 1.1 },

  { id: "bcl1", kind: "cloud", position: [-18, 15, 6], scale: 2.4 },
  { id: "bcl2", kind: "cloud", position: [16, 17, -6], scale: 3 },
  { id: "bcl3", kind: "cloud", position: [-8, 19, -22], scale: 2.6 },
  { id: "bcl4", kind: "cloud", position: [24, 14, 14], scale: 2.2 },
  { id: "bcl5", kind: "cloud", position: [0, 21, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  { id: "b-coin-1", position: [-20, A + 1, 15], value: 2 },
  { id: "b-coin-2", position: [-16, A + 1, 20], value: 2 },
  { id: "b-coin-3", position: [-11, B + 1, 22], value: 2 },
  { id: "b-coin-4", position: [-5, B + 1, 16], value: 2 },
  { id: "b-coin-5", position: [0, C + 1, 11], value: 2 },
  { id: "b-coin-6", position: [6, C + 1, 16], value: 2 },
  { id: "b-coin-7", position: [12, D + 1, 10], value: 2 },
  { id: "b-coin-8", position: [18, D + 1, 4], value: 2 },
  { id: "b-coin-9", position: [16, E + 1, -3], value: 2 },
  { id: "b-coin-10", position: [10, E + 1, -8], value: 2 },
  { id: "b-coin-11", position: [-6, F + 1, -13], value: 2 },
  { id: "b-coin-12", position: [5, F + 1, -18], value: 2 },
];

export const bubbleBayOfB: WorldDefinition = {
  id: "bubble-bay-of-b",
  name: "Bubble Bay of B",
  spawn: [-19, 0, 5],
  spawnYaw: Math.PI,
  action: "jump",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "b-cp-1", position: [-18, A, 17] },
    { id: "b-cp-2", position: [-8, B, 19] },
    { id: "b-cp-3", position: [3, C, 12] },
    { id: "b-cp-4", position: [15, D, 6] },
    { id: "b-cp-5", position: [12, E, -6] },
  ],
  finish: [0, F, -16],
  // Rescue launches back onto the middle of the chain, so a splash costs a
  // short swim rather than the whole loop over again.
  jumpPads: [
    { id: "b-pad-mid", position: [3, 0, 3], radius: 2.4, boost: 13 },
    { id: "b-pad-late", position: [-3, 0, -6], radius: 2.4, boost: 15 },
  ],
  // Each "hop" waypoint stands on the island being launched from, clear of
  // the next one's footprint, so the declared height is the ground the
  // player is actually on when they line the jump up.
  verifyRoute: [
    { name: "CP1 b-cp-1", target: [-18, A, 17] },
    { name: "line up hop B", target: [-14.5, A, 18] },
    { name: "CP2 b-cp-2", target: [-8, B, 19] },
    { name: "line up hop C", target: [-4.5, B, 15] },
    { name: "CP3 b-cp-3", target: [3, C, 12] },
    { name: "line up hop D", target: [6.5, C, 10] },
    { name: "CP4 b-cp-4", target: [15, D, 6] },
    { name: "line up hop E", target: [14, D, 3.5] },
    { name: "CP5 b-cp-5", target: [12, E, -6] },
    { name: "line up lighthouse", target: [10, E, -9] },
  ],
  skyColor: "#bdeeff",
  fogColor: "#d6f6ff",
  waterColor: "#3fa8d9",
  waterLevel: -2.2,
  killPlane: -12,
};
