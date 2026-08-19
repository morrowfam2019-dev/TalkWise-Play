"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import type { CourtSpot } from "@/content/basketball/types";
import { Ball, type BallFlight } from "./Ball";
import { BallerAvatar, type ShotPhase } from "./BallerAvatar";
import { Court } from "./Court";
import { Hoop } from "./Hoop";

const SKY = "#8fd8f5";

/** Smoothly moves the camera to frame the current spot's shooter and the
 * hoop together, re-centering whenever the spot changes. */
function CameraRig({ spot }: { spot: CourtSpot }) {
  const target = useRef(new THREE.Vector3());
  const { camera } = useThree();

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const x = Math.sin(spot.angle) * spot.distance;
    const z = Math.cos(spot.angle) * spot.distance;

    // Camera sits further back along the same line from the hoop, elevated.
    const camDistance = spot.distance + 4.2;
    const camX = Math.sin(spot.angle) * camDistance;
    const camZ = Math.cos(spot.angle) * camDistance;
    const camY = 2.4 + spot.distance * 0.08;

    target.current.set(camX, camY, camZ);
    camera.position.lerp(target.current, Math.min(1, delta * 4));
    camera.lookAt(x * 0.3, 2.0, z * 0.35);
  });

  return null;
}

export function CourtScene({
  spot,
  ballerId,
  jerseyId,
  phase,
  ballFlight,
  onBallArrive,
}: {
  spot: CourtSpot;
  ballerId: string;
  jerseyId: string | null;
  phase: ShotPhase;
  ballFlight: BallFlight | null;
  onBallArrive: () => void;
}) {
  const x = Math.sin(spot.angle) * spot.distance;
  const z = Math.cos(spot.angle) * spot.distance;
  const facing = spot.angle + Math.PI;

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 100, position: [0, 3, spot.distance + 4] }}
    >
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={["#bfeafd", 20, 45]} />

      <ambientLight intensity={1.1} />
      <hemisphereLight args={[SKY, "#7a5230", 0.5]} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} />
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#ffe6bd" />

      <CameraRig spot={spot} />
      <Court />
      <Hoop />

      <group position={[x, 0, z]}>
        <Suspense fallback={null}>
          <BallerAvatar
            ballerId={ballerId}
            jerseyId={jerseyId}
            phase={phase}
            facing={facing}
          />
        </Suspense>
      </group>

      <Ball flight={ballFlight} onArrive={onBallArrive} />
    </Canvas>
  );
}
