"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBeginnerGroup, getBeginnerSound } from "@/content/speech/beginner";
import { getBoost } from "@/content/adventures/shop";
import { getMapProgress } from "@/player/storage";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { gameAudio } from "../core/audio";
import { GameInput } from "../core/input";
import { TouchControls } from "../ui/TouchControls";
import type { ExplorerMap } from "./maps";
import { ExplorerScene } from "./scene/ExplorerScene";
import { ExplorerHud } from "./ui/ExplorerHud";
import { MapCelebration } from "./ui/MapCelebration";
import { SoundStationModal } from "./ui/SoundStationModal";

type Phase = "intro" | "exploring" | "station" | "celebration";

interface ExplorerShellProps {
  map: ExplorerMap;
  onExit: () => void;
}

/**
 * BEGINNER — one session in one explorer map.
 *
 * The shape of a session is the founder brief's shape: discover a station,
 * practise the sound, watch the park react, carry on exploring. There is no
 * run to complete, no results screen, and no failure state.
 *
 * ## Persistence
 *
 * Every turn is saved the moment it finishes, rather than at the end of a
 * run the way a word adventure saves. An open map has no end, and a
 * four-year-old closing the tab mid-park must not lose what they practised.
 * `recordStationTurn` is additive and per-turn, so this is safe to call as
 * often as it happens.
 *
 * ## Coins
 *
 * Awarded per turn and per pickup, into the shared platform wallet, exactly
 * like every other TalkWise Play reward. The counter on the HUD is the
 * session's own tally; the wallet is updated as it goes.
 */
