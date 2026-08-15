import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * PARTY PLAZA OF P — the Phase 2 proof-of-pipeline world.
 *
 * Second world built to prove the engine/content split: nothing here is
 * copied game logic, only new data. Same flat-base-plus-jump-pads shape as
 * Mountain of M (all five checkpoints, coins, and the finish sit on the base
 * level so a child can walk the whole route with no precision jumping; the
 * elevated party platforms are optional detours reached by jump pad).
 */

const GRASS = "#8ce088";
const GRASS_HIGH = "#a6f0a0";
const DIRT = "#e0a8c9";
const ROCK = "#c9b8e8";
const ROCK_DARK = "#ab97d4";
const SUMMIT_STONE = "#ffd8ec";

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
    id: `p-solid-${solidSeq}`,
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
  // Base plaza.
  slab(-26, 26, -24, 24, 0, -9, DIRT, GRASS),

  // West party platform (elevated).
  slab(-20, -4, -10, 7, 1.4, -1, DIRT, GRASS),

  // East party platform (elevated higher).
  slab(4, 20, -6, 5.6, 2.8, -1, DIRT, GRASS),

  // Mid stage (highest of the lower tiers).
  slab(-9, 9, -17, -7, 4.4, -1, ROCK, GRASS_HIGH),

  // Walkable ramps up to the mid stage. Footprints stop exactly at the
  // lower platforms' edges (z=-10 and z=-6) rather than overlapping them.
  // Widened to the platforms' full x-range so a diagonal boosted jump
  // can't slip through an uncovered corner between platform and terrace.
  slab(-20, -9, -17, -10, 4.4, -1, ROCK_DARK, GRASS_HIGH),
  slab(4, 14, -17, -6, 4.4, -1, ROCK_DARK, GRASS_HIGH),

  // Summit — the P Palace platform.
  slab(-5, 5, -22, -15.3, 6.4, -1, ROCK, SUMMIT_STONE),
];

