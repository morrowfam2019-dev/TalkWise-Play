"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { Decoration, WorldDefinition } from "../world/types";

const TRUNK = "#9a6b3f";
const LEAF_A = "#3fbf5f";
const LEAF_B = "#57d47a";
const PINE = "#2fa85a";
const ROCK = "#9aa6b6";
const CLOUD = "#ffffff";

function Tree({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.4, 6]} />
        <meshLambertMaterial color={TRUNK} />
      </mesh>
      <mesh position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.78, 10, 8]} />
        <meshLambertMaterial color={LEAF_A} />
      </mesh>
      <mesh position={[0.42, 1.35, 0.2]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshLambertMaterial color={LEAF_B} />
      </mesh>
      <mesh position={[-0.4, 1.45, -0.18]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshLambertMaterial color={LEAF_B} />
      </mesh>
    </group>
  );
}

function Pine({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.9, 6]} />
        <meshLambertMaterial color={TRUNK} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.85, 1.2, 8]} />
        <meshLambertMaterial color={PINE} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <coneGeometry args={[0.62, 1.0, 8]} />
        <meshLambertMaterial color={LEAF_A} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshLambertMaterial color={LEAF_B} />
      </mesh>
    </group>
  );
}

function Rock({ scale }: { scale: number }) {
  return (
    <mesh scale={scale} position={[0, 0.35 * scale, 0]} rotation={[0.3, 0.8, 0.2]}>
      <icosahedronGeometry args={[0.6, 0]} />
      <meshLambertMaterial color={ROCK} flatShading />
    </mesh>
  );
}

function Flower({ scale, color }: { scale: number; color: string }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 5]} />
        <meshLambertMaterial color="#3fbf5f" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.16, 8, 7]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Cloud({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 10, 8]} />
        <meshLambertMaterial color={CLOUD} />
      </mesh>
      <mesh position={[1.05, -0.18, 0.1]}>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshLambertMaterial color={CLOUD} />
      </mesh>
      <mesh position={[-0.95, -0.2, -0.1]}>
        <sphereGeometry args={[0.62, 10, 8]} />
        <meshLambertMaterial color={CLOUD} />
      </mesh>
    </group>
  );
}

/**
 * A ground-planted crystal cluster — three tall thin spikes, not a floating
 * round token. Deliberately unlike a coin in both shape and default color, so
 * a trail marker never reads as a stray pickup a child forgot to collect.
 */
function Crystal({ scale, color = "#bff2ff" }: { scale: number; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.14, 0.16, 0.05]} rotation={[0, 0, -0.25]} scale={0.6}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.12, 0.13, -0.08]} rotation={[0, 0, 0.3]} scale={0.5}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function DecorationItem({ decoration }: { decoration: Decoration }) {
  switch (decoration.kind) {
    case "tree":
      return <Tree scale={decoration.scale} />;
    case "pine":
      return <Pine scale={decoration.scale} />;
    case "rock":
      return <Rock scale={decoration.scale} />;
    case "flower":
      return <Flower scale={decoration.scale} color={decoration.color ?? "#ff8fd0"} />;
    case "cloud":
      return <Cloud scale={decoration.scale} />;
    case "crystal":
      return <Crystal scale={decoration.scale} color={decoration.color} />;
    default:
      return null;
  }
}

/** Purely visual scenery. Nothing here participates in collision. */
export function Decorations({ world }: { world: WorldDefinition }) {
  return (
    <group>
      {world.decorations.map((decoration) => (
        <group key={decoration.id} position={decoration.position}>
          <DecorationItem decoration={decoration} />
        </group>
      ))}
    </group>
  );
}
