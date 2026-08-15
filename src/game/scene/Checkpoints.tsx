"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { SpeechChallenge } from "@/content/speech";
import { LABEL_ASPECT, LABEL_DONE, LABEL_PENDING } from "../core/labelTexture";
import type { CheckpointAnchor } from "../world/types";
import { useLabelTexture } from "./useLabelTexture";

const PENDING = "#f5c33b";
const DONE = "#2ecc71";
const STONE = "#e2dccb";

const LABEL_WIDTH = 2.5;
const LABEL_HEIGHT = LABEL_WIDTH / LABEL_ASPECT;

interface CheckpointProps {
  anchor: CheckpointAnchor;
  challenge: SpeechChallenge;
  completed: boolean;
  isNear: boolean;
}

function Checkpoint({ anchor, challenge, completed, isNear }: CheckpointProps) {
  const pennant = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const label = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);

  const texture = useLabelTexture(
    completed ? `${challenge.word} ★` : challenge.word,
    completed ? LABEL_DONE : LABEL_PENDING,
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (pennant.current) {
      // A flag waves side to side — planted on its pole, never floating —
      // so it reads as a marker rather than something to pick up.
      const wave = Math.sin(t * 2.6) * 0.14;
      pennant.current.rotation.y = wave;
      const pulse = isNear && !completed ? 1 + Math.sin(t * 9) * 0.1 : 1;
      pennant.current.scale.setScalar(pulse);
    }

    if (ring.current) {
      ring.current.rotation.z += delta * 0.6;
      const s = completed ? 1 : 1 + Math.sin(t * 3) * 0.07;
      ring.current.scale.set(s, s, 1);
    }

    if (beam.current) {
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = completed ? 0 : 0.14 + Math.sin(t * 2.4) * 0.05;
    }

    // Billboard the word toward the camera.
    if (label.current) {
      label.current.quaternion.copy(state.camera.quaternion);
      label.current.position.y = 2.55 + Math.sin(t * 2 + 0.8) * 0.08;
    }
  });

  const color = completed ? DONE : PENDING;

  return (
    <group position={anchor.position}>
      {/* Plinth */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.78, 0.95, 0.44, 12]} />
        <meshLambertMaterial color={STONE} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 0.16, 12]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>

      {/* Ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <torusGeometry args={[1.32, 0.09, 8, 28]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Flag — planted on the plinth, not floating, so nothing here reads
          as a pickup a child forgot to grab. */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.3, 6]} />
        <meshLambertMaterial color={STONE} />
      </mesh>
      <mesh ref={pennant} position={[0, 1.9, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.3, 0.5, 3]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.55} />
      </mesh>

      {/* Guiding light beam, hidden once the challenge is done */}
      <mesh ref={beam} position={[0, 5, 0]}>
        <cylinderGeometry args={[0.5, 0.72, 10, 10, 1, true]} />
        <meshBasicMaterial
          color={PENDING}
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Word sign */}
      <mesh ref={label} position={[0, 2.55, 0]}>
        <planeGeometry args={[LABEL_WIDTH, LABEL_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

interface CheckpointsProps {
  anchors: CheckpointAnchor[];
  challenges: SpeechChallenge[];
  completed: boolean[];
  nearIndex: number | null;
}

/**
 * Renders one checkpoint per anchor, pairing anchor N with challenge N. The
 * world never names a word and the level never names a coordinate.
 */
export function Checkpoints({
  anchors,
  challenges,
  completed,
  nearIndex,
}: CheckpointsProps) {
  return (
    <group>
      {anchors.map((anchor, index) => {
        const challenge = challenges[index];
        if (!challenge) return null;
        return (
          <Checkpoint
            key={anchor.id}
            anchor={anchor}
            challenge={challenge}
            completed={completed[index] ?? false}
            isNear={nearIndex === index}
          />
        );
      })}
    </group>
  );
}
