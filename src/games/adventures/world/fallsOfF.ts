import type { Collectible, Decoration, Solid, WorldDefinition } from "./types";

/**
 * FERN FALLS OF F — a spiral staircase of ledges. Action: JUMP.
 *
 * Eight small ledges ring a waterfall pillar, each one 0.95 above the last
 * and just barely touching its neighbour, so the whole world is one tight
 * corkscrew climb around a single landmark. Bubble Bay sprawls across a
 * lagoon; this is the opposite — everything happens within a few strides of
 * the centre, and the pillar is always in view as the thing you are climbing.
 *
 * The pool floor runs underneath at y=0, so a missed hop is a splash and a
 * short walk back to the first ledge, never a fall out of the world. One
 * rescue pad on that floor launches back up to the east ledge so a slip
 * near the top doesn't cost the whole spiral.
 */

const POOL = "#4fb3c9";
const SAND = "#e8dcb8";
const LEDGE = "#7fbf8f";
const LEDGE_TOP = "#a8e0b4";
const PILLAR = "#6fa8c9";
const PILLAR_TOP = "#d6f6ff";

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
    id: `f-solid-${solidSeq}`,
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

const L1 = RISE * 1;
const L2 = RISE * 2;
const L3 = RISE * 3;
const L4 = RISE * 4;
const L5 = RISE * 5;
const L6 = RISE * 6;
const L7 = RISE * 7;
const L8 = RISE * 8;
const TOP = RISE * 9;

const solids: Solid[] = [
  // Pool floor — the safety net under the entire spiral.
  slab(-26, 26, -26, 26, 0, -9, POOL, SAND),

  // Eight ledges corkscrewing around the falls, south → south-east → east …
  slab(-2.25, 2.25, 4.75, 9.25, L1, -1, LEDGE, LEDGE_TOP),
  slab(2.75, 7.25, 2.75, 7.25, L2, -1, LEDGE, LEDGE_TOP),
  slab(4.75, 9.25, -2.25, 2.25, L3, -1, LEDGE, LEDGE_TOP),
  slab(2.75, 7.25, -7.25, -2.75, L4, -1, LEDGE, LEDGE_TOP),
  slab(-2.25, 2.25, -9.25, -4.75, L5, -1, LEDGE, LEDGE_TOP),
  slab(-7.25, -2.75, -7.25, -2.75, L6, -1, LEDGE, LEDGE_TOP),
  slab(-9.25, -4.75, -2.25, 2.25, L7, -1, LEDGE, LEDGE_TOP),
  slab(-7.25, -2.75, 2.75, 7.25, L8, -1, LEDGE, LEDGE_TOP),

  // The falls themselves — the top is the finish.
  slab(-4, 4, -4, 4, TOP, -1, PILLAR, PILLAR_TOP),
];

const decorations: Decoration[] = [
  // Ferns and pines crowding the pool's edge.
  { id: "ft1", kind: "pine", position: [-20, 0, 18], scale: 1.2 },
  { id: "ft2", kind: "tree", position: [-13, 0, 21], scale: 1 },
  { id: "ft3", kind: "pine", position: [14, 0, 20], scale: 1.15 },
  { id: "ft4", kind: "tree", position: [21, 0, 13], scale: 0.95 },
  { id: "ft5", kind: "pine", position: [22, 0, -6], scale: 1.05 },
  { id: "ft6", kind: "tree", position: [16, 0, -18], scale: 1 },
  { id: "ft7", kind: "pine", position: [0, 0, -22], scale: 1.1 },
  { id: "ft8", kind: "tree", position: [-16, 0, -18], scale: 0.95 },
  { id: "ft9", kind: "pine", position: [-22, 0, -4], scale: 1.1 },
  { id: "ft10", kind: "pine", position: [-21, 0, 8], scale: 1 },

  { id: "fr1", kind: "rock", position: [-14, 0, 5], scale: 1.1 },
  { id: "fr2", kind: "rock", position: [14, 0, 8], scale: 0.9 },
  { id: "fr3", kind: "rock", position: [12, 0, -12], scale: 1.2 },
  { id: "fr4", kind: "rock", position: [-11, 0, -14], scale: 0.95 },
  { id: "fr5", kind: "rock", position: [0, 0, 13], scale: 0.8 },

  {
    id: "ff1",
    kind: "flower",
    position: [-8, 0, 12],
    scale: 1,
    color: "#ffd76a",
  },
  {
    id: "ff2",
    kind: "flower",
    position: [8, 0, 12],
    scale: 1,
    color: "#ff9ec4",
  },
  {
    id: "ff3",
    kind: "flower",
    position: [-16, 0, -8],
    scale: 1,
    color: "#c7a6ff",
  },
  {
    id: "ff4",
    kind: "flower",
    position: [16, 0, 2],
    scale: 1,
    color: "#ffd76a",
  },

  // Spray crystals at the pillar's foot.
  {
    id: "fc1",
    kind: "crystal",
    position: [0, 0, 11],
    scale: 0.9,
    color: "#bff2ff",
  },
  {
    id: "fc2",
    kind: "crystal",
    position: [-11, 0, 0],
    scale: 0.9,
    color: "#bff2ff",
  },
  {
    id: "fc3",
    kind: "crystal",
    position: [11, 0, 0],
    scale: 0.9,
    color: "#bff2ff",
  },
  {
    id: "fc4",
    kind: "crystal",
    position: [0, 0, -11],
    scale: 0.9,
    color: "#bff2ff",
  },

  { id: "fcl1", kind: "cloud", position: [-15, 15, 10], scale: 2.4 },
  { id: "fcl2", kind: "cloud", position: [16, 17, -8], scale: 2.8 },
  { id: "fcl3", kind: "cloud", position: [2, 20, -18], scale: 2.5 },
  { id: "fcl4", kind: "cloud", position: [-4, 14, 20], scale: 2.2 },
];

