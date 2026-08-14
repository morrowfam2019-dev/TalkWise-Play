import type { Solid } from "../world/types";

/**
 * Kinematic collision against axis-aligned boxes.
 *
 * The player is treated as a vertical cylinder. Horizontal movement resolves
 * circle-vs-rectangle; vertical movement snaps to the highest surface beneath
 * the player. Boxes whose tops are within STEP_HEIGHT of the player's feet are
 * ignored horizontally, which gives free stair-climbing without ramps or a
 * physics engine — the biggest single win for young players.
 */

export const PLAYER_RADIUS = 0.42;
export const PLAYER_HEIGHT = 1.5;
export const STEP_HEIGHT = 0.75;

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  top: number;
  bottom: number;
}

export function buildCollisionBoxes(solids: Solid[]): CollisionBox[] {
  return solids.map((solid) => ({
    minX: solid.minX,
    maxX: solid.maxX,
    minZ: solid.minZ,
    maxZ: solid.maxZ,
    top: solid.top,
    bottom: solid.bottom,
  }));
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** True when a circle at (x, z) overlaps the box footprint. */
function overlapsFootprint(
  box: CollisionBox,
  x: number,
  z: number,
  radius: number,
): boolean {
  const cx = clamp(x, box.minX, box.maxX);
  const cz = clamp(z, box.minZ, box.maxZ);
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < radius * radius;
}

export interface HorizontalResult {
  x: number;
  z: number;
}

/**
 * Pushes a proposed position out of any box that blocks it.
 *
 * `feetY` is the player's current foot height — boxes low enough to step onto
 * and boxes entirely above the player's head do not block.
 */
export function resolveHorizontal(
  boxes: CollisionBox[],
  proposedX: number,
  proposedZ: number,
  feetY: number,
  radius = PLAYER_RADIUS,
  height = PLAYER_HEIGHT,
): HorizontalResult {
  let x = proposedX;
  let z = proposedZ;
  const headY = feetY + height;

  // Two passes so a player wedged into a corner is pushed out of both walls.
  for (let pass = 0; pass < 2; pass += 1) {
    for (const box of boxes) {
      if (box.top <= feetY + STEP_HEIGHT) continue; // steppable or below
      if (box.bottom >= headY) continue; // clears the head

      const cx = clamp(x, box.minX, box.maxX);
      const cz = clamp(z, box.minZ, box.maxZ);
      const dx = x - cx;
      const dz = z - cz;
      const distSq = dx * dx + dz * dz;
      if (distSq >= radius * radius) continue;

      if (distSq > 1e-8) {
        const dist = Math.sqrt(distSq);
        x = cx + (dx / dist) * radius;
        z = cz + (dz / dist) * radius;
      } else {
        // Centre is inside the rectangle: escape along the shallowest axis.
        const toMinX = x - box.minX;
        const toMaxX = box.maxX - x;
        const toMinZ = z - box.minZ;
        const toMaxZ = box.maxZ - z;
        const best = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);
        if (best === toMinX) x = box.minX - radius;
        else if (best === toMaxX) x = box.maxX + radius;
        else if (best === toMinZ) z = box.minZ - radius;
        else z = box.maxZ + radius;
      }
    }
  }

  return { x, z };
}

/**
 * Highest surface the player can land on at (x, z).
 *
 * Only surfaces at or below `maxSurfaceY` count, so the player never teleports
 * up through a ledge they are walking underneath. Returns -Infinity over a gap.
 */
export function groundHeightAt(
  boxes: CollisionBox[],
  x: number,
  z: number,
  maxSurfaceY: number,
  radius = PLAYER_RADIUS,
): number {
  let best = Number.NEGATIVE_INFINITY;
  for (const box of boxes) {
    if (box.top > maxSurfaceY) continue;
    if (box.top <= best) continue;
    if (!overlapsFootprint(box, x, z, radius)) continue;
    best = box.top;
  }
  return best;
}

/** Ceiling directly above the player's head, or Infinity when clear. */
export function ceilingHeightAt(
  boxes: CollisionBox[],
  x: number,
  z: number,
  feetY: number,
  radius = PLAYER_RADIUS,
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const box of boxes) {
    if (box.bottom < feetY + 0.1) continue;
    if (box.bottom >= best) continue;
    if (!overlapsFootprint(box, x, z, radius)) continue;
    best = box.bottom;
  }
  return best;
}
