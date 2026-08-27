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
import type { WorldAction, WorldBounds } from "../world/types";

const MOVE_SPEED = 6.4;
const ACCELERATION = 14;
const GRAVITY = 22;
const JUMP_SPEED = 7.6;
const TERMINAL_VELOCITY = -30;
const COYOTE_TIME = 0.12;
const JUMP_BUFFER = 0.14;
const TURN_SPEED = 12;

/** Standing height clears a barrier whose underside sits at 0.9; sliding
 * height ducks beneath it. Slide worlds are authored against these numbers. */
const SLIDE_HEIGHT = 0.62;
const SLIDE_SPEED = 9.6;
const SLIDE_DURATION = 0.6;
const SLIDE_COOLDOWN = 0.22;
/** A slide that ends under a low ceiling stays down rather than standing up
 * inside the barrier — the player keeps gliding until there is headroom. */
const SLIDE_EXTENSION = 0.12;

export interface ControllerInput {
  /** Desired world-space direction, magnitude 0..1. */
  moveX: number;
  moveZ: number;
  /** The level's one action button — jump or slide, per the world. */
  action: boolean;
  /**
   * Movement multipliers from the player's equipped boost, defaulting to 1.
   * They ride along with the frame's intent rather than living on the
   * controller, because they are the player's loadout and not the
   * controller's own state — and nothing here can reach the speech check.
   */
  jumpBoost?: number;
  speedBoost?: number;
  /**
   * Easy-mode movement assist from the player's settings, not their loadout.
   * Widens coyote time and the jump buffer so a mistimed jump still lands —
   * it never changes speed, height, or anything the speech check touches.
   */
  assist?: boolean;
}

/** How much wider coyote time and the jump buffer get in assist mode. */
const ASSIST_TIMING_MULTIPLIER = 1.6;

/** The slice of a world the controller needs to move a player through it. */
export interface WorldRules {
  action: WorldAction;
  killPlane: number;
  bounds?: WorldBounds;
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
  /** True while a slide is in progress, so the avatar can take the pose. */
  sliding = false;

