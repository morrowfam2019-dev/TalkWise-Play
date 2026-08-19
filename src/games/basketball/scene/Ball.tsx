"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface BallFlight {
  from: [number, number, number];
  to: [number, number, number];
  /** `Date.now()` at the moment the shot was released. */
  startedAt: number;
  durationMs: number;
  peakHeight: number;
}

/**
 * The ball actually in the air — a plain parabolic tween from release point
 * to target point over `durationMs`, timed against `Date.now()` rather than
 * the R3F clock so the flight can be started from ordinary React state
 * outside the canvas without caring which frame it lands on.
 */
export function Ball({
  flight,
  onArrive,
}: {
  flight: BallFlight | null;
  onArrive: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const arrived = useRef(false);

  useEffect(() => {
    arrived.current = false;
  }, [flight]);

  useFrame(() => {
    if (!flight || !mesh.current) return;
    const elapsed = Date.now() - flight.startedAt;
    const t = Math.min(1, elapsed / flight.durationMs);

    const [fx, fy, fz] = flight.from;
    const [tx, ty, tz] = flight.to;
    const x = fx + (tx - fx) * t;
    const z = fz + (tz - fz) * t;
    const baseY = fy + (ty - fy) * t;
    const arc = Math.sin(Math.PI * t) * flight.peakHeight;

    mesh.current.position.set(x, baseY + arc, z);
    mesh.current.rotation.x += 0.25;

    if (t >= 1 && !arrived.current) {
      arrived.current = true;
      onArrive();
    }
  });

  if (!flight) return null;

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.14, 14, 12]} />
      <meshLambertMaterial color="#e0742a" />
    </mesh>
  );
}
