/**
 * World description model.
 *
 * A world is pure data: boxes, decorations, and anchor points. It knows
 * nothing about which sound or words are being practiced — the level binds
 * speech challenges to this world's checkpoint anchors by index.
 */

export type Vec3 = [number, number, number];

/** An axis-aligned box. Solids are the only things the player collides with. */
export interface Solid {
  id: string;
  /** Inclusive bounds in world units. */
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Top surface the player stands on. */
  top: number;
  /** Bottom of the box; extends down into the terrain. */
  bottom: number;
  /** Body colour. */
  color: string;
  /** Optional grass/stone cap drawn on the top face. */
  capColor?: string;
}

export type DecorationKind = "tree" | "pine" | "rock" | "cloud" | "flower" | "crystal";

/** Purely visual props. Decorations never collide. */
export interface Decoration {
  id: string;
  kind: DecorationKind;
  position: Vec3;
  scale: number;
  color?: string;
}

/** A coin pickup. */
export interface Collectible {
  id: string;
  position: Vec3;
  /** Coins awarded when picked up. */
  value: number;
}

/** A spot where a speech challenge can be placed. */
export interface CheckpointAnchor {
  id: string;
  position: Vec3;
}

/** A trigger zone that boosts the player upward. */
export interface JumpPad {
  id: string;
  /** Center position of the pad. */
  position: Vec3;
  /** Size of the trigger zone (half-width in X and Z). */
  radius: number;
  /** Upward velocity to apply when player steps on it. */
  boost: number;
}

/** Outer play-area edge. An invisible wall keeps the player inside it,
 * rather than letting them walk off into the void around the island. */
export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WorldDefinition {
  id: string;
  /** Kid-facing world name. */
  name: string;
  /** Where the player starts and respawns from. */
  spawn: Vec3;
  /** Initial camera yaw in radians, so the player faces the mountain. */
  spawnYaw: number;
  /** Horizontal play-area limits — should match the outer edge of the base
   * island so the barrier isn't visible as a hard stop mid-terrain. */
  bounds: WorldBounds;
  solids: Solid[];
  decorations: Decoration[];
  collectibles: Collectible[];
  /** Ordered anchors; challenge N is bound to anchor N. */
  checkpoints: CheckpointAnchor[];
  /** The finish destination, gated until every checkpoint is complete. */
  finish: Vec3;
  /** Jump pad boost zones. */
  jumpPads?: JumpPad[];
  /** Sky and fog colours. */
  skyColor: string;
  fogColor: string;
  waterColor: string;
  waterLevel: number;
  /** Y below which the player is considered to have fallen off the world. */
  killPlane: number;
}
