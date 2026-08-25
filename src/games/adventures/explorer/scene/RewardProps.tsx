"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { RewardProp } from "../maps";

/**
 * The part of a Beginner map that speech switches on.
 *
 * Every prop here exists from the moment the map loads, but dark, still and
 * grey. When the station it belongs to is fully practised it turns its
 * colour on, starts moving, and stays that way. That is the whole Beginner
 * reward loop expressed in geometry: the park does not hand a child a score,
 * it *changes* because they talked to it.
 *
 * None of these collide. A child can run straight through a fountain.
 */

const OFF = "#9aa6b6";

/**
 * Eases a prop's 0 → 1 "switched on" value every frame.
 *
 * Held in refs rather than state because it changes sixty times a second and
 * nothing in React needs to re-render for it — the same discipline the
 * gameplay controller applies to movement.
 */
function useGlow(lit: boolean) {
  const target = useRef(lit ? 1 : 0);
  const glow = useRef({ glow: lit ? 1 : 0 });

  useEffect(() => {
    target.current = lit ? 1 : 0;
  }, [lit]);

  useFrame((_, delta) => {
    const step = Math.min(1, delta * 3.2);
    glow.current.glow += (target.current - glow.current.glow) * step;
  });

  return glow;
}

/** Stable per-prop offset so a row of balloons does not bob in lockstep.
 * Derived from the id rather than random, so it is the same every render. */
function phaseFor(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 1000;
  }
  return (hash / 1000) * Math.PI * 2;
}

