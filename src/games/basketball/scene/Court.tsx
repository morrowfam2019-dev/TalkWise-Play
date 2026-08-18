"use client";

import * as THREE from "three";
import { COURT_SPOTS } from "@/content/basketball/types";

const WOOD = "#c98a4b";
const LINE = "#f4ede0";

/**
 * The court floor and markings, plus small floor discs at each of the five
 * shooting spots so a child can see where they're standing without reading
 * a HUD label first.
 */
export function Court() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4]} receiveShadow={false}>
        <planeGeometry args={[22, 26]} />
        <meshLambertMaterial color={WOOD} />
      </mesh>

      {/* Center key / paint */}
      <mesh position={[0, 0, 2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 4.4]} />
        <meshBasicMaterial color={LINE} transparent opacity={0.14} />
      </mesh>

      {/* Baseline under the hoop */}
      <mesh position={[0, 0.001, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 0.06]} />
        <meshBasicMaterial color={LINE} />
      </mesh>

      {/* Three-point arc, drawn as a thin ring segment facing the hoop. */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[7.4, 7.55, 48, 1, -Math.PI * 0.42, Math.PI * 0.84]} />
        <meshBasicMaterial color={LINE} side={THREE.DoubleSide} />
      </mesh>

      {COURT_SPOTS.map((spot) => {
        const x = Math.sin(spot.angle) * spot.distance;
        const z = Math.cos(spot.angle) * spot.distance;
        return (
          <mesh key={spot.id} position={[x, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.58, 24]} />
            <meshBasicMaterial color={LINE} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}
