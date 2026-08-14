"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildCollisionBoxes, groundHeightAt } from "../core/collision";
import { PlayerController } from "../core/controller";
import type { GameInput } from "../core/input";
import type { WorldDefinition } from "../world/types";
import { PlayerAvatar } from "./PlayerAvatar";

const CAMERA_DISTANCE = 9;
const CAMERA_TARGET_HEIGHT = 1.15;
const LOOK_SENSITIVITY = 0.0055;
const PITCH_MIN = -0.05;
const PITCH_MAX = 0.95;
const KEYBOARD_YAW_SPEED = 2.2;

const CHECKPOINT_RADIUS = 2.3;
const CHECKPOINT_REARM_RADIUS = 3.4;
const CHECKPOINT_VERTICAL_TOLERANCE = 2.6;
const COIN_RADIUS = 1.15;
const FINISH_RADIUS = 2.6;

export interface GameplayCallbacks {
  onCheckpoint: (index: number) => void;
  onCoin: (id: string, value: number) => void;
  onFinish: () => void;
  onNearChange: (index: number | null) => void;
  onJump: () => void;
  /** Optional position readout for level design; sampled a few times a second. */
  onDebugSample?: (x: number, y: number, z: number) => void;
}

interface GameplayControllerProps extends GameplayCallbacks {
  world: WorldDefinition;
  input: GameInput;
  paused: boolean;
  completed: boolean[];
  collected: string[];
  finishUnlocked: boolean;
  /** Bumping this restarts the run from spawn. */
  runId: number;
}

/**
 * Drives the whole gameplay frame: input → movement → camera → triggers.
 *
 * Trigger checks live here rather than on individual meshes so proximity is
 * evaluated once per frame against plain world data, which keeps React out of
 * the hot path entirely — only real events cross back into component state.
 */
