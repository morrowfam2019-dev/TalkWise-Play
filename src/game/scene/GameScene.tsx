"use client";

import { Canvas } from "@react-three/fiber";
import type { SpeechChallenge } from "@/content/speech";
import type { GameInput } from "../core/input";
import type { WorldDefinition } from "../world/types";
import { Checkpoints } from "./Checkpoints";
import { Coins } from "./Coins";
import { Decorations } from "./Decorations";
import { FinishPortal } from "./FinishPortal";
import { GameplayController, type GameplayCallbacks } from "./GameplayController";
import { JumpPads } from "./JumpPads";
import { Terrain } from "./Terrain";

interface GameSceneProps extends GameplayCallbacks {
  world: WorldDefinition;
  challenges: SpeechChallenge[];
  input: GameInput;
  characterId: string;
  auraId: string | null;
  jumpBoost: number;
  speedBoost: number;
  paused: boolean;
  completed: boolean[];
  collected: string[];
  nearIndex: number | null;
  runId: number;
}

/**
 * Scene assembly and renderer configuration.
 *
 * Lighting is deliberately cheap — ambient plus two directionals, no shadow
 * maps — because the target device is a phone browser. Depth comes from the
 * blob shadow under the player and from fog, both of which cost almost nothing.
 */
export function GameScene({
  world,
  challenges,
  input,
  characterId,
  auraId,
  jumpBoost,
  speedBoost,
  paused,
  completed,
  collected,
  nearIndex,
  runId,
  ...callbacks
}: GameSceneProps) {
  const remaining = completed.filter((done) => !done).length;
  const finishUnlocked = remaining === 0;

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 58, near: 0.1, far: 260, position: [0, 6, 26] }}
    >
      <color attach="background" args={[world.skyColor]} />
      <fog attach="fog" args={[world.fogColor, 60, 190]} />

      <ambientLight intensity={1.15} />
      <hemisphereLight args={[world.skyColor, "#4c7a3f", 0.55]} />
      <directionalLight position={[18, 30, 14]} intensity={1.25} />
      <directionalLight position={[-14, 12, -18]} intensity={0.4} color="#ffe6bd" />

      <Terrain world={world} />
      <Decorations world={world} />
      {world.jumpPads ? <JumpPads pads={world.jumpPads} /> : null}
      <Coins collectibles={world.collectibles} collected={collected} />
      <Checkpoints
        anchors={world.checkpoints}
        challenges={challenges}
        completed={completed}
        nearIndex={nearIndex}
      />
      <FinishPortal
        position={world.finish}
        unlocked={finishUnlocked}
        remaining={remaining}
      />

      <GameplayController
        world={world}
        input={input}
        characterId={characterId}
        auraId={auraId}
        jumpBoost={jumpBoost}
        speedBoost={speedBoost}
        paused={paused}
        completed={completed}
        collected={collected}
        finishUnlocked={finishUnlocked}
        runId={runId}
        {...callbacks}
      />
    </Canvas>
  );
}