const decorations: Decoration[] = [
  // Shoreline trees, reused kinds — the world is only distinguished by
  // color and layout in Phase 2; richer per-world art is a Phase 3 pass.
  { id: "pt1", kind: "tree", position: [-23, 0, 20], scale: 1.05 },
  { id: "pt2", kind: "pine", position: [-18, 0, 15.5], scale: 0.95 },
  { id: "pt3", kind: "tree", position: [-10, 0, 19.5], scale: 0.9 },
  { id: "pt4", kind: "pine", position: [2.5, 0, 20.5], scale: 1.1 },
  { id: "pt5", kind: "tree", position: [11, 0, 19], scale: 1 },
  { id: "pt6", kind: "pine", position: [22, 0, 17.5], scale: 1 },
  { id: "pt7", kind: "tree", position: [24, 0, 6], scale: 0.9 },
  { id: "pt8", kind: "pine", position: [-24, 0, -2], scale: 1.05 },
  { id: "pt9", kind: "tree", position: [-23, 0, -14], scale: 0.95 },
  { id: "pt10", kind: "pine", position: [-15, 0, -18.5], scale: 1.15 },
  { id: "pt11", kind: "tree", position: [-11, 0, -21], scale: 0.85 },
  { id: "pt12", kind: "pine", position: [14, 0, -16], scale: 1.05 },
  { id: "pt13", kind: "tree", position: [20.5, 0, -10], scale: 0.95 },
  { id: "pt14", kind: "pine", position: [22, 0, -20], scale: 1.1 },

  // Trees on the party platforms.
  { id: "pt15", kind: "pine", position: [-18, 1.4, -7.5], scale: 0.9 },
  { id: "pt16", kind: "tree", position: [-6.5, 1.4, 5], scale: 0.8 },
  { id: "pt17", kind: "pine", position: [17.5, 2.8, -4.5], scale: 0.85 },
  { id: "pt18", kind: "tree", position: [5.5, 2.8, 4], scale: 0.75 },
  { id: "pt19", kind: "pine", position: [-7.5, 4.4, -15.5], scale: 0.85 },
  { id: "pt20", kind: "pine", position: [7.5, 4.4, -15], scale: 0.8 },

  // Rocks.
  { id: "pr1", kind: "rock", position: [-20, 0, 11], scale: 1.05 },
  { id: "pr2", kind: "rock", position: [7, 0, 8.5], scale: 0.75 },
  { id: "pr3", kind: "rock", position: [18, 0, -14], scale: 1.25 },
  { id: "pr4", kind: "rock", position: [-21, 0, -19], scale: 0.95 },
  { id: "pr5", kind: "rock", position: [-12, 1.4, 3], scale: 0.65 },
  { id: "pr6", kind: "rock", position: [16, 2.8, 3], scale: 0.7 },

  // Balloon-colored flowers — Phase 2 keeps the flower geometry, just
  // themed with a party palette instead of M's meadow palette.
  { id: "pf1", kind: "flower", position: [-5, 0, 15], scale: 1, color: "#ff6f91" },
  { id: "pf2", kind: "flower", position: [4, 0, 17], scale: 1, color: "#ffb347" },
  { id: "pf3", kind: "flower", position: [-16, 0, 19], scale: 1, color: "#7fd8ff" },
  { id: "pf4", kind: "flower", position: [14, 0, 10], scale: 1, color: "#ff6f91" },
  { id: "pf5", kind: "flower", position: [-19, 1.4, 0], scale: 1, color: "#ffb347" },
  { id: "pf6", kind: "flower", position: [12, 2.8, 1], scale: 1, color: "#7fd8ff" },

  // Pink crystals marking the summit approach.
  { id: "pc1", kind: "crystal", position: [-3.6, 5.2, -13], scale: 1 },
  { id: "pc2", kind: "crystal", position: [3.6, 5.2, -13], scale: 1 },
  { id: "pc3", kind: "crystal", position: [-3.8, 7.2, -20.5], scale: 1.2 },
  { id: "pc4", kind: "crystal", position: [3.8, 7.2, -20.5], scale: 1.2 },

  // Clouds.
  { id: "pcl1", kind: "cloud", position: [-18, 14, 6], scale: 2.4 },
  { id: "pcl2", kind: "cloud", position: [16, 16, -6], scale: 3 },
  { id: "pcl3", kind: "cloud", position: [-8, 18, -22], scale: 2.6 },
  { id: "pcl4", kind: "cloud", position: [24, 13, 14], scale: 2.2 },
  { id: "pcl5", kind: "cloud", position: [0, 20, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  { id: "p-coin-1", position: [-24, 1, 20], value: 2 },
  { id: "p-coin-2", position: [0, 1, 20], value: 2 },
  { id: "p-coin-3", position: [24, 1, 18], value: 2 },
  { id: "p-coin-4", position: [-25, 1, 10], value: 2 },
  { id: "p-coin-5", position: [-2, 1, 22], value: 2 },
  { id: "p-coin-6", position: [2, 1, 22], value: 2 },
  { id: "p-coin-7", position: [-25, 1, 5], value: 2 },
  { id: "p-coin-8", position: [25, 1, 0], value: 2 },
  { id: "p-coin-9", position: [-22, 1, -15], value: 2 },
  { id: "p-coin-10", position: [20, 1, -18], value: 2 },
  { id: "p-coin-11", position: [-22, 1, -12], value: 2 },
  { id: "p-coin-12", position: [20, 1, -10], value: 2 },
];

export const partyPlazaOfP: WorldDefinition = {
  id: "party-plaza-of-p",
  name: "Party Plaza of P",
  spawn: [0, 0, 16],
  spawnYaw: 0,
  bounds: { minX: -26, maxX: 26, minZ: -24, maxZ: 24 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "p-cp-1", position: [-9, 0, 13] },
    { id: "p-cp-2", position: [18, 0, 9] },
    { id: "p-cp-3", position: [-14, 1.4, 2] },
    { id: "p-cp-4", position: [15, 2.8, 0] },
    { id: "p-cp-5", position: [0, 4.4, -11.5] },
  ],
  finish: [0, 6.4, -20],
  // Ordered shore → west → east → mid → summit; verify-world.mjs relies on
  // this order to route the traversal check through each pad in turn.
  jumpPads: [
    // Boost from shore to west platform (1.4 gap; needs ~7.9 to clear)
    { id: "p-pad-west", position: [-12, 0, 10], radius: 2.5, boost: 12 },
    // Boost from shore to east platform (2.8 gap; needs ~11.1 to clear)
    { id: "p-pad-east", position: [11, 0, 10], radius: 2.5, boost: 13 },
    // Boost from west platform to mid stage (3.0 gap; needs ~11.5 to clear)
    { id: "p-pad-west-mid", position: [-12, 1.4, -8], radius: 2, boost: 14 },
    // Boost from east platform to mid stage (1.6 gap; needs ~8.4 to clear)
    { id: "p-pad-east-mid", position: [11, 2.8, -4], radius: 2, boost: 11 },
    // Boost from mid stage to summit (2.0 gap; needs ~9.4 to clear)
    { id: "p-pad-summit", position: [0, 4.4, -15], radius: 2, boost: 12 },
  ],
  skyColor: "#ffd6ec",
  fogColor: "#ffe8f5",
  waterColor: "#7fc8ff",
  waterLevel: -2.2,
  killPlane: -12,
};
