"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getBaller, getJersey, type BallerLook } from "@/content/basketball/roster";

const EYE_WHITE = "#ffffff";
const EYE_DARK = "#1b2233";
const SNEAKER = "#f4f4f8";
const SNEAKER_SOLE = "#e3402a";

export type ShotPhase = "idle" | "aiming" | "releasing" | "made" | "missed";

/** Hair geometry on top of the head — a human-proportioned equivalent of
 * the adventure engine's crest, built from the same shop-preview shapes so
 * a baller in 3D matches its shop-card preview. */
function Hair({ look }: { look: BallerLook }) {
  switch (look.hairStyle) {
    case "puff":
      return (
        <mesh position={[0, 0.3, -0.02]}>
          <sphereGeometry args={[0.24, 14, 12]} />
          <meshLambertMaterial color={look.hair} />
        </mesh>
      );
    case "braids":
      return (
        <>
          {[-0.14, 0, 0.14].map((x) => (
            <mesh key={x} position={[x, 0.05, -0.1]} rotation={[0.3, 0, 0]}>
              <capsuleGeometry args={[0.035, 0.28, 4, 6]} />
              <meshLambertMaterial color={look.hair} />
            </mesh>
          ))}
          <mesh position={[0, 0.26, 0]} scale={[1.02, 0.6, 1.02]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshLambertMaterial color={look.hair} />
          </mesh>
        </>
      );
    case "bun":
      return (
        <>
          <mesh position={[0, 0.22, 0]} scale={[1.02, 0.55, 1.02]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshLambertMaterial color={look.hair} />
          </mesh>
          <mesh position={[0, 0.42, -0.05]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshLambertMaterial color={look.hair} />
          </mesh>
        </>
      );
    case "curly":
      return (
        <group position={[0, 0.24, 0]}>
          {[
            [0, 0.06, 0],
            [-0.12, 0, 0.05],
            [0.12, 0, 0.05],
            [-0.09, 0.02, -0.14],
            [0.09, 0.02, -0.14],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.11, 10, 8]} />
              <meshLambertMaterial color={look.hair} />
            </mesh>
          ))}
        </group>
      );
    case "fade":
      return (
        <mesh position={[0, 0.24, -0.02]} scale={[1.03, 0.42, 1.03]}>
          <sphereGeometry args={[0.22, 14, 12]} />
          <meshLambertMaterial color={look.hair} />
        </mesh>
      );
    case "short":
    default:
      return (
        <mesh position={[0, 0.24, -0.02]} scale={[1.02, 0.5, 1.02]}>
          <sphereGeometry args={[0.22, 14, 12]} />
          <meshLambertMaterial color={look.hair} />
        </mesh>
      );
  }
}

/**
 * A basketball-styled player: human proportions, jersey, shorts, sneakers —
 * deliberately not the adventure engine's rounded blob rig, because a
 * baller needs to actually look like a basketball player. Palette and
 * hairstyle come from the equipped baller; jersey colors from the equipped
 * jersey, both bought from the same store as everything else.
 */