export function GameplayController({
  world,
  input,
  paused,
  completed,
  collected,
  finishUnlocked,
  runId,
  onCheckpoint,
  onCoin,
  onFinish,
  onNearChange,
  onJump,
  onDebugSample,
}: GameplayControllerProps) {
  const controller = useMemo(() => new PlayerController(), []);
  const boxes = useMemo(() => buildCollisionBoxes(world.solids), [world]);

  const playerGroup = useRef<THREE.Group>(null);
  const blobShadow = useRef<THREE.Mesh>(null);

  const yaw = useRef(world.spawnYaw);
  const pitch = useRef(0.3);
  const cameraReady = useRef(false);
  const armed = useRef<boolean[]>([]);
  const nearIndex = useRef<number | null>(null);
  const finishFired = useRef(false);
  const wasJumping = useRef(false);
  const debugClock = useRef(0);

  // Live mirrors so the frame loop never reads stale props via closure.
  const state = useRef({ paused, completed, collected, finishUnlocked });
  useEffect(() => {
    state.current = { paused, completed, collected, finishUnlocked };
  }, [paused, completed, collected, finishUnlocked]);

  useEffect(() => {
    controller.reset(world.spawn, world.spawnYaw);
    yaw.current = world.spawnYaw;
    pitch.current = 0.3;
    cameraReady.current = false;
    armed.current = world.checkpoints.map(() => true);
    finishFired.current = false;
    nearIndex.current = null;
    onNearChange(null);
  }, [controller, world, runId, onNearChange]);

  useFrame((frame, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30);
    const { paused: isPaused, completed: done, collected: taken } = state.current;

    // --- Camera orientation --------------------------------------------------
    const look = input.consumeLook();
    yaw.current -= look.x * LOOK_SENSITIVITY;
    pitch.current = THREE.MathUtils.clamp(
      pitch.current + look.y * LOOK_SENSITIVITY,
      PITCH_MIN,
      PITCH_MAX,
    );
    yaw.current += input.getKeyboardYaw() * KEYBOARD_YAW_SPEED * delta;

    // --- Movement ------------------------------------------------------------
    if (!isPaused) {
      const move = input.getMove();
      const forwardX = -Math.sin(yaw.current);
      const forwardZ = -Math.cos(yaw.current);
      const rightX = -forwardZ;
      const rightZ = forwardX;

      const jumping = input.isJumping();
      if (jumping && !wasJumping.current && controller.grounded) onJump();
      wasJumping.current = jumping;

      controller.update(
        delta,
        {
          moveX: forwardX * move.y + rightX * move.x,
          moveZ: forwardZ * move.y + rightZ * move.x,
          jump: jumping,
        },
        boxes,
        world.killPlane,
      );
    }

    const position = controller.position;

    if (onDebugSample) {
      debugClock.current += delta;
      if (debugClock.current >= 0.25) {
        debugClock.current = 0;
        onDebugSample(position.x, position.y, position.z);
      }
    }

    // --- Avatar transform ----------------------------------------------------
    if (playerGroup.current) {
      playerGroup.current.position.copy(position);
      playerGroup.current.rotation.y = controller.facing;
    }

    if (blobShadow.current) {
      // The shadow rides the surface below the player and fades with height.
      const found = groundHeightAt(boxes, position.x, position.z, position.y + 0.05);
      const groundY = Number.isFinite(found) ? found : world.waterLevel;
      const height = Math.max(0, position.y - groundY);
      blobShadow.current.position.set(position.x, groundY + 0.04, position.z);
      const scale = THREE.MathUtils.clamp(1 - height * 0.12, 0.4, 1);
      blobShadow.current.scale.setScalar(scale);
      const material = blobShadow.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.26 * scale;
    }

    // --- Camera follow -------------------------------------------------------
    const cosPitch = Math.cos(pitch.current);
    const desiredX = position.x + Math.sin(yaw.current) * CAMERA_DISTANCE * cosPitch;
    const desiredZ = position.z + Math.cos(yaw.current) * CAMERA_DISTANCE * cosPitch;
    const desiredY =
      position.y + CAMERA_TARGET_HEIGHT + Math.sin(pitch.current) * CAMERA_DISTANCE + 1.1;

    const camera = frame.camera;
    if (!cameraReady.current) {
      camera.position.set(desiredX, desiredY, desiredZ);
      cameraReady.current = true;
    } else {
      const blend = 1 - Math.exp(-9 * delta);
      camera.position.x += (desiredX - camera.position.x) * blend;
      camera.position.y += (desiredY - camera.position.y) * blend;
      camera.position.z += (desiredZ - camera.position.z) * blend;
    }
    camera.position.y = Math.max(camera.position.y, world.waterLevel + 1.6);
    camera.lookAt(position.x, position.y + CAMERA_TARGET_HEIGHT, position.z);

    if (isPaused) return;

    // --- Checkpoint proximity ------------------------------------------------
    let closest: number | null = null;
    let closestDistance = Infinity;

    world.checkpoints.forEach((anchor, index) => {
      const dx = position.x - anchor.position[0];
      const dz = position.z - anchor.position[2];
      const dy = position.y - anchor.position[1];
      if (Math.abs(dy) > CHECKPOINT_VERTICAL_TOLERANCE) return;
      const distance = Math.hypot(dx, dz);

      if (distance > CHECKPOINT_REARM_RADIUS) armed.current[index] = true;

      if (done[index]) return;

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }

      if (distance < CHECKPOINT_RADIUS && armed.current[index]) {
        armed.current[index] = false;
        onCheckpoint(index);
      }
    });

    const near = closestDistance < CHECKPOINT_REARM_RADIUS ? closest : null;
    if (near !== nearIndex.current) {
      nearIndex.current = near;
      onNearChange(near);
    }

    // --- Coins ---------------------------------------------------------------
    for (const collectible of world.collectibles) {
      if (taken.includes(collectible.id)) continue;
      const dx = position.x - collectible.position[0];
      const dy = position.y + 0.75 - collectible.position[1];
      const dz = position.z - collectible.position[2];
      if (Math.hypot(dx, dy, dz) < COIN_RADIUS) {
        onCoin(collectible.id, collectible.value);
      }
    }

    // --- Finish --------------------------------------------------------------
    if (state.current.finishUnlocked && !finishFired.current) {
      const dx = position.x - world.finish[0];
      const dz = position.z - world.finish[2];
      const dy = Math.abs(position.y - world.finish[1]);
      if (Math.hypot(dx, dz) < FINISH_RADIUS && dy < 3) {
        finishFired.current = true;
        onFinish();
      }
    }
  });

  return (
    <group>
      <mesh ref={blobShadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color="#123" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <group ref={playerGroup}>
        <PlayerAvatar controller={controller} />
      </group>
    </group>
  );
}
