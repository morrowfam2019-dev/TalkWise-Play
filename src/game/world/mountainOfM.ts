import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * MOUNTAIN OF M — the Phase 1 world.
 *
 * A bright island with a terraced mountain rising to the north (-Z). The
 * player starts on the shore and works upward: two checkpoints on the base,
 * one on each side ledge, one on the mid terrace, and the finish portal on
 * the summit. Every climb is built from steps no taller than the controller's
 * auto-step height, so a child can walk the whole route without precise
 * jumping — jumping exists for fun and for optional coins.
 */

const GRASS = "#6fd36b";
const GRASS_HIGH = "#8ade7c";
const DIRT = "#c58a55";
const ROCK = "#a8b3c4";
const ROCK_DARK = "#8b97a9";
const STONE = "#e2dcCB";
const SUMMIT_STONE = "#f3d488";

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
  // Base island.
  slab(-26, 26, -24, 24, 0, -9, DIRT, GRASS),

  // West ledge (tier 1) and its stair up from the shore.
  slab(-20, -4, -10, 7, 1.4, -1, DIRT, GRASS),
  slab(-14, -10, 9, 10.8, 0.7, -1, STONE),
  slab(-14, -10, 7, 9, 1.4, -1, STONE),

  // East ledge (tier 2) and its stair up from the shore.
  slab(4, 20, -6, 5.6, 2.8, -1, DIRT, GRASS),
  slab(9, 13, 9.4, 10.8, 0.7, -1, STONE),
  slab(9, 13, 8.2, 9.4, 1.4, -1, STONE),
  slab(9, 13, 7, 8.2, 2.1, -1, STONE),
  slab(9, 13, 5.6, 7, 2.8, -1, STONE),

  // Mid terrace (tier 3).
  slab(-9, 9, -17, -7, 4.4, -1, ROCK, GRASS_HIGH),

  // West route: stair off the west ledge, then a buttress bridge to the terrace.
  slab(-16, -12, -6.2, -5, 2.1, -1, STONE),
  slab(-16, -12, -7.4, -6.2, 2.8, -1, STONE),
  slab(-16, -12, -8.6, -7.4, 3.5, -1, STONE),
  slab(-16, -12, -9.8, -8.6, 4.2, -1, STONE),
  slab(-16, -9, -13, -9.8, 4.4, -6, ROCK_DARK, GRASS_HIGH),

  // East route: stair off the east ledge, then a buttress bridge to the terrace.
  slab(10, 14, -5.2, -4, 3.5, -1, STONE),
  slab(10, 14, -6.4, -5.2, 4.2, -1, STONE),
  slab(9, 14, -11, -6.4, 4.4, -6, ROCK_DARK, GRASS_HIGH),

  // Summit stair and summit platform.
  slab(-2.5, 2.5, -16.5, -15.3, 5.1, -1, SUMMIT_STONE),
  slab(-2.5, 2.5, -17.7, -16.5, 5.8, -1, SUMMIT_STONE),
  slab(-5, 5, -22, -17.5, 6.4, -2, ROCK, SUMMIT_STONE),

  // Optional stepping stones behind the spawn — a small jump route for coins,
  // kept clear of the main shore path between the west and east stairs.
  slab(-6, -3, 17, 20, 1, -1, ROCK, GRASS),
  slab(-2, 1, 20, 23, 1.6, -1, ROCK, GRASS),
];

