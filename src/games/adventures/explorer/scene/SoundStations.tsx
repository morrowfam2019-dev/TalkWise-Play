"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getBeginnerSound } from "@/content/speech/beginner";
import {
  LABEL_ASPECT,
  LABEL_DONE,
  LABEL_PENDING,
} from "../../core/labelTexture";
import { useLabelTexture } from "../../scene/useLabelTexture";
import type { SoundStationAnchor } from "../maps";

/**
 * The big landmark a child walks up to in a Beginner map.
 *
 * Everything about it is scaled for a player who cannot read: the grapheme
 * is a metre-and-a-half tall on a billboarded sign, the plinth is twice the
 * size of a word-adventure checkpoint, and an unlit station throws a
 * coloured beam a child can see from the far side of the park. Once its
 * sound has been practised enough times, the beam goes out and the station
 * turns gold and keeps spinning — the marker becomes a trophy rather than
 * disappearing.
 */

const PENDING = "#f5c33b";
const LIT = "#2ecc71";
const GOLD = "#ffd76a";
const STONE = "#f2ece0";

const SIGN_WIDTH = 4.2;
const SIGN_HEIGHT = SIGN_WIDTH / LABEL_ASPECT;

interface StationProps {
  anchor: SoundStationAnchor;
  /** Turns finished here, out of the sound's own repetition target. */
  completions: number;
  repetitions: number;
  isNear: boolean;
}

function Station({ anchor, completions, repetitions, isNear }: StationProps) {
  const sign = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const crown = useRef<THREE.Group>(null);

  const sound = getBeginnerSound(anchor.soundId);
  const lit = repetitions > 0 && completions >= repetitions;
  const display = sound?.display ?? anchor.soundId.toUpperCase();

  const texture = useLabelTexture(
    lit ? `${display} ★` : display,
    lit ? LABEL_DONE : LABEL_PENDING,
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (ring.current) {
      ring.current.rotation.z += delta * (lit ? 1.1 : 0.5);
      const pulse = lit ? 1 : 1 + Math.sin(t * 2.6) * 0.08;
      ring.current.scale.set(pulse, pulse, 1);
    }

    if (beam.current) {
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = lit ? 0 : 0.2 + Math.sin(t * 2) * 0.06;
    }

    if (crown.current) {
      crown.current.visible = lit;
      crown.current.rotation.y += delta * 0.9;
      crown.current.position.y = 4.6 + Math.sin(t * 1.8) * 0.14;
    }

    if (sign.current) {
      sign.current.quaternion.copy(state.camera.quaternion);
      const bob =
        isNear && !lit ? Math.sin(t * 5) * 0.1 : Math.sin(t * 1.6) * 0.06;
      sign.current.position.y = 3.5 + bob;
    }
  });

  const color = lit ? LIT : PENDING;

  return (
    <group position={anchor.position}>
      {/* Plinth — deliberately chunky, so it reads as a place from a
          distance rather than as something small to collect. */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.5, 1.9, 0.6, 16]} />
        <meshLambertMaterial color={STONE} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[1.05, 1.25, 0.28, 16]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        {/* Radius matches ExplorerScene's STATION_RADIUS, so the ring a
            child can see is exactly the ring that opens the station. */}
        <torusGeometry args={[3.2, 0.18, 8, 32]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* Sign post */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 2, 8]} />
        <meshLambertMaterial color={STONE} />
      </mesh>

      {/* Guiding beam — the "there is something over there" signal. */}
      <mesh ref={beam} position={[0, 7, 0]}>
        <cylinderGeometry args={[0.9, 1.4, 14, 12, 1, true]} />
        <meshBasicMaterial
          color={PENDING}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Trophy crown, once the station is lit. */}
      <group ref={crown} position={[0, 4.6, 0]} visible={false}>
        {[0, 1, 2, 3, 4].map((index) => {
          const angle = (index / 5) * Math.PI * 2;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 1.1, 0, Math.sin(angle) * 1.1]}
              rotation={[0, -angle, 0]}
            >
              <coneGeometry args={[0.22, 0.55, 5]} />
              <meshLambertMaterial
                color={GOLD}
                emissive={GOLD}
                emissiveIntensity={0.7}
              />
            </mesh>
          );
        })}
      </group>

      {/* The grapheme itself */}
      <mesh ref={sign} position={[0, 3.5, 0]}>
        <planeGeometry args={[SIGN_WIDTH, SIGN_HEIGHT]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

interface SoundStationsProps {
  stations: SoundStationAnchor[];
  /** Finished turns per station id. */
  completions: Record<string, number>;
  /** Repetition target per station id. */
  repetitions: Record<string, number>;
  nearIndex: number | null;
}

export function SoundStations({
  stations,
  completions,
  repetitions,
  nearIndex,
}: SoundStationsProps) {
  return (
    <group>
      {stations.map((anchor, index) => (
        <Station
          key={anchor.id}
          anchor={anchor}
          completions={completions[anchor.id] ?? 0}
          repetitions={repetitions[anchor.id] ?? 0}
          isNear={nearIndex === index}
        />
      ))}
    </group>
  );
}
