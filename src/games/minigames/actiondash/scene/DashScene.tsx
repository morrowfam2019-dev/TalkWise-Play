"use client";

/**
 * Action Dash's course — a side-on 3D track TJ runs along.
 *
 * ## What was wrong with the first version
 *
 * It was a flat cartoon standing still in the middle of a large empty
 * gradient. Nothing moved between rounds, so a game called *Dash* had no
 * dashing in it, and two thirds of a phone screen was sky.
 *
 * ## How this one works
 *
 * TJ runs on the spot at a fixed point on screen and **the world moves past
 * him**, right-to-left in world space, which reads as him dashing to the
 * left toward the next command. That is the standard side-scroller trick and
 * it is the right one here: the camera never has to chase him, he never
 * leaves frame, and the course can be infinitely long without a level.
 *
 * Scenery is a small pool of props recycled off the ends rather than a long
 * strip of geometry, so a four-minute session allocates nothing after the
 * first frame — the same bounded-pool discipline the bubble field uses.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TJModel, type TJPose } from "./TJModel";

const SKY_TOP = "#bfe9ff";
const GRASS = "#7ac46a";
const GRASS_DARK = "#5aa85f";
const PATH = "#e8cf9a";

/** Where TJ stands on screen. Right of centre, so the course he is running
 * *into* is the bigger half of the frame. */
const TJ_X = 1.4;

/** How fast the world slides past while dashing, in units per second. */
const DASH_SPEED = 7.5;

/** The recycled prop pool. */
const PROP_COUNT = 14;
const PROP_SPACING = 4.2;

/** Ground stripes, recycled the same way. */
const STRIPE_COUNT = 20;
const STRIPE_SPACING = 2.4;

/** Far scenery. A tall phone frame gives the sky a lot of room, and an
 * empty gradient up there is what made the first version look unfinished.
 * Hills and clouds fill it and, because they scroll slower than the track,
 * they also carry the parallax that sells the speed. */
const HILL_COUNT = 7;
const HILL_SPACING = 9;
const HILL_PARALLAX = 0.22;
const CLOUD_COUNT = 6;
const CLOUD_SPACING = 8;
const CLOUD_PARALLAX = 0.1;

type PropKind = "tree" | "bush" | "box" | "cone" | "flag";

interface CourseProp {
  kind: PropKind;
  x: number;
  z: number;
  scale: number;
}

function makeProps(): CourseProp[] {
  const kinds: PropKind[] = [
    "tree",
    "bush",
    "box",
    "cone",
    "flag",
    "bush",
    "tree",
  ];
  return Array.from({ length: PROP_COUNT }, (_, i) => ({
    kind: kinds[i % kinds.length],
    // Spread along the track, starting well to the left so the course is
    // already populated on the first frame.
    x: -14 + i * PROP_SPACING,
    // Alternate near/far so the course has depth rather than a single row.
    // Far enough back that a prop passing behind TJ never looks like it is
    // going through him.
    z: i % 2 === 0 ? -3.6 : -6.4,
    scale: 0.85 + ((i * 37) % 40) / 100,
  }));
}

/** One rolling hill on the skyline. Flattened spheres, not geometry with
 * silhouette detail: at this distance they are a shape and a colour. */
function Hill({ scale }: { scale: number }) {
  return (
    <mesh position={[0, -0.6, 0]} scale={[scale * 1.7, scale, 1]}>
      <sphereGeometry args={[2.6, 14, 10]} />
      <meshLambertMaterial color="#57a86b" />
    </mesh>
  );
}

function Cloud({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh>
        <sphereGeometry args={[0.9, 12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.85, -0.16, 0]}>
        <sphereGeometry args={[0.62, 12, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.8, -0.2, 0]}>
        <sphereGeometry args={[0.55, 12, 10]} />
        <meshBasicMaterial color="#f4fbff" />
      </mesh>
    </group>
  );
}

function Prop({ kind }: { kind: PropKind }) {
  switch (kind) {
    case "tree":
      return (
        <group>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.11, 0.15, 1.1, 8]} />
            <meshLambertMaterial color="#8a5c30" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.72, 12, 10]} />
            <meshLambertMaterial color="#3f9e52" />
          </mesh>
          <mesh position={[0.34, 1.14, 0.2]}>
            <sphereGeometry args={[0.44, 12, 10]} />
            <meshLambertMaterial color="#4bb35f" />
          </mesh>
        </group>
      );
    case "bush":
      return (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshLambertMaterial color="#4bb35f" />
          </mesh>
          <mesh position={[0.36, 0.22, 0.1]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshLambertMaterial color="#3f9e52" />
          </mesh>
        </group>
      );
    case "box":
      return (
        <mesh position={[0, 0.36, 0]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.72, 0.72, 0.72]} />
          <meshLambertMaterial color="#c99a5e" />
        </mesh>
      );
    case "cone":
      return (
        <group>
          <mesh position={[0, 0.34, 0]}>
            <coneGeometry args={[0.24, 0.68, 10]} />
            <meshLambertMaterial color="#ff7a3d" />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.5, 0.08, 0.5]} />
            <meshLambertMaterial color="#e8e8e8" />
          </mesh>
        </group>
      );
    case "flag":
      return (
        <group>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 1.6, 6]} />
            <meshLambertMaterial color="#b08a52" />
          </mesh>
          <mesh position={[0.34, 1.36, 0]}>
            <boxGeometry args={[0.62, 0.4, 0.03]} />
            <meshLambertMaterial color="#f5c33b" />
          </mesh>
        </group>
      );
  }
}

