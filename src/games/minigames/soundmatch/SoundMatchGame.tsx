"use client";

/**
 * GAME-004 SOUND MATCH — drag the right one into the chest.
 *
 * ## The touch contract, which is the whole point of this game
 *
 * §16 and §26 both single out drag-and-drop as the place a competitor's
 * over-sensitive touch handling hurts most, so this implements the strict
 * version:
 *
 * - a card only *starts* moving after the pointer has travelled
 *   `DRAG_START_PX` — below that it is a rest, not a drag;
 * - a drop only counts on **release**, and only inside the chest (plus a
 *   forgiveness margin, because a four-year-old's aim is not pixel-perfect);
 * - releasing anywhere else returns the card home with an animation and
 *   costs nothing at all — not a wrong answer, not a lost combo. A slip is
 *   not an attempt;
 * - a card held still and released where it started does nothing.
 *
 * ## Tap-to-place, for the children who cannot drag
 *
 * Dragging is a fine motor skill some of this game's players do not have
 * yet, and a game they physically cannot operate teaches nothing. So a tap
 * *selects* a card and a second tap on the chest places it — two deliberate
 * actions, the same intentionality bar the drag path meets, and reachable
 * with a keyboard as well.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { dailySeed } from "@/content/minigames";
import type {
  ContentPackId,
  MiniLearningLevel,
} from "@/content/minigames/types";
import { miniAudio } from "@/minigames/audio";
import { getMiniGame } from "@/minigames/registry";
import { speechTargetWithFallback } from "@/minigames/speech";
import { DRAG_START_PX, isInsideRect, useGestureLock } from "@/minigames/touch";
import { useMiniGameRun } from "@/minigames/useMiniGameRun";
import { MayaCoach, speakerFor } from "@/minigames/ui/MayaCoach";
import { MiniGameHud } from "@/minigames/ui/MiniGameHud";
import { MiniGameResults } from "@/minigames/ui/MiniGameResults";
import { MiniSpeechGate } from "@/minigames/ui/MiniSpeechGate";
import { ParticleLayer, useParticles } from "@/minigames/ui/Particles";
import { PowerUpBadge } from "@/minigames/ui/PowerUpBadge";
import { GAME_SOUND_MATCH, getGame } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import {
  ROUNDS_PER_SESSION,
  planSession,
  type MatchChoice,
} from "./core/rounds";

/** How far outside the chest a release still counts. See the note above. */
const CHEST_FORGIVENESS_PX = 44;

type Stage = "speaking" | "matching" | "celebrating";

