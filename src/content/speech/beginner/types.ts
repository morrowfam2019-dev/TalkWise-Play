/**
 * BEGINNER — Sound Explorer content model.
 *
 * A station targets one speech sound and shows its grapheme, but what Miss
 * Maya models and what a child is asked to say out loud is the letter's
 * **name** — "Em", not the isolated phoneme /m/ held on its own. That switch
 * exists for one reason: browser speech recognition transcribes a spoken
 * letter name reliably, and cannot reliably transcribe an isolated
 * consonant with no vowel around it (a glide like /w/ especially comes back
 * as noise). Keeping the model, the prompt, and the recognizer's target all
 * the same thing — the letter name — is what makes a correct attempt
 * actually get credited.
 *
 * Nothing in here knows about maps, 3D, or recognition APIs. A map consumes
 * this data; the explorer engine renders it. Adding a sound to TalkWise
 * later is a data change in `sounds.ts` plus a station anchor in a map file.
 */

/**
 * Which developmental group a sound belongs to.
 *
 * These order *content*, they do not describe a child. Individual children
 * vary enormously in the order they pick sounds up, and nothing in this
 * product diagnoses, scores, or gates on that. The grouping exists so a
 * three-map world has a defensible reason for what sits where — see
 * `groups.ts` for the ordering rationale and its sources.
 */
export type BeginnerGroupId = "group1" | "group2" | "group3";

/**
 * How the sound-level recogniser decides a child produced the target.
 *
 * Deliberately generous. Browser speech recognition is built to transcribe
 * words, and an isolated consonant held with no vowel is the hardest thing
 * to hand it — an earlier isolated-sound tier was removed from this
 * codebase for exactly that reason. Asking for the letter's *name* instead
 * ("Em" rather than a held /m/) gives the browser something it actually
 * transcribes well. A production still counts when the transcript looks
 * anything like the target: an exact token, a token that starts with it, or
 * the sound's own anchor word. This confirms a child spoke; it is not a
 * pronunciation score, and a speech difference must never read as failure.
 */
export interface SoundRecognition {
  /**
   * Whole transcripts that count, lowercased and stripped to a–z. These are
   * the spellings browsers actually return for a spoken letter name ("em",
   * "bee", "double u" → "doubleu"), not phonetic notation.
   */
  accepted: string[];
  /**
   * A heard token counts when it *starts* with one of these. A child whose
   * "Em" is transcribed as "emma", or whose "Double U" comes back as
   * "dubstep", still said the letter name.
   */
  acceptedPrefixes: string[];
}

/** One practiced speech sound. */
export interface BeginnerSound {
  /**
   * Stable id, matching `SpeechSound.id` on the Intermediate levels — that
   * shared id is what lets one target sound run Beginner → Intermediate →
   * Expert. Used in URLs and saved progress.
   */
  id: string;
  /** The grapheme shown large at the station, e.g. "M". Recognition aid. */
  display: string;
  /** The sound itself, e.g. "/m/". */
  phoneme: string;
  /**
   * How Miss Maya models it out loud — the letter's name, said once,
   * cleanly. "Em" for /m/, "Double U" for /w/. Not the isolated phoneme:
   * browser recognition can't reliably hear that back.
   */
  model: string;
  /** Kid-facing articulation cue. One short sentence, read aloud too. */
  cue: string;
  /** Emoji stand-in, keeping content asset-free. */
  glyph: string;
  /**
   * A real word from the shared library that begins with this sound. Two
   * jobs: Miss Maya can say "mmmmm — like in *moon*" using her existing
   * recorded clip, and a child who answers with the whole word is credited
   * with the sound rather than marked wrong.
   */
  anchorWord: string;
  group: BeginnerGroupId;
  /**
   * Turns that fully light a station. One, everywhere: a correct or
   * credited attempt lights the station immediately rather than asking a
   * child to repeat a sound they already made.
   */
  repetitions: number;
  /** Coins per completed turn. */
  reward: number;
  recognition: SoundRecognition;
}

/** A named developmental group, and the map that hosts it. */
export interface BeginnerGroup {
  id: BeginnerGroupId;
  /** Kid-facing name. Describes the *sounds*, never the child. */
  title: string;
  /** One line for grown-ups, on the map card. */
  blurb: string;
  /** Why these sounds sit together, for the parent view and for us. */
  rationale: string;
  glyph: string;
}
