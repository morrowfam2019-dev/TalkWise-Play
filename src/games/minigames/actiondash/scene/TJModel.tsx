"use client";

/**
 * TJ, in 3D.
 *
 * ## Why he is built from geometry rather than shipped as a mesh file
 *
 * Speech Basketball loads founder-approved `.glb` scans for its ballers, so
 * the pattern exists in this codebase — but a mesh file is a fixed pose
 * rigged for one thing. Action Dash needs him to run, jump, spin, clap,
 * wave, eat, drink, sit and sleep on demand, and to blend from a run into
 * any of those the instant a child says the word. Built from primitives,
 * every one of those is a few numbers in the frame loop, he weighs nothing
 * to download, and he recolours to the approved palette exactly.
 *
 * ## Dropping in the Higgsfield mesh
 *
 * A textured, rigged, run-animated GLB of TJ was generated from the
 * approved covers (Higgsfield element `tj-talkwise-play`). To use it,
 * save it as `public/models/tj.glb` and set `TJ_GLB` to true. The
 * procedural rig below stays as the fallback, because it is the thing that
 * can perform all ten action verbs — the GLB carries one run clip.
 *
 * ## Scene contract
 *
 * TJ stands on y=0 and is about 1.7 units tall, so one unit reads as a
 * metre. He faces −X, which is the direction he dashes.
 */

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ActionId } from "@/content/minigames/types";

/**
 * How far TJ is turned back toward the camera from a dead-side profile.
 * Straight-on profile hides one eye behind the other and reads as a
 * cardboard cut-out; a three-quarter turn shows his face while still
 * pointing him down the track.
 */
const THREE_QUARTER_TURN = 0.62;

/** Flip to true once `public/models/tj.glb` exists. See the note above. */
const TJ_GLB = false;

/** Approved palette, matching the cover art and the 2D TJ. */
const SKIN = "#c98a5b";
const HAIR = "#3d2517";
const HOODIE = "#1f6fe0";
const HOODIE_DARK = "#1550ab";
const JOGGERS = "#1e2a44";
const SHOE = "#2f8bf0";
const SHOE_SOLE = "#ffffff";

/** What TJ is doing right now. */
export type TJPose = "idle" | "dash" | ActionId;

let dracoLoader: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
  }
  return dracoLoader;
}

/** Scales and grounds a loaded mesh so it matches the procedural rig's
 * 1.7-unit height and stands on y=0. */
function normalize(scene: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 0) {
    const scale = 1.7 / size.y;
    scene.scale.setScalar(scale);
  }
  const grounded = new THREE.Box3().setFromObject(scene);
  scene.position.y -= grounded.min.y;
}

function TJGlb() {
  const gltf = useLoader(GLTFLoader, "/models/tj.glb", (loader) => {
    (loader as GLTFLoader).setDRACOLoader(getDracoLoader());
  }) as GLTF;
  const scene = useMemo(() => {
    normalize(gltf.scene);
    return gltf.scene;
  }, [gltf]);
  return <primitive object={scene} />;
}

/** One curly clump of TJ's afro. */
function HairPuff({
  position,
  radius,
}: {
  position: [number, number, number];
  radius: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 12, 10]} />
      <meshLambertMaterial color={HAIR} />
    </mesh>
  );
}

