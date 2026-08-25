import type { Collectible, Decoration, Solid } from "../../world/types";
import type { ExplorerMap, RewardProp, SoundStationAnchor } from "./types";

/**
 * MAP 1 — SUNNY PARK PLAYGROUND. Sound group 1: the lip sounds /m/, /b/, /p/.
 *
 * A bright, flat, open park roughly four times the footprint of a word
 * adventure (104 × 104 units against 52 × 52), built so a four-year-old can
 * run in any direction and find something. Everything underfoot is either
 * flat or a 0.3 step the controller walks up on its own; the only places
 * that need the jump button are the picnic deck and the slide hill, and
 * neither has a station on it that a child could be locked out of.
 *
 * There are no pits, no hazards, and no water inside the play area — the
 * pond is a shallow splash slab, not a drop. Nothing in this map can end a
 * session.
 */

const GRASS = "#7fdc6f";
const GRASS_DARK = "#5fc45c";
const PATH = "#f0d9a8";
const PATH_EDGE = "#e0c48c";
const SAND = "#f7e2a8";
const COURT = "#f2a35e";
const DECK = "#c98a55";
const DECK_TOP = "#e0a86a";
const HILL = "#8fe07e";
const DIRT = "#c58a55";

const STEP = 0.3;
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
    id: `park-${solidSeq}`,
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
  // The park itself — one continuous field, so nothing here can drop anyone.
  slab(-52, 52, -52, 52, 0, -10, DIRT, GRASS),

  // Main paths: a north-south spine and an east-west crossing, laid a hair
  // above the grass so they read as paths from ground level.
  slab(-4, 4, -46, 46, 0.06, -1, PATH_EDGE, PATH),
  slab(-46, 46, -4, 4, 0.06, -1, PATH_EDGE, PATH),

  // Sandbox, west.
  slab(-40, -22, 0, 18, STEP, -1, SAND, SAND),

  // Ball court, east.
  slab(18, 40, -8, 14, STEP, -1, COURT, COURT),

  // Picnic deck, north-east — raised, with its own step up from the path.
  slab(14, 18, -26, -20, RISE / 2, -1, DECK, DECK_TOP),
  slab(16, 38, -36, -14, RISE, -1, DECK, DECK_TOP),

  // Slide hill, north — three terraces to climb, then a long grass run back
  // down. Purely for fun; there is no station up here to be gated behind it.
  slab(-30, -8, -46, -26, RISE, -1, HILL, GRASS_DARK),
  slab(-27, -11, -43, -29, RISE * 2, -1, HILL, GRASS_DARK),
  slab(-24, -14, -40, -32, RISE * 3, -1, HILL, GRASS_DARK),

  // Splash pad in the middle of the green — a shallow slab, not water.
  slab(-9, 9, 10, 26, 0.12, -1, "#9fe4f5", "#c7f0fb"),

  // Swing lawn, north-west, kept flat and generous.
  slab(-42, -18, -28, -8, 0.08, -1, GRASS_DARK, GRASS),
];

