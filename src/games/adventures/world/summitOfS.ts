import type { Collectible, Decoration, Solid, WorldDefinition } from "./types";

/**
 * SUMMIT OF S — a switchback ridge. Action: JUMP.
 *
 * Five wide terraces stacked south to north, each a full 1.9 above the one
 * below — too tall to jump. The only way up each is a single mid-height
 * stair block parked at one end, and those ends alternate west, east, west,
 * east, so the climb doubles back on itself like a mountain road. Where
 * Mountain of M circles a peak, this one zigzags up a ridge.
 *
 * Each hop is the usual 0.95: over the 0.75 auto-step, under the ~1.31 a
 * jump clears. Terraces run the full width, so overshooting an edge drops
 * the player onto the tier below rather than off the world.
 */

const STONE = "#b6a99a";
const STONE_TOP = "#ddd2c2";
const SCREE = "#8f8375";
const SNOW = "#f2f6fb";
const LEDGE = "#9c8d7c";

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
    id: `s-solid-${solidSeq}`,
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

const T1 = RISE * 1;
const SA = RISE * 2;
const T2 = RISE * 3;
const SB = RISE * 4;
const T3 = RISE * 5;
const SC = RISE * 6;
const T4 = RISE * 7;
const SD = RISE * 8;
const PEAK = RISE * 9;

const solids: Solid[] = [
  // Valley floor, full footprint — a missed jump is never a fall out.
  slab(-26, 26, -26, 26, 0, -9, SCREE, STONE_TOP),

  slab(-20, 20, 12, 20, T1, -1, STONE, STONE_TOP),
  slab(-20, -14, 10, 14, SA, -1, LEDGE, SNOW), // west switchback
  slab(-20, 20, 4, 12, T2, -1, STONE, STONE_TOP),
  slab(14, 20, 2, 6, SB, -1, LEDGE, SNOW), // east switchback
  slab(-20, 20, -4, 4, T3, -1, STONE, STONE_TOP),
  slab(-20, -14, -6, -2, SC, -1, LEDGE, SNOW), // west switchback
  slab(-20, 20, -12, -4, T4, -1, STONE, SNOW),
  slab(14, 20, -14, -10, SD, -1, LEDGE, SNOW), // east switchback
  slab(-20, 20, -22, -12, PEAK, -1, STONE, SNOW),
];

const decorations: Decoration[] = [
  // Treeline thins out as the ridge rises — pines low, bare rock up top.
  { id: "st1", kind: "pine", position: [-23, 0, 22], scale: 1.15 },
  { id: "st2", kind: "pine", position: [-14, 0, 23], scale: 1 },
  { id: "st3", kind: "tree", position: [6, 0, 23.5], scale: 0.95 },
  { id: "st4", kind: "pine", position: [18, 0, 22], scale: 1.1 },
  { id: "st5", kind: "pine", position: [23, 0, 10], scale: 0.95 },
  { id: "st6", kind: "pine", position: [-23, 0, 6], scale: 1 },
  { id: "st7", kind: "pine", position: [-16, T1, 17], scale: 0.9 },
  { id: "st8", kind: "tree", position: [10, T1, 15], scale: 0.85 },
  { id: "st9", kind: "pine", position: [-8, T2, 9], scale: 0.8 },
  { id: "st10", kind: "pine", position: [8, T3, 1], scale: 0.75 },

  { id: "sr1", kind: "rock", position: [-22, 0, -4], scale: 1.2 },
  { id: "sr2", kind: "rock", position: [22, 0, -16], scale: 1.05 },
  { id: "sr3", kind: "rock", position: [-10, T1, 14], scale: 0.85 },
  { id: "sr4", kind: "rock", position: [10, T2, 6], scale: 0.8 },
  { id: "sr5", kind: "rock", position: [-11, T3, -2], scale: 0.75 },
  { id: "sr6", kind: "rock", position: [11, T4, -10], scale: 0.8 },
  { id: "sr7", kind: "rock", position: [-14, PEAK, -19], scale: 0.9 },

  {
    id: "sf1",
    kind: "flower",
    position: [-6, 0, 22],
    scale: 1,
    color: "#c7a6ff",
  },
  {
    id: "sf2",
    kind: "flower",
    position: [7, T1, 18],
    scale: 1,
    color: "#ffd76a",
  },
  {
    id: "sf3",
    kind: "flower",
    position: [-7, T2, 10],
    scale: 1,
    color: "#c7a6ff",
  },

  // Ice spires flanking every switchback, so the next turn is findable.
  {
    id: "sc1",
    kind: "crystal",
    position: [-17, T1, 15.4],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc2",
    kind: "crystal",
    position: [-12.4, T1, 13],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc3",
    kind: "crystal",
    position: [17, T2, 7.4],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc4",
    kind: "crystal",
    position: [12.4, T2, 5],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc5",
    kind: "crystal",
    position: [-17, T3, -0.6],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc6",
    kind: "crystal",
    position: [-12.4, T3, -3],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc7",
    kind: "crystal",
    position: [17, T4, -8.6],
    scale: 0.9,
    color: "#dff3ff",
  },
  {
    id: "sc8",
    kind: "crystal",
    position: [12.4, T4, -11],
    scale: 0.9,
    color: "#dff3ff",
  },

  { id: "scl1", kind: "cloud", position: [-18, 14, 8], scale: 2.6 },
  { id: "scl2", kind: "cloud", position: [17, 17, -4], scale: 3 },
  { id: "scl3", kind: "cloud", position: [-6, 20, -20], scale: 2.4 },
  { id: "scl4", kind: "cloud", position: [22, 12, 16], scale: 2.2 },
];