export function TJModel({ pose }: { pose: TJPose }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);

  // Every pose is driven from one clock in the frame loop rather than from
  // React state: at 60fps a state-driven rig would re-render the whole game
  // 60 times a second to move a leg.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;

    // Reset to neutral each frame, then apply the current pose. Cheap, and
    // it means a pose never has to undo the one before it.
    g.position.set(0, 0, 0);
    g.rotation.set(0, 0, 0);
    b.position.set(0, 0, 0);
    b.rotation.set(0, 0, 0);
    const setLimb = (ref: typeof legL, x: number, z = 0) => {
      if (ref.current) ref.current.rotation.set(x, 0, z);
    };
    setLimb(legL, 0);
    setLimb(legR, 0);
    setLimb(armL, 0);
    setLimb(armR, 0);

    switch (pose) {
      case "dash":
      case "run": {
        // The run cycle: opposed legs and arms, a bob on the double-step,
        // and a slight forward lean into the direction of travel.
        const s = t * 11;
        setLimb(legL, Math.sin(s) * 0.95);
        setLimb(legR, Math.sin(s + Math.PI) * 0.95);
        setLimb(armL, Math.sin(s + Math.PI) * 0.85);
        setLimb(armR, Math.sin(s) * 0.85);
        b.position.y = Math.abs(Math.sin(s)) * 0.09;
        // Lean into the run on X, not Z: he travels along his own +Z, so a
        // Z tilt just makes him list sideways to the camera.
        b.rotation.x = 0.17;
        break;
      }
      case "jump": {
        const cycle = (t * 1.1) % 1;
        const lift = Math.sin(cycle * Math.PI);
        g.position.y = lift * 1.15;
        setLimb(legL, -lift * 1.0);
        setLimb(legR, -lift * 0.7);
        setLimb(armL, -lift * 2.2);
        setLimb(armR, -lift * 2.2);
        break;
      }
      case "spin": {
        g.rotation.y = t * 6;
        setLimb(armL, 0, -1.25);
        setLimb(armR, 0, 1.25);
        break;
      }
      case "clap": {
        const c = Math.abs(Math.sin(t * 7));
        setLimb(armL, -1.35, 0.5 + c * 0.75);
        setLimb(armR, -1.35, -0.5 - c * 0.75);
        break;
      }
      case "wave": {
        // Out to the side and rocking, not up beside his ear: an inward
        // wave puts his own hand over his face at this camera angle.
        setLimb(armR, -2.45, 0.45 + Math.sin(t * 7) * 0.35);
        break;
      }
      case "dance": {
        // Arms overhead and alternating, not folded in front: at this size a
        // pair of arms crossing the chest reads as a hug. −2.7 on X swings a
        // limb from hanging to raised; the Z spread keeps them clear of the
        // hoodie so both stay visible in the three-quarter view.
        const d = Math.sin(t * 5);
        b.rotation.z = d * 0.22;
        b.rotation.y = d * 0.3;
        g.position.x = d * 0.16;
        g.position.y = Math.abs(d) * 0.08;
        setLimb(armL, -2.5 + d * 0.45, -0.75);
        setLimb(armR, -2.5 - d * 0.45, 0.75);
        setLimb(legL, d * 0.45);
        setLimb(legR, -d * 0.45);
        break;
      }
      case "eat":
      case "drink": {
        const bite = (Math.sin(t * 4) + 1) / 2;
        setLimb(armR, -2.35 - bite * 0.45);
        b.rotation.x = bite * 0.12;
        break;
      }
      case "sit": {
        g.position.y = -0.42;
        setLimb(legL, -1.5);
        setLimb(legR, -1.5);
        break;
      }
      case "sleep": {
        g.rotation.z = 1.45;
        g.position.y = -0.62;
        b.position.y = Math.sin(t * 1.6) * 0.03;
        break;
      }
      default: {
        // Idle: a gentle breathing bob so he never looks frozen, and a small
        // rest angle on the arms so they clear the hoodie in silhouette.
        b.position.y = Math.sin(t * 1.9) * 0.045;
        b.rotation.z = Math.sin(t * 0.9) * 0.03;
        setLimb(armL, 0.12, 0.16);
        setLimb(armR, 0.12, -0.16);
      }
    }
  });

  if (TJ_GLB) {
    return (
      <group rotation={[0, -Math.PI / 2 + THREE_QUARTER_TURN, 0]}>
        <group ref={root}>
          <TJGlb />
        </group>
      </group>
    );
  }

  return (
    // The facing lives on an outer group the frame loop never touches. `root`
    // is reset to neutral every frame — put the turn on it and the first
    // frame wipes it, which is exactly how he ended up jogging at the camera.
    <group rotation={[0, -Math.PI / 2 + THREE_QUARTER_TURN, 0]}>
      <group ref={root}>
        <group ref={body}>
          {/* Legs — pivot at the hip so a rotation swings the whole leg. */}
          <group ref={legL} position={[-0.16, 0.72, 0]}>
            <mesh position={[0, -0.34, 0]}>
              <capsuleGeometry args={[0.11, 0.5, 4, 10]} />
              <meshLambertMaterial color={JOGGERS} />
            </mesh>
            <mesh position={[0, -0.68, 0.06]}>
              <boxGeometry args={[0.24, 0.14, 0.4]} />
              <meshLambertMaterial color={SHOE} />
            </mesh>
            <mesh position={[0, -0.75, 0.06]}>
              <boxGeometry args={[0.26, 0.06, 0.42]} />
              <meshLambertMaterial color={SHOE_SOLE} />
            </mesh>
          </group>
          <group ref={legR} position={[0.16, 0.72, 0]}>
            <mesh position={[0, -0.34, 0]}>
              <capsuleGeometry args={[0.11, 0.5, 4, 10]} />
              <meshLambertMaterial color={JOGGERS} />
            </mesh>
            <mesh position={[0, -0.68, 0.06]}>
              <boxGeometry args={[0.24, 0.14, 0.4]} />
              <meshLambertMaterial color={SHOE} />
            </mesh>
            <mesh position={[0, -0.75, 0.06]}>
              <boxGeometry args={[0.26, 0.06, 0.42]} />
              <meshLambertMaterial color={SHOE_SOLE} />
            </mesh>
          </group>

          {/* Hoodie torso */}
          <mesh position={[0, 1.06, 0]}>
            <capsuleGeometry args={[0.28, 0.36, 4, 12]} />
            <meshLambertMaterial color={HOODIE} />
          </mesh>
          {/* Hood bunched behind the neck */}
          <mesh position={[0, 1.3, -0.14]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshLambertMaterial color={HOODIE_DARK} />
          </mesh>
          {/* Backpack */}
          <mesh position={[0, 1.08, -0.28]}>
            <boxGeometry args={[0.34, 0.44, 0.18]} />
            <meshLambertMaterial color={HOODIE_DARK} />
          </mesh>

          {/* Arms — pivot at the shoulder. */}
          <group ref={armL} position={[-0.36, 1.26, 0]}>
            <mesh position={[0, -0.27, 0]}>
              <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
              <meshLambertMaterial color={HOODIE} />
            </mesh>
            <mesh position={[0, -0.56, 0]}>
              <sphereGeometry args={[0.105, 12, 10]} />
              <meshLambertMaterial color={SKIN} />
            </mesh>
          </group>
          <group ref={armR} position={[0.36, 1.26, 0]}>
            <mesh position={[0, -0.27, 0]}>
              <capsuleGeometry args={[0.09, 0.42, 4, 10]} />
              <meshLambertMaterial color={HOODIE} />
            </mesh>
            <mesh position={[0, -0.56, 0]}>
              <sphereGeometry args={[0.105, 12, 10]} />
              <meshLambertMaterial color={SKIN} />
            </mesh>
          </group>

          {/* Head */}
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.3, 20, 16]} />
            <meshLambertMaterial color={SKIN} />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.29, 1.54, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshLambertMaterial color={SKIN} />
          </mesh>
          <mesh position={[0.29, 1.54, 0]}>
            <sphereGeometry args={[0.075, 10, 8]} />
            <meshLambertMaterial color={SKIN} />
          </mesh>

          {/* The afro — the silhouette that makes him read as TJ at a glance. */}
          <HairPuff position={[0, 1.82, -0.02]} radius={0.25} />
          <HairPuff position={[-0.19, 1.72, 0.02]} radius={0.19} />
          <HairPuff position={[0.19, 1.72, 0.02]} radius={0.19} />
          <HairPuff position={[0, 1.7, -0.24]} radius={0.2} />
          <HairPuff position={[-0.13, 1.62, 0.16]} radius={0.14} />
          <HairPuff position={[0.13, 1.62, 0.16]} radius={0.14} />

          {/* Face — flat discs on the front of the head read cleanly at the
            small on-screen size without costing a texture. */}
          <mesh position={[-0.11, 1.58, 0.27]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.11, 1.58, 0.27]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.11, 1.575, 0.31]}>
            <sphereGeometry args={[0.032, 10, 8]} />
            <meshBasicMaterial color="#3a2410" />
          </mesh>
          <mesh position={[0.11, 1.575, 0.31]}>
            <sphereGeometry args={[0.032, 10, 8]} />
            <meshBasicMaterial color="#3a2410" />
          </mesh>
          <mesh position={[0, 1.45, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
            <meshBasicMaterial color="#7d2b2b" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
