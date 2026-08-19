/**
 * The shared speech content engine.
 *
 * Games do not own word lists. A game describes *what kind of practice it
 * needs right now* and this layer answers with targets:
 *
 * ```
 * gameId + mode + practiceTrack + languageBackground + soundId + difficulty
 *   → SpeechTarget[]
 * ```
 *
 * Time Attack asks for one gate target. Shootout asks for ten. A future
 * 1-on-1 Clutch asks for sentence targets. None of them contain a word.
 *
 * ## Why the request carries fields nothing reads yet
 *
 * `practiceTrack` and `languageBackground` are honoured in the *signature*
 * today and defaulted to Speech Development / no background. That is
 * deliberate: the multilingual/ESL work is explicitly out of scope for this
 * update, but the shape of this call is the thing that would be expensive to
 * change later, because every mode in every game would have to be touched.
 * Adding an English-Pronunciation track with Spanish/Mandarin/Arabic
 * language-background pools later means adding data and a branch *here* —
 * not duplicating a basketball engine per language.
 *
 * Selection is deterministic (cycling, not random) so a round is reproducible
 * and a child gets the same ladder in the same order each time.
 */

import { listLevels } from "./index";
import { getSoundLadder } from "./tiers";

/**
 * Speech difficulty — how hard the *talking* is. Explicitly not the same
 * axis as a game's mechanical difficulty; Basketball keeps its shot-meter
 * tuning separate for exactly this reason.
 *
 * Two tiers, not three. An isolated-sound "Easy / Sound Builder" tier
 * (`mmm`, `ba`, …) shipped originally but speech recognition reliably
 * mis-heard bare sounds and short mouth-noises as silence or noise — so it
 * came back out rather than ship a level that structurally can't register a
 * correct attempt. Beginner now starts at whole words/phrases (what used to
 * be Intermediate); Expert is unchanged (full sentences).
 */
export type SpeechDifficulty = "beginner" | "expert";

export const SPEECH_DIFFICULTIES: {
  id: SpeechDifficulty;
  label: string;
  kicker: string;
  blurb: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    kicker: "Words & Phrases",
    blurb: "Whole words and short phrases.",
  },
  {
    id: "expert",
    label: "Expert",
    kicker: "Sentences",
    blurb: "Full sentences, one word at a time.",
  },
];

export const DEFAULT_SPEECH_DIFFICULTY: SpeechDifficulty = "beginner";

export function isSpeechDifficulty(value: unknown): value is SpeechDifficulty {
  return value === "beginner" || value === "expert";
}

/** Falls back to Beginner for anything unrecognised (e.g. a stale URL, or a
 * link saved back when the removed "easy" tier still existed). */
export function coerceSpeechDifficulty(value: unknown): SpeechDifficulty {
  return isSpeechDifficulty(value) ? value : DEFAULT_SPEECH_DIFFICULTY;
}

/**
 * Which learning programme the targets come from. Speech Development is the
 * only track with content today; English Pronunciation is reserved so that
 * adding it later is a data change, not an API change.
 */
export type PracticeTrack = "speech-development" | "english-pronunciation";

/**
 * A learner's first-language background, used only by the English
 * Pronunciation track. Null for Speech Development.
 */
export type LanguageBackground =
  | "spanish"
  | "french"
  | "mandarin"
  | "arabic"
  | "korean"
  | "vietnamese"
  | "portuguese";

/** One word inside a target, addressable on its own. */
export interface SpeechTargetWord {
  /** Stable within its target: "0", "1", … */
  id: string;
  /** As displayed, punctuation included: "book." */
  text: string;
  /** Lowercased, punctuation stripped — what recognition compares against. */
  normalized: string;
}

/**
 * One thing to say. For Easy and Intermediate this is a single word or short
 * phrase; for Hard it is a sentence whose `words` can be recognised and kept
 * independently, so a learner repairs the one word they missed rather than
 * restarting the sentence.
 */
