import type { Collectible, Decoration, Solid } from "../../world/types";
import type { ExplorerMap, RewardProp, SoundStationAnchor } from "./types";

/**
 * MAP 2 — WHISPER WOODS. Sound group 2: the air sounds /w/ and /f/.
 *
 * A visible step on from the park: cooler light, taller planting, and a
 * landscape you follow rather than one you cross. The park is a lawn with
 * things on it; the woods are a creek, a bridge, a garden clearing and a
 * treehouse rise, connected by trails.
 *
 * Same promises as Map 1 — one continuous ground plane, no pits, no hazard
 * water, and no station a child has to jump to reach. The rises here are
 * 0.3 trail steps and one 0.95 bridge, and the bridge has flat trail either
 * side of it so nothing is behind a jump.
 */

const MOSS = "#5fbf63";
const MOSS_DARK = "#3f9c52";
const TRAIL = "#d9bd8c";
const TRAIL_EDGE = "#c4a878";
const CREEK = "#7fd0e8";
const CREEK_BED = "#a8c9d6";
const PLANK = "#b07f4e";
const PLANK_TOP = "#cf9a63";
const GARDEN = "#9ce07f";
const STONE = "#b6bfcb";
const DIRT = "#8f6b46";

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
    id: `woods-${solidSeq}`,
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
  // Forest floor, in two halves with the creek channel between them. The
  // halves stop at the channel rather than running under it, so the creek
  // bed is the ground there instead of being buried inside the island.
  slab(-52, 52, 6, 52, 0, -10, DIRT, MOSS),
  slab(-52, 52, -52, -6, 0, -10, DIRT, MOSS),

  // The creek — a shallow bed you can walk straight down into and back out
  // of (0.5 either way, well under the controller's auto-step), cut across
  // the middle of the woods so the bridge has a reason to exist.
  slab(-52, 52, -6, 6, -0.5, -10, CREEK_BED, CREEK),

  // Trails: south approach, then a fork east to the garden and west to the
  // treehouse rise.
  slab(-3.5, 3.5, 6, 46, 0.06, -1, TRAIL_EDGE, TRAIL),
  slab(-3.5, 3.5, -46, -6, 0.06, -1, TRAIL_EDGE, TRAIL),
  slab(-44, 44, -26, -19, 0.06, -1, TRAIL_EDGE, TRAIL),

  // The plank bridge over the creek, with a ramp step at each end.
  slab(-6, 6, 6, 9, STEP, -1, PLANK, PLANK_TOP),
  slab(-6, 6, -9, -6, STEP, -1, PLANK, PLANK_TOP),
  slab(-6, 6, -6, 6, RISE, -3, PLANK, PLANK_TOP),

  // Garden clearing, east.
  slab(18, 42, -44, -24, STEP, -1, GARDEN, GARDEN),

  // Treehouse rise, west — two easy terraces up to a flat platform.
  slab(-44, -20, -46, -28, STEP, -1, MOSS_DARK, MOSS),
  slab(-40, -24, -44, -32, RISE, -1, MOSS_DARK, MOSS),

  // Stepping stones through the shallows, east of the bridge. Low enough
  // that the controller walks onto them — they are scenery to enjoy, never
  // a jump a child has to land.
  slab(14, 17, -2, 2, 0.1, -3, STONE, STONE),
  slab(20, 23, -2, 2, 0.1, -3, STONE, STONE),
  slab(26, 29, -2, 2, 0.1, -3, STONE, STONE),

  // A wide flat meadow south of the creek, so the map opens out rather than
  // funnelling everyone down one trail.
  slab(10, 46, 12, 44, 0.04, -1, MOSS, MOSS_DARK),
];