export function SoundMatchGame({
  packId,
  level,
}: {
  packId: ContentPackId;
  level: MiniLearningLevel;
}) {
  const router = useRouter();
  const game = getGame(GAME_SOUND_MATCH);
  const definition = getMiniGame(GAME_SOUND_MATCH);
  const { profile, setMicEnabled } = usePlayerProfile();

  const run = useMiniGameRun({
    gameId: GAME_SOUND_MATCH,
    definition,
    packId,
    level,
  });
  const particles = useParticles();
  useGestureLock(true);

  const [sessionIndex, setSessionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("speaking");
  const [selected, setSelected] = useState<string | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [placed, setPlaced] = useState<MatchChoice | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );

  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(
    null,
  );
  const chestRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const rounds = useMemo(
    () =>
      planSession({ packId, level, seed: dailySeed() + sessionIndex * 613 }),
    [packId, level, sessionIndex],
  );
  const round = rounds?.[roundIndex] ?? null;

  const speechTarget = useMemo(
    () => (round ? speechTargetWithFallback(round.target, level) : null),
    [round, level],
  );

  // --- Answering -----------------------------------------------------------

  const resolveDrop = useCallback(
    (choice: MatchChoice, xPercent: number, yPercent: number) => {
      if (!round || stage !== "matching") return;

      if (choice.isTarget) {
        miniAudio.snap();
        run.session.correct();
        particles.burst(xPercent, yPercent, "⭐", "#f5c33b");
        setPlaced(choice);
        setStage("celebrating");
        window.setTimeout(() => {
          setPlaced(null);
          setSelected(null);
          if (roundIndex + 1 >= (rounds?.length ?? 0)) {
            run.finish({ completed: true });
          } else {
            setRoundIndex((index) => index + 1);
            setStage("speaking");
          }
        }, 1100);
        return;
      }

      // Wrong card in the chest: it comes straight back out, gently.
      run.session.wrong();
      setSelected(null);
      setReturning(choice.id);
      window.setTimeout(() => setReturning(null), 300);
    },
    [round, stage, run, particles, roundIndex, rounds],
  );

  // --- Dragging ------------------------------------------------------------

  const handleCardPointerDown = (
    choice: MatchChoice,
    event: React.PointerEvent,
  ) => {
    if (stage !== "matching") return;
    dragStartRef.current = {
      id: choice.id,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCardPointerMove = (event: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    // Below the threshold this is still a rest, not a drag.
    if (!drag && moved < DRAG_START_PX) return;
    setDrag({ id: start.id, x: event.clientX, y: event.clientY });
  };

  const handleCardPointerUp = (
    choice: MatchChoice,
    event: React.PointerEvent,
  ) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    const wasDragging = drag !== null;
    setDrag(null);
    if (!start || stage !== "matching") return;

    if (!wasDragging) {
      // A tap. It selects rather than submits — see the note at the top.
      setSelected((current) => (current === choice.id ? null : choice.id));
      return;
    }

    const chest = chestRef.current?.getBoundingClientRect() ?? null;
    if (
      isInsideRect(chest, event.clientX, event.clientY, CHEST_FORGIVENESS_PX)
    ) {
      const stage_ = document
        .getElementById("match-stage")
        ?.getBoundingClientRect();
      resolveDrop(
        choice,
        stage_ ? ((event.clientX - stage_.left) / stage_.width) * 100 : 50,
        stage_ ? ((event.clientY - stage_.top) / stage_.height) * 100 : 30,
      );
      return;
    }

    // Released away from the chest. Not an attempt — just put it back.
    setReturning(choice.id);
    window.setTimeout(() => setReturning(null), 260);
  };

  const handleChestTap = () => {
    if (stage !== "matching" || !selected || !round) return;
    const choice = round.choices.find((entry) => entry.id === selected);
    if (choice) resolveDrop(choice, 50, 26);
  };

  // --- Stage transitions ---------------------------------------------------

  const handleUnlock = useCallback(
    (spoke: boolean) => {
      if (spoke) run.markSpoke();
      if (!startedRef.current) {
        startedRef.current = true;
        run.begin();
      }
      setStage("matching");
    },
    [run],
  );

  const handleExit = useCallback(() => {
    run.finish({ completed: false });
  }, [run]);

  const handleReplay = useCallback(() => {
    startedRef.current = false;
    setRoundIndex(0);
    setSelected(null);
    setPlaced(null);
    setStage("speaking");
    setSessionIndex((index) => index + 1);
    run.replay();
  }, [run]);

  if (!rounds || !round) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#ffdcae] to-[#ffb877] p-6">
        <div className="max-w-sm rounded-[1.75rem] border-8 border-[#f5c33b] bg-white p-6 text-center shadow-2xl">
          <p className="text-2xl font-black text-[#141420]">
            This pack is not ready for that level yet.
          </p>
          <button
            type="button"
            onClick={() => router.push(game.route)}
            className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-4 py-4 text-xl font-black text-white"
          >
            Pick another
          </button>
        </div>
      </main>
    );
  }

  const dragged = drag
    ? round.choices.find((choice) => choice.id === drag.id)
    : null;

  return (
    <main className="relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[#ffe7c2] via-[#ffcf94] to-[#e8a262]">
      <MiniGameHud
        score={run.session.state.score}
        combo={run.session.state.combo}
        multiplier={run.session.state.combo > 0 ? run.session.multiplier : 1}
        roundLabel={`${roundIndex + 1} of ${rounds.length}`}
        coins={spendableCoins(profile)}
        onExit={handleExit}
      />

      <div
        id="match-stage"
        className="relative flex flex-1 flex-col justify-between overflow-hidden px-4 py-3"
      >
        {/* The instruction, always on screen while matching. */}
        <div className="relative z-10 mx-auto w-full max-w-md">
          <MayaCoach line={round.prompt} speak={speakerFor(speechTarget)} />
        </div>

        {/* The treasure chest — the drop target. Deliberately huge. */}
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div
            ref={chestRef}
            role="button"
            tabIndex={0}
            aria-label={`Backpack — put ${round.chestLabel} in here`}
            onClick={handleChestTap}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleChestTap();
              }
            }}
            className={`flex h-40 w-56 flex-col items-center justify-center rounded-[1.75rem] border-8 border-dashed shadow-xl transition-all sm:h-48 sm:w-72 ${
              placed
                ? "tw-snap border-[#2ecc71] bg-[#e8faf0]"
                : selected
                  ? "border-[#2ecc71] bg-white/95 scale-105"
                  : "border-[#a5713f] bg-white/80"
            }`}
          >
            {placed ? (
              <>
                <span className="text-5xl" aria-hidden>
                  {placed.glyph}
                </span>
                <p className="tw-star mt-1 text-xl font-black text-[#25a25a]">
                  GREAT JOB!
                </p>
              </>
            ) : (
              <>
                <span className="text-5xl" aria-hidden>
                  🎒
                </span>
                <p className="mt-1 px-3 text-center text-lg leading-tight font-black text-[#a5713f]">
                  {selected ? "Tap to put it in!" : round.chestLabel}
                </p>
              </>
            )}
          </div>
        </div>

        {/* The choices. */}
        <div
          className={`relative z-10 mx-auto grid w-full max-w-md gap-2 ${
            round.choices.length > 3 ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          {round.choices.map((choice) => {
            const isDragging = drag?.id === choice.id;
            const isSelected = selected === choice.id;
            const isReturning = returning === choice.id;
            const isGone = placed?.id === choice.id;

            return (
              <button
                key={choice.id}
                type="button"
                disabled={stage !== "matching" || isGone}
                aria-label={choice.label}
                aria-pressed={isSelected}
                onPointerDown={(event) => handleCardPointerDown(choice, event)}
                onPointerMove={handleCardPointerMove}
                onPointerUp={(event) => handleCardPointerUp(choice, event)}
                onPointerCancel={() => {
                  dragStartRef.current = null;
                  setDrag(null);
                }}
                className={`flex touch-none flex-col items-center justify-center rounded-2xl border-4 bg-white p-3 shadow-lg transition-transform ${
                  isSelected ? "border-[#2ecc71] scale-105" : "border-white"
                } ${isDragging ? "opacity-30" : ""} ${
                  isReturning ? "tw-nudge" : ""
                } ${isGone ? "opacity-0" : ""}`}
              >
                {level === "beginner" ? (
                  <span className="text-4xl font-black text-[#141420]">
                    {choice.label}
                  </span>
                ) : (
                  <>
                    <span className="text-4xl leading-none" aria-hidden>
                      {choice.glyph}
                    </span>
                    <span className="mt-1 line-clamp-2 text-center text-xs leading-tight font-black text-[#141420] uppercase">
                      {choice.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* The card in hand, following the finger. */}
        {drag && dragged ? (
          <div
            className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-[#f5c33b] bg-white p-3 shadow-2xl"
            style={{ left: drag.x, top: drag.y }}
            aria-hidden
          >
            {level === "beginner" ? (
              <span className="text-4xl font-black text-[#141420]">
                {dragged.label}
              </span>
            ) : (
              <span className="text-4xl">{dragged.glyph}</span>
            )}
          </div>
        ) : null}

        <ParticleLayer bursts={particles.bursts} />
        <PowerUpBadge active={run.powerUps.active} />

        {stage === "speaking" && speechTarget ? (
          <MiniSpeechGate
            key={`${roundIndex}-${speechTarget.id}`}
            target={speechTarget}
            headline={`Round ${roundIndex + 1} of ${rounds.length}`}
            micEnabled={profile.micEnabled}
            assist={profile.assistMode}
            onMicEnabledChange={setMicEnabled}
            onUnlock={handleUnlock}
          />
        ) : null}

        {stage === "speaking" && !speechTarget ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#141420]/70 p-4">
            <div className="tw-pop w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-5 text-center">
              <MayaCoach line={round.prompt} speak={speakerFor(speechTarget)} />
              <button
                type="button"
                onClick={() => handleUnlock(false)}
                className="mt-4 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-2xl font-black text-white"
              >
                LET&apos;S GO
              </button>
            </div>
          </div>
        ) : null}

        {run.phase === "results" && run.summary && run.reward ? (
          <MiniGameResults
            title="Sound Match"
            summary={run.summary}
            reward={run.reward}
            wasPersonalBest={run.wasPersonalBest}
            bestScore={run.bestScore}
            powerUpsEarned={run.powerUps.earnedCount}
            onReplay={handleReplay}
            setupHref={game.route}
            highlight={
              run.summary.correct >= ROUNDS_PER_SESSION
                ? "You found every single one!"
                : run.summary.correct > 0
                  ? `You found ${run.summary.correct}!`
                  : undefined
            }
          />
        ) : null}
      </div>
    </main>
  );
}
