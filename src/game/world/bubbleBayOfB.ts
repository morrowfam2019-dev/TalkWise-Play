import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * BUBBLE BAY OF B — the third sound, proving the pipeline scales past two.
 *
 * Same flat-base-plus-jump-pads shape as Mountain of M and Party Plaza of P
 * (all five checkpoints, coins, and the finish sit on the base level so a
 * child can walk the whole route with no precision jumping; the elevated
 * platforms are optional detours reached by jump pad). Only the palette and
 * theming are new — the shore/platform/pad geometry is copied from Party
 * Plaza of P, whose jump-pad boosts are already verified to clear their
 * gaps, so nothing here needed re-tuning.
 */

const SAND = "#f5e2b8";
const SAND_HIGH = "#ffe9c2";
const DOCK = "#8bd4e0";
const DOCK_DARK = "#5fb8c9";
const SUMMIT_STONE = "#d6f6ff";

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

const solids: Solid[] = [
  // Base beach.
  slab(-26, 26, -24, 24, 0, -9, DOCK, SAND),

  // West dock (elevated).
  slab(-20, -4, -10, 7, 1.4, -1, DOCK, SAND),

  // East dock (elevated higher).
  slab(4, 20, -6, 5.6, 2.8, -1, DOCK, SAND),

  // Mid boardwalk (highest of the lower tiers).
  slab(-9, 9, -17, -7, 4.4, -1, DOCK_DARK, SAND_HIGH),

  // Walkable ramps up to the mid boardwalk. Footprints stop exactly at the
  // lower platforms' edges (z=-10 and z=-6) rather than overlapping them.
  slab(-20, -9, -17, -10, 4.4, -1, DOCK_DARK, SAND_HIGH),
  slab(4, 14, -17, -6, 4.4, -1, DOCK_DARK, SAND_HIGH),

  // Summit — the B Lighthouse platform.
  slab(-5, 5, -22, -15.3, 6.4, -1, DOCK, SUMMIT_STONE),
];