const decorations: Decoration[] = [
  // Shoreline trees.
  { id: "t1", kind: "tree", position: [-23, 0, 20], scale: 1.1 },
  { id: "t2", kind: "pine", position: [-18, 0, 15.5], scale: 1 },
  { id: "t3", kind: "tree", position: [-10, 0, 19.5], scale: 0.9 },
  { id: "t4", kind: "pine", position: [2.5, 0, 20.5], scale: 1.15 },
  { id: "t5", kind: "tree", position: [11, 0, 19], scale: 1 },
  { id: "t6", kind: "pine", position: [22, 0, 17.5], scale: 1.05 },
  { id: "t7", kind: "tree", position: [24, 0, 6], scale: 0.95 },
  { id: "t8", kind: "pine", position: [-24, 0, -2], scale: 1.1 },
  { id: "t9", kind: "tree", position: [-23, 0, -14], scale: 1 },
  { id: "t10", kind: "pine", position: [-15, 0, -18.5], scale: 1.2 },
  { id: "t11", kind: "tree", position: [-11, 0, -21], scale: 0.9 },
  { id: "t12", kind: "pine", position: [14, 0, -16], scale: 1.1 },
  { id: "t13", kind: "tree", position: [20.5, 0, -10], scale: 1 },
  { id: "t14", kind: "pine", position: [22, 0, -20], scale: 1.15 },
  // Trees on the ledges.
  { id: "t15", kind: "pine", position: [-18, 1.4, -7.5], scale: 0.95 },
  { id: "t16", kind: "tree", position: [-6.5, 1.4, 5], scale: 0.85 },
  { id: "t17", kind: "pine", position: [17.5, 2.8, -4.5], scale: 0.9 },
  { id: "t18", kind: "tree", position: [5.5, 2.8, 4], scale: 0.8 },
  { id: "t19", kind: "pine", position: [-7.5, 4.4, -15.5], scale: 0.9 },
  { id: "t20", kind: "pine", position: [7.5, 4.4, -15], scale: 0.85 },

  // Rocks.
  { id: "r1", kind: "rock", position: [-20, 0, 11], scale: 1.1 },
  { id: "r2", kind: "rock", position: [7, 0, 8.5], scale: 0.8 },
  { id: "r3", kind: "rock", position: [18, 0, -14], scale: 1.3 },
  { id: "r4", kind: "rock", position: [-21, 0, -19], scale: 1 },
  { id: "r5", kind: "rock", position: [-12, 1.4, 3], scale: 0.7 },
  { id: "r6", kind: "rock", position: [16, 2.8, 3], scale: 0.75 },
  { id: "r7", kind: "rock", position: [-4, 4.4, -9], scale: 0.65 },
  { id: "r8", kind: "rock", position: [4, 4.4, -13], scale: 0.7 },
  { id: "r9", kind: "rock", position: [-24, 0, 14], scale: 0.9 },
  { id: "r10", kind: "rock", position: [24, 0, -3], scale: 1 },

  // Flowers on the shore.
  { id: "f1", kind: "flower", position: [-5, 0, 15], scale: 1, color: "#ff8fd0" },
  { id: "f2", kind: "flower", position: [4, 0, 17], scale: 1, color: "#ffd166" },
  { id: "f3", kind: "flower", position: [-16, 0, 19], scale: 1, color: "#8ce0ff" },
  { id: "f4", kind: "flower", position: [14, 0, 10], scale: 1, color: "#ff8fd0" },
  { id: "f5", kind: "flower", position: [-19, 1.4, 0], scale: 1, color: "#ffd166" },
  { id: "f6", kind: "flower", position: [12, 2.8, 1], scale: 1, color: "#8ce0ff" },

  // Golden M crystals marking the summit approach.
  { id: "c1", kind: "crystal", position: [-3.6, 5.2, -13], scale: 1 },
  { id: "c2", kind: "crystal", position: [3.6, 5.2, -13], scale: 1 },
  { id: "c3", kind: "crystal", position: [-3.8, 7.2, -20.5], scale: 1.2 },
  { id: "c4", kind: "crystal", position: [3.8, 7.2, -20.5], scale: 1.2 },

  // Clouds.
  { id: "cl1", kind: "cloud", position: [-18, 14, 6], scale: 2.4 },
  { id: "cl2", kind: "cloud", position: [16, 16, -6], scale: 3 },
  { id: "cl3", kind: "cloud", position: [-8, 18, -22], scale: 2.6 },
  { id: "cl4", kind: "cloud", position: [24, 13, 14], scale: 2.2 },
  { id: "cl5", kind: "cloud", position: [0, 20, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  { id: "coin-1", position: [-14, 1, 17], value: 2 },
  { id: "coin-2", position: [6, 1, 16], value: 2 },
  { id: "coin-3", position: [20, 1, 14], value: 2 },
  { id: "coin-4", position: [-21, 1, 8], value: 2 },
  { id: "coin-5", position: [-4.5, 2, 18.5], value: 2 },
  { id: "coin-6", position: [-0.5, 2.6, 21.5], value: 2 },
  { id: "coin-7", position: [-17, 2.4, 4], value: 2 },
  { id: "coin-8", position: [-16, 2.4, -3], value: 2 },
  { id: "coin-9", position: [18, 3.8, 2], value: 2 },
  { id: "coin-10", position: [-6, 5.4, -14], value: 2 },
  { id: "coin-11", position: [-13, 5.4, -11], value: 2 },
  { id: "coin-12", position: [12, 5.4, -9], value: 2 },
];

export const mountainOfM: WorldDefinition = {
  id: "mountain-of-m",
  name: "Mountain of M",
  spawn: [0, 0, 16],
  spawnYaw: 0,
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "cp-1", position: [-9, 0, 13] },
    { id: "cp-2", position: [18, 0, 9] },
    { id: "cp-3", position: [-14, 1.4, 2] },
    { id: "cp-4", position: [15, 2.8, 0] },
    { id: "cp-5", position: [0, 4.4, -11.5] },
  ],
  finish: [0, 6.4, -20],
  skyColor: "#8fd8f5",
  fogColor: "#bfe9fb",
  waterColor: "#3fb8e8",
  waterLevel: -2.2,
  killPlane: -12,
};
