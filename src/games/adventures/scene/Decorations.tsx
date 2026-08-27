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
    <mesh
      scale={scale}
      position={[0, 0.35 * scale, 0]}
      rotation={[0.3, 0.8, 0.2]}
    >
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
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
        />
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
function Crystal({
  scale,
  color = "#bff2ff",
}: {
  scale: number;
  color?: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0.14, 0.16, 0.05]} rotation={[0, 0, -0.25]} scale={0.6}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[-0.12, 0.13, -0.08]} rotation={[0, 0, 0.3]} scale={0.5}>
        <coneGeometry args={[0.13, 0.6, 5]} />
        <meshLambertMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

const WALL = "#f7e2c0";
const ROOF = "#e0685a";
const ROOF_DARK = "#c94f43";
const DOOR = "#8a5a34";
const FRAME = "#b9895a";
const MATTRESS = "#ff9dc4";
const MATTRESS_TRIM = "#ffe066";
const PILLOW = "#ffffff";

/**
 * A small open-sided cottage, big enough for a child avatar to stand under.
 * Built from separate wall panels with a gap left for the doorway rather
 * than one solid box — decorations never collide, so nothing needs cutting,
 * but a single box would just look like a block. Roomy enough on the inside
 * for the bouncy-bed decoration and its jump pad to sit under the roofline.
 */
function House({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      {/* Back and side walls — solid. */}
      <mesh position={[0, 1.4, -2.4]}>
        <boxGeometry args={[4.8, 2.8, 0.2]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh position={[-2.4, 1.4, 0]}>
        <boxGeometry args={[0.2, 2.8, 4.8]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh position={[2.4, 1.4, 0]}>
        <boxGeometry args={[0.2, 2.8, 4.8]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      {/* Front wall, split with a doorway gap in the middle. */}
      <mesh position={[-1.7, 1.4, 2.4]}>
        <boxGeometry args={[1.4, 2.8, 0.2]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh position={[1.7, 1.4, 2.4]}>
        <boxGeometry args={[1.4, 2.8, 0.2]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      <mesh position={[0, 2.5, 2.4]}>
        <boxGeometry args={[2, 0.6, 0.2]} />
        <meshLambertMaterial color={WALL} />
      </mesh>
      {/* Door leaf, propped open beside the gap. */}
      <mesh position={[-1.05, 1, 2.55]} rotation={[0, 0.9, 0]}>
        <boxGeometry args={[1.2, 2, 0.08]} />
        <meshLambertMaterial color={DOOR} />
      </mesh>
      {/* Hip roof — two big angled planes meeting at a ridge. */}
      <mesh position={[0, 3.1, -1.15]} rotation={[0.62, 0, 0]}>
        <boxGeometry args={[5.4, 0.15, 3.2]} />
        <meshLambertMaterial color={ROOF} />
      </mesh>
      <mesh position={[0, 3.1, 1.15]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[5.4, 0.15, 3.2]} />
        <meshLambertMaterial color={ROOF} />
      </mesh>
      <mesh position={[0, 4.15, 0]}>
        <boxGeometry args={[5.5, 0.2, 0.2]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>
      {/* Little round window either side of the door. */}
      <mesh position={[-2.51, 1.7, 0.8]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.42, 12]} />
        <meshLambertMaterial color="#bfe8ff" />
      </mesh>
      <mesh position={[2.51, 1.7, 0.8]} rotation={[0, -Math.PI / 2, 0]}>
        <circleGeometry args={[0.42, 12]} />
        <meshLambertMaterial color="#bfe8ff" />
      </mesh>
    </group>
  );
}

/**
 * A bouncy bed — the visual half of the house's trampoline. The actual
 * bounce is a `hidden` jump pad placed at the same position; this is what
 * makes it read as furniture instead of a launch pad.
 */
function Bed({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[2.4, 0.5, 3.4]} />
        <meshLambertMaterial color={FRAME} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[2.3, 0.34, 3.3]} />
        <meshLambertMaterial color={MATTRESS} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[2.34, 0.06, 3.34]} />
        <meshLambertMaterial color={MATTRESS_TRIM} />
      </mesh>
      <mesh position={[0, 0.98, -1.35]}>
        <boxGeometry args={[1.9, 0.34, 0.6]} />
        <meshLambertMaterial color={PILLOW} />
      </mesh>
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.05, -1.55]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 6]} />
          <meshLambertMaterial color={FRAME} />
        </mesh>
      ))}
      {[-1.05, 1.05].map((x) => (
        <mesh key={`f-${x}`} position={[x, 0.05, 1.55]}>
          <cylinderGeometry args={[0.1, 0.1, 0.6, 6]} />
          <meshLambertMaterial color={FRAME} />
        </mesh>
      ))}
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
      return (
        <Flower
          scale={decoration.scale}
          color={decoration.color ?? "#ff8fd0"}
        />
      );
    case "cloud":
      return <Cloud scale={decoration.scale} />;
    case "crystal":
      return <Crystal scale={decoration.scale} color={decoration.color} />;
    case "house":
      return <House scale={decoration.scale} />;
    case "bed":
      return <Bed scale={decoration.scale} />;
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
