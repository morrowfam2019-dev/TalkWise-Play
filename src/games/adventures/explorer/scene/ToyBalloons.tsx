"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ToyBalloon } from "../maps";

/**
 * Free-standing balloons a child can pop just by walking up to one — no
 * sound required, no reward tracked. Purely a delight to find between
 * stations. Touching one sends it rising up out of reach and fading out;
 * `risingSince` (a start timestamp per id, from `Date.now()`) drives that
 * animation directly rather than through React state, so sixty balloons
 * animating at once never re-renders anything.
 */
export const TOY_RISE_DURATION_MS = 1700;
const RISE_HEIGHT = 7;

/** Stable per-balloon phase so a cluster doesn't bob in lockstep. */
function phaseFor(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 1000;
  }
  return (hash / 1000) * Math.PI * 2;
}

function Balloon({
  balloon,
  risingSince,
}: {
  balloon: ToyBalloon;
  risingSince: number | undefined;
}) {
  const group = useRef<THREE.Group>(null);
  const skin = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => phaseFor(balloon.id), [balloon.id]);
  const color = useMemo(() => new THREE.Color(balloon.color), [balloon.color]);

  useFrame((state) => {
    if (!group.current || !skin.current) return;
    const t = state.clock.elapsedTime;
    const material = skin.current.material as THREE.MeshLambertMaterial;

    const elapsed = risingSince === undefined ? Infinity : Date.now() - risingSince;
    if (elapsed < TOY_RISE_DURATION_MS) {
      const progress = elapsed / TOY_RISE_DURATION_MS;
      // Quick lift, easing out, and a fade in the second half.
      const eased = 1 - Math.pow(1 - progress, 2);
      group.current.position.y = balloon.position[1] + eased * RISE_HEIGHT;
      material.opacity = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
      material.transparent = true;
      group.current.scale.setScalar(1 - progress * 0.15);
    } else {
      // Idle: tethered, bobbing gently, fully visible.
      group.current.position.y =
        balloon.position[1] + Math.sin(t * 1.6 + phase) * 0.22;
      group.current.scale.setScalar(1);
      material.opacity = 1;
      material.transparent = false;
      group.current.rotation.z = Math.sin(t * 1.1 + phase) * 0.1;
    }
  });

  return (
    <group ref={group} position={balloon.position}>
      <mesh ref={skin} position={[0, 0.6, 0]} scale={[1, 1.2, 1]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.12, 0.24, 6]} />
        <meshLambertMaterial color="#e9e3d6" />
      </mesh>
      {/* A little string down to the ground, so it reads as tethered. */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.6, 4]} />
        <meshLambertMaterial color="#c9c2b0" />
      </mesh>
    </group>
  );
}

/**
 * `rising` maps a balloon id to the `Date.now()` timestamp its rise began.
 * The parent adds an entry when the player touches one and removes it after
 * `TOY_RISE_DURATION_MS`, which is what lets the same balloon be popped again
 * later — nothing here decides when a rise ends.
 */
export function ToyBalloons({
  balloons,
  rising,
}: {
  balloons: ToyBalloon[];
  rising: Record<string, number>;
}) {
  return (
    <group>
      {balloons.map((balloon) => (
        <Balloon key={balloon.id} balloon={balloon} risingSince={rising[balloon.id]} />
      ))}
    </group>
  );
}
