"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { PlayerController } from "../core/controller";

const SKIN = "#35cfc0";
const SKIN_DARK = "#22b3a6";
const BELLY = "#fff3d8";
const LIMB = "#2f7fd4";
const BOOT = "#f5c33b";
const GOLD = "#f5c33b";
const EYE_WHITE = "#ffffff";
const EYE_DARK = "#1b2233";

/**
 * "Milo" — the original TalkWise Play character.
 *
 * A rounded, geometric friend built entirely from primitives: no external
 * model to download, and nothing derived from any existing game's character
 * design. Animation is driven straight from the controller's motion state.
 */
export function PlayerAvatar({ controller }: { controller: PlayerController }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Mesh>(null);

  const squash = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { speedRatio, strideTime, grounded, landingImpact } = controller;

    if (landingImpact > 3) {
      squash.current = Math.min(1, landingImpact / 14);
    }
    squash.current = Math.max(0, squash.current - delta * 4.5);

    const swing = Math.sin(strideTime * 9) * speedRatio * 0.75;
    const counterSwing = Math.sin(strideTime * 9 + Math.PI) * speedRatio * 0.6;

    if (grounded) {
      if (leftLeg.current) leftLeg.current.rotation.x = swing;
      if (rightLeg.current) rightLeg.current.rotation.x = -swing;
      if (leftArm.current) leftArm.current.rotation.x = counterSwing;
      if (rightArm.current) rightArm.current.rotation.x = -counterSwing;
    } else {
      // Tucked, arms up — reads clearly as "in the air".
      const airBlend = 0.6;
      if (leftLeg.current) leftLeg.current.rotation.x = -airBlend;
      if (rightLeg.current) rightLeg.current.rotation.x = airBlend * 0.4;
      if (leftArm.current) leftArm.current.rotation.x = -1.9;
      if (rightArm.current) rightArm.current.rotation.x = -1.9;
    }

    if (body.current) {
      const bob = Math.sin(strideTime * 18) * 0.035 * speedRatio;
      const breathe = Math.sin(strideTime * 2.2) * 0.012 * (1 - speedRatio);
      body.current.position.y = bob + breathe;
      body.current.rotation.z = Math.sin(strideTime * 9) * 0.05 * speedRatio;
    }

    if (root.current) {
      const s = squash.current;
      root.current.scale.set(1 + s * 0.22, 1 - s * 0.3, 1 + s * 0.22);
    }

    if (head.current) {
      head.current.rotation.z = Math.sin(strideTime * 9 + 0.6) * 0.06 * speedRatio;
    }

    if (antenna.current) {
      antenna.current.position.x = Math.sin(strideTime * 7) * 0.05 * (0.4 + speedRatio);
    }
  });

  return (
    <group ref={root}>
      <group ref={body}>
        {/* Legs */}
        <group ref={leftLeg} position={[-0.15, 0.42, 0]}>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
            <meshLambertMaterial color={LIMB} />
          </mesh>
          <mesh position={[0, -0.34, 0.05]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshLambertMaterial color={BOOT} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.15, 0.42, 0]}>
          <mesh position={[0, -0.16, 0]}>
            <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
            <meshLambertMaterial color={LIMB} />
          </mesh>
          <mesh position={[0, -0.34, 0.05]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshLambertMaterial color={BOOT} />
          </mesh>
        </group>

        {/* Torso */}
        <mesh position={[0, 0.66, 0]}>
          <capsuleGeometry args={[0.29, 0.3, 6, 12]} />
          <meshLambertMaterial color={SKIN} />
        </mesh>
        <mesh position={[0, 0.62, 0.2]} scale={[1, 1.15, 0.45]}>
          <sphereGeometry args={[0.19, 12, 10]} />
          <meshLambertMaterial color={BELLY} />
        </mesh>
        <mesh position={[0, 0.84, 0.26]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} />
        </mesh>

        {/* Arms */}
        <group ref={leftArm} position={[-0.34, 0.82, 0]}>
          <mesh position={[0, -0.14, 0]} rotation={[0, 0, 0.18]}>
            <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
            <meshLambertMaterial color={LIMB} />
          </mesh>
          <mesh position={[-0.03, -0.31, 0]}>
            <sphereGeometry args={[0.115, 10, 8]} />
            <meshLambertMaterial color={SKIN_DARK} />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.34, 0.82, 0]}>
          <mesh position={[0, -0.14, 0]} rotation={[0, 0, -0.18]}>
            <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
            <meshLambertMaterial color={LIMB} />
          </mesh>
          <mesh position={[0.03, -0.31, 0]}>
            <sphereGeometry args={[0.115, 10, 8]} />
            <meshLambertMaterial color={SKIN_DARK} />
          </mesh>
        </group>

        {/* Head */}
        <group ref={head} position={[0, 1.16, 0]}>
          <mesh>
            <sphereGeometry args={[0.36, 16, 14]} />
            <meshLambertMaterial color={SKIN} />
          </mesh>

          {/* Eyes */}
          <mesh position={[-0.13, 0.05, 0.27]}>
            <sphereGeometry args={[0.115, 12, 10]} />
            <meshLambertMaterial color={EYE_WHITE} />
          </mesh>
          <mesh position={[0.13, 0.05, 0.27]}>
            <sphereGeometry args={[0.115, 12, 10]} />
            <meshLambertMaterial color={EYE_WHITE} />
          </mesh>
          <mesh position={[-0.13, 0.05, 0.35]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshLambertMaterial color={EYE_DARK} />
          </mesh>
          <mesh position={[0.13, 0.05, 0.35]}>
            <sphereGeometry args={[0.055, 10, 8]} />
            <meshLambertMaterial color={EYE_DARK} />
          </mesh>

          {/* Smile */}
          <mesh position={[0, -0.14, 0.29]} scale={[1.5, 0.8, 0.5]}>
            <sphereGeometry args={[0.075, 12, 10]} />
            <meshLambertMaterial color={EYE_DARK} />
          </mesh>

          {/* Cheeks */}
          <mesh position={[-0.25, -0.06, 0.21]}>
            <sphereGeometry args={[0.06, 8, 7]} />
            <meshLambertMaterial color="#ff9ec4" />
          </mesh>
          <mesh position={[0.25, -0.06, 0.21]}>
            <sphereGeometry args={[0.06, 8, 7]} />
            <meshLambertMaterial color="#ff9ec4" />
          </mesh>

          {/* Antenna */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.24, 5]} />
            <meshLambertMaterial color={SKIN_DARK} />
          </mesh>
          <mesh ref={antenna} position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshLambertMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
