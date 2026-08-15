import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * MOUNTAIN OF M — a spiral climb. Action: JUMP.
 *
 * Four concentric terraces, each too tall to step onto. The only way up is a
 * single stair block per terrace, and those stairs sit at rotating compass
 * points — south, east, north, west — so the climb genuinely winds around the
 * mountain instead of going straight up one face.
 *
 * Every rise is 0.95: above the controller's 0.75 auto-step (so it always
 * costs a jump) and well under the ~1.31 a jump clears (so it never costs a
 * retry). The terraces are filled squares rather than rings, so a missed
 * jump lands the player on the terrace below instead of in a pit.
 */

const GRASS = "#6fd36b";
const GRASS_HIGH = "#8ade7c";
const DIRT = "#c58a55";
const ROCK = "#a8b3c4";
const ROCK_DARK = "#8b97a9";
const SUMMIT_STONE = "#f3d488";

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
    id: `solid-${solidSeq}`,
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

const solids: Solid[] = [
  // Base island — the full footprint, so nothing on the mountain can drop a
  // player into a hole.
  slab(-26, 26, -26, 26, 0, -9, DIRT, GRASS),

  // Terrace 1, and the south stair up to it.
  slab(-3, 3, 19, 23, RISE, -1, ROCK_DARK, GRASS_HIGH),
  slab(-19, 19, -19, 19, RISE * 2, -1, DIRT, GRASS),

  // Terrace 2, and the east stair.
  slab(15, 19, -3, 3, RISE * 3, -1, ROCK_DARK, GRASS_HIGH),
  slab(-15, 15, -15, 15, RISE * 4, -1, DIRT, GRASS_HIGH),

  // Terrace 3, and the north stair.
  slab(-3, 3, -14, -10, RISE * 5, -1, ROCK_DARK, SUMMIT_STONE),
  slab(-10, 10, -10, 10, RISE * 6, -1, ROCK, GRASS_HIGH),

  // Summit, and the west stair.
  slab(-10, -6, -3, 3, RISE * 7, -1, ROCK_DARK, SUMMIT_STONE),
  slab(-6, 6, -6, 6, RISE * 8, -1, ROCK, SUMMIT_STONE),
];

const T1 = RISE * 2;
const T2 = RISE * 4;
const T3 = RISE * 6;
const SUMMIT = RISE * 8;

