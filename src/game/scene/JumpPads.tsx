"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { JumpPad } from "../world/types";

const PAD_RED = "#ff3b3b";
const PAD_RED_DARK = "#c81e1e";

function Pad({ pad, seed }: { pad: JumpPad; seed: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 2.4 + seed;
    if (ring.current) {
      const scale = 1 + Math.sin(t) * 0.08;
      ring.current.scale.set(scale, scale, 1);
    }
    if (arrow.current) {
      arrow.current.position.y = 0.55 + Math.sin(t * 1.4) * 0.12;
    }
  });

  return (
    <group position={pad.position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[pad.radius * 0.85, 20]} />
        <meshLambertMaterial
          color={PAD_RED}
          emissive={PAD_RED}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh
        ref={ring}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.04, 0]}
      >
        <ringGeometry args={[pad.radius * 0.9, pad.radius, 24]} />
        <meshLambertMaterial
          color={PAD_RED_DARK}
          emissive={PAD_RED_DARK}
          emissiveIntensity={0.35}
        />
      </mesh>
      <group ref={arrow}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.28, 0.5, 4]} />
          <meshLambertMaterial
            color={PAD_RED}
            emissive={PAD_RED}
            emissiveIntensity={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Red boost pads marking where the player gets an upward launch. */
export function JumpPads({ pads }: { pads: JumpPad[] }) {
  return (
    <group>
      {pads.map((pad, index) => (
        <Pad key={pad.id} pad={pad} seed={index * 1.3} />
      ))}
    </group>
  );
}
