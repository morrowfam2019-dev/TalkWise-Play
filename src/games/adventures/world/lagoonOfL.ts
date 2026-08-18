import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * LAGOON OF L — a ring you walk all the way around. Action: SLIDE.
 *
 * A square corridor circles a lagoon mound too tall to climb, and six stone
 * arches cut that ring into six stretches. Every arch hangs at 0.9, so the
 * only way past one is underneath it. Where Party Plaza sends you out and
 * back along spokes, this is a single closed loop: you leave the start, go
 * all the way round, and arrive back where you began.
 *
 * The mound in the middle is deliberately unclimbable — a walkable one would
 * let a player cut across the centre and skip every arch on the ring.
 */

const SHORE = "#c8b88a";
const SHORE_TOP = "#e6d9ac";
const HEDGE = "#3f8f7a";
const HEDGE_TOP = "#6fc4a8";
const ARCH = "#8a7fb5";
const ARCH_TOP = "#b3a8d8";
const MOUND = "#4fa8c9";
const MOUND_TOP = "#8fe0f0";

/** Underside of every arch: above a sliding player, below a standing one. */
const ARCH_CLEARANCE = 0.9;
const ARCH_TOP_Y = 2.8;

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
    id: `l-solid-${solidSeq}`,
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

const wall = (a: number, b: number, c: number, d: number) =>
  slab(a, b, c, d, ARCH_TOP_Y, -1, HEDGE, HEDGE_TOP);
const arch = (a: number, b: number, c: number, d: number) =>
  slab(a, b, c, d, ARCH_TOP_Y, ARCH_CLEARANCE, ARCH, ARCH_TOP);

const solids: Solid[] = [
  slab(-26, 26, -26, 26, 0, -9, SHORE, SHORE_TOP),

  // The lagoon mound: 3.2 tall, so there is no way over it.
  slab(-8, 8, -8, 8, 3.2, -1, MOUND, MOUND_TOP),

  // Outer hedge, closing the ring.
  wall(-22, 22, 18, 22),
  wall(-22, 22, -22, -18),
  wall(18, 22, -22, 22),
  wall(-22, -18, -22, 22),

  // Six arches, cutting the ring into six stretches.
  arch(-9.7, -8.3, 8, 18), // south-west
  arch(8.3, 9.7, 8, 18), // south-east
  arch(8, 18, -0.7, 0.7), // east
  arch(8.3, 9.7, -18, -8), // north-east
  arch(-9.7, -8.3, -18, -8), // north-west
  arch(-18, -8, -0.7, 0.7), // west
];

