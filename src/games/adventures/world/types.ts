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
  /**
   * Yaw (radians) a player should be running toward when they hit the pad,
   * for pads whose boost is tuned for one direction rather than "straight
   * up." Purely visual — an arrow on the pad points this way — but without
   * it a boosted jump can arc over the very ledge it was meant to clear.
   */
  aimYaw?: number;
}

/** Outer play-area edge. An invisible wall keeps the player inside it,
 * rather than letting them walk off into the void around the island. */
export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * The one traversal verb a world is built around.
 *
 * A world commits to exactly one: a "jump" world asks for height (raised
 * ledges, gaps, boost pads) and never asks the player to duck; a "slide"
 * world is flat underfoot and asks them to duck under low barriers, never to
 * jump. One button, one meaning, per adventure — a child learns a single
 * verb per world instead of juggling a moveset.
 */
export type WorldAction = "jump" | "slide";

export interface WorldDefinition {
  id: string;
  /** Kid-facing world name. */
  name: string;
  /** Where the player starts and respawns from. */
  spawn: Vec3;
  /** Initial camera yaw in radians, so the player faces the mountain. */
  spawnYaw: number;
  /** The single traversal verb this world is built around. */
  action: WorldAction;
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
  /**
   * The intended path through the world, as ordered waypoints between spawn
   * and finish. `npm run verify:world` walks exactly this line, so authoring
   * it is how a level says "this is the route I mean" — a straight
   * checkpoint-to-checkpoint line would cut corners through geometry the
   * design never meant a player to cross. Omit it and the verifier falls
   * back to walking the checkpoints in order.
   */
  verifyRoute?: { name: string; target: Vec3 }[];
  /** Sky and fog colours. */
  skyColor: string;
  fogColor: string;
  waterColor: string;
  waterLevel: number;
  /** Y below which the player is considered to have fallen off the world. */
  killPlane: number;
}