const decorations: Decoration[] = [
  // Shoreline trees, reused kinds — the world is only distinguished by
  // color and layout, same as Party Plaza of P.
  { id: "bt1", kind: "tree", position: [-23, 0, 20], scale: 1.05 },
  { id: "bt2", kind: "pine", position: [-18, 0, 15.5], scale: 0.95 },
  { id: "bt3", kind: "tree", position: [-10, 0, 19.5], scale: 0.9 },
  { id: "bt4", kind: "pine", position: [2.5, 0, 20.5], scale: 1.1 },
  { id: "bt5", kind: "tree", position: [11, 0, 19], scale: 1 },
  { id: "bt6", kind: "pine", position: [22, 0, 17.5], scale: 1 },
  { id: "bt7", kind: "tree", position: [24, 0, 6], scale: 0.9 },
  { id: "bt8", kind: "pine", position: [-24, 0, -2], scale: 1.05 },
  { id: "bt9", kind: "tree", position: [-23, 0, -14], scale: 0.95 },
  { id: "bt10", kind: "pine", position: [-15, 0, -18.5], scale: 1.15 },
  { id: "bt11", kind: "tree", position: [-11, 0, -21], scale: 0.85 },
  { id: "bt12", kind: "pine", position: [14, 0, -16], scale: 1.05 },
  { id: "bt13", kind: "tree", position: [20.5, 0, -10], scale: 0.95 },
  { id: "bt14", kind: "pine", position: [22, 0, -20], scale: 1.1 },

  // Trees on the docks.
  { id: "bt15", kind: "pine", position: [-18, 1.4, -7.5], scale: 0.9 },
  { id: "bt16", kind: "tree", position: [-6.5, 1.4, 5], scale: 0.8 },
  { id: "bt17", kind: "pine", position: [17.5, 2.8, -4.5], scale: 0.85 },
  { id: "bt18", kind: "tree", position: [5.5, 2.8, 4], scale: 0.75 },
  { id: "bt19", kind: "pine", position: [-7.5, 4.4, -15.5], scale: 0.85 },
  { id: "bt20", kind: "pine", position: [7.5, 4.4, -15], scale: 0.8 },

  // Rocks.
  { id: "br1", kind: "rock", position: [-20, 0, 11], scale: 1.05 },
  { id: "br2", kind: "rock", position: [7, 0, 8.5], scale: 0.75 },
  { id: "br3", kind: "rock", position: [18, 0, -14], scale: 1.25 },
  { id: "br4", kind: "rock", position: [-21, 0, -19], scale: 0.95 },
  { id: "br5", kind: "rock", position: [-12, 1.4, 3], scale: 0.65 },
  { id: "br6", kind: "rock", position: [16, 2.8, 3], scale: 0.7 },

  // Bubble-blue flowers — a bay palette instead of M's meadow or P's party
  // colors.
  { id: "bf1", kind: "flower", position: [-5, 0, 15], scale: 1, color: "#5ecbe8" },
  { id: "bf2", kind: "flower", position: [4, 0, 17], scale: 1, color: "#8fe3f0" },
  { id: "bf3", kind: "flower", position: [-16, 0, 19], scale: 1, color: "#bff2ff" },
  { id: "bf4", kind: "flower", position: [14, 0, 10], scale: 1, color: "#5ecbe8" },
  { id: "bf5", kind: "flower", position: [-19, 1.4, 0], scale: 1, color: "#8fe3f0" },
  { id: "bf6", kind: "flower", position: [12, 2.8, 1], scale: 1, color: "#bff2ff" },

  // Aqua crystals marking the summit approach.
  { id: "bc1", kind: "crystal", position: [-3.6, 5.2, -13], scale: 1 },
  { id: "bc2", kind: "crystal", position: [3.6, 5.2, -13], scale: 1 },
  { id: "bc3", kind: "crystal", position: [-3.8, 7.2, -20.5], scale: 1.2 },
  { id: "bc4", kind: "crystal", position: [3.8, 7.2, -20.5], scale: 1.2 },

  // Clouds.
  { id: "bcl1", kind: "cloud", position: [-18, 14, 6], scale: 2.4 },
  { id: "bcl2", kind: "cloud", position: [16, 16, -6], scale: 3 },
  { id: "bcl3", kind: "cloud", position: [-8, 18, -22], scale: 2.6 },
  { id: "bcl4", kind: "cloud", position: [24, 13, 14], scale: 2.2 },
  { id: "bcl5", kind: "cloud", position: [0, 20, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  { id: "b-coin-1", position: [-24, 1, 20], value: 2 },
  { id: "b-coin-2", position: [0, 1, 20], value: 2 },
  { id: "b-coin-3", position: [24, 1, 18], value: 2 },
  { id: "b-coin-4", position: [-25, 1, 10], value: 2 },
  { id: "b-coin-5", position: [-2, 1, 22], value: 2 },
  { id: "b-coin-6", position: [2, 1, 22], value: 2 },
  { id: "b-coin-7", position: [-25, 1, 5], value: 2 },
  { id: "b-coin-8", position: [25, 1, 0], value: 2 },
  { id: "b-coin-9", position: [-22, 1, -15], value: 2 },
  { id: "b-coin-10", position: [20, 1, -18], value: 2 },
  { id: "b-coin-11", position: [-22, 1, -12], value: 2 },
  { id: "b-coin-12", position: [20, 1, -10], value: 2 },
];

export const bubbleBayOfB: WorldDefinition = {
  id: "bubble-bay-of-b",
  name: "Bubble Bay of B",
  spawn: [0, 0, 16],
  spawnYaw: 0,
  bounds: { minX: -26, maxX: 26, minZ: -24, maxZ: 24 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "b-cp-1", position: [-9, 0, 13] },
    { id: "b-cp-2", position: [18, 0, 9] },
    { id: "b-cp-3", position: [-14, 1.4, 2] },
    { id: "b-cp-4", position: [15, 2.8, 0] },
    { id: "b-cp-5", position: [0, 4.4, -11.5] },
  ],
  finish: [0, 6.4, -20],
  // Ordered shore → west → east → mid → summit; verify-world.mjs relies on
  // this order to route the traversal check through each pad in turn.
  jumpPads: [
    // Boost from shore to west dock (1.4 gap; needs ~7.9 to clear)
    { id: "b-pad-west", position: [-12, 0, 10], radius: 2.5, boost: 12 },
    // Boost from shore to east dock (2.8 gap; needs ~11.1 to clear)
    { id: "b-pad-east", position: [11, 0, 10], radius: 2.5, boost: 13 },
    // Boost from west dock to mid boardwalk (3.0 gap; needs ~11.5 to clear)
    { id: "b-pad-west-mid", position: [-12, 1.4, -8], radius: 2, boost: 14 },
    // Boost from east dock to mid boardwalk (1.6 gap; needs ~8.4 to clear)
    { id: "b-pad-east-mid", position: [11, 2.8, -4], radius: 2, boost: 11 },
    // Boost from mid boardwalk to summit (2.0 gap; needs ~9.4 to clear)
    { id: "b-pad-summit", position: [0, 4.4, -15], radius: 2, boost: 12 },
  ],
  skyColor: "#bdeeff",
  fogColor: "#d6f6ff",
  waterColor: "#3fa8d9",
  waterLevel: -2.2,
  killPlane: -12,
};