/**
 * The scrolling world: ground stripes and props, all moving right-to-left
 * while `dashing` is true and recycled once they pass the camera.
 */
function Course({ dashing }: { dashing: boolean }) {
  const group = useRef<THREE.Group>(null);
  const stripeGroup = useRef<THREE.Group>(null);

  // Starting layouts are computed once and read during render; the moving
  // copies live in refs and are only ever touched inside the frame loop.
  const props = useMemo(() => makeProps(), []);
  const stripeLayout = useMemo(
    () =>
      Array.from({ length: STRIPE_COUNT }, (_, i) => -20 + i * STRIPE_SPACING),
    [],
  );
  const hillLayout = useMemo(
    () => Array.from({ length: HILL_COUNT }, (_, i) => -24 + i * HILL_SPACING),
    [],
  );
  const cloudLayout = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, (_, i) => -18 + i * CLOUD_SPACING),
    [],
  );
  const offsets = useRef<number[]>(props.map((p) => p.x));
  const stripes = useRef<number[]>([...stripeLayout]);
  const hills = useRef<number[]>([...hillLayout]);
  const clouds = useRef<number[]>([...cloudLayout]);
  const hillGroup = useRef<THREE.Group>(null);
  const cloudGroup = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!dashing) return;
    const step = DASH_SPEED * Math.min(delta, 0.05);
    const g = group.current;

    // Props: slide left, recycle to the far right once past the camera.
    for (let i = 0; i < offsets.current.length; i += 1) {
      offsets.current[i] += step;
      if (offsets.current[i] > 16)
        offsets.current[i] -= PROP_COUNT * PROP_SPACING;
      const child = g?.children[i];
      if (child) child.position.x = offsets.current[i];
    }

    // Ground stripes give the speed a readable cadence — without them a
    // flat green plane sliding along looks completely static.
    for (let i = 0; i < stripes.current.length; i += 1) {
      stripes.current[i] += step;
      if (stripes.current[i] > 16) {
        stripes.current[i] -= STRIPE_COUNT * STRIPE_SPACING;
      }
      const child = stripeGroup.current?.children[i];
      if (child) child.position.x = stripes.current[i];
    }

    // Far scenery, at a fraction of the speed. Recycled the same way, so
    // the skyline is as endless as the track and costs the same nothing.
    for (let i = 0; i < hills.current.length; i += 1) {
      hills.current[i] += step * HILL_PARALLAX;
      if (hills.current[i] > 36) hills.current[i] -= HILL_COUNT * HILL_SPACING;
      const child = hillGroup.current?.children[i];
      if (child) child.position.x = hills.current[i];
    }
    for (let i = 0; i < clouds.current.length; i += 1) {
      clouds.current[i] += step * CLOUD_PARALLAX;
      if (clouds.current[i] > 30) {
        clouds.current[i] -= CLOUD_COUNT * CLOUD_SPACING;
      }
      const child = cloudGroup.current?.children[i];
      if (child) child.position.x = clouds.current[i];
    }
  });

  return (
    <>
      {/* Skyline, behind everything and slower than everything. */}
      <group ref={cloudGroup}>
        {cloudLayout.map((x, i) => (
          <group key={i} position={[x, 6.4 + (i % 3) * 0.9, -26]}>
            <Cloud scale={1 + ((i * 29) % 50) / 100} />
          </group>
        ))}
      </group>
      <group ref={hillGroup}>
        {hillLayout.map((x, i) => (
          <group key={i} position={[x, 0, -20]}>
            <Hill scale={1.1 + ((i * 43) % 60) / 100} />
          </group>
        ))}
      </group>

      {/* Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -2]}>
        <planeGeometry args={[80, 24]} />
        <meshLambertMaterial color={GRASS} />
      </mesh>
      {/* The dirt path TJ runs on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.2]}>
        <planeGeometry args={[80, 2.6]} />
        <meshLambertMaterial color={PATH} />
      </mesh>

      <group ref={stripeGroup}>
        {stripeLayout.map((x, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.01, 0.2]}
          >
            <planeGeometry args={[0.9, 0.14]} />
            <meshLambertMaterial color={GRASS_DARK} />
          </mesh>
        ))}
      </group>

      <group ref={group}>
        {props.map((p, i) => (
          <group key={i} position={[p.x, 0, p.z]} scale={p.scale}>
            <Prop kind={p.kind} />
          </group>
        ))}
      </group>
    </>
  );
}

export function DashScene({
  pose,
  dashing,
}: {
  pose: TJPose;
  /** True while TJ is travelling to the next command. */
  dashing: boolean;
}) {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // Side-on framing, slightly above TJ's head height and angled just
      // enough to read as 3D rather than a flat cut-out.
      // A tall phone viewport with a downward tilt spends its bottom third
      // on empty near-ground, so the camera sits low and looks almost level:
      // sky lands behind the coach bar, ground behind the cards, and TJ has
      // the readable middle band to himself.
      camera={{ fov: 40, near: 0.1, far: 100, position: [-1.8, 2.0, 11.4] }}
      onCreated={({ camera }) => camera.lookAt(1.2, 1.15, 0)}
    >
      <color attach="background" args={[SKY_TOP]} />
      <fog attach="fog" args={[SKY_TOP, 20, 46]} />

      <ambientLight intensity={1.15} />
      <hemisphereLight args={[SKY_TOP, "#4a7a3a", 0.55]} />
      <directionalLight position={[6, 10, 8]} intensity={1.05} />

      <Course dashing={dashing} />

      <group position={[TJ_X, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.42, 20]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.16} />
        </mesh>
        <TJModel pose={pose} />
      </group>
    </Canvas>
  );
}
