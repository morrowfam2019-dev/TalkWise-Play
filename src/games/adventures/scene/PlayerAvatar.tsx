"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createChestLogoTexture } from "../core/chestLogoTexture";
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
/** TJ's dad hat. Not pure black — a flat #000 reads as a hole in the world
 * under this scene's lighting. */
const CAP_BLACK = "#15161c";
const CAP_GREY = "#3b3d47";

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
    case "cap":
      return (
        <>
          <mesh position={[0, 0.2, 0]} scale={[1, 0.6, 1]}>
            <sphereGeometry
              args={[0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshLambertMaterial color={CAP_BLACK} />
          </mesh>
          <mesh
            ref={wobble}
            position={[0, 0.2, 0.2]}
            rotation={[0.2, 0, 0]}
            scale={[1, 0.12, 1]}
          >
            <sphereGeometry args={[0.26, 14, 10]} />
            <meshLambertMaterial color={CAP_BLACK} />
          </mesh>
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

/* ------------------------------------------------------------------ */
/* TJ                                                                   */
/* ------------------------------------------------------------------ */

/**
 * TJ's meshes, drawn into the same joints as everybody else's.
 *
 * He is the one named character in the shop — a child sees him on the game
 * cards before they ever unlock him — so a recoloured blob was the wrong
 * body. These parts give him the hoodie, joggers, trainers and afro from the
 * approved art while dropping into the exact joint slots the animation
 * already drives, which is why the walk, jump, slide, hats and auras all
 * keep working untouched.
 *
 * Everything is still primitives: no mesh to download, and the whole
 * character costs about forty extra triangles over the blob.
 *
 * ## The Higgsfield mesh, and why it is not wired up
 *
 * A textured, rigged, walk-animated GLB of TJ was generated from the
 * approved art (Higgsfield element `tj-talkwise-play`). It is not in the
 * repo: the agent proxy blocks the CDN that serves Higgsfield output, so
 * the file has to be downloaded by hand and committed.
 *
 * Swapping it in is not a flag, either — unlike Basketball, which can treat
 * its meshes as rigid because a baller only leans and bounces, this
 * character walks, jumps and slides. A GLB here needs an `AnimationMixer`
 * driven from `controller.speedRatio` and `grounded`, and the clip and bone
 * names have to be read off the actual file first. Do that with the file in
 * hand, not from a description of it.
 */

/** Reads the hoodie's shadowed tone off its main colour. */
function shade(hex: string, amount = 0.72): string {
  const c = new THREE.Color(hex);
  c.multiplyScalar(amount);
  return `#${c.getHexString()}`;
}

function TjLeg({ look }: { look: CharacterLook }) {
  return (
    <>
      {/* Jogger */}
      <mesh position={[0, -0.16, 0]}>
        <capsuleGeometry args={[0.1, 0.18, 4, 8]} />
        <meshLambertMaterial color={look.limb} />
      </mesh>
      {/* Trainer, toes forward so the stride reads from the side */}
      <mesh position={[0, -0.33, 0.06]}>
        <boxGeometry args={[0.2, 0.12, 0.29]} />
        <meshLambertMaterial color={look.boot} />
      </mesh>
      {/* White sole */}
      <mesh position={[0, -0.39, 0.06]}>
        <boxGeometry args={[0.22, 0.06, 0.31]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
    </>
  );
}

function TjArm({ look, side }: { look: CharacterLook; side: -1 | 1 }) {
  return (
    <>
      {/* Hoodie sleeve */}
      <mesh position={[0, -0.15, 0]} rotation={[0, 0, side * -0.16]}>
        <capsuleGeometry args={[0.088, 0.24, 4, 8]} />
        <meshLambertMaterial color={look.belly} />
      </mesh>
      {/* Cuff */}
      <mesh position={[side * 0.045, -0.3, 0]}>
        <cylinderGeometry args={[0.083, 0.083, 0.05, 10]} />
        <meshLambertMaterial color={shade(look.belly)} />
      </mesh>
      {/* Hand */}
      <mesh position={[side * 0.055, -0.37, 0]}>
        <sphereGeometry args={[0.093, 10, 8]} />
        <meshLambertMaterial color={look.skin} />
      </mesh>
    </>
  );
}

function TjTorso({ look }: { look: CharacterLook }) {
  const logo = useMemo(() => createChestLogoTexture("TJ"), []);
  useEffect(() => () => logo.dispose(), [logo]);
  const hoodieDark = shade(look.belly);

  return (
    <>
      {/* Hoodie. Deliberately shorter than the blob torso it replaces: at
          the original length the hem reached the trainers and he had no
          visible joggers at all, which lost half the outfit. */}
      <mesh position={[0, 0.72, 0]}>
        <capsuleGeometry args={[0.27, 0.24, 6, 12]} />
        <meshLambertMaterial color={look.belly} />
      </mesh>
      {/* Hem, so the hoodie ends somewhere instead of fading into the legs */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.265, 0.25, 0.08, 14]} />
        <meshLambertMaterial color={hoodieDark} />
      </mesh>
      {/* Hood, bunched behind the neck */}
      <mesh position={[0, 0.93, -0.15]} scale={[1, 0.8, 0.9]}>
        <sphereGeometry args={[0.21, 14, 10]} />
        <meshLambertMaterial color={hoodieDark} />
      </mesh>
      {/* Backpack */}
      <mesh position={[0, 0.72, -0.29]}>
        <boxGeometry args={[0.3, 0.36, 0.16]} />
        <meshLambertMaterial color={hoodieDark} />
      </mesh>
      <mesh position={[0, 0.62, -0.38]}>
        <boxGeometry args={[0.24, 0.1, 0.04]} />
        <meshLambertMaterial color={look.boot} />
      </mesh>
      {/* The white "TJ" chest mark */}
      <mesh position={[0, 0.74, 0.268]}>
        <planeGeometry args={[0.25, 0.25]} />
        <meshBasicMaterial map={logo} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

/**
 * TJ's black dad hat, and the close-cut fade under it.
 *
 * He wore an afro here first. It was the right call from the cover art and
 * the wrong one on screen: at the size he actually appears it was a large
 * brown mass that fought the head shape from every angle, and the founder
 * called it. The cap gives him a flat, dark, unmistakable silhouette
 * instead — low crown, curved brim, no crease — and it reads at a glance
 * from across a phone, which the afro never quite did.
 *
 * The fade underneath is not decoration: without it he is bald whenever a
 * bought hat replaces the cap.
 */
function TjCap({
  look,
  wearingHat,
}: {
  look: CharacterLook;
  wearingHat: boolean;
}) {
  const hair = look.hair ?? look.skinDark;
  return (
    <>
      {/* Close-cut hair, all the way round.
          Everything on this head — hair, band, crown, brim — has to start
          ABOVE y=0.16. The first pass sat the band and brim at eye level and
          he came out wearing a black bandit mask: a dark strip straight
          across two white slits. The brows top out at 0.183; nothing but the
          brim's leading edge goes lower than that. */}
      <mesh position={[0, 0.15, -0.02]} scale={[1.01, 0.9, 1.01]}>
        <sphereGeometry
          args={[0.352, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshLambertMaterial color={hair} />
      </mesh>

      {/* A bought hat wins over his own — the child picked it. Skipping the
          cap here is what stops two hats stacking on one head. */}
      {wearingHat ? null : (
        <>
          {/* The band the crown sits on, so it meets the head in a line
              instead of floating. */}
          <mesh position={[0, 0.2, -0.01]}>
            <cylinderGeometry args={[0.368, 0.363, 0.09, 20]} />
            <meshLambertMaterial color={CAP_BLACK} />
          </mesh>
          {/* Crown — low and soft, the dad-hat shape rather than a
              structured ball cap's tall front panel. */}
          <mesh position={[0, 0.21, -0.01]} scale={[1.01, 0.8, 1.02]}>
            <sphereGeometry
              args={[0.368, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshLambertMaterial color={CAP_BLACK} />
          </mesh>
          {/* Curved brim, tipped down at the front and set high enough that
              it shades his forehead rather than his eyes. */}
          <mesh
            position={[0, 0.185, 0.28]}
            rotation={[0.3, 0, 0]}
            scale={[1.32, 0.09, 1.05]}
          >
            <sphereGeometry args={[0.3, 18, 12]} />
            <meshLambertMaterial color={CAP_BLACK} />
          </mesh>
          {/* Underside of the brim, a shade lighter so the curve reads
              against the crown rather than merging into one black blob. */}
          <mesh
            position={[0, 0.168, 0.28]}
            rotation={[0.3, 0, 0]}
            scale={[1.26, 0.05, 1]}
          >
            <sphereGeometry args={[0.3, 18, 12]} />
            <meshLambertMaterial color={CAP_GREY} />
          </mesh>
          {/* Button on top */}
          <mesh position={[0, 0.5, -0.01]}>
            <sphereGeometry args={[0.036, 10, 8]} />
            <meshLambertMaterial color={CAP_GREY} />
          </mesh>
        </>
      )}
    </>
  );
}

function TjFace({ look }: { look: CharacterLook }) {
  return (
    <>
      {/* Ears */}
      <mesh position={[-0.34, -0.02, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshLambertMaterial color={look.skinDark} />
      </mesh>
      <mesh position={[0.34, -0.02, 0]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshLambertMaterial color={look.skinDark} />
      </mesh>

      {/* Eyes — the same big friendly read as the rest of the cast, so he
          belongs to the same world he is standing in. */}
      {/* Pulled in and forward from the first pass: at the old width the
          whites broke the head's silhouette and showed as a white blob on
          his cheek whenever he turned. */}
      <mesh position={[-0.12, 0.02, 0.285]}>
        <sphereGeometry args={[0.095, 12, 10]} />
        <meshLambertMaterial color={EYE_WHITE} />
      </mesh>
      <mesh position={[0.12, 0.02, 0.285]}>
        <sphereGeometry args={[0.095, 12, 10]} />
        <meshLambertMaterial color={EYE_WHITE} />
      </mesh>
      <mesh position={[-0.12, 0.02, 0.355]}>
        <sphereGeometry args={[0.046, 10, 8]} />
        <meshLambertMaterial color={EYE_DARK} />
      </mesh>
      <mesh position={[0.12, 0.02, 0.355]}>
        <sphereGeometry args={[0.046, 10, 8]} />
        <meshLambertMaterial color={EYE_DARK} />
      </mesh>

      {/* Brows — a couple of degrees of tilt is the difference between
          "friendly boy" and "surprised doll". */}
      <mesh position={[-0.13, 0.17, 0.3]} rotation={[0, 0, 0.16]}>
        <boxGeometry args={[0.115, 0.026, 0.02]} />
        <meshLambertMaterial color={look.hair ?? look.skinDark} />
      </mesh>
      <mesh position={[0.13, 0.17, 0.3]} rotation={[0, 0, -0.16]}>
        <boxGeometry args={[0.115, 0.026, 0.02]} />
        <meshLambertMaterial color={look.hair ?? look.skinDark} />
      </mesh>

      {/* Nose and smile */}
      <mesh position={[0, -0.07, 0.32]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshLambertMaterial color={look.skinDark} />
      </mesh>
      <mesh position={[0, -0.17, 0.305]} scale={[1.6, 0.85, 0.5]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshLambertMaterial color="#5d2b28" />
      </mesh>

      {/* Cheeks */}
      <mesh position={[-0.26, -0.1, 0.19]}>
        <sphereGeometry args={[0.055, 8, 7]} />
        <meshLambertMaterial color={look.cheek} />
      </mesh>
      <mesh position={[0.26, -0.1, 0.19]}>
        <sphereGeometry args={[0.055, 8, 7]} />
        <meshLambertMaterial color={look.cheek} />
      </mesh>
    </>
  );
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
  const isTj = look.build === "tj";

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
          {/* Legs. Same two joints for every build — only what hangs off
              them changes. */}
          <group ref={leftLeg} position={[-0.15, 0.42, 0]}>
            {isTj ? (
              <TjLeg look={look} />
            ) : (
              <>
                <mesh position={[0, -0.16, 0]}>
                  <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
                  <meshLambertMaterial color={look.limb} />
                </mesh>
                <mesh position={[0, -0.34, 0.05]}>
                  <sphereGeometry args={[0.14, 10, 8]} />
                  <meshLambertMaterial color={look.boot} />
                </mesh>
              </>
            )}
          </group>
          <group ref={rightLeg} position={[0.15, 0.42, 0]}>
            {isTj ? (
              <TjLeg look={look} />
            ) : (
              <>
                <mesh position={[0, -0.16, 0]}>
                  <capsuleGeometry args={[0.11, 0.16, 4, 8]} />
                  <meshLambertMaterial color={look.limb} />
                </mesh>
                <mesh position={[0, -0.34, 0.05]}>
                  <sphereGeometry args={[0.14, 10, 8]} />
                  <meshLambertMaterial color={look.boot} />
                </mesh>
              </>
            )}
          </group>

          {/* Torso */}
          {isTj ? (
            <TjTorso look={look} />
          ) : (
            <>
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
            </>
          )}

          {/* Arms */}
          <group ref={leftArm} position={[-0.34, 0.82, 0]}>
            {isTj ? (
              <TjArm look={look} side={-1} />
            ) : (
              <>
                <mesh position={[0, -0.14, 0]} rotation={[0, 0, 0.18]}>
                  <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
                  <meshLambertMaterial color={look.limb} />
                </mesh>
                <mesh position={[-0.03, -0.31, 0]}>
                  <sphereGeometry args={[0.115, 10, 8]} />
                  <meshLambertMaterial color={look.skinDark} />
                </mesh>
              </>
            )}
          </group>
          <group ref={rightArm} position={[0.34, 0.82, 0]}>
            {isTj ? (
              <TjArm look={look} side={1} />
            ) : (
              <>
                <mesh position={[0, -0.14, 0]} rotation={[0, 0, -0.18]}>
                  <capsuleGeometry args={[0.095, 0.2, 4, 8]} />
                  <meshLambertMaterial color={look.limb} />
                </mesh>
                <mesh position={[0.03, -0.31, 0]}>
                  <sphereGeometry args={[0.115, 10, 8]} />
                  <meshLambertMaterial color={look.skinDark} />
                </mesh>
              </>
            )}
          </group>

          {/* Head */}
          <group ref={head} position={[0, 1.16, 0]}>
            <mesh>
              <sphereGeometry args={[0.36, 16, 14]} />
              <meshLambertMaterial color={look.skin} />
            </mesh>

            {isTj ? (
              <>
                <TjCap look={look} wearingHat={Boolean(hatId)} />
                <TjFace look={look} />
                <Hat hatId={hatId ?? null} />
              </>
            ) : (
              <>
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
              </>
            )}
          </group>
        </group>
      </group>
    </group>
  );
}
