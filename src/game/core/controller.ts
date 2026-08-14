import * as THREE from "three";
import {
  ceilingHeightAt,
  groundHeightAt,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  resolveHorizontal,
  STEP_HEIGHT,
  type CollisionBox,
} from "./collision";

const MOVE_SPEED = 6.4;
const ACCELERATION = 14;
const GRAVITY = 22;
const JUMP_SPEED = 7.6;
const TERMINAL_VELOCITY = -30;
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.14;
const TURN_SPEED = 12;

export interface ControllerInput {
  /** Desired world-space direction, magnitude 0..1. */
  moveX: number;
  moveZ: number;
  jump: boolean;
}

/**
 * Third-person kinematic character controller.
 *
 * Deliberately not a rigid-body simulation: children need movement that is
 * predictable and impossible to get stuck in. Coyote time and a jump buffer
 * make jumps forgiving; a rolling "last safe spot" means falling off the
 * island is a two-second setback rather than a restart.
 */
export class PlayerController {
  readonly position = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  facing = 0;
  grounded = false;
  /** Vertical speed on the frame the player last landed, for squash effects. */
  landingImpact = 0;
  /** Seconds of continuous movement, used to drive the walk cycle. */
  strideTime = 0;
  speedRatio = 0;

  private coyote = 0;
  private jumpBuffer = 0;
  private safeSpot = new THREE.Vector3();
  private safeTimer = 0;
  private spawn = new THREE.Vector3();

  reset(spawn: THREE.Vector3Tuple, yaw: number) {
    this.spawn.set(spawn[0], spawn[1], spawn[2]);
    this.position.copy(this.spawn);
    this.safeSpot.copy(this.spawn);
    this.velocity.set(0, 0, 0);
    this.facing = yaw;
    this.grounded = true;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.strideTime = 0;
    this.speedRatio = 0;
    this.landingImpact = 0;
  }

  update(
    dt: number,
    input: ControllerInput,
    boxes: CollisionBox[],
    killPlane: number,
  ) {
    const wasGrounded = this.grounded;
    this.landingImpact = 0;

    // --- Horizontal velocity -------------------------------------------------
    let desiredX = input.moveX;
    let desiredZ = input.moveZ;
    const desiredLength = Math.hypot(desiredX, desiredZ);
    if (desiredLength > 1) {
      desiredX /= desiredLength;
      desiredZ /= desiredLength;
    }

    const targetVX = desiredX * MOVE_SPEED;
    const targetVZ = desiredZ * MOVE_SPEED;
    const blend = Math.min(1, ACCELERATION * dt);
    this.velocity.x += (targetVX - this.velocity.x) * blend;
    this.velocity.z += (targetVZ - this.velocity.z) * blend;

    // --- Jump ---------------------------------------------------------------
    this.jumpBuffer = input.jump ? JUMP_BUFFER : Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? COYOTE_TIME : Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }

    // --- Horizontal movement + collision ------------------------------------
    const feetY = this.position.y;
    const proposedX = this.position.x + this.velocity.x * dt;
    const proposedZ = this.position.z + this.velocity.z * dt;
    const resolved = resolveHorizontal(boxes, proposedX, proposedZ, feetY);

    // Kill residual speed into a wall so the player does not stick to it.
    if (Math.abs(resolved.x - proposedX) > 1e-4) this.velocity.x = 0;
    if (Math.abs(resolved.z - proposedZ) > 1e-4) this.velocity.z = 0;

    this.position.x = resolved.x;
    this.position.z = resolved.z;

    // --- Vertical movement --------------------------------------------------
    this.velocity.y = Math.max(TERMINAL_VELOCITY, this.velocity.y - GRAVITY * dt);
    let nextY = this.position.y + this.velocity.y * dt;

    // Surfaces the player may land on: anything up to a step above the feet
    // while grounded (so stairs pull them up), or at/below the feet mid-air.
    const surfaceLimit = wasGrounded ? feetY + STEP_HEIGHT : feetY + 0.02;
    const ground = groundHeightAt(boxes, this.position.x, this.position.z, surfaceLimit);

    if (this.velocity.y <= 0 && ground > Number.NEGATIVE_INFINITY && nextY <= ground) {
      nextY = ground;
      if (!wasGrounded) this.landingImpact = -this.velocity.y;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Head bump: stop upward motion under an overhang.
    if (this.velocity.y > 0) {
      const ceiling = ceilingHeightAt(boxes, this.position.x, this.position.z, this.position.y);
      if (nextY + PLAYER_HEIGHT > ceiling) {
        nextY = ceiling - PLAYER_HEIGHT;
        this.velocity.y = 0;
      }
    }

    this.position.y = nextY;

    // --- Facing -------------------------------------------------------------
    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.speedRatio = Math.min(1, planarSpeed / MOVE_SPEED);
    if (planarSpeed > 0.35) {
      const targetFacing = Math.atan2(this.velocity.x, this.velocity.z);
      let delta = targetFacing - this.facing;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      this.facing += delta * Math.min(1, TURN_SPEED * dt);
      this.strideTime += dt * (0.6 + this.speedRatio);
    } else {
      this.strideTime += dt * 0.15;
    }

    // --- Safety net ---------------------------------------------------------
    this.safeTimer += dt;
    if (this.grounded && this.safeTimer > 0.3) {
      this.safeTimer = 0;
      this.safeSpot.copy(this.position);
    }

    if (this.position.y < killPlane) {
      this.position.copy(this.safeSpot);
      this.position.y += 0.5;
      this.velocity.set(0, 0, 0);
      return { respawned: true };
    }

    return { respawned: false };
  }
}

export { PLAYER_HEIGHT, PLAYER_RADIUS };