const decorations: Decoration[] = [
  // Reeds and palms on the lagoon mound, seen across the water the whole way.
  { id: "lt1", kind: "pine", position: [-4, 3.2, 4], scale: 1.1 },
  { id: "lt2", kind: "tree", position: [4, 3.2, -3], scale: 1.2 },
  { id: "lt3", kind: "pine", position: [3, 3.2, 5], scale: 0.9 },
  { id: "lt4", kind: "tree", position: [-5, 3.2, -5], scale: 1 },

  // Corner planting inside the ring.
  { id: "lt5", kind: "pine", position: [-16, 0, 16], scale: 1 },
  { id: "lt6", kind: "tree", position: [16, 0, 16], scale: 0.95 },
  { id: "lt7", kind: "pine", position: [16, 0, -16], scale: 1.05 },
  { id: "lt8", kind: "tree", position: [-16, 0, -16], scale: 0.9 },

  { id: "lr1", kind: "rock", position: [-15, 0, 11], scale: 0.9 },
  { id: "lr2", kind: "rock", position: [15, 0, -11], scale: 0.85 },
  { id: "lr3", kind: "rock", position: [11, 0, 15], scale: 0.75 },
  { id: "lr4", kind: "rock", position: [-11, 0, -15], scale: 0.8 },

  { id: "lf1", kind: "flower", position: [-6, 0, 11], scale: 1, color: "#ffd76a" },
  { id: "lf2", kind: "flower", position: [6, 0, 11], scale: 1, color: "#ff9ec4" },
  { id: "lf3", kind: "flower", position: [11, 0, -6], scale: 1, color: "#c7a6ff" },
  { id: "lf4", kind: "flower", position: [-11, 0, 6], scale: 1, color: "#ffd76a" },

  // A lantern each side of every arch, marking where to duck.
  { id: "lc1", kind: "crystal", position: [-9, 0, 7.2], scale: 0.8, color: "#ffe9a8" },
  { id: "lc2", kind: "crystal", position: [-9, 0, 18.8], scale: 0.8, color: "#ffe9a8" },
  { id: "lc3", kind: "crystal", position: [9, 0, 7.2], scale: 0.8, color: "#ffe9a8" },
  { id: "lc4", kind: "crystal", position: [9, 0, 18.8], scale: 0.8, color: "#ffe9a8" },
  { id: "lc5", kind: "crystal", position: [7.2, 0, 0], scale: 0.8, color: "#ffe9a8" },
  { id: "lc6", kind: "crystal", position: [18.8, 0, 0], scale: 0.8, color: "#ffe9a8" },
  { id: "lc7", kind: "crystal", position: [9, 0, -7.2], scale: 0.8, color: "#ffe9a8" },
  { id: "lc8", kind: "crystal", position: [-9, 0, -7.2], scale: 0.8, color: "#ffe9a8" },
  { id: "lc9", kind: "crystal", position: [-7.2, 0, 0], scale: 0.8, color: "#ffe9a8" },
  { id: "lc10", kind: "crystal", position: [-18.8, 0, 0], scale: 0.8, color: "#ffe9a8" },

  { id: "lcl1", kind: "cloud", position: [-16, 14, 8], scale: 2.4 },
  { id: "lcl2", kind: "cloud", position: [18, 16, -8], scale: 2.8 },
  { id: "lcl3", kind: "cloud", position: [0, 19, -20], scale: 2.5 },
  { id: "lcl4", kind: "cloud", position: [4, 15, 21], scale: 2.2 },
];

const collectibles: Collectible[] = [
  { id: "l-coin-1", position: [-4, 1, 13], value: 2 },
  { id: "l-coin-2", position: [4, 1, 13], value: 2 },
  { id: "l-coin-3", position: [16, 1, 13], value: 2 },
  { id: "l-coin-4", position: [13, 1, 4], value: 2 },
  { id: "l-coin-5", position: [13, 1, -4], value: 2 },
  { id: "l-coin-6", position: [16, 1, -13], value: 2 },
  { id: "l-coin-7", position: [4, 1, -13], value: 2 },
  { id: "l-coin-8", position: [-4, 1, -13], value: 2 },
  { id: "l-coin-9", position: [-16, 1, -13], value: 2 },
  { id: "l-coin-10", position: [-13, 1, -4], value: 2 },
  { id: "l-coin-11", position: [-13, 1, 4], value: 2 },
  { id: "l-coin-12", position: [-16, 1, 13], value: 2 },
];

export const lagoonOfL: WorldDefinition = {
  id: "lagoon-of-l",
  name: "Lagoon of L",
  spawn: [-13, 0, 13],
  spawnYaw: -Math.PI / 2,
  action: "slide",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "l-cp-1", position: [0, 0, 13] },
    { id: "l-cp-2", position: [13, 0, 13] },
    { id: "l-cp-3", position: [13, 0, -13] },
    { id: "l-cp-4", position: [0, 0, -13] },
    { id: "l-cp-5", position: [-13, 0, -13] },
  ],
  finish: [-16, 0, 16],
  // One lap, taking each arch square-on down the middle of its corridor.
  verifyRoute: [
    { name: "arch 1", target: [-9, 0, 13] },
    { name: "CP1 l-cp-1", target: [0, 0, 13] },
    { name: "arch 2", target: [9, 0, 13] },
    { name: "CP2 l-cp-2", target: [13, 0, 13] },
    { name: "arch 3", target: [13, 0, 0] },
    { name: "CP3 l-cp-3", target: [13, 0, -13] },
    { name: "arch 4", target: [9, 0, -13] },
    { name: "CP4 l-cp-4", target: [0, 0, -13] },
    { name: "arch 5", target: [-9, 0, -13] },
    { name: "CP5 l-cp-5", target: [-13, 0, -13] },
    { name: "arch 6", target: [-13, 0, 0] },
  ],
  skyColor: "#a8e6d8",
  fogColor: "#d2f2e8",
  waterColor: "#2f9ab8",
  waterLevel: -2.2,
  killPlane: -12,
};
