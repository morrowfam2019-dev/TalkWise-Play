"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
  getAura,
  getCharacter,
  getHat,
  type CharacterLook,
} from "@/content/adventures/shop";
import type { PlayerController } from "../core/controller";

const GOLD = "#f5c33b";
const EYE_WHITE = "#ffffff";
const EYE_DARK = "#1b2233";

/** What sits on top of the head — the fastest read on which character this is. */
function Crest({
  look,
  wobble,
}: {
  look: CharacterLook;
  wobble: React.RefObject<THREE.Mesh | null>;
}) {
  switch (look.crest) {
    case "ears":
      return (
        <>
          <mesh position={[-0.2, 0.34, 0]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshLambertMaterial color={look.skinDark} />
          </mesh>
          <mesh position={[0.2, 0.34, 0]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshLambertMaterial color={look.skinDark} />
          </mesh>
          <mesh ref={wobble} position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshLambertMaterial
              color={look.boot}
              emissive={look.boot}
              emissiveIntensity={0.4}
            />
          </mesh>
        </>
      );
    case "halo":
      return (
        <mesh
          ref={wobble}
          position={[0, 0.5, 0]}
          rotation={[Math.PI / 2.3, 0, 0]}
        >
          <torusGeometry args={[0.22, 0.035, 8, 20]} />
          <meshLambertMaterial
            color={look.boot}
            emissive={look.boot}
            emissiveIntensity={0.7}
          />
        </mesh>
      );
    case "leaf":
      return (
        <>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.22, 5]} />
            <meshLambertMaterial color={look.skinDark} />
          </mesh>
          <mesh
            ref={wobble}
            position={[0.1, 0.54, 0]}
            rotation={[0, 0, -0.7]}
            scale={[1, 0.4, 0.6]}
          >
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshLambertMaterial color="#8ade7c" />
          </mesh>
        </>
      );
    case "curls":
      return (
        <>
          {[
            [-0.14, 0.32, 0.08],
            [0.14, 0.32, 0.08],
            [0, 0.36, -0.08],
            [-0.08, 0.35, -0.18],
            [0.08, 0.35, -0.18],
          ].map(([x, y, z], i) => (
            <mesh
              key={i}
              position={[x, y, z]}
              ref={i === 0 ? wobble : undefined}
            >
              <sphereGeometry args={[0.1, 8, 7]} />
              <meshLambertMaterial color={look.skinDark} />
            </mesh>
          ))}
        </>
      );
    case "antenna":
    default:
      return (
        <>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.24, 5]} />
            <meshLambertMaterial color={look.skinDark} />
          </mesh>
          <mesh ref={wobble} position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshLambertMaterial
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      );
  }
}

/**
 * The equipped hat, drawn over the head. Purely cosmetic, and layered on top
 * of whichever crest the character already has — an original silhouette per
 * style rather than any franchise's exact costume.
 */