export function BallerAvatar({
  ballerId,
  jerseyId,
  phase,
  facing = 0,
}: {
  ballerId: string;
  jerseyId: string | null;
  phase: ShotPhase;
  /** Yaw, radians — faces the hoop for the current court spot. */
  facing?: number;
}) {
  const look = getBaller(ballerId).look;
  const jersey = getJersey(jerseyId) ?? getJersey("jersey-home")!;

  const root = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const bob = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    bob.current += delta;

    const idleBob = phase === "idle" || phase === "aiming" ? Math.sin(bob.current * 2.4) * 0.02 : 0;
    if (root.current) {
      root.current.position.y = idleBob;
      root.current.rotation.y = facing;
    }

    // Shooting arm: rests low, rises through "aiming", extends fully at
    // "releasing", then relaxes back down once the shot is away.
    const targetLift =
      phase === "aiming" ? -1.7 : phase === "releasing" ? -2.7 : -0.3;
    if (rightArm.current) {
      rightArm.current.rotation.x +=
        (targetLift - rightArm.current.rotation.x) * Math.min(1, delta * 10);
    }
    if (leftArm.current) {
      const supportLift = phase === "aiming" || phase === "releasing" ? -1.5 : -0.2;
      leftArm.current.rotation.x +=
        (supportLift - leftArm.current.rotation.x) * Math.min(1, delta * 10);
    }

    // The held ball rides the shooting hand until release, then vanishes
    // (the real animated shot ball in the scene takes over).
    if (ball.current) {
      ball.current.visible = phase === "idle" || phase === "aiming";
    }

    const t = state.clock.elapsedTime;
    if (root.current && (phase === "made" || phase === "missed")) {
      root.current.position.y = idleBob + Math.max(0, Math.sin(t * 6)) * (phase === "made" ? 0.06 : 0);
    }
  });

  return (
    <group ref={root}>
      {/* Legs */}
      <group position={[-0.11, 0.5, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.075, 0.32, 4, 8]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
        <mesh position={[0, -0.44, 0.05]}>
          <boxGeometry args={[0.15, 0.09, 0.22]} />
          <meshLambertMaterial color={SNEAKER} />
        </mesh>
        <mesh position={[0, -0.485, 0.05]}>
          <boxGeometry args={[0.155, 0.02, 0.22]} />
          <meshLambertMaterial color={SNEAKER_SOLE} />
        </mesh>
      </group>
      <group position={[0.11, 0.5, 0]}>
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.075, 0.32, 4, 8]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
        <mesh position={[0, -0.44, 0.05]}>
          <boxGeometry args={[0.15, 0.09, 0.22]} />
          <meshLambertMaterial color={SNEAKER} />
        </mesh>
        <mesh position={[0, -0.485, 0.05]}>
          <boxGeometry args={[0.155, 0.02, 0.22]} />
          <meshLambertMaterial color={SNEAKER_SOLE} />
        </mesh>
      </group>

      {/* Shorts */}
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[0.2, 0.14, 4, 10]} />
        <meshLambertMaterial color={jersey.secondary} />
      </mesh>

      {/* Torso / jersey */}
      <mesh position={[0, 0.94, 0]}>
        <capsuleGeometry args={[0.19, 0.36, 6, 12]} />
        <meshLambertMaterial color={jersey.primary} />
      </mesh>
      <mesh position={[0, 0.94, 0.16]} scale={[0.5, 0.9, 0.3]}>
        <sphereGeometry args={[0.19, 10, 8]} />
        <meshLambertMaterial color={jersey.secondary} />
      </mesh>

      {/* Arms */}
      <group ref={leftArm} position={[-0.26, 1.12, 0]}>
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0.12]}>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.26, 1.12, 0]}>
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, -0.12]}>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
        <mesh ref={ball} position={[0, -0.36, 0.05]}>
          <sphereGeometry args={[0.1, 12, 10]} />
          <meshLambertMaterial color="#e0742a" />
        </mesh>
      </group>

      {/* Head */}
      <group position={[0, 1.32, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 14]} />
          <meshLambertMaterial color={look.skin} />
        </mesh>
        <Hair look={look} />
        <mesh position={[-0.08, 0.01, 0.17]}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <meshLambertMaterial color={EYE_WHITE} />
        </mesh>
        <mesh position={[0.08, 0.01, 0.17]}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <meshLambertMaterial color={EYE_WHITE} />
        </mesh>
        <mesh position={[-0.08, 0.01, 0.21]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshLambertMaterial color={EYE_DARK} />
        </mesh>
        <mesh position={[0.08, 0.01, 0.21]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshLambertMaterial color={EYE_DARK} />
        </mesh>
        <mesh position={[0, -0.08, 0.18]} scale={[1.4, 0.7, 0.5]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshLambertMaterial color={EYE_DARK} />
        </mesh>
      </group>
    </group>
  );
}
