/**
 * Speech content model.
 *
 * This layer is deliberately free of any game-engine, rendering, or platform
 * concepts. A level describes *what* is practiced; the game engine decides
 * *how* it is presented. Swapping /M/ for /P/ should mean adding a data file
 * here, not editing world or gameplay code.
 */

/** A target speech sound, e.g. /m/. */
export interface SpeechSound {
  /** Stable id used in URLs and saved progress, e.g. "m". */
  id: string;
  /** Display form, e.g. "/M/". */
  label: string;
  /** Short kid-facing description of the sound. */
  description: string;
}

/** One word-practice challenge presented at a checkpoint. */
export interface SpeechChallenge {
  /** Stable id, unique within its level. */
  id: string;
  /** The target word, shown in caps to the child. */
  word: string;
  /** Instruction line, e.g. "Say MOON!". */
  prompt: string;
  /** Simple visual stand-in for the word (emoji keeps the prototype asset-free). */
  glyph: string;
  /** Short encouragement shown after the child confirms they practiced. */
  praise: string;
  /** Coins awarded on completion. */
  reward: number;
}

/** A playable level: one sound, one world, an ordered set of challenges. */
export interface SpeechLevel {
  /** Stable id used in routes and saved progress, e.g. "m-adventure". */
  id: string;
  /** Kid-facing title, e.g. "M Adventure". */
  title: string;
  /** One-line description for the home screen card. */
  tagline: string;
  /** The sound this level practices. */
  sound: SpeechSound;
  /** Id of the world the game engine should load for this level. */
  worldId: string;
  /**
   * Challenges in checkpoint order. The world supplies N checkpoint anchors;
   * challenges are bound to anchors by index at load time, so neither side
   * hard-codes the other's contents.
   */
  challenges: SpeechChallenge[];
}