const decorations: Decoration[] = [
  // Dense boundary planting — this is a wood, so the edge is trees.
  { id: "wb1", kind: "pine", position: [-49, 0, 47], scale: 1.3 },
  { id: "wb2", kind: "pine", position: [-34, 0, 49], scale: 1.2 },
  { id: "wb3", kind: "tree", position: [-16, 0, 48], scale: 1.15 },
  { id: "wb4", kind: "pine", position: [10, 0, 49], scale: 1.25 },
  { id: "wb5", kind: "tree", position: [30, 0, 48], scale: 1.1 },
  { id: "wb6", kind: "pine", position: [48, 0, 46], scale: 1.3 },
  { id: "wb7", kind: "tree", position: [49, 0, 26], scale: 1.15 },
  { id: "wb8", kind: "pine", position: [48, 0, -12], scale: 1.25 },
  { id: "wb9", kind: "tree", position: [49, 0, -34], scale: 1.1 },
  { id: "wb10", kind: "pine", position: [34, 0, -49], scale: 1.3 },
  { id: "wb11", kind: "tree", position: [8, 0, -48], scale: 1.15 },
  { id: "wb12", kind: "pine", position: [-14, 0, -49], scale: 1.2 },
  { id: "wb13", kind: "tree", position: [-48, 0, -20], scale: 1.15 },
  { id: "wb14", kind: "pine", position: [-49, 0, 4], scale: 1.3 },
  { id: "wb15", kind: "tree", position: [-48, 0, 28], scale: 1.1 },

  // Trail-side planting, thick enough to feel like woodland.
  { id: "wt1", kind: "pine", position: [-10, 0, 30], scale: 1 },
  { id: "wt2", kind: "tree", position: [9, 0, 26], scale: 0.95 },
  { id: "wt3", kind: "pine", position: [-12, 0, 16], scale: 1.05 },
  { id: "wt4", kind: "tree", position: [10, 0, 38], scale: 1 },
  { id: "wt5", kind: "pine", position: [-9, 0, -14], scale: 1.05 },
  { id: "wt6", kind: "tree", position: [9, 0, -12], scale: 0.9 },
  { id: "wt7", kind: "pine", position: [-14, 0, -36], scale: 1.1 },
  { id: "wt8", kind: "tree", position: [12, 0, -34], scale: 0.95 },

  // Treehouse rise — the big trees the platform is built among.
  { id: "th1", kind: "tree", position: [-36, RISE, -38], scale: 1.5 },
  { id: "th2", kind: "tree", position: [-28, RISE, -36], scale: 1.35 },
  { id: "th3", kind: "pine", position: [-42, STEP, -32], scale: 1.2 },
  { id: "th4", kind: "crystal", position: [-32, RISE, -42], scale: 0.95, color: "#dff3ff" },

  // Garden clearing.
  { id: "gd1", kind: "flower", position: [22, STEP, -40], scale: 1, color: "#ff6f91" },
  { id: "gd2", kind: "flower", position: [28, STEP, -42], scale: 1, color: "#ffe066" },
  { id: "gd3", kind: "flower", position: [34, STEP, -38], scale: 1, color: "#c78bff" },
  { id: "gd4", kind: "flower", position: [26, STEP, -30], scale: 1, color: "#7fd8ff" },
  { id: "gd5", kind: "flower", position: [36, STEP, -28], scale: 1, color: "#ffb347" },
  { id: "gd6", kind: "rock", position: [40, STEP, -42], scale: 0.9 },

  // Creek rocks.
  { id: "cr1", kind: "rock", position: [-20, -0.5, 3], scale: 0.8 },
  { id: "cr2", kind: "rock", position: [-32, -0.5, -3], scale: 1 },
  { id: "cr3", kind: "rock", position: [36, -0.5, 3], scale: 0.85 },
  { id: "cr4", kind: "rock", position: [44, -0.5, -3], scale: 1.05 },

  // Meadow flowers, south-east.
  { id: "wf1", kind: "flower", position: [20, 0, 20], scale: 1, color: "#ffe066" },
  { id: "wf2", kind: "flower", position: [32, 0, 28], scale: 1, color: "#ff6f91" },
  { id: "wf3", kind: "flower", position: [40, 0, 18], scale: 1, color: "#c78bff" },

  { id: "wc1", kind: "cloud", position: [-20, 22, 26], scale: 3 },
  { id: "wc2", kind: "cloud", position: [24, 24, -20], scale: 3.4 },
  { id: "wc3", kind: "cloud", position: [-34, 20, -44], scale: 2.8 },
  { id: "wc4", kind: "cloud", position: [6, 26, 44], scale: 3.2 },
];