const decorations: Decoration[] = [
  // Boundary trees, all the way round, so the park has an edge you can see
  // before you reach the invisible one.
  { id: "bt1", kind: "tree", position: [-48, 0, 46], scale: 1.2 },
  { id: "bt2", kind: "tree", position: [-30, 0, 48], scale: 1.05 },
  { id: "bt3", kind: "pine", position: [-12, 0, 49], scale: 1.1 },
  { id: "bt4", kind: "tree", position: [14, 0, 48], scale: 1.15 },
  { id: "bt5", kind: "pine", position: [32, 0, 47], scale: 1 },
  { id: "bt6", kind: "tree", position: [48, 0, 44], scale: 1.2 },
  { id: "bt7", kind: "pine", position: [49, 0, 24], scale: 1.05 },
  { id: "bt8", kind: "tree", position: [48, 0, -6], scale: 1.1 },
  { id: "bt9", kind: "pine", position: [46, 0, -30], scale: 1.15 },
  { id: "bt10", kind: "tree", position: [40, 0, -46], scale: 1.05 },
  { id: "bt11", kind: "pine", position: [16, 0, -48], scale: 1.1 },
  { id: "bt12", kind: "tree", position: [-4, 0, -49], scale: 1.2 },
  { id: "bt13", kind: "pine", position: [-36, 0, -48], scale: 1 },
  { id: "bt14", kind: "tree", position: [-48, 0, -34], scale: 1.15 },
  { id: "bt15", kind: "pine", position: [-49, 0, -12], scale: 1.05 },
  { id: "bt16", kind: "tree", position: [-48, 0, 16], scale: 1.1 },

  // Swing lawn — a stand of shade trees behind the swings.
  { id: "sw1", kind: "tree", position: [-40, 0.08, -26], scale: 1.05 },
  { id: "sw2", kind: "tree", position: [-34, 0.08, -27], scale: 0.9 },
  { id: "sw3", kind: "pine", position: [-20, 0.08, -26], scale: 0.95 },

  // Sandbox rim.
  { id: "sb1", kind: "rock", position: [-41, STEP, 3], scale: 0.85 },
  { id: "sb2", kind: "rock", position: [-41, STEP, 15], scale: 0.7 },
  { id: "sb3", kind: "rock", position: [-21, STEP, 9], scale: 0.9 },
  { id: "sb4", kind: "flower", position: [-30, STEP, 20], scale: 1, color: "#ff6f91" },
  { id: "sb5", kind: "flower", position: [-36, STEP, 20], scale: 1, color: "#ffb347" },

  // Ball court corners.
  { id: "bc1", kind: "rock", position: [17, STEP, -7], scale: 0.7 },
  { id: "bc2", kind: "rock", position: [41, STEP, 13], scale: 0.75 },

  // Picnic deck plantings.
  { id: "pd1", kind: "tree", position: [35, RISE, -34], scale: 0.95 },
  { id: "pd2", kind: "flower", position: [20, RISE, -18], scale: 1, color: "#ff6f91" },
  { id: "pd3", kind: "flower", position: [33, RISE, -18], scale: 1, color: "#7fd8ff" },
  { id: "pd4", kind: "flower", position: [26, RISE, -34], scale: 1, color: "#ffb347" },

  // Slide hill.
  { id: "sh1", kind: "pine", position: [-31, RISE, -30], scale: 1 },
  { id: "sh2", kind: "pine", position: [-7, RISE, -40], scale: 1.05 },
  { id: "sh3", kind: "crystal", position: [-19, RISE * 3, -36], scale: 1, color: "#fff3c4" },

  // Splash pad.
  { id: "sp1", kind: "flower", position: [-11, 0, 18], scale: 1, color: "#7fd8ff" },
  { id: "sp2", kind: "flower", position: [11, 0, 18], scale: 1, color: "#7fd8ff" },

  // Meadow flowers scattered through the open grass.
  { id: "mf1", kind: "flower", position: [12, 0, 32], scale: 1, color: "#ff6f91" },
  { id: "mf2", kind: "flower", position: [-14, 0, 34], scale: 1, color: "#ffb347" },
  { id: "mf3", kind: "flower", position: [30, 0, 26], scale: 1, color: "#ffe066" },
  { id: "mf4", kind: "flower", position: [-30, 0, 34], scale: 1, color: "#c78bff" },
  { id: "mf5", kind: "flower", position: [8, 0, -18], scale: 1, color: "#ff6f91" },
  { id: "mf6", kind: "flower", position: [-8, 0, -14], scale: 1, color: "#ffe066" },

  // Clouds.
  { id: "cl1", kind: "cloud", position: [-24, 20, 20], scale: 3.2 },
  { id: "cl2", kind: "cloud", position: [26, 22, -14], scale: 3.6 },
  { id: "cl3", kind: "cloud", position: [0, 24, 40], scale: 3 },
  { id: "cl4", kind: "cloud", position: [-38, 18, -40], scale: 2.8 },
  { id: "cl5", kind: "cloud", position: [40, 21, 34], scale: 3.2 },
];

/** Coins line the paths between stations, so following them is also how a
 * child finds the next thing to talk to. */
