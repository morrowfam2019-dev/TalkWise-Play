import type {
  Collectible,
  Decoration,
  Solid,
  WorldDefinition,
} from "./types";

/**
 * PARTY PLAZA OF P — a hub and four stalls. Action: SLIDE.
 *
 * Nothing here is climbed. A round central stage sits low enough to step
 * straight onto, and the four stalls ring it at the compass points, each
 * walled off with one entrance under a banner. The banners hang at 0.9 —
 * above a sliding player, below a standing one — so the only way into a
 * stall is to duck under it. No part of this world asks for a jump.
 *
 * The stalls are deliberately reachable in any order: this is a plaza you
 * circle, not a summit you climb, and choosing a route is the skill it
 * teaches instead.
 */

const PLAZA = "#e0a8c9";
const PLAZA_TOP = "#ffd6ec";
const STAGE = "#c98fd0";
const STAGE_TOP = "#f4e3f6";
const STALL = "#ab97d4";
const STALL_TOP = "#d8c8f0";
const BANNER = "#ff6f91";
const BANNER_TOP = "#ffa8bd";

/** Underside of every banner. A standing player is 1.5 tall; a sliding one
 * is 0.62 — this number is the whole reason the slide exists. */
const BANNER_CLEARANCE = 0.9;
const BANNER_TOP_Y = 2.6;

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

/** One walled stall with a banner across its mouth, built along an axis. */
function stall(
  side: "south" | "east" | "north" | "west",
): Solid[] {
  const wall = (a: number, b: number, c: number, d: number) =>
    slab(a, b, c, d, BANNER_TOP_Y, -1, STALL, STALL_TOP);
  const banner = (a: number, b: number, c: number, d: number) =>
    slab(a, b, c, d, BANNER_TOP_Y, BANNER_CLEARANCE, BANNER, BANNER_TOP);

  switch (side) {
    case "south":
      return [
        wall(-7, -4, 12, 22),
        wall(4, 7, 12, 22),
        wall(-7, 7, 22, 25),
        banner(-4, 4, 12, 14),
      ];
    case "north":
      return [
        wall(-7, -4, -22, -12),
        wall(4, 7, -22, -12),
        wall(-7, 7, -25, -22),
        banner(-4, 4, -14, -12),
      ];
    case "east":
      return [
        wall(12, 22, -7, -4),
        wall(12, 22, 4, 7),
        wall(22, 25, -7, 7),
        banner(12, 14, -4, 4),
      ];
    case "west":
      return [
        wall(-22, -12, -7, -4),
        wall(-22, -12, 4, 7),
        wall(-25, -22, -7, 7),
        banner(-14, -12, -4, 4),
      ];
  }
}

const STAGE_TOP_Y = 0.7; // Under the 0.75 auto-step, so it costs no jump.

const solids: Solid[] = [
  slab(-26, 26, -26, 26, 0, -9, PLAZA, PLAZA_TOP),
  slab(-6, 6, -6, 6, STAGE_TOP_Y, -1, STAGE, STAGE_TOP),
  ...stall("south"),
  ...stall("east"),
  ...stall("north"),
  ...stall("west"),
];

const decorations: Decoration[] = [
  // Corner groves, kept out of the four approach lanes.
  { id: "pt1", kind: "tree", position: [-20, 0, 20], scale: 1.05 },
  { id: "pt2", kind: "pine", position: [-14, 0, 18], scale: 0.95 },
  { id: "pt3", kind: "tree", position: [18, 0, 18], scale: 0.9 },
  { id: "pt4", kind: "pine", position: [14, 0, 20], scale: 1.1 },
  { id: "pt5", kind: "tree", position: [18, 0, -18], scale: 1 },
  { id: "pt6", kind: "pine", position: [14, 0, -20], scale: 1 },
  { id: "pt7", kind: "tree", position: [-18, 0, -18], scale: 0.9 },
  { id: "pt8", kind: "pine", position: [-20, 0, -14], scale: 1.05 },
  { id: "pt9", kind: "pine", position: [-24, 0, 2], scale: 0.9 },
  { id: "pt10", kind: "pine", position: [24, 0, -2], scale: 0.9 },

  // Balloon-bright flowers lining the four lanes into the stalls.
  { id: "pf1", kind: "flower", position: [-6, 0, 10], scale: 1, color: "#ff6f91" },
  { id: "pf2", kind: "flower", position: [6, 0, 10], scale: 1, color: "#ffb347" },
  { id: "pf3", kind: "flower", position: [10, 0, -6], scale: 1, color: "#7fd8ff" },
  { id: "pf4", kind: "flower", position: [10, 0, 6], scale: 1, color: "#ff6f91" },
  { id: "pf5", kind: "flower", position: [-6, 0, -10], scale: 1, color: "#ffb347" },
  { id: "pf6", kind: "flower", position: [6, 0, -10], scale: 1, color: "#7fd8ff" },
  { id: "pf7", kind: "flower", position: [-10, 0, 6], scale: 1, color: "#ff6f91" },
  { id: "pf8", kind: "flower", position: [-10, 0, -6], scale: 1, color: "#ffb347" },

  // Crystals flanking every banner, marking where to duck.
  { id: "pc1", kind: "crystal", position: [-5, 0, 13], scale: 0.85 },
  { id: "pc2", kind: "crystal", position: [5, 0, 13], scale: 0.85 },
  { id: "pc3", kind: "crystal", position: [13, 0, -5], scale: 0.85 },
  { id: "pc4", kind: "crystal", position: [13, 0, 5], scale: 0.85 },
  { id: "pc5", kind: "crystal", position: [-5, 0, -13], scale: 0.85 },
  { id: "pc6", kind: "crystal", position: [5, 0, -13], scale: 0.85 },
  { id: "pc7", kind: "crystal", position: [-13, 0, -5], scale: 0.85 },
  { id: "pc8", kind: "crystal", position: [-13, 0, 5], scale: 0.85 },

  // Stage dressing.
  { id: "pr1", kind: "rock", position: [-4.5, STAGE_TOP_Y, 4.5], scale: 0.6 },
  { id: "pr2", kind: "rock", position: [4.5, STAGE_TOP_Y, -4.5], scale: 0.6 },

  { id: "pcl1", kind: "cloud", position: [-18, 14, 6], scale: 2.4 },
  { id: "pcl2", kind: "cloud", position: [16, 16, -6], scale: 3 },
  { id: "pcl3", kind: "cloud", position: [-8, 18, -22], scale: 2.6 },
  { id: "pcl4", kind: "cloud", position: [24, 13, 14], scale: 2.2 },
  { id: "pcl5", kind: "cloud", position: [0, 20, 20], scale: 2.8 },
];

