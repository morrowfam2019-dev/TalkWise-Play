"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export type ShotPhase = "idle" | "aiming" | "releasing" | "made" | "missed";

/** GAME-002's ballers are real 3D scans (Meshy image-to-3D from the
 * founder-approved concept art), one GLB per character — not the earlier
 * procedural placeholder rig. Every baller ships at a wildly different
 * export scale (Meshy's unit convention isn't consistent between meshes),
 * so height is normalized at load time from each mesh's own bounding box
 * rather than a hardcoded constant. */
const TARGET_HEIGHT = 1.54;

const MODEL_URL: Record<string, string> = {
  cosmo: "/models/basketball/cosmo.glb",
  nova: "/models/basketball/nova.glb",
  yarnie: "/models/basketball/yarnie.glb",
  volt: "/models/basketball/volt.glb",
  cocoa: "/models/basketball/cocoa.glb",
};

let dracoLoader: DRACOLoader | null = null;
function getDracoLoader() {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
  }
  return dracoLoader;
}

/** `Box3.setFromObject` is unreliable on a freshly loaded `SkinnedMesh` — it
 * can read a stale/empty geometry bounding box before the skeleton's ever
 * been updated once, producing a near-zero or wildly wrong box. Computing
 * bounds mesh-by-mesh from each geometry's own (freshly computed) bounding
 * box, transformed by an explicitly-updated matrixWorld, sidesteps that. */
function computeVisualBounds(root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    tmp.copy(geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
    box.union(tmp);
  });
  return box;
}

/**
 * Meshy's auto-rig ships a skeleton and joint weights for most of these
 * meshes, but the skin binding it produces is internally inconsistent with
 * the mesh's own bind-pose geometry — applying it deforms the character
 * into a shredded, unrecognisable mess (confirmed by rendering with
 * skinning stripped: the underlying geometry is completely correct, and
 * only the *deformation* was broken). Rather than trust per-baller skin
 * data that has already been shown to lie, every SkinnedMesh is converted
 * to a plain static Mesh using its own (correct) bind-pose geometry. That
 * costs limb-level animation — every baller now animates as one rigid
 * body, the same as Yarnie always did (Yarnie never got a skeleton from
 * Meshy at all) — but it's the only path proven to render the actual
 * character instead of a distortion of it.
 */
function stripSkinning(root: THREE.Object3D) {
  const replacements: [THREE.Object3D, THREE.Mesh][] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (mesh.isSkinnedMesh) {
      const plain = new THREE.Mesh(mesh.geometry, mesh.material);
      plain.position.copy(mesh.position);
      plain.rotation.copy(mesh.rotation);
      plain.scale.copy(mesh.scale);
      replacements.push([mesh, plain]);
    }
  });
  for (const [skinned, plain] of replacements) {
    skinned.parent?.add(plain);
    skinned.parent?.remove(skinned);
  }
}

/** Normalizes a loaded GLTF scene to stand `TARGET_HEIGHT` tall, feet at
 * y=0, centered on X/Z — necessary because raw export scale varies wildly
 * between meshes (some ~0.017 units tall, one ~1.9 units tall). Idempotent:
 * `useLoader`'s cache is shared across every mount of the same URL, so this
 * must not re-apply the transform on a second mount. */
function normalize(scene: THREE.Object3D) {
  if (scene.userData.normalized) return;
  scene.userData.normalized = true;

  stripSkinning(scene);

  const box = computeVisualBounds(scene);
  const size = new THREE.Vector3();
  box.getSize(size);
  const height = size.y || 1;
  const scale = TARGET_HEIGHT / height;

  const center = new THREE.Vector3();
  box.getCenter(center);

  scene.scale.setScalar(scale);
  scene.position.x = -center.x * scale;
  scene.position.z = -center.z * scale;
  scene.position.y = -box.min.y * scale;

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  });
}

/**
 * Renders one baller's real mesh as a rigid body — the shot-phase language
 * (idle bob, a lean into "aiming"/"releasing", a made/missed bounce) lives
 * on the shared root group in `BallerAvatar`; this component only loads and
 * normalizes the model, and positions the held-ball prop. There is no
 * per-limb animation for any baller — see `stripSkinning` for why.
 */
function BallerModel({ ballerId, phase }: { ballerId: string; phase: ShotPhase }) {
  const url = MODEL_URL[ballerId] ?? MODEL_URL.cosmo;
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    (loader as GLTFLoader).setDRACOLoader(getDracoLoader());
  }) as GLTF;

  // Renders `gltf.scene` directly rather than a clone — `useLoader` already
  // caches per URL, so this only becomes a real limitation if the same
  // baller needs to render twice on screen at once, which nothing in
  // Basketball currently does (a child has one baller equipped, and it
  // never appears on two canvases simultaneously).
  const scene = useMemo(() => {
    normalize(gltf.scene);
    return gltf.scene;
  }, [gltf]);

  const ball = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ball.current) {
      ball.current.visible = phase === "idle" || phase === "aiming";
    }
  });

  return (
    <group>
      <primitive object={scene} />
      {/* No hand bone to track (see stripSkinning), so the held ball sits
          at a fixed offset roughly at hip/chest height, held forward. */}
      <mesh ref={ball} position={[0.22, 0.8, 0.18]}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshLambertMaterial color="#e0742a" />
      </mesh>
    </group>
  );
}

/**
 * A basketball-styled player rendered from the founder-approved 3D scan for
 * this baller — replaces the earlier procedural placeholder rig entirely.
 * `jerseyId` is intentionally unused here: these meshes have their outfit
 * baked into the model/texture from the source concept art, so equipping a
 * different jersey currently has no visible effect on the court. The jersey
 * shop and inventory still work exactly as before; only the 3D recolor is
 * gone until per-jersey mesh variants exist.
 */
export function BallerAvatar({
  ballerId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  jerseyId: _jerseyId,
  phase,
  facing = 0,
}: {
  ballerId: string;
  jerseyId: string | null;
  phase: ShotPhase;
  /** Yaw, radians — faces the hoop for the current court spot. */
  facing?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const lean = useRef<THREE.Group>(null);
  const bob = useRef(0);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const lerp = Math.min(1, delta * 10);
    bob.current += delta;

    const idleBob = phase === "idle" || phase === "aiming" ? Math.sin(bob.current * 2.4) * 0.02 : 0;
    if (root.current) {
      root.current.position.y = idleBob;
      root.current.rotation.y = facing;
    }

    // Every baller is a rigid mesh now (see stripSkinning), so "shooting"
    // reads as a lean into the shot rather than an arm raise.
    const targetLean = phase === "aiming" ? -0.18 : phase === "releasing" ? -0.32 : 0;
    if (lean.current) {
      lean.current.rotation.x += (targetLean - lean.current.rotation.x) * lerp;
    }

    const t = state.clock.elapsedTime;
    if (root.current && (phase === "made" || phase === "missed")) {
      root.current.position.y = idleBob + Math.max(0, Math.sin(t * 6)) * (phase === "made" ? 0.06 : 0);
    }
  });

  return (
    <group ref={root}>
      <group ref={lean}>
        <BallerModel ballerId={ballerId} phase={phase} />
      </group>
    </group>
  );
}