const collectibles: Collectible[] = [
  { id: "pc-1", position: [0, 1, 38], value: 2 },
  { id: "pc-2", position: [0, 1, 30], value: 2 },
  { id: "pc-3", position: [0, 1, 22], value: 2 },
  { id: "pc-4", position: [-12, 1, 8], value: 2 },
  { id: "pc-5", position: [-22, 1.3, 8], value: 2 },
  { id: "pc-6", position: [-32, 1.3, 8], value: 2 },
  { id: "pc-7", position: [12, 1, 3], value: 2 },
  { id: "pc-8", position: [22, 1.3, 3], value: 2 },
  { id: "pc-9", position: [32, 1.3, 3], value: 2 },
  { id: "pc-10", position: [-16, 1.1, -12], value: 2 },
  { id: "pc-11", position: [-24, 1.1, -16], value: 2 },
  { id: "pc-12", position: [10, 1, -20], value: 2 },
  { id: "pc-13", position: [20, 1.9, -24], value: 3 },
  { id: "pc-14", position: [-20, 2.9, -30], value: 3 },
  { id: "pc-15", position: [-19, RISE * 3 + 1, -36], value: 5 },
  { id: "pc-16", position: [0, 1, 16], value: 2 },
  { id: "pc-17", position: [0, 1, -30], value: 2 },
  { id: "pc-18", position: [-40, 1, 30], value: 3 },
  { id: "pc-19", position: [40, 1, -40], value: 3 },
  { id: "pc-20", position: [42, 1, 30], value: 3 },
];

const stations: SoundStationAnchor[] = [
  {
    id: "park-swings",
    soundId: "m",
    position: [-28, 0.08, -18],
    place: "The Swings",
    activates: ["lantern-sw-1", "lantern-sw-2", "lantern-sw-3", "pinwheel-sw"],
  },
  {
    id: "park-court",
    soundId: "b",
    position: [29, STEP, 3],
    place: "The Ball Court",
    activates: ["starpost-bc-1", "starpost-bc-2", "starpost-bc-3", "fountain-green"],
  },
  {
    id: "park-picnic",
    soundId: "p",
    position: [27, RISE, -25],
    place: "The Picnic Deck",
    activates: [
      "balloon-pd-1",
      "balloon-pd-2",
      "balloon-pd-3",
      "balloon-pd-4",
      "archway-entry",
    ],
  },
];

const rewardProps: RewardProp[] = [
  // /m/ — the swing path lights up.
  { id: "lantern-sw-1", kind: "lantern", position: [-34, 0.08, -12], color: "#ffd76a" },
  { id: "lantern-sw-2", kind: "lantern", position: [-28, 0.08, -8], color: "#ffd76a" },
  { id: "lantern-sw-3", kind: "lantern", position: [-22, 0.08, -12], color: "#ffd76a" },
  { id: "pinwheel-sw", kind: "pinwheel", position: [-31, 0.08, -22], color: "#ff8fb1" },

  // /b/ — the court floodlights and the fountain on the green.
  { id: "starpost-bc-1", kind: "starpost", position: [19, STEP, -7], color: "#7fd8ff" },
  { id: "starpost-bc-2", kind: "starpost", position: [39, STEP, -7], color: "#7fd8ff" },
  { id: "starpost-bc-3", kind: "starpost", position: [39, STEP, 13], color: "#7fd8ff" },
  { id: "fountain-green", kind: "fountain", position: [0, 0.12, 18], color: "#8fe6ff" },

  // /p/ — the picnic balloons and the park archway back at the entrance.
  { id: "balloon-pd-1", kind: "balloon", position: [20, RISE, -22], color: "#ff6f91" },
  { id: "balloon-pd-2", kind: "balloon", position: [26, RISE, -18], color: "#ffe066" },
  { id: "balloon-pd-3", kind: "balloon", position: [32, RISE, -22], color: "#7fd8ff" },
  { id: "balloon-pd-4", kind: "balloon", position: [26, RISE, -30], color: "#c78bff" },
  { id: "archway-entry", kind: "archway", position: [0, 0.06, 42], color: "#ffd76a" },
];

export const sunnyPark: ExplorerMap = {
  id: "sunny-park",
  groupId: "group1",
  title: "Sunny Park",
  blurb: "A big open playground. Find the swings, the ball court and the picnic deck.",
  glyph: "🛝",
  cardGradient: "from-[#8fe07e] to-[#39a85f]",
  // On the path slab, not the grass beside it — the path top is 0.06.
  spawn: [0, 0.06, 44],
  spawnYaw: 0,
  bounds: { minX: -52, maxX: 52, minZ: -52, maxZ: 52 },
  solids,
  decorations,
  collectibles,
  stations,
  rewardProps,
  skyColor: "#8fd8f5",
  fogColor: "#d8f2fd",
  waterColor: "#5fc4ec",
  waterLevel: -3,
  killPlane: -14,
};