const collectibles: Collectible[] = [
  // A trail on the pool floor leading to the first ledge, then one on each
  // ledge the climb passes without a checkpoint.
  { id: "f-coin-1", position: [0, 1, 16], value: 2 },
  { id: "f-coin-2", position: [-5, 1, 13], value: 2 },
  { id: "f-coin-3", position: [5, 1, 13], value: 2 },
  { id: "f-coin-4", position: [5, L2 + 1, 5], value: 2 },
  { id: "f-coin-5", position: [5, L4 + 1, -5], value: 2 },
  { id: "f-coin-6", position: [-5, L6 + 1, -5], value: 2 },
  { id: "f-coin-7", position: [-5, L8 + 1, 5], value: 2 },
  { id: "f-coin-8", position: [-14, 1, 10], value: 2 },
  { id: "f-coin-9", position: [14, 1, -10], value: 2 },
  { id: "f-coin-10", position: [-14, 1, -10], value: 2 },
  { id: "f-coin-11", position: [14, 1, 10], value: 2 },
  { id: "f-coin-12", position: [0, 1, -15], value: 2 },
];

export const fallsOfF: WorldDefinition = {
  id: "fern-falls-of-f",
  name: "Fern Falls of F",
  spawn: [0, 0, 14],
  spawnYaw: 0,
  action: "jump",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "f-cp-1", position: [0, L1, 7] },
    { id: "f-cp-2", position: [7, L3, 0] },
    { id: "f-cp-3", position: [0, L5, -7] },
    { id: "f-cp-4", position: [-7, L7, 0] },
    { id: "f-cp-5", position: [2.2, TOP, 2.2] },
  ],
  finish: [-2.2, TOP, -2.2],
  // Boost tuned against the controller's real physics: run west off this pad
  // and it lands on the east ledge, a third of the way up the spiral.
  jumpPads: [
    {
      id: "f-pad-rescue",
      position: [13, 0, 0],
      radius: 1.8,
      boost: 12,
      aimYaw: Math.PI / 2,
    },
  ],
  // One waypoint per ledge, straight around the corkscrew.
  verifyRoute: [
    { name: "CP1 f-cp-1", target: [0, L1, 7] },
    { name: "ledge 2", target: [5, L2, 5] },
    { name: "CP2 f-cp-2", target: [7, L3, 0] },
    { name: "ledge 4", target: [5, L4, -5] },
    { name: "CP3 f-cp-3", target: [0, L5, -7] },
    { name: "ledge 6", target: [-5, L6, -5] },
    { name: "CP4 f-cp-4", target: [-7, L7, 0] },
    { name: "ledge 8", target: [-5, L8, 5] },
    { name: "CP5 f-cp-5", target: [2.2, TOP, 2.2] },
  ],
  skyColor: "#bfe8f0",
  fogColor: "#dcf2f6",
  waterColor: "#2f8fb0",
  waterLevel: -2.2,
  killPlane: -12,
};