const collectibles: Collectible[] = [
  { id: "wc-1", position: [0, 1, 40], value: 2 },
  { id: "wc-2", position: [0, 1, 32], value: 2 },
  { id: "wc-3", position: [0, 1, 24], value: 2 },
  { id: "wc-4", position: [0, 1, 14], value: 2 },
  { id: "wc-5", position: [0, 1.9, 0], value: 3 },
  { id: "wc-6", position: [0, 1, -14], value: 2 },
  { id: "wc-7", position: [-12, 1, -22], value: 2 },
  { id: "wc-8", position: [-24, 1, -22], value: 2 },
  { id: "wc-9", position: [-34, 1.3, -34], value: 3 },
  { id: "wc-10", position: [14, 1, -22], value: 2 },
  { id: "wc-11", position: [26, 1.3, -30], value: 2 },
  { id: "wc-12", position: [34, 1.3, -38], value: 3 },
  { id: "wc-13", position: [15.5, 1.1, 0], value: 2 },
  { id: "wc-14", position: [21.5, 1.1, 0], value: 2 },
  { id: "wc-15", position: [27.5, 1.1, 0], value: 3 },
  { id: "wc-16", position: [28, 1, 24], value: 3 },
  { id: "wc-17", position: [40, 1, 34], value: 3 },
  { id: "wc-18", position: [-40, 1, 20], value: 3 },
];

const stations: SoundStationAnchor[] = [
  {
    id: "woods-bridge",
    soundId: "w",
    position: [0, 0.06, 12],
    place: "The Creek Bridge",
    activates: [
      "lantern-br-1",
      "lantern-br-2",
      "fountain-creek",
      "pinwheel-br",
    ],
  },
  {
    id: "woods-garden",
    soundId: "f",
    position: [28, 0.3, -35],
    place: "The Fern Garden",
    activates: [
      "lantern-gd-1",
      "lantern-gd-2",
      "starpost-gd",
      "archway-garden",
    ],
  },
];

const rewardProps: RewardProp[] = [
  // /w/ — the bridge and the water light up.
  { id: "lantern-br-1", kind: "lantern", position: [-5, 0.95, 5], color: "#8fe6ff" },
  { id: "lantern-br-2", kind: "lantern", position: [5, 0.95, -5], color: "#8fe6ff" },
  { id: "fountain-creek", kind: "fountain", position: [-14, -0.5, 0], color: "#8fe6ff" },
  { id: "pinwheel-br", kind: "pinwheel", position: [-6, 0.06, 14], color: "#7fd8ff" },

  // /f/ — the garden wakes up.
  { id: "lantern-gd-1", kind: "lantern", position: [20, 0.3, -28], color: "#ffd76a" },
  { id: "lantern-gd-2", kind: "lantern", position: [38, 0.3, -40], color: "#ffd76a" },
  { id: "starpost-gd", kind: "starpost", position: [32, 0.3, -44], color: "#a8ff9f" },
  { id: "archway-garden", kind: "archway", position: [17, 0.3, -30], color: "#a8ff9f" },
];

export const whisperWoods: ExplorerMap = {
  id: "whisper-woods",
  groupId: "group2",
  title: "Whisper Woods",
  blurb: "Follow the trail to the creek bridge and the fern garden.",
  glyph: "🌲",
  cardGradient: "from-[#4fc0a0] to-[#1f7d63]",
  // On the trail slab, whose top is 0.06.
  spawn: [0, 0.06, 44],
  spawnYaw: 0,
  bounds: { minX: -52, maxX: 52, minZ: -52, maxZ: 52 },
  solids,
  decorations,
  collectibles,
  stations,
  rewardProps,
  skyColor: "#a8dff0",
  fogColor: "#cfeadf",
  waterColor: "#5aa9c4",
  waterLevel: -3.5,
  killPlane: -14,
};
