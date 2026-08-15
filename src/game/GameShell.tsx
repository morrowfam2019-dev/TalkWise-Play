"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpeechLevel } from "@/content/speech";
import { getBoost } from "@/content/shop";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { getLevelProgress } from "@/player/storage";
import { gameAudio } from "./core/audio";
import { GameInput } from "./core/input";
import { GameScene } from "./scene/GameScene";
import { ChallengeModal } from "./ui/ChallengeModal";
import { Hud } from "./ui/Hud";
import { ResultsScreen } from "./ui/ResultsScreen";
import { TouchControls } from "./ui/TouchControls";
import { getWorld } from "./world";

type Phase = "intro" | "playing" | "challenge" | "results";

interface GameShellProps {
  level: SpeechLevel;
  onExit: () => void;
}

/**
 * Owns a single run: run state, the pause boundary, and the bridge between
 * the 3D scene and the DOM UI. The scene reports events; everything a player
 * can see or save is decided here.
 */
export function GameShell({ level, onExit }: GameShellProps) {
  const world = useMemo(() => getWorld(level.worldId), [level.worldId]);
  const input = useMemo(() => new GameInput(), []);
  const lookRef = useRef<HTMLDivElement>(null);

  const { profile, recordRun } = usePlayerProfile();
  const boost = getBoost(profile.loadout.boostId);

  const total = level.challenges.length;
  const [phase, setPhase] = useState<Phase>("intro");
  const [completed, setCompleted] = useState<boolean[]>(() =>
    level.challenges.map(() => false),
  );
  const [collected, setCollected] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [nearIndex, setNearIndex] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);

  // Opt-in position readout for level design and automated play-throughs.
  const [debugEnabled] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug"),
  );
  const [debugPosition, setDebugPosition] = useState("");

  const handleDebugSample = useCallback((x: number, y: number, z: number) => {
    setDebugPosition(`${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
  }, []);

  // Refs mirror state for the frame loop and for guarding duplicate events
  // that can fire within a single frame, before React has re-rendered.
  const phaseRef = useRef<Phase>("intro");
  const completedRef = useRef<boolean[]>(completed);
  const collectedRef = useRef<Set<string>>(new Set());
  const resultRecorded = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
    completedRef.current = completed;
  }, [phase, completed]);

  const paused = phase !== "playing";

  useEffect(() => {
    const element = lookRef.current;
    if (!element) return;
    return input.attach(element);
  }, [input]);

  useEffect(() => {
    input.setEnabled(!paused);
  }, [input, paused]);

  const handleCheckpoint = useCallback((index: number) => {
    if (phaseRef.current !== "playing") return;
    if (completedRef.current[index]) return;
    gameAudio.checkpointFound();
    setActiveIndex(index);
    setPhase("challenge");
  }, []);

  const handleCoin = useCallback((id: string, value: number) => {
    if (collectedRef.current.has(id)) return;
    collectedRef.current.add(id);
    gameAudio.coin();
    setCollected((current) => [...current, id]);
    setCoins((current) => current + value);
  }, []);

  const handleJump = useCallback(() => {
    gameAudio.jump();
  }, []);

  const handleNearChange = useCallback((index: number | null) => {
    setNearIndex(index);
  }, []);

  const handleFinish = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    gameAudio.levelComplete();
    setPhase("results");
  }, []);

  const handleConfirmChallenge = useCallback(() => {
    const index = activeIndex;
    if (index === null) return;

    gameAudio.challengeComplete();
    setCoins((current) => current + level.challenges[index].reward);
    setCompleted((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
  }, [activeIndex, level.challenges]);

  const closeChallenge = useCallback(() => {
    setActiveIndex(null);
    setPhase("playing");
  }, []);

  const startRun = useCallback(() => {
    gameAudio.unlock();
    gameAudio.startMusic();
    setPhase("playing");
  }, []);

  // Music runs for the lifetime of a run; stop it if the player leaves the
  // level without an unmount happening some other way (e.g. route change).
  useEffect(() => {
    return () => gameAudio.stopMusic();
  }, []);

  const completedCount = completed.filter(Boolean).length;
  const allComplete = total > 0 && completedCount === total;

  // Cue the portal unlocking, just after the challenge celebration lands.
  useEffect(() => {
    if (!allComplete) return;
    const timer = window.setTimeout(() => gameAudio.unlockFinish(), 700);
    return () => window.clearTimeout(timer);
  }, [allComplete]);

  // Persist the run exactly once, when the results screen appears. The
  // previous best is read here, before the run is folded in, so the "new best"
  // badge compares against the record the player actually beat.
  useEffect(() => {
    if (phase !== "results" || resultRecorded.current) return;
    resultRecorded.current = true;
    setIsNewBest(coins > getLevelProgress(profile, level.id).bestCoins);
    recordRun(level.id, {
      checkpoints: completedCount,
      coins,
      completed: completedCount === total,
    });
  }, [phase, recordRun, level.id, completedCount, coins, total, profile]);

  const handleReplay = useCallback(() => {
    collectedRef.current = new Set();
    resultRecorded.current = false;
    setCompleted(level.challenges.map(() => false));
    setCollected([]);
    setCoins(0);
    setActiveIndex(null);
    setNearIndex(null);
    setRunId((current) => current + 1);
    setIsNewBest(false);
    setPhase("playing");
  }, [level.challenges]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      gameAudio.setMuted(next);
      if (!next) gameAudio.unlock();
      return next;
    });
  }, []);

  if (!world) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#141420] p-6 text-center text-white">
        <div>
          <p className="text-xl font-black">This adventure is not ready yet.</p>
          <button
            type="button"
            onClick={onExit}
            className="mt-4 rounded-2xl bg-[#f5c33b] px-6 py-3 font-black text-[#141420]"
          >
            Back to TalkWise Play
          </button>
        </div>
      </div>
    );
  }

  const activeChallenge = activeIndex === null ? null : level.challenges[activeIndex];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden overscroll-none bg-[#8fd8f5] select-none">
      <div ref={lookRef} className="absolute inset-0 touch-none">
        <GameScene
          world={world}
          challenges={level.challenges}
          input={input}
          characterId={profile.loadout.characterId}
          auraId={profile.loadout.auraId}
          jumpBoost={boost?.jump ?? 1}
          speedBoost={boost?.speed ?? 1}
          paused={paused}
          completed={completed}
          collected={collected}
          nearIndex={nearIndex}
          runId={runId}
          onCheckpoint={handleCheckpoint}
          onCoin={handleCoin}
          onFinish={handleFinish}
          onNearChange={handleNearChange}
          onJump={handleJump}
          onDebugSample={debugEnabled ? handleDebugSample : undefined}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <Hud
          completedCount={completedCount}
          totalCheckpoints={total}
          coins={coins}
          nearWord={
            nearIndex === null ? null : (level.challenges[nearIndex]?.word ?? null)
          }
          action={world.action}
          finishUnlocked={completedCount === total}
          muted={muted}
          onToggleMute={toggleMute}
          onExit={onExit}
        />

        <TouchControls input={input} action={world.action} />

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
            <div className="w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
              <p className="text-sm font-black tracking-[0.2em] text-[#8a8aa0] uppercase">
                TalkWise Play
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-[#141420]">
                {level.title}
              </h1>
              <p className="mt-2 text-lg font-extrabold text-[#2f7fd4]">
                Target sound: {level.sound.label}
              </p>
              <p className="mt-4 text-base font-semibold text-[#4a4a60]">
                Explore {world.name} and find {total} speech challenges. Say
                each word out loud to earn coins, then reach the portal!
              </p>
              <p className="mt-3 inline-block rounded-full bg-[#eaf4ff] px-4 py-2 text-sm font-black text-[#2f7fd4]">
                {world.action === "jump"
                  ? "🦘 This adventure uses JUMP"
                  : "🛝 This adventure uses SLIDE"}
              </p>
              <button
                type="button"
                onClick={startRun}
                className="mt-6 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
              >
                START
              </button>
            </div>
          </div>
        ) : null}

        {phase === "challenge" && activeChallenge ? (
          <ChallengeModal
            key={activeChallenge.id}
            challenge={activeChallenge}
            onConfirm={handleConfirmChallenge}
            onDismiss={closeChallenge}
            onClose={closeChallenge}
          />
        ) : null}

        {phase === "results" ? (
          <ResultsScreen
            levelTitle={level.title}
            completedCount={completedCount}
            totalCheckpoints={total}
            coins={coins}
            isNewBest={isNewBest}
            onReplay={handleReplay}
            onExit={onExit}
          />
        ) : null}
      </div>
    </div>
  );
}
