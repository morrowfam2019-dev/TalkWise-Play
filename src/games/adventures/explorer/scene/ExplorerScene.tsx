"use client";

import { Canvas } from "@react-three/fiber";
import type { GameInput } from "../../core/input";
import { Coins } from "../../scene/Coins";
import { Decorations } from "../../scene/Decorations";
import {
  GameplayController,
  type GameplayCallbacks,
} from "../../scene/GameplayController";
import { JumpPads } from "../../scene/JumpPads";
import { Terrain } from "../../scene/Terrain";
import type { ExplorerMap } from "../maps";
import { toWorldDefinition } from "../maps";
import { RewardProps } from "./RewardProps";
import { SoundStations } from "./SoundStations";
import { useMemo } from "react";

/**
 * Station triggers are wider than a word adventure's checkpoint, and match
 * the ring the station draws on the ground: on a map this size, a
 * four-year-old aiming at a letter should not be able to walk past it.
 */
const STATION_RADIUS = 3.2;
const STATION_REARM_RADIUS = 5;

interface ExplorerSceneProps extends GameplayCallbacks {
  map: ExplorerMap;
  input: GameInput;
  characterId: string;
  auraId: string | null;
  hatId: string | null;
  jumpBoost: number;
  speedBoost: number;
  assist: boolean;
  paused: boolean;
  collected: string[];
  /** Finished turns per station id. */
  completions: Record<string, number>;
  /** Repetition target per station id. */
  repetitions: Record<string, number>;
  /** Reward props currently switched on. */
  litProps: string[];
  nearIndex: number | null;
  runId: number;
}

/**
 * Scene assembly for a Beginner explorer map.
 *
 * Deliberately the same renderer configuration, lighting and controller as a
 * word adventure — an explorer map is a different *place*, not a different
 * engine. Two things differ, and only two: sound stations stand where
 * checkpoints would, and there is no finish portal, because an open park has
 * nothing to finish.
 *
 * `completed` is passed to the controller as all-false on purpose. That is
 * what keeps a station re-enterable: a child who has lit /m/ can walk back
 * to the swings tomorrow and say it again, which is exactly the behaviour
 * repeated practice needs and the opposite of a checkpoint's.
 */
export function ExplorerScene({
  map,
  input,
  characterId,
  auraId,
  hatId,
  jumpBoost,
  speedBoost,
  assist,
  paused,
  collected,
  completions,
  repetitions,
  litProps,
  nearIndex,
  runId,
  ...callbacks
}: ExplorerSceneProps) {
  const world = useMemo(() => toWorldDefinition(map), [map]);
  const neverCompleted = useMemo(
    () => map.stations.map(() => false),
    [map.stations],
  );

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 58, near: 0.1, far: 320, position: [0, 6, 26] }}
    >
      <color attach="background" args={[map.skyColor]} />
      {/* Fog starts further out than a word adventure's: the whole point of
          these maps is that a child can see across them. */}
      <fog attach="fog" args={[map.fogColor, 110, 300]} />

      <ambientLight intensity={1.2} />
      <hemisphereLight args={[map.skyColor, "#5f8f52", 0.6]} />
      <directionalLight position={[24, 40, 18]} intensity={1.25} />
      <directionalLight position={[-18, 16, -24]} intensity={0.4} color="#ffe6bd" />

      <Terrain world={world} />
      <Decorations world={world} />
      {world.jumpPads ? <JumpPads pads={world.jumpPads} /> : null}
      <Coins collectibles={world.collectibles} collected={collected} />
      <RewardProps props={map.rewardProps} litIds={litProps} />
      <SoundStations
        stations={map.stations}
        completions={completions}
        repetitions={repetitions}
        nearIndex={nearIndex}
      />

      <GameplayController
        world={world}
        input={input}
        characterId={characterId}
        auraId={auraId}
        hatId={hatId}
        jumpBoost={jumpBoost}
        speedBoost={speedBoost}
        assist={assist}
        paused={paused}
        completed={neverCompleted}
        collected={collected}
        finishUnlocked={false}
        runId={runId}
        checkpointRadius={STATION_RADIUS}
        checkpointRearmRadius={STATION_REARM_RADIUS}
        {...callbacks}
      />
    </Canvas>
  );
}
