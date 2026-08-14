"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { Collectible } from "../world/types";

const GOLD = "#f5c33b";

function Coin({ collectible, seed }: { collectible: Collectible; seed: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 2.2;
    ref.current.position.y =
      collectible.position[1] + Math.sin(state.clock.elapsedTime * 2.4 + seed) * 0.16;
  });

  return (
    <group ref={ref} position={collectible.position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.26, 0.1, 8, 18]} />
        <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.45} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 16]} />
        <meshLambertMaterial color="#ffe08a" emissive="#ffe08a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** Renders only the coins that are still uncollected. */
export function Coins({
  collectibles,
  collected,
}: {
  collectibles: Collectible[];
  collected: string[];
}) {
  const taken = new Set(collected);
  return (
    <group>
      {collectibles.map((collectible, index) =>
        taken.has(collectible.id) ? null : (
          <Coin key={collectible.id} collectible={collectible} seed={index * 1.7} />
        ),
      )}
    </group>
  );
}