const decorations: Decoration[] = [
  // Shoreline ring.
  { id: "t1", kind: "tree", position: [-24, 0, 22], scale: 1.05 },
  { id: "t2", kind: "pine", position: [-22, 0, 12], scale: 0.95 },
  { id: "t3", kind: "tree", position: [-12, 0, 24], scale: 0.9 },
  { id: "t4", kind: "pine", position: [10, 0, 23.5], scale: 1.1 },
  { id: "t5", kind: "tree", position: [22, 0, 21], scale: 1 },
  { id: "t6", kind: "pine", position: [24, 0, 10], scale: 1 },
  { id: "t7", kind: "tree", position: [23, 0, -12], scale: 0.9 },
  { id: "t8", kind: "pine", position: [-24, 0, -8], scale: 1.05 },
  { id: "t9", kind: "tree", position: [-21, 0, -21], scale: 0.95 },
  { id: "t10", kind: "pine", position: [12, 0, -23], scale: 1.15 },

  // Terrace plantings — each ring gets its own band so the spiral reads from
  // the air as well as from the ground.
  { id: "t11", kind: "pine", position: [-17, T1, 11], scale: 0.9 },
  { id: "t12", kind: "tree", position: [16, T1, -13], scale: 0.85 },
  { id: "t13", kind: "pine", position: [-11, T1, -16], scale: 0.9 },
  { id: "t14", kind: "tree", position: [12.5, T2, 12.5], scale: 0.8 },
  { id: "t15", kind: "pine", position: [-13, T2, -6], scale: 0.85 },
  { id: "t16", kind: "pine", position: [7.5, T3, -7.5], scale: 0.75 },

  // Rocks.
  { id: "r1", kind: "rock", position: [-22, 0, 4], scale: 1.05 },
  { id: "r2", kind: "rock", position: [21, 0, 2], scale: 0.75 },
  { id: "r3", kind: "rock", position: [6, 0, -24], scale: 1.25 },
  { id: "r4", kind: "rock", position: [17, T1, 8], scale: 0.8 },
  { id: "r5", kind: "rock", position: [-12, T2, 12], scale: 0.7 },
  { id: "r6", kind: "rock", position: [8, T3, 6], scale: 0.65 },

  // Meadow flowers.
  { id: "f1", kind: "flower", position: [-8, 0, 22], scale: 1, color: "#ff6f91" },
  { id: "f2", kind: "flower", position: [8, 0, 21], scale: 1, color: "#ffb347" },
  { id: "f3", kind: "flower", position: [-20, 0, -14], scale: 1, color: "#7fd8ff" },
  { id: "f4", kind: "flower", position: [-16, T1, 16], scale: 1, color: "#ffb347" },
  { id: "f5", kind: "flower", position: [13, T2, -12], scale: 1, color: "#ff6f91" },

  // Crystals lighting each stair, so the way up is always visible.
  { id: "c1", kind: "crystal", position: [-4.4, 0, 21], scale: 0.9 },
  { id: "c2", kind: "crystal", position: [4.4, 0, 21], scale: 0.9 },
  { id: "c3", kind: "crystal", position: [17, T1, 4.4], scale: 0.9 },
  { id: "c4", kind: "crystal", position: [17, T1, -4.4], scale: 0.9 },
  { id: "c5", kind: "crystal", position: [-4.4, T2, -12], scale: 0.9 },
  { id: "c6", kind: "crystal", position: [4.4, T2, -12], scale: 0.9 },
  { id: "c7", kind: "crystal", position: [-8, T3, 4.4], scale: 0.9 },
  { id: "c8", kind: "crystal", position: [-8, T3, -4.4], scale: 0.9 },

  // Clouds.
  { id: "cl1", kind: "cloud", position: [-18, 16, 6], scale: 2.4 },
  { id: "cl2", kind: "cloud", position: [16, 18, -6], scale: 3 },
  { id: "cl3", kind: "cloud", position: [-8, 20, -22], scale: 2.6 },
  { id: "cl4", kind: "cloud", position: [24, 15, 14], scale: 2.2 },
  { id: "cl5", kind: "cloud", position: [0, 22, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  // Base ring — a trail toward the first stair.
  { id: "coin-1", position: [-6, 1, 24], value: 2 },
  { id: "coin-2", position: [0, 1, 24.5], value: 2 },
  { id: "coin-3", position: [6, 1, 24], value: 2 },
  { id: "coin-4", position: [-22, 1, 16], value: 2 },
  { id: "coin-5", position: [22, 1, -16], value: 2 },
  // Terrace 1, curling toward the east stair.
  { id: "coin-6", position: [10, T1 + 1, 16], value: 2 },
  { id: "coin-7", position: [16, T1 + 1, 12], value: 2 },
  { id: "coin-8", position: [-17, T1 + 1, -6], value: 2 },
  // Terrace 2, curling toward the north stair.
  { id: "coin-9", position: [8, T2 + 1, -12], value: 2 },
  { id: "coin-10", position: [-12, T2 + 1, 8], value: 2 },
  // Terrace 3 and the summit.
  { id: "coin-11", position: [7, T3 + 1, -7], value: 2 },
  { id: "coin-12", position: [0, SUMMIT + 1, 0], value: 2 },
];

export const mountainOfM: WorldDefinition = {
  id: "mountain-of-m",
  name: "Mountain of M",
  spawn: [0, 0, 24],
  spawnYaw: 0,
  action: "jump",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "cp-1", position: [0, T1, 17] },
    { id: "cp-2", position: [17, T1, 8] },
    { id: "cp-3", position: [-6, T2, -12.5] },
    { id: "cp-4", position: [-7.5, T3, 6] },
    { id: "cp-5", position: [0, SUMMIT, 2.8] },
  ],
  finish: [0, SUMMIT, -2.8],
  // South stair → terrace 1 → east stair → terrace 2 → north stair →
  // terrace 3 → west stair → summit. Waypoints hug each terrace so the
  // walked line never tries to cut the corner through the tier above it.
  verifyRoute: [
    { name: "south stair", target: [0, RISE, 21] },
    { name: "CP1 cp-1", target: [0, T1, 17] },
    { name: "T1 east arc", target: [15, T1, 15] },
    { name: "CP2 cp-2", target: [17, T1, 8] },
    { name: "east stair", target: [17, RISE * 3, 0] },
    { name: "T2 north arc", target: [12, T2, -12] },
    { name: "CP3 cp-3", target: [-6, T2, -12.5] },
    { name: "north stair", target: [0, RISE * 5, -12] },
    { name: "T3 west arc", target: [-7, T3, 7] },
    { name: "CP4 cp-4", target: [-7.5, T3, 6] },
    { name: "west stair", target: [-8, RISE * 7, 0] },
    { name: "CP5 cp-5", target: [0, SUMMIT, 2.8] },
  ],
  skyColor: "#8fd8f5",
  fogColor: "#cfeefc",
  waterColor: "#4fb0e8",
  waterLevel: -2.2,
  killPlane: -12,
};