const collectibles: Collectible[] = [
  { id: "s-coin-1", position: [-6, 1, 23], value: 2 },
  { id: "s-coin-2", position: [6, 1, 23], value: 2 },
  { id: "s-coin-3", position: [-8, T1 + 1, 16], value: 2 },
  { id: "s-coin-4", position: [-14, T1 + 1, 17], value: 2 },
  { id: "s-coin-5", position: [8, T2 + 1, 8], value: 2 },
  { id: "s-coin-6", position: [14, T2 + 1, 9], value: 2 },
  { id: "s-coin-7", position: [-8, T3 + 1, 0], value: 2 },
  { id: "s-coin-8", position: [-14, T3 + 1, 1], value: 2 },
  { id: "s-coin-9", position: [8, T4 + 1, -8], value: 2 },
  { id: "s-coin-10", position: [14, T4 + 1, -7], value: 2 },
  { id: "s-coin-11", position: [-4, PEAK + 1, -16], value: 2 },
  { id: "s-coin-12", position: [4, PEAK + 1, -16], value: 2 },
];

export const summitOfS: WorldDefinition = {
  id: "summit-of-s",
  name: "Summit of S",
  spawn: [0, 0, 24],
  spawnYaw: 0,
  action: "jump",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "s-cp-1", position: [0, T1, 16] },
    { id: "s-cp-2", position: [0, T2, 8] },
    { id: "s-cp-3", position: [0, T3, 0] },
    { id: "s-cp-4", position: [0, T4, -8] },
    { id: "s-cp-5", position: [-8, PEAK, -17] },
  ],
  finish: [8, PEAK, -19],
  // Every switchback waypoint stands on the stair block itself, at the one
  // end where it isn't buried under the terrace above it.
  verifyRoute: [
    { name: "CP1 s-cp-1", target: [0, T1, 16] },
    { name: "west switchback", target: [-17, SA, 13] },
    { name: "CP2 s-cp-2", target: [0, T2, 8] },
    { name: "east switchback", target: [17, SB, 5] },
    { name: "CP3 s-cp-3", target: [0, T3, 0] },
    { name: "west switchback 2", target: [-17, SC, -3] },
    { name: "CP4 s-cp-4", target: [0, T4, -8] },
    { name: "east switchback 2", target: [17, SD, -11] },
    { name: "CP5 s-cp-5", target: [-8, PEAK, -17] },
  ],
  skyColor: "#cfe3f5",
  fogColor: "#e6eff8",
  waterColor: "#5f86b0",
  waterLevel: -2.2,
  killPlane: -12,
};
