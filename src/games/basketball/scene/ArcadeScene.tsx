"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import {
  BALL_RADIUS,
  RACK_POSITION,
  stepBall,
  type ArcadeBall,
} from "../core/arcade";
import { BallerAvatar } from "./BallerAvatar";
import { Court } from "./Court";
import { Hoop } from "./Hoop";

const SKY = "#8fd8f5";

/**
 * The ball rack — a simple ramp the balls return to. Original geometry, no
 * cabinet artwork, logos or trade dress of any kind.
 */
function BallRack() {
  return (
    <group position={[0, 0, RACK_POSITION[2] + 0.55]}>
      <mesh position={[0, 0.45, 0]} rotation={[-0.22, 0, 0]}>
        <boxGeometry args={[2.4, 0.08, 1.5]} />
        <meshLambertMaterial color="#d9832f" />
      </mesh>
      <mesh position={[-1.2, 0.62, 0]}>
        <boxGeometry args={[0.1, 0.34, 1.5]} />
        <meshLambertMaterial color="#b8651c" />
      </mesh>
      <mesh position={[1.2, 0.62, 0]}>
        <boxGeometry args={[0.1, 0.34, 1.5]} />
        <meshLambertMaterial color="#b8651c" />
      </mesh>
    </group>
  );
}

/**
 * Steps and draws every ball in the pool.
 *
 * The pool is a stable array of mutable ball objects, created once by the
 * mode and never replaced. Mutating them in the frame loop rather than
 * routing them through `setState` is deliberate and is the one place in this
 * game where it is the right call: up to eight balls are integrated every
 * frame at 60fps, and re-rendering the whole mode 480 times a second would
 * buy nothing. React owns the round; the frame loop owns the physics.
 *
 * A fixed set of meshes is created once and reused — nothing is mounted or
 * unmounted per shot, so a 30-second flick frenzy allocates no geometry and
 * leaks no objects.
 */
function BallPool({
  pool,
  onBallEvent,
}: {
  pool: ArcadeBall[];
  onBallEvent: (ball: ArcadeBall) => void;
}) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, rawDelta) => {
    // Clamped so a backgrounded tab resuming cannot teleport every ball
    // through the rim plane in a single enormous step.
    const delta = Math.min(rawDelta, 1 / 30);

    for (let i = 0; i < pool.length; i += 1) {
      const ball = pool[i];
      const mesh = meshes.current[i];

      if (ball.active) {
        stepBall(ball, delta);
        onBallEvent(ball);
      }

      if (!mesh) continue;
      mesh.visible = ball.active;
      if (ball.active) {
        mesh.position.set(ball.x, ball.y, ball.z);
        mesh.rotation.x += 0.3;
        mesh.rotation.z += 0.12;
      }
    }
  });

  return (
    <>
      {pool.map((ball, index) => (
        <mesh
          key={ball.id}
          ref={(node) => {
            meshes.current[index] = node;
          }}
          visible={false}
        >
          <sphereGeometry args={[BALL_RADIUS, 14, 12]} />
          <meshLambertMaterial color="#e0742a" />
        </mesh>
      ))}
    </>
  );
}

/** The ball waiting to be flicked, drawn only while one is ready. */
function ReadyBall({ visible }: { visible: boolean }) {
  return (
    <mesh position={[...RACK_POSITION]} visible={visible}>
      <sphereGeometry args={[BALL_RADIUS, 16, 14]} />
      <meshLambertMaterial color="#f08a3c" emissive="#7a3a10" emissiveIntensity={0.25} />
    </mesh>
  );
}

export function ArcadeScene({
  pool,
  ballerId,
  jerseyId,
  ballReady,
  onBallEvent,
}: {
  pool: ArcadeBall[];
  ballerId: string;
  jerseyId: string | null;
  ballReady: boolean;
  onBallEvent: (ball: ArcadeBall) => void;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // Fixed arcade framing: the hoop and the rack both in shot, no camera
      // movement at all. A moving camera would fight the drag gesture, since
      // the child is aiming in screen space.
      camera={{ fov: 52, near: 0.1, far: 100, position: [0, 3.1, 10.6] }}
    >
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={["#bfeafd", 22, 48]} />

      <ambientLight intensity={1.1} />
      <hemisphereLight args={[SKY, "#7a5230", 0.5]} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} />
      <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#ffe6bd" />

      <Court />
      <Hoop />
      <BallRack />

      {/* The child's chosen baller stands beside the rack, cheering rather
          than shooting — in Time Attack the child's own hand is the shooter.
          Uses the same selected baller as every other Basketball mode. */}
      <group position={[2.1, 0, RACK_POSITION[2] + 0.2]}>
        <Suspense fallback={null}>
          <BallerAvatar
            ballerId={ballerId}
            jerseyId={jerseyId}
            phase="idle"
            facing={Math.PI + 0.35}
          />
        </Suspense>
      </group>

      <ReadyBall visible={ballReady} />
      <BallPool pool={pool} onBallEvent={onBallEvent} />
    </Canvas>
  );
}