export interface SpeechTarget {
  /** Unique within the returned set. */
  id: string;
  /** Full text as shown to the child. */
  text: string;
  /** Text broken into individually-recognisable words. */
  words: SpeechTargetWord[];
  /** Instruction line, e.g. "Say MOON!". */
  prompt: string;
  /** Short encouragement after a successful attempt. */
  praise: string;
  /** Emoji stand-in, keeping the content asset-free. */
  glyph: string;
  difficulty: SpeechDifficulty;
  /**
   * True when the target is worth recognising word-by-word. Only sentences
   * set this; a one-word target has nothing to partially complete.
   */
  wordByWord: boolean;
}

export interface SpeechTargetRequest {
  /** Permanent game id, e.g. "GAME-002". Recorded, not branched on. */
  gameId: string;
  /** Mode id within that game, e.g. "timeAttack". Recorded, not branched on. */
  mode: string;
  soundId: string;
  difficulty: SpeechDifficulty;
  /** How many targets the caller wants. The pool cycles if it is shorter. */
  targetCount: number;
  /** Defaults to Speech Development. */
  practiceTrack?: PracticeTrack;
  /** Only meaningful on the English Pronunciation track. */
  languageBackground?: LanguageBackground | null;
}

const PRAISE = [
  "GREAT JOB!",
  "AWESOME!",
  "NICE SPEAKING!",
  "YOU DID IT!",
  "SUPER TALKING!",
];

function splitWords(text: string): SpeechTargetWord[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({
      id: String(index),
      text: word,
      normalized: word.toLowerCase().replace(/[^a-z']/g, ""),
    }));
}

/** How a target is announced, per tier. */
function promptFor(text: string, difficulty: SpeechDifficulty): string {
  if (difficulty === "expert") return "Say the whole sentence!";
  return `Say ${text.toUpperCase()}!`;
}

/** The raw strings available for one sound at one tier, easiest first. */
function poolFor(
  soundId: string,
  difficulty: SpeechDifficulty,
): { text: string; glyph: string }[] {
  const level = listLevels().find((entry) => entry.sound.id === soundId);
  const ladder = getSoundLadder(soundId);

  if (difficulty === "expert") {
    if (!ladder || ladder.sentences.length === 0) {
      // Fall back one tier rather than to nothing.
      return poolFor(soundId, "beginner");
    }
    return ladder.sentences.map((text) => ({ text, glyph: "💬" }));
  }

  const words = (level?.challenges ?? []).map((c) => ({
    text: c.word,
    glyph: c.glyph,
  }));
  const phrases = (ladder?.phrases ?? []).map((text) => ({
    text,
    glyph: "🗨️",
  }));
  return [...words, ...phrases];
}

/**
 * The one call every game mode makes to get something to say.
 *
 * Returns exactly `targetCount` targets, cycling the pool when it is shorter
 * than the request (five words over ten shots means each word comes up
 * twice — the behaviour Shootout already had). Returns an empty array only
 * when the sound genuinely has no content at all, which callers must handle
 * as "this sound isn't ready yet".
 */
export function requestSpeechTargets(
  request: SpeechTargetRequest,
): SpeechTarget[] {
  const { soundId, difficulty, targetCount } = request;
  const pool = poolFor(soundId, difficulty);
  if (pool.length === 0 || targetCount <= 0) return [];

  const targets: SpeechTarget[] = [];
  for (let index = 0; index < targetCount; index += 1) {
    const entry = pool[index % pool.length];
    const words = splitWords(entry.text);
    targets.push({
      id: `${soundId}-${difficulty}-${index}`,
      text: entry.text,
      words,
      prompt: promptFor(entry.text, difficulty),
      praise: PRAISE[index % PRAISE.length],
      glyph: entry.glyph,
      difficulty,
      wordByWord: difficulty === "expert" && words.length > 1,
    });
  }
  return targets;
}

/** Whether a sound has any content at all, at any tier. */
export function hasSpeechContent(soundId: string): boolean {
  return poolFor(soundId, "beginner").length > 0;
}