export function ExplorerShell({ map, onExit }: ExplorerShellProps) {
  const input = useMemo(() => new GameInput(), []);
  const lookRef = useRef<HTMLDivElement>(null);

  const {
    profile,
    adventures,
    recordStationTurn,
    recordExplorerCoins,
    recordMapCelebration,
    setMicEnabled,
  } = usePlayerProfile();
  const boost = getBoost(adventures.loadout.boostId);
  const group = getBeginnerGroup(map.groupId);

  // Turns already finished, per station, read once when the map loads. The
  // park a child comes back to is the park they left, lanterns and all.
  const [completions, setCompletions] = useState<Record<string, number>>(() => {
    const saved = getMapProgress(profile, map.id);
    const seeded: Record<string, number> = {};
    for (const station of map.stations) {
      seeded[station.id] = saved.stations[station.soundId]?.completions ?? 0;
    }
    return seeded;
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [nearIndex, setNearIndex] = useState<number | null>(null);
  const [collected, setCollected] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [muted, setMuted] = useState(false);
  const [runId] = useState(0);

  // Opt-in position readout, the same `?debug` switch the word adventures
  // carry — it is how a map's anchors get placed and how an automated
  // play-through knows where it is standing.
  const [debugEnabled] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug"),
  );
  const [debugPosition, setDebugPosition] = useState("");
  const handleDebugSample = useCallback((x: number, y: number, z: number) => {
    setDebugPosition(`${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
  }, []);

  const phaseRef = useRef<Phase>("intro");
  const collectedRef = useRef<Set<string>>(new Set());
  // Seeded from the save, so a child who lit this map yesterday walks back
  // into a lit park instead of being handed the same party again.
  const celebratedRef = useRef(getMapProgress(profile, map.id).celebrated);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const paused = phase !== "exploring";

  useEffect(() => {
    const element = lookRef.current;
    if (!element) return;
    return input.attach(element);
  }, [input]);

  useEffect(() => {
    input.setEnabled(!paused);
  }, [input, paused]);

  useEffect(() => () => gameAudio.stopMusic(), []);

  /** Repetition targets, per station, from the sound library. */
  const repetitions = useMemo(() => {
    const targets: Record<string, number> = {};
    for (const station of map.stations) {
      targets[station.id] = getBeginnerSound(station.soundId)?.repetitions ?? 3;
    }
    return targets;
  }, [map.stations]);

  const litStationIds = useMemo(() => {
    return map.stations
      .filter(
        (station) =>
          (completions[station.id] ?? 0) >= (repetitions[station.id] ?? 3),
      )
      .map((station) => station.id);
  }, [map.stations, completions, repetitions]);

  /** Every reward prop belonging to a lit station. This is the whole
   * "speech changes the world" mechanism, in one derivation. */
  const litProps = useMemo(() => {
    const ids: string[] = [];
    for (const station of map.stations) {
      if (litStationIds.includes(station.id)) ids.push(...station.activates);
    }
    return ids;
  }, [map.stations, litStationIds]);

  const allLit =
    map.stations.length > 0 && litStationIds.length === map.stations.length;

  const handleStation = useCallback((index: number) => {
    if (phaseRef.current !== "exploring") return;
    gameAudio.checkpointFound();
    setActiveIndex(index);
    setPhase("station");
  }, []);

  const handleCoin = useCallback(
    (id: string, value: number) => {
      if (collectedRef.current.has(id)) return;
      collectedRef.current.add(id);
      gameAudio.coin();
      setCollected((current) => [...current, id]);
      setCoins((current) => current + value);
      // Banked immediately: there is no results screen in an open map to
      // bank it on later, and `collectedRef` already makes each coin
      // unrepeatable within a session.
      recordExplorerCoins(value);
    },
    [recordExplorerCoins],
  );

  const handleNearChange = useCallback((index: number | null) => {
    setNearIndex(index);
  }, []);

  const handleJump = useCallback(() => gameAudio.jump(), []);

  // The explorer has no finish portal; the controller's finish trigger is
  // never armed, so this exists only to satisfy the shared callback shape.
  const handleFinish = useCallback(() => {}, []);

  const startSession = useCallback(() => {
    gameAudio.unlock();
    gameAudio.startMusic();
    setPhase("exploring");
  }, []);

  const activeStation =
    activeIndex === null ? null : (map.stations[activeIndex] ?? null);
  const activeSound = activeStation
    ? getBeginnerSound(activeStation.soundId)
    : undefined;

  const handleTurn = useCallback(
    () => {
      if (!activeStation || !activeSound) return;
      gameAudio.challengeComplete();
      setCompletions((current) => ({
        ...current,
        [activeStation.id]: (current[activeStation.id] ?? 0) + 1,
      }));
      setCoins((current) => current + activeSound.reward);
      recordStationTurn(map.id, activeStation.soundId, {
        completed: true,
        coins: activeSound.reward,
      });
    },
    [activeStation, activeSound, map.id, recordStationTurn],
  );

  /**
   * Closing a station card is the only moment the last light can have just
   * come on, so the map celebration is decided here rather than watched for
   * in an effect. It fires once ever — `celebratedRef` is seeded from the
   * save — and it fires *after* the child has left the station card, never
   * on top of it.
   */
  const leaveStation = useCallback(() => {
    setActiveIndex(null);
    if (allLit && !celebratedRef.current) {
      celebratedRef.current = true;
      gameAudio.levelComplete();
      recordMapCelebration(map.id);
      setPhase("celebration");
      return;
    }
    setPhase("exploring");
  }, [allLit, map.id, recordMapCelebration]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      gameAudio.setMuted(next);
      if (!next) gameAudio.unlock();
      return next;
    });
  }, []);

  const nearStation = nearIndex === null ? null : map.stations[nearIndex];
  const nearSound = nearStation ? getBeginnerSound(nearStation.soundId) : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#8fd8f5] select-none">
      <div ref={lookRef} className="absolute inset-0 touch-none">
        <ExplorerScene
          map={map}
          input={input}
          characterId={adventures.loadout.characterId}
          auraId={adventures.loadout.auraId}
          hatId={adventures.loadout.hatId}
          jumpBoost={boost?.jump ?? 1}
          speedBoost={boost?.speed ?? 1}
          assist={profile.assistMode}
          paused={paused}
          collected={collected}
          completions={completions}
          repetitions={repetitions}
          litProps={litProps}
          nearIndex={nearIndex}
          runId={runId}
          onCheckpoint={handleStation}
          onCoin={handleCoin}
          onFinish={handleFinish}
          onNearChange={handleNearChange}
          onJump={handleJump}
          onDebugSample={debugEnabled ? handleDebugSample : undefined}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <ExplorerHud
          litStations={litStationIds.length}
          totalStations={map.stations.length}
          coins={coins}
          nearDisplay={nearSound?.display ?? null}
          nearPlace={nearStation?.place ?? null}
          muted={muted}
          onToggleMute={toggleMute}
          onExit={onExit}
        />

        <TouchControls input={input} action="jump" />

        {debugEnabled ? (
          <p
            data-testid="debug-position"
            className="absolute bottom-1 left-1 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-lime-300"
          >
            {debugPosition}
          </p>
        ) : null}

        {phase === "intro" ? (
          <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center bg-[#141420]/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
              <p className="text-xs font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
                Sound Explorer
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-[#141420]">
                {map.title}
              </h1>
              <div className="mt-3 flex justify-center gap-3">
                {map.stations.map((station) => {
                  const sound = getBeginnerSound(station.soundId);
                  return (
                    <span
                      key={station.id}
                      className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#f5c33b] to-[#e09a1e] text-4xl font-black text-white shadow"
                    >
                      {sound?.display ?? "?"}
                    </span>
                  );
                })}
              </div>
              <p className="mt-4 text-base font-bold text-[#4a4a60]">
                Explore and find the glowing letters. Say each sound to light
                up {map.title}!
              </p>
              {group ? (
                <p className="mt-2 text-sm font-semibold text-[#8a8aa0]">
                  {group.glyph} {group.title}
                </p>
              ) : null}
              <button
                type="button"
                onClick={startSession}
                className="mt-6 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                ▶ GO
              </button>
            </div>
          </div>
        ) : null}

        {phase === "station" && activeStation && activeSound ? (
          <SoundStationModal
            key={activeStation.id}
            sound={activeSound}
            place={activeStation.place}
            completions={completions[activeStation.id] ?? 0}
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onTurn={handleTurn}
            onLeave={leaveStation}
          />
        ) : null}

        {phase === "celebration" ? (
          <MapCelebration
            mapTitle={map.title}
            litStations={litStationIds.length}
            coins={coins}
            onKeepExploring={() => setPhase("exploring")}
            onExit={onExit}
          />
        ) : null}
      </div>
    </div>
  );
}