  private coyote = 0;
  private jumpBuffer = 0;
  private slideTimer = 0;
  private slideCooldown = 0;
  private actionWasHeld = false;
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
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.actionWasHeld = false;
    this.sliding = false;
    this.strideTime = 0;
    this.speedRatio = 0;
    this.landingImpact = 0;
  }

  /** Collision height right now — reduced mid-slide so the player fits under
   * barriers that block them standing up. */
  get height(): number {
    return this.sliding ? SLIDE_HEIGHT : PLAYER_HEIGHT;
  }

  /** Sets upward velocity directly — used by jump pads and similar triggers. */
  boostUp(velocityY: number) {
    this.velocity.y = velocityY;
    this.grounded = false;
  }

  update(
    dt: number,
    input: ControllerInput,
    boxes: CollisionBox[],
    rules: WorldRules,
  ) {
    const { action: worldAction, killPlane, bounds } = rules;
    const wasGrounded = this.grounded;
    this.landingImpact = 0;

    const actionPressed = input.action && !this.actionWasHeld;
    this.actionWasHeld = input.action;

    // --- Slide --------------------------------------------------------------
    // Slide worlds spend the action button here; jump worlds never enter this
    // branch, so a slide can never be triggered where nothing is duckable.
    this.slideCooldown = Math.max(0, this.slideCooldown - dt);
    if (worldAction === "slide") {
      if (
        actionPressed &&
        this.grounded &&
        !this.sliding &&
        this.slideCooldown <= 0
      ) {
        this.sliding = true;
        this.slideTimer = SLIDE_DURATION;
        // Slide along the way the player is already looking, so ducking under
        // a barrier doesn't need the stick held perfectly straight.
        const heading =
          Math.hypot(this.velocity.x, this.velocity.z) > 0.4
            ? Math.atan2(this.velocity.x, this.velocity.z)
            : this.facing;
        this.velocity.x = Math.sin(heading) * SLIDE_SPEED;
        this.velocity.z = Math.cos(heading) * SLIDE_SPEED;
      }
    } else if (this.sliding) {
      this.sliding = false;
    }

    // --- Horizontal velocity -------------------------------------------------
    let desiredX = input.moveX;
    let desiredZ = input.moveZ;
    const desiredLength = Math.hypot(desiredX, desiredZ);
    if (desiredLength > 1) {
      desiredX /= desiredLength;
      desiredZ /= desiredLength;
    }

    if (this.sliding) {
      // Steering is heavily damped mid-slide so it reads as a committed move
      // rather than a speed buff the player can drive around corners.
      const drag = Math.min(1, 1.6 * dt);
      this.velocity.x += (desiredX * MOVE_SPEED - this.velocity.x) * drag;
      this.velocity.z += (desiredZ * MOVE_SPEED - this.velocity.z) * drag;
    } else {
      const speed = MOVE_SPEED * (input.speedBoost ?? 1);
      const targetVX = desiredX * speed;
      const targetVZ = desiredZ * speed;
      const blend = Math.min(1, ACCELERATION * dt);
      this.velocity.x += (targetVX - this.velocity.x) * blend;
      this.velocity.z += (targetVZ - this.velocity.z) * blend;
    }

    // --- Jump ---------------------------------------------------------------
    const timingScale = input.assist ? ASSIST_TIMING_MULTIPLIER : 1;
    const wantsJump = worldAction === "jump" && input.action;
    this.jumpBuffer = wantsJump
      ? JUMP_BUFFER * timingScale
      : Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded
      ? COYOTE_TIME * timingScale
      : Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.velocity.y = JUMP_SPEED * (input.jumpBoost ?? 1);
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }

    // --- Horizontal movement + collision ------------------------------------
    const feetY = this.position.y;
    const proposedX = this.position.x + this.velocity.x * dt;
    const proposedZ = this.position.z + this.velocity.z * dt;
    const resolved = resolveHorizontal(
      boxes,
      proposedX,
      proposedZ,
      feetY,
      PLAYER_RADIUS,
      this.height,
    );

    // Kill residual speed into a wall so the player does not stick to it.
    if (Math.abs(resolved.x - proposedX) > 1e-4) this.velocity.x = 0;
    if (Math.abs(resolved.z - proposedZ) > 1e-4) this.velocity.z = 0;

    this.position.x = resolved.x;
    this.position.z = resolved.z;

    // Invisible wall at the island's outer edge — without this, running
    // straight off the perimeter drops the player past the terrain and the
    // water plane before the kill-plane catches them, which reads as a
    // glitch rather than a fall.
    if (bounds) {
      this.position.x = Math.min(
        Math.max(this.position.x, bounds.minX + PLAYER_RADIUS),
        bounds.maxX - PLAYER_RADIUS,
      );
      this.position.z = Math.min(
        Math.max(this.position.z, bounds.minZ + PLAYER_RADIUS),
        bounds.maxZ - PLAYER_RADIUS,
      );
    }

    // --- Vertical movement --------------------------------------------------
    this.velocity.y = Math.max(
      TERMINAL_VELOCITY,
      this.velocity.y - GRAVITY * dt,
    );
    let nextY = this.position.y + this.velocity.y * dt;

    // Surfaces the player may land on: anything up to a step above the feet
    // while grounded (so stairs pull them up), or at/below the feet mid-air.
    const surfaceLimit = wasGrounded ? feetY + STEP_HEIGHT : feetY + 0.02;
    const ground = groundHeightAt(
      boxes,
      this.position.x,
      this.position.z,
      surfaceLimit,
    );

    if (
      this.velocity.y <= 0 &&
      ground > Number.NEGATIVE_INFINITY &&
      nextY <= ground
    ) {
      nextY = ground;
      if (!wasGrounded) this.landingImpact = -this.velocity.y;
      this.velocity.y = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Head bump: stop upward motion under an overhang.
    if (this.velocity.y > 0) {
      const ceiling = ceilingHeightAt(
        boxes,
        this.position.x,
        this.position.z,
        this.position.y,
      );
      if (nextY + this.height > ceiling) {
        nextY = ceiling - this.height;
        this.velocity.y = 0;
      }
    }

    this.position.y = nextY;

    // --- Slide timer --------------------------------------------------------
    // Standing back up is only allowed with real headroom, so a slide that
    // runs out mid-tunnel keeps going instead of wedging the player inside
    // the barrier they just ducked under.
    if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        const ceiling = ceilingHeightAt(
          boxes,
          this.position.x,
          this.position.z,
          this.position.y,
        );
        if (ceiling - this.position.y >= PLAYER_HEIGHT) {
          this.sliding = false;
          this.slideCooldown = SLIDE_COOLDOWN;
        } else {
          this.slideTimer = SLIDE_EXTENSION;
        }
      }
    }

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
    // Never bank a safe spot mid-slide: the player is somewhere a standing
    // body doesn't fit, and respawning them there would wedge them in it.
    this.safeTimer += dt;
    if (this.grounded && !this.sliding && this.safeTimer > 0.3) {
      this.safeTimer = 0;
      this.safeSpot.copy(this.position);
    }

    if (this.position.y < killPlane) {
      this.position.copy(this.safeSpot);
      this.position.y += 0.5;
      this.velocity.set(0, 0, 0);
      this.sliding = false;
      this.slideTimer = 0;
      return { respawned: true };
    }

    return { respawned: false };
  }
}

export { PLAYER_HEIGHT, PLAYER_RADIUS };
