"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Collectible } from "../world/types";

const BUBBLE = "#f5c33b";
const BUBBLE_GLOW = "#ffe08a";

/**
 * The TalkWise speech bubble, extruded as a pickup.
 *
 * Built as a filled outline (rounded body plus a tail) with three dots cut in
 * front, so it reads as the brand mark rather than a generic coin. The shape
 * is authored once and shared by every instance.
 */
function useBubbleGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    const w = 0.34;
    const h = 0.26;
    const r = 0.12;

    // Rounded-rectangle body, drawn clockwise from the left edge.
    shape.moveTo(-w, -h + r);
    shape.lineTo(-w, h - r);
    shape.quadraticCurveTo(-w, h, -w + r, h);
    shape.lineTo(w - r, h);
    shape.quadraticCurveTo(w, h, w, h - r);
    shape.lineTo(w, -h + r);
    shape.quadraticCurveTo(w, -h, w - r, -h);
    // Tail, angled down-left the way the logo's is.
    shape.lineTo(-w * 0.28, -h);
    shape.lineTo(-w * 0.42, -h - 0.2);
    shape.lineTo(-w * 0.62, -h);
    shape.lineTo(-w + r, -h);
    shape.quadraticCurveTo(-w, -h, -w, -h + r);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 8,
    });
    geometry.center();
    return geometry;
  }, []);
}

function SpeechCoin({
  collectible,
  seed,
  geometry,
}: {
  collectible: Collectible;
  seed: number;
  geometry: THREE.ExtrudeGeometry;
}) {
  const ref = useRef<THREE.Group>(null);
  const baseY = collectible.position[1];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Bobs in place and always faces the camera, so the mark stays readable
    // from wherever the player approaches it.
    ref.current.position.y = baseY + Math.sin(t * 2.1 + seed) * 0.18;
    ref.current.rotation.z = Math.sin(t * 1.5 + seed) * 0.07;
    ref.current.quaternion.setFromEuler(
      new THREE.Euler(0, state.camera.rotation.y, Math.sin(t * 1.5 + seed) * 0.07),
    );
  });

  return (
    <group ref={ref} position={collectible.position}>
      <mesh geometry={geometry}>
        <meshLambertMaterial
          color={BUBBLE}
          emissive={BUBBLE}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* The three dots, sitting proud of the front face. */}
      {[-0.16, 0, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.02, 0.11]}>
          <sphereGeometry args={[0.052, 10, 8]} />
          <meshLambertMaterial
            color={BUBBLE_GLOW}
            emissive={BUBBLE_GLOW}
            emissiveIntensity={0.65}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Renders only the speech-bubble pickups that are still uncollected. */
export function Coins({
  collectibles,
  collected,
}: {
  collectibles: Collectible[];
  collected: string[];
}) {
  const geometry = useBubbleGeometry();
  const taken = new Set(collected);
  return (
    <group>
      {collectibles.map((collectible, index) =>
        taken.has(collectible.id) ? null : (
          <SpeechCoin
            key={collectible.id}
            collectible={collectible}
            seed={index * 1.7}
            geometry={geometry}
          />
        ),
      )}
    </group>
  );
}
