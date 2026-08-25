/**
 * BEGINNER — the explorer map model.
 *
 * An explorer map is a **place**, not a course. Where a word adventure is a
 * route from a spawn to a portal with checkpoints along it, an explorer map
 * is a large open ground with sound stations scattered through it, no finish
 * line, and nothing to fail. A child can wander, pick a station, practise a
 * sound, watch the park react, and wander off again.
 *
 * It reuses the word adventures' world primitives — the same `Solid`,
 * `Decoration`, `Collectible` and `JumpPad` types, and therefore the same
 * collision, controller, terrain renderer and touch controls. That reuse is
 * the point: the movement in Beginner is the movement the founder already
 * approved, and none of it was rewritten to get a second kind of level.
 */

import type { BeginnerGroupId } from "@/content/speech/beginner";
import type {
  Collectible,
  Decoration,
  JumpPad,
  Solid,
  Vec3,
  WorldBounds,
  WorldDefinition,
} from "../../world/types";

/** A place in the map where one speech sound is practiced. */
export interface SoundStationAnchor {
  /** Stable id, unique within the map. */
  id: string;
  /**
   * Which sound this station teaches, matching `BeginnerSound.id`. The
   * station carries no sound *content* — only the pointer — so a station can
   * be moved, restyled or renamed without touching the curriculum.
   */
  soundId: string;
  position: Vec3;
  /** Kid-facing name of the spot, e.g. "The Swings". */
  place: string;
  /**
   * Reward-prop ids that switch on when this station is fully practiced.
   * This is how speech changes the world: a child finishes /m/ at the swings
   * and the lanterns along the swing path come on and stay on.
   */
  activates: string[];
}

/**
 * A piece of the environment that speech turns on.
 *
 * Dark and still until its station is lit, then bright, animated, and
 * permanent for the session. Purely visual — never collides, never blocks.
 */
export type RewardPropKind =
  | "lantern"
  | "balloon"
  | "pinwheel"
  | "fountain"
  | "starpost"
  | "archway";

export interface RewardProp {
  id: string;
  kind: RewardPropKind;
  position: Vec3;
  scale?: number;
  color?: string;
}

/** A large, open Beginner world. */
export interface ExplorerMap {
  /** Stable id used in routes and saved progress, e.g. "sunny-park". */
  id: string;
  /** Which developmental sound group this map hosts. */
  groupId: BeginnerGroupId;
  /** Kid-facing title. */
  title: string;
  /** One line for the map card. */
  blurb: string;
  /** Emoji for the card. */
  glyph: string;
  /** Tailwind gradient classes for the card banner. */
  cardGradient: string;

  spawn: Vec3;
  spawnYaw: number;
  bounds: WorldBounds;
  solids: Solid[];
  decorations: Decoration[];
  collectibles: Collectible[];
  jumpPads?: JumpPad[];

  /** The sound stations dotted around the map. */
  stations: SoundStationAnchor[];
  /** Everything speech can switch on. */
  rewardProps: RewardProp[];

  skyColor: string;
  fogColor: string;
  waterColor: string;
  waterLevel: number;
  killPlane: number;
}

/**
 * Adapts an explorer map to the shape the shared gameplay controller reads.
 *
 * Stations become checkpoint anchors, which is exactly what the controller's
 * proximity pass already does well. `finish` is set to the spawn point and
 * the shell never unlocks it, so the finish trigger — the one piece of the
 * controller an open map has no use for — simply never fires. Every
 * explorer map is a `jump` world: one verb, and the most forgiving one, for
 * the youngest players in the product.
 */
export function toWorldDefinition(map: ExplorerMap): WorldDefinition {
  return {
    id: map.id,
    name: map.title,
    spawn: map.spawn,
    spawnYaw: map.spawnYaw,
    action: "jump",
    bounds: map.bounds,
    solids: map.solids,
    decorations: map.decorations,
    collectibles: map.collectibles,
    checkpoints: map.stations.map((station) => ({
      id: station.id,
      position: station.position,
    })),
    finish: map.spawn,
    jumpPads: map.jumpPads,
    skyColor: map.skyColor,
    fogColor: map.fogColor,
    waterColor: map.waterColor,
    waterLevel: map.waterLevel,
    killPlane: map.killPlane,
  };
}
