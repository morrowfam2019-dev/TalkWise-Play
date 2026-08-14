"use client";

import { useMemo } from "react";
import type { WorldDefinition } from "../world/types";

const CAP_THICKNESS = 0.32;

/**
 * Renders the world's solid boxes. Each solid draws as a body plus an optional
 * grass/stone cap so flat-coloured boxes read as terraced ground rather than
 * floating cubes.
 */
export function Terrain({ world }: { world: WorldDefinition }) {
  const pieces = useMemo(
    () =>
      world.solids.map((solid) => {
        const width = solid.maxX - solid.minX;
        const depth = solid.maxZ - solid.minZ;
        const height = solid.top - solid.bottom;
        const centerX = (solid.minX + solid.maxX) / 2;
        const centerZ = (solid.minZ + solid.maxZ) / 2;
        return {
          id: solid.id,
          color: solid.color,
          capColor: solid.capColor,
          body: {
            args: [width, height, depth] as [number, number, number],
            position: [centerX, solid.bottom + height / 2, centerZ] as [
              number,
              number,
              number,
            ],
          },
          cap: {
            args: [width + 0.02, CAP_THICKNESS, depth + 0.02] as [
              number,
              number,
              number,
            ],
            position: [centerX, solid.top - CAP_THICKNESS / 2 + 0.01, centerZ] as [
              number,
              number,
              number,
            ],
          },
        };
      }),
    [world],
  );

  return (
    <group>
      {pieces.map((piece) => (
        <group key={piece.id}>
          <mesh position={piece.body.position}>
            <boxGeometry args={piece.body.args} />
            <meshLambertMaterial color={piece.color} />
          </mesh>
          {piece.capColor ? (
            <mesh position={piece.cap.position}>
              <boxGeometry args={piece.cap.args} />
              <meshLambertMaterial color={piece.capColor} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* Ocean around the island. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, world.waterLevel, 0]}
      >
        <planeGeometry args={[400, 400]} />
        <meshLambertMaterial color={world.waterColor} />
      </mesh>
    </group>
  );
}
