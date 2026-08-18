"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LABEL_ASPECT, LABEL_DONE, LABEL_PENDING } from "../core/labelTexture";
import type { Vec3 } from "../world/types";
import { useLabelTexture } from "./useLabelTexture";

const LOCKED = "#8d93a3";
const UNLOCKED = "#a06bff";
const GOLD = "#f5c33b";

const LABEL_WIDTH = 3;
const LABEL_HEIGHT = LABEL_WIDTH / LABEL_ASPECT;

interface FinishPortalProps {
  position: Vec3;
  unlocked: boolean;
  remaining: number;
}

/**
 * The summit portal. It stays visibly locked until every speech challenge is
 * done, so the goal is legible from the start of the run.
 */
export function FinishPortal({ position, unlocked, remaining }: FinishPortalProps) {
  const ring = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);

  const texture = useLabelTexture(
    unlocked ? "FINISH!" : `${remaining} TO GO`,
    unlocked ? LABEL_DONE : LABEL_PENDING,
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (ring.current) {
      ring.current.rotation.z += delta * (unlocked ? 1.1 : 0.15);
    }

    if (inner.current) {
      const material = inner.current.material as THREE.MeshBasicMaterial;
      material.opacity = unlocked ? 0.55 + Math.sin(t * 3) * 0.15 : 0.16;
      inner.current.rotation.z -= delta * (unlocked ? 0.8 : 0.1);
    }

    if (beam.current) {
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = unlocked ? 0.2 + Math.sin(t * 2.6) * 0.07 : 0;
    }

    if (label.current) {
      label.current.quaternion.copy(state.camera.quaternion);
      label.current.position.y = 4.4 + Math.sin(t * 2) * 0.09;
    }
  });

  const color = unlocked ? UNLOCKED : LOCKED;

  return (
    <group position={position}>
      {/* Base pad */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.7, 1.95, 0.24, 16]} />
        <meshLambertMaterial color={unlocked ? GOLD : "#b9bfcc"} />
      </mesh>

      {/* Portal ring */}
      <mesh ref={ring} position={[0, 2.1, 0]}>
        <torusGeometry args={[1.5, 0.22, 10, 32]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={unlocked ? 0.7 : 0.15}
        />
      </mesh>

      {/* Portal surface */}
      <mesh ref={inner} position={[0, 2.1, 0]}>
        <circleGeometry args={[1.42, 28]} />
        <meshBasicMaterial
          color={unlocked ? "#e0c8ff" : "#7d8494"}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Celebration beam once unlocked */}
      <mesh ref={beam} position={[0, 8, 0]}>
        <cylinderGeometry args={[1.1, 1.5, 16, 12, 1, true]} />
        <meshBasicMaterial
          color={GOLD}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={label} position={[0, 4.4, 0]}>
        <planeGeometry args={[LABEL_WIDTH, LABEL_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}