function Hat({ hatId }: { hatId: string | null }) {
  const hat = getHat(hatId);
  if (!hat) return null;

  if (hat.style === "speedster") {
    return (
      <group position={[0, 0.28, 0]}>
        <mesh rotation={[0, 0, 0]} scale={[1.02, 0.55, 1.02]}>
          <sphereGeometry
            args={[0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshLambertMaterial color={hat.primary} />
        </mesh>
        <mesh position={[-0.16, 0.1, 0.22]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.06, 0.16, 4]} />
          <meshLambertMaterial color={hat.secondary} />
        </mesh>
        <mesh position={[0.16, 0.1, 0.22]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.06, 0.16, 4]} />
          <meshLambertMaterial color={hat.secondary} />
        </mesh>
        <mesh position={[0, 0.05, 0.34]} scale={[0.5, 0.14, 0.02]}>
          <boxGeometry args={[0.5, 1, 1]} />
          <meshLambertMaterial
            color={hat.secondary}
            emissive={hat.secondary}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    );
  }

  if (hat.style === "webbed") {
    return (
      <group position={[0, 0.03, 0]}>
        <mesh scale={[1.06, 1.06, 1.06]}>
          <sphereGeometry args={[0.37, 16, 14]} />
          <meshLambertMaterial color={hat.primary} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={`h${i}`}
            rotation={[0, 0, (i / 4) * Math.PI]}
            scale={[1.07, 1.07, 1.07]}
          >
            <torusGeometry args={[0.37, 0.008, 4, 20, Math.PI]} />
            <meshLambertMaterial color={hat.secondary} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1.07, 1.07, 1.07]}>
          <torusGeometry args={[0.2, 0.008, 4, 16]} />
          <meshLambertMaterial color={hat.secondary} />
        </mesh>
        <mesh position={[-0.13, 0.08, 0.3]} scale={[1.3, 0.7, 0.5]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshLambertMaterial color={hat.secondary} />
        </mesh>
        <mesh position={[0.13, 0.08, 0.3]} scale={[1.3, 0.7, 0.5]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshLambertMaterial color={hat.secondary} />
        </mesh>
      </group>
    );
  }

  // "caped" — a cowl across the top of the head plus a cape behind the body.
  return (
    <>
      <mesh position={[0, 0.16, -0.05]} scale={[1.05, 0.6, 1.05]}>
        <sphereGeometry args={[0.37, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshLambertMaterial color={hat.primary} />
      </mesh>
      <mesh position={[0, 0.15, 0.3]} scale={[0.16, 0.16, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial
          color={hat.secondary}
          emissive={hat.secondary}
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh
        position={[0, -0.75, -0.32]}
        rotation={[0.25, 0, 0]}
        scale={[0.62, 0.9, 1]}
      >
        <planeGeometry args={[0.6, 0.9]} />
        <meshLambertMaterial color={hat.secondary} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

/** The equipped aura, drawn around the player's feet. Cosmetic only. */
function Aura({ auraId }: { auraId: string | null }) {
  const group = useRef<THREE.Group>(null);
  const aura = getAura(auraId);

  useFrame((state) => {
    if (!group.current || !aura) return;
    const t = state.clock.elapsedTime;
    if (aura.style === "orbit") {
      group.current.rotation.y = t * 1.6;
    } else if (aura.style === "sparkle") {
      group.current.rotation.y = t * 0.5;
      group.current.children.forEach((child, i) => {
        child.position.y = 0.2 + ((t * 0.8 + i * 0.33) % 1) * 1.3;
      });
    } else {
      const pulse = 1 + Math.sin(t * 3) * 0.09;
      group.current.scale.set(pulse, 1, pulse);
    }
  });

  if (!aura) return null;

  if (aura.style === "orbit") {
    return (
      <group ref={group} position={[0, 0.7, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 3) * Math.PI * 2) * 0.7,
              0,
              Math.sin((i / 3) * Math.PI * 2) * 0.7,
            ]}
          >
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshLambertMaterial
              color={aura.color}
              emissive={aura.color}
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}
      </group>
    );
  }

  if (aura.style === "sparkle") {
    return (
      <group ref={group}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 0.42,
              0.2,
              Math.sin((i / 5) * Math.PI * 2) * 0.42,
            ]}
          >
            <sphereGeometry args={[0.055, 8, 6]} />
            <meshLambertMaterial
              color={aura.color}
              emissive={aura.color}
              emissiveIntensity={0.85}
            />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group ref={group}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 24]} />
        <meshLambertMaterial
          color={aura.color}
          emissive={aura.color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * The player's character.
 *
 * A rounded, geometric friend built entirely from primitives: no external
 * model to download, and nothing derived from any existing game's character
 * design. Which character is drawn comes from the shop loadout — the
 * silhouette and palette change, the animation rig never does, so a bought
 * character costs nothing in gameplay terms.
 */
export function PlayerAvatar({
  controller,
  characterId,
  auraId,
  hatId,
}: {
  controller: PlayerController;
  characterId: string;
  auraId: string | null;
  hatId?: string | null;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const crest = useRef<THREE.Mesh>(null);

  const squash = useRef(0);
  const slideLean = useRef(0);

  const look = getCharacter(characterId).look;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { speedRatio, strideTime, grounded, landingImpact, sliding } =
      controller;

    if (landingImpact > 3) {
      squash.current = Math.min(1, landingImpact / 14);
    }
    squash.current = Math.max(0, squash.current - delta * 4.5);

    // Ease into and out of the slide pose so the duck reads as a move rather
    // than a snap between two states.
    const leanTarget = sliding ? 1 : 0;
    slideLean.current +=
      (leanTarget - slideLean.current) * Math.min(1, delta * 14);
    const lean = slideLean.current;

    const swing = Math.sin(strideTime * 9) * speedRatio * 0.75;
    const counterSwing = Math.sin(strideTime * 9 + Math.PI) * speedRatio * 0.6;

    if (sliding || lean > 0.02) {
      // Legs out front, arms swept back — a baseball slide.
      if (leftLeg.current)
        leftLeg.current.rotation.x = -1.1 * lean + swing * (1 - lean);
      if (rightLeg.current)
        rightLeg.current.rotation.x = -0.9 * lean - swing * (1 - lean);
      if (leftArm.current)
        leftArm.current.rotation.x = 1.5 * lean + counterSwing * (1 - lean);
      if (rightArm.current)
        rightArm.current.rotation.x = 1.5 * lean - counterSwing * (1 - lean);
    } else if (grounded) {
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
      body.current.position.y = (bob + breathe) * (1 - lean);
      body.current.rotation.z =
        Math.sin(strideTime * 9) * 0.05 * speedRatio * (1 - lean);
    }

    if (root.current) {
      const s = squash.current;
      // Tipping back and dropping low is what sells the slide; the collision
      // capsule shrinks in the controller, and this is the matching read.
      root.current.rotation.x = lean * 1.15;
      root.current.position.y = -lean * 0.12;
      root.current.scale.set(1 + s * 0.22, 1 - s * 0.3, 1 + s * 0.22);
    }

    if (head.current) {
      head.current.rotation.z =
        Math.sin(strideTime * 9 + 0.6) * 0.06 * speedRatio;
      head.current.rotation.x = -lean * 0.5;
    }

    if (crest.current) {
      crest.current.position.x =
        Math.sin(strideTime * 7) * 0.05 * (0.4 + speedRatio);
    }
  });

  return (
    <group>
      <Aura auraId={auraId} />
      <group ref={root}>
        <group ref={body}>
          {/* Legs */}
          <group ref={leftLeg} position={[-0.15, 0.42, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
              <meshLambertMaterial color={look.limb} />
            </mesh>
            <mesh position={[0, -0.34, 0.05]}>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshLambertMaterial color={look.boot} />
            </mesh>
          </group>
          <group ref={rightLeg} position={[0.15, 0.42, 0]}>
            <mesh position={[0, -0.16, 0]}>
              <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
              <meshLambertMaterial color={look.limb} />
            </mesh>
            <mesh position={[0, -0.34, 0.05]}>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshLambertMaterial color={look.boot} />
            </mesh>
          </group>

          {/* Torso */}
          <mesh position={[0, 0.66, 0]}>
            <capsuleGeometry args={[0.29, 0.3, 6, 12]} />
            <meshLambertMaterial color={look.skin} />
          </mesh>
          <mesh position={[0, 0.62, 0.2]} scale={[1, 1.15, 0.45]}>
            <sphereGeometry args={[0.19, 12, 10]} />
            <meshLambertMaterial color={look.belly} />
          </mesh>
          <mesh position={[0, 0.84, 0.26]}>
            <sphereGeometry args={[0.07, 10, 8]} />
            <meshLambertMaterial
              color={GOLD}
              emissive={GOLD}
              emissiveIntensity={0.3}
            />
          </mesh>

          {/* Arms */}
          <group ref={leftArm} position={[-0.34, 0.82, 0]}>
            <mesh position={[0, -0.14, 0]} rotation={[0, 0, 0.18]}>
              <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
              <meshLambertMaterial color={look.limb} />
            </mesh>
            <mesh position={[-0.03, -0.31, 0]}>
              <sphereGeometry args={[0.115, 10, 8]} />
              <meshLambertMaterial color={look.skinDark} />
            </mesh>
          </group>
          <group ref={rightArm} position={[0.34, 0.82, 0]}>
            <mesh position={[0, -0.14, 0]} rotation={[0, 0, -0.18]}>
              <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
              <meshLambertMaterial color={look.limb} />
            </mesh>
            <mesh position={[0.03, -0.31, 0]}>
              <sphereGeometry args={[0.115, 10, 8]} />
              <meshLambertMaterial color={look.skinDark} />
            </mesh>
          </group>

          {/* Head */}
          <group ref={head} position={[0, 1.16, 0]}>
            <mesh>
              <sphereGeometry args={[0.36, 16, 14]} />
              <meshLambertMaterial color={look.skin} />
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
              <meshLambertMaterial color={look.cheek} />
            </mesh>
            <mesh position={[0.25, -0.06, 0.21]}>
              <sphereGeometry args={[0.06, 8, 7]} />
              <meshLambertMaterial color={look.cheek} />
            </mesh>

            <Crest look={look} wobble={crest} />
            <Hat hatId={hatId ?? null} />
          </group>
        </group>
      </group>
    </group>
  );
}
