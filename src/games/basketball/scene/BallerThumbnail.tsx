"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { BallerAvatar } from "./BallerAvatar";

/**
 * A small, static live render of a baller — used anywhere a shop card or
 * list needs a preview. Deliberately the *real* `BallerAvatar`, not a CSS
 * approximation: whatever a child buys here is exactly what they see on the
 * court, because it's the same component either way.
 */
export function BallerThumbnail({
  ballerId,
  jerseyId = null,
  className,
}: {
  ballerId: string;
  jerseyId?: string | null;
  className?: string;
}) {
  return (
    <div className={className} aria-hidden>
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "low-power" }}
        camera={{ fov: 32, near: 0.1, far: 20, position: [0, 0.85, 3.3] }}
        onCreated={({ camera }) => camera.lookAt(0, 0.78, 0)}
        frameloop="demand"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <directionalLight position={[-2, 2, -1]} intensity={0.4} color="#ffe6bd" />
        <Suspense fallback={null}>
          <BallerAvatar ballerId={ballerId} jerseyId={jerseyId} phase="idle" facing={0} />
        </Suspense>
      </Canvas>
    </div>
  );
}
