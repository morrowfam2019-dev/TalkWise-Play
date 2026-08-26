/**
 * BEGINNER — Sound Explorer content model.
 *
 * The unit of practice here is a **speech sound**, not a word and not a
 * letter name. A station shows the grapheme because letter shapes help a
 * pre-reader recognise which station they are standing on, but everything
 * the child is asked to produce, and everything recognition listens for, is
 * the sound itself: /m/ as a single clean "M", never "the letter em".
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
 * words, and an isolated consonant is the hardest thing to hand it — an
 * earlier isolated-sound tier was removed from this codebase for exactly
 * that reason. So a production counts when the transcript looks anything
 * like the sound: an exact token, a token that starts with it, or the
 * sound's own anchor word. This confirms a child spoke; it is not a
 * pronunciation score, and a speech difference must never read as failure.
 */
export interface SoundRecognition {
  /**
   * Whole transcripts that count, lowercased and stripped to a–z. These are
   * the spellings browsers actually return for a hummed or buzzed
   * consonant ("em", "hmm", "um" for /m/), not phonetic notation.
   */
  accepted: string[];
  /**
   * A heard token counts when it *starts* with one of these. A child who
   * says "mmmoon" or whose hum is transcribed as "monkey" still made /m/.
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
   * How Miss Maya models it out loud — a single, clean production, said
   * once. "M", not "mmmmm" and not "m-m-m".
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