const collectibles: Collectible[] = [
  // A ring of coins around the stage, plus a pair inside each stall as the
  // reward for sliding in.
  { id: "p-coin-1", position: [-9, 1, 9], value: 2 },
  { id: "p-coin-2", position: [9, 1, 9], value: 2 },
  { id: "p-coin-3", position: [9, 1, -9], value: 2 },
  { id: "p-coin-4", position: [-9, 1, -9], value: 2 },
  { id: "p-coin-5", position: [0, 1, 16.5], value: 2 },
  { id: "p-coin-6", position: [0, 1, 20], value: 2 },
  { id: "p-coin-7", position: [16.5, 1, 0], value: 2 },
  { id: "p-coin-8", position: [20, 1, 0], value: 2 },
  { id: "p-coin-9", position: [0, 1, -16.5], value: 2 },
  { id: "p-coin-10", position: [0, 1, -20], value: 2 },
  { id: "p-coin-11", position: [-16.5, 1, 0], value: 2 },
  { id: "p-coin-12", position: [-20, 1, 0], value: 2 },
];

export const partyPlazaOfP: WorldDefinition = {
  id: "party-plaza-of-p",
  name: "Party Plaza of P",
  // Off in a corner of the plaza, clear of the stage and all four stalls —
  // spawning next to a checkpoint puts its word-label in the child's face
  // before they have seen the world at all.
  spawn: [-14, 0, 14],
  spawnYaw: -Math.PI / 4,
  action: "slide",
  bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
  solids,
  decorations,
  collectibles,
  checkpoints: [
    { id: "p-cp-1", position: [0, 0, 18] },
    { id: "p-cp-2", position: [18, 0, 0] },
    { id: "p-cp-3", position: [0, 0, -18] },
    { id: "p-cp-4", position: [-18, 0, 0] },
    { id: "p-cp-5", position: [0, STAGE_TOP_Y, 3] },
  ],
  finish: [0, STAGE_TOP_Y, -3],
  // Each stall is entered head-on so the run at the banner is straight —
  // a slide taken at an angle can clip a side wall instead of the gap.
  verifyRoute: [
    { name: "into the plaza", target: [-6, 0, 11] },
    { name: "south mouth", target: [0, 0, 11] },
    { name: "CP1 p-cp-1", target: [0, 0, 18] },
    { name: "back to plaza", target: [0, 0, 10] },
    { name: "east mouth", target: [11, 0, 0] },
    { name: "CP2 p-cp-2", target: [18, 0, 0] },
    { name: "plaza again", target: [10, 0, 0] },
    { name: "north mouth", target: [0, 0, -11] },
    { name: "CP3 p-cp-3", target: [0, 0, -18] },
    { name: "plaza once more", target: [0, 0, -10] },
    { name: "west mouth", target: [-11, 0, 0] },
    { name: "CP4 p-cp-4", target: [-18, 0, 0] },
    { name: "CP5 p-cp-5", target: [0, STAGE_TOP_Y, 3] },
  ],
  skyColor: "#ffd6ec",
  fogColor: "#ffe8f5",
  waterColor: "#7fc8ff",
  waterLevel: -2.2,
  killPlane: -12,
};
