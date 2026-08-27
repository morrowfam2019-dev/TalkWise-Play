/**
 * Analytics-ready events for the mini-game collection.
 *
 * §33 is careful about scope: build clean internal events for future
 * measurement, but do **not** build a dashboard on top of infrastructure
 * that does not exist. So this is a typed emitter with no transport — every
 * event is shaped, named and fired at the right moment, and the sink is a
 * no-op until someone wires one up.
 *
 * That is the whole point. §34 wants to be able to answer later "which
 * mini-game gets the most starts, the most completions, the most replays,
 * where do children quit" — and the expensive part of answering that is
 * having emitted the events all along, not having a chart. Adding a
 * transport later is `setAnalyticsSink`; it is not a retrofit through six
 * game engines.
 *
 * ## What is deliberately not in an event
 *
 * No child name, no profile id, no household id, no speech transcript, no
 * audio (§32, §33). An event says what happened in a game, not who it
 * happened to. Anything that could identify a child is the caller's to
 * *not* pass, and there is no field here to pass it in.
 */

import type { MiniLearningLevel } from "@/content/minigames/types";

export type MiniGameEventName =
  | "game_started"
  | "game_completed"
  | "game_exit"
  | "replay_clicked"
  | "target_attempted"
  | "target_completed"
  | "round_score"
  | "difficulty_selected"
  | "category_selected"
  | "power_up_activated";

export interface MiniGameEvent {
  name: MiniGameEventName;
  /** Permanent game id, e.g. "GAME-003". */
  gameId: string;
  /** Content pack id, when the event happened inside a chosen pack. */
  packId?: string;
  level?: MiniLearningLevel;
  /** Session length in milliseconds, on the events where it is known. */
  durationMs?: number;
  score?: number;
  /** Whole percent. */
  accuracy?: number;
  bestCombo?: number;
  /** How the session ended: played through, or left early. */
  outcome?: "completed" | "abandoned";
  /** Free-form, small, never child-identifying. */
  detail?: string;
  /** Milliseconds since the epoch, filled in by `emit`. */
  at?: number;
}

export type AnalyticsSink = (event: MiniGameEvent) => void;

let sink: AnalyticsSink | null = null;

/**
 * Installs the sink every future event is handed to. Passing null removes
 * it, which is the default state and the shipped one.
 */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

/**
 * Records one event.
 *
 * Never throws: a broken sink must not be able to crash a game a child is
 * in the middle of. That is not defensive padding — an analytics failure
 * taking down gameplay is the single worst outcome this module could have.
 */
export function emitMiniGameEvent(event: MiniGameEvent): void {
  if (!sink) return;
  try {
    sink({ ...event, at: Date.now() });
  } catch {
    // Swallowed on purpose. See above.
  }
}