function Lantern({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const bulb = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#ffd76a"),
    [prop.color],
  );
  const off = useMemo(() => new THREE.Color(OFF), []);

  useFrame((state) => {
    const g = glow.current.glow;
    if (bulb.current) {
      const material = bulb.current.material as THREE.MeshLambertMaterial;
      material.color.copy(off).lerp(color, g);
      material.emissive.copy(color);
      material.emissiveIntensity = g * (0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.12);
    }
    if (halo.current) {
      const material = halo.current.material as THREE.MeshBasicMaterial;
      material.opacity = g * 0.28;
      halo.current.scale.setScalar(0.7 + g * 0.5);
    }
  });

  return (
    <group position={prop.position} scale={prop.scale ?? 1}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 1.8, 8]} />
        <meshLambertMaterial color="#6b5a45" />
      </mesh>
      <mesh ref={bulb} position={[0, 2, 0]}>
        <sphereGeometry args={[0.36, 12, 10]} />
        <meshLambertMaterial color={OFF} />
      </mesh>
      <mesh ref={halo} position={[0, 2, 0]}>
        <sphereGeometry args={[0.85, 10, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Balloon({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const group = useRef<THREE.Group>(null);
  const skin = useRef<THREE.Mesh>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#ff6f91"),
    [prop.color],
  );
  const off = useMemo(() => new THREE.Color(OFF), []);
  const phase = useMemo(() => phaseFor(prop.id), [prop.id]);

  useFrame((state) => {
    const g = glow.current.glow;
    const t = state.clock.elapsedTime;
    if (skin.current) {
      const material = skin.current.material as THREE.MeshLambertMaterial;
      material.color.copy(off).lerp(color, g);
    }
    if (group.current) {
      // Deflated and on the ground until lit, then floating and bobbing.
      group.current.position.y =
        prop.position[1] + g * (2.2 + Math.sin(t * 1.4 + phase) * 0.28);
      group.current.scale.setScalar(0.45 + g * 0.55);
      group.current.rotation.z = Math.sin(t * 0.9 + phase) * 0.12 * g;
    }
  });

  return (
    <group ref={group} position={prop.position}>
      <mesh ref={skin} position={[0, 0.6, 0]} scale={[1, 1.2, 1]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshLambertMaterial color={OFF} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <coneGeometry args={[0.12, 0.24, 6]} />
        <meshLambertMaterial color="#e9e3d6" />
      </mesh>
    </group>
  );
}

function Pinwheel({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const blades = useRef<THREE.Group>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#ff8fb1"),
    [prop.color],
  );
  const off = useMemo(() => new THREE.Color(OFF), []);

  useFrame((_, delta) => {
    const g = glow.current.glow;
    if (blades.current) {
      blades.current.rotation.z += delta * 3.4 * g;
      for (const child of blades.current.children) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshLambertMaterial;
        material.color.copy(off).lerp(color, g);
      }
    }
  });

  return (
    <group position={prop.position} scale={prop.scale ?? 1}>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.7, 6]} />
        <meshLambertMaterial color="#e9e3d6" />
      </mesh>
      <group ref={blades} position={[0, 1.8, 0.12]}>
        {[0, 1, 2, 3].map((index) => (
          <mesh
            key={index}
            rotation={[0, 0, (index / 4) * Math.PI * 2]}
            position={[
              Math.cos((index / 4) * Math.PI * 2) * 0.4,
              Math.sin((index / 4) * Math.PI * 2) * 0.4,
              0,
            ]}
          >
            <planeGeometry args={[0.68, 0.34]} />
            <meshLambertMaterial color={OFF} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const JET_COUNT = 8;

function Fountain({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const jets = useRef<THREE.Group>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#8fe6ff"),
    [prop.color],
  );

  useFrame((state) => {
    const g = glow.current.glow;
    const t = state.clock.elapsedTime;
    if (!jets.current) return;
    jets.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      // Each droplet runs its own loop up and back down.
      const cycle = (t * 0.9 + index / JET_COUNT) % 1;
      const height = Math.sin(cycle * Math.PI) * 2.6 * g;
      const angle = (index / JET_COUNT) * Math.PI * 2;
      const spread = cycle * 1.3;
      mesh.position.set(
        Math.cos(angle) * spread,
        0.4 + height,
        Math.sin(angle) * spread,
      );
      mesh.scale.setScalar(g * (0.9 - cycle * 0.4));
      const material = mesh.material as THREE.MeshLambertMaterial;
      material.opacity = g;
    });
  });

  return (
    <group position={prop.position}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1.5, 1.7, 0.4, 16]} />
        <meshLambertMaterial color="#e6e0d2" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[1.28, 1.28, 0.08, 16]} />
        <meshLambertMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <group ref={jets}>
        {Array.from({ length: JET_COUNT }, (_, index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshLambertMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.5}
              transparent
              opacity={0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Starpost({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const star = useRef<THREE.Mesh>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#cfe8ff"),
    [prop.color],
  );
  const off = useMemo(() => new THREE.Color(OFF), []);

  useFrame((state, delta) => {
    const g = glow.current.glow;
    if (!star.current) return;
    star.current.rotation.y += delta * 1.4 * (0.2 + g);
    star.current.position.y = 2.4 + Math.sin(state.clock.elapsedTime * 1.6) * 0.2 * g;
    const material = star.current.material as THREE.MeshLambertMaterial;
    material.color.copy(off).lerp(color, g);
    material.emissive.copy(color);
    material.emissiveIntensity = g * 0.85;
  });

  return (
    <group position={prop.position} scale={prop.scale ?? 1}>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 2.2, 8]} />
        <meshLambertMaterial color="#cfd6e0" />
      </mesh>
      <mesh ref={star} position={[0, 2.4, 0]}>
        <octahedronGeometry args={[0.62, 0]} />
        <meshLambertMaterial color={OFF} />
      </mesh>
    </group>
  );
}

function Archway({ prop, lit }: { prop: RewardProp; lit: boolean }) {
  const arc = useRef<THREE.Mesh>(null);
  const glow = useGlow(lit);
  const color = useMemo(
    () => new THREE.Color(prop.color ?? "#ffd76a"),
    [prop.color],
  );
  const off = useMemo(() => new THREE.Color(OFF), []);

  useFrame((state) => {
    const g = glow.current.glow;
    if (!arc.current) return;
    const material = arc.current.material as THREE.MeshLambertMaterial;
    material.color.copy(off).lerp(color, g);
    material.emissive.copy(color);
    material.emissiveIntensity =
      g * (0.6 + Math.sin(state.clock.elapsedTime * 1.5) * 0.16);
  });

  return (
    <group position={prop.position} scale={prop.scale ?? 1}>
      <mesh position={[-2.4, 1.5, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 3, 8]} />
        <meshLambertMaterial color="#e6e0d2" />
      </mesh>
      <mesh position={[2.4, 1.5, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 3, 8]} />
        <meshLambertMaterial color="#e6e0d2" />
      </mesh>
      {/* A torus lies in the XY plane and its 0→PI arc is the top half, so
          an unrotated half-torus is already a standing arch. */}
      <mesh ref={arc} position={[0, 3, 0]}>
        <torusGeometry args={[2.4, 0.24, 8, 24, Math.PI]} />
        <meshLambertMaterial color={OFF} />
      </mesh>
    </group>
  );
}

const RENDERERS = {
  lantern: Lantern,
  balloon: Balloon,
  pinwheel: Pinwheel,
  fountain: Fountain,
  starpost: Starpost,
  archway: Archway,
} as const;

export function RewardProps({
  props: rewardProps,
  litIds,
}: {
  props: RewardProp[];
  /** Ids of every prop currently switched on. */
  litIds: string[];
}) {
  const lit = useMemo(() => new Set(litIds), [litIds]);
  return (
    <group>
      {rewardProps.map((prop) => {
        const Renderer = RENDERERS[prop.kind];
        return <Renderer key={prop.id} prop={prop} lit={lit.has(prop.id)} />;
      })}
    </group>
  );
}
