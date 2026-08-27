/**
 * How a mini-game asks for something to say.
 *
 * Mini-games do not own word lists any more than the big games do. This is
 * the adapter between the mini-game content layer (which owns *things*) and
 * the shared speech services (which own recognition and Miss Maya's voice),
 * and it is the only place that knows how a mini learning level maps onto a
 * speech target.
 *
 * ## The mapping, and the one place the two ladders differ
 *
 * ```
 *   BEGINNER      → the item's sound, spoken as its letter name ("Em")
 *   INTERMEDIATE  → the item's word ("moon")
 *   EXPERT        → the item's sentence ("I see the big moon.")
 * ```
 *
 * `content/speech/engine.ts` has only two tiers because an isolated-sound
 * tier was removed from the big games — browser recognition cannot hear a
 * bare consonant reliably, and a *word adventure that cannot be completed*
 * is a broken level. The mini-games can carry the third tier honestly for a
 * different structural reason: **a mini-game round never depends on the
 * recogniser**. The speech moment is always passable by tapping, always, on
 * the first attempt — see `MiniSpeechGate`. So the Beginner tier here asks
 * a child to make a sound and celebrates whatever comes back, which is what
 * §5 and §17 both describe, rather than gating a game behind it.
 *
 * At Beginner the recogniser used is `SoundRecognizer` with the same wide,
 * browser-reality-based accept lists GAME-001's sound stations use, reached
 * through the shared Beginner sound library so there is exactly one
 * definition of "that counts as /m/" on the platform.
 */

import { getBeginnerSound } from "@/content/speech/beginner";
import type { ContentItem, MiniLearningLevel } from "@/content/minigames/types";
import {
  splitTargetWords,
  type SpeechDifficulty,
  type SpeechTargetWord,
} from "@/content/speech/engine";
import type { SoundMatchConfig } from "@/speech/recognition";

/**
 * The mini-game learning level expressed on the speech engine's two-tier
 * axis, for the places that need to speak to shared speech code.
 *
 * Beginner and Intermediate both map to `beginner` (words and phrases) and
 * Expert to `expert` (sentences). The mini Beginner tier's *sound* handling
 * does not go through the two-tier axis at all — it uses `SoundRecognizer`
 * directly, which is why this mapping is honest rather than lossy.
 */
export function toSpeechDifficulty(level: MiniLearningLevel): SpeechDifficulty {
  return level === "expert" ? "expert" : "beginner";
}

/** What kind of thing a child is being asked to say. */
export type MiniSpeechKind = "sound" | "word" | "sentence";

/** One thing to say in a mini-game. */
export interface MiniSpeechTarget {
  /** Unique within its session. */
  id: string;
  kind: MiniSpeechKind;
  /** Full text as shown, e.g. "M", "moon", "I see the big moon." */
  text: string;
  /** Individually-recognisable words. One entry for a sound or a word. */
  words: SpeechTargetWord[];
  /** Instruction line, e.g. "Say MOON!". */
  prompt: string;
  /** What Miss Maya says when she models it. For a sound this is the
   * letter's *name* ("Em"), never the held phoneme — see `maya-voice.ts`. */
  model: string;
  /** Emoji stand-in for the thing. */
  glyph: string;
  /** Articulation cue shown under a Beginner sound, e.g. "Lips together". */
  cue: string | null;
  /** Recognition config, present only for `kind === "sound"`. */
  soundConfig: SoundMatchConfig | null;
  /** Worth recognising word-by-word. Only sentences set this. */
  wordByWord: boolean;
}

/**
 * Builds the speech target for one content item at one level.
 *
 * Returns null only when the item genuinely cannot carry that level — no
 * sound at Beginner, no sentence at Expert. Callers fall back a tier rather
 * than showing a child an empty prompt.
 */
export function speechTargetFor(
  item: ContentItem,
  level: MiniLearningLevel,
): MiniSpeechTarget | null {
  if (level === "beginner") {
    if (!item.targetSound) return null;
    const sound = getBeginnerSound(item.targetSound);
    if (!sound) return null;
    return {
      id: `${item.id}-sound`,
      kind: "sound",
      text: sound.display,
      words: splitTargetWords(sound.display),
      prompt: `Say ${sound.display}!`,
      model: sound.model,
      glyph: item.glyph,
      cue: sound.cue,
      soundConfig: {
        accepted: sound.recognition.accepted,
        acceptedPrefixes: sound.recognition.acceptedPrefixes,
        anchorWord: item.word,
      },
      wordByWord: false,
    };
  }

  if (level === "expert") {
    if (!item.sentence) return null;
    const words = splitTargetWords(item.sentence);
    return {
      id: `${item.id}-sentence`,
      kind: "sentence",
      text: item.sentence,
      words,
      prompt: "Say the whole sentence!",
      model: item.sentence,
      glyph: item.glyph,
      cue: null,
      soundConfig: null,
      wordByWord: words.length > 1,
    };
  }

  // Intermediate: the word itself, not the phrase. The phrase is what the
  // *game* shows and scores against ("big moon"); what a child is asked to
  // say is the word, because a two-word phrase recognised as one blob is
  // the kind of all-or-nothing target §17 warns against.
  const words = splitTargetWords(item.word);
  return {
    id: `${item.id}-word`,
    kind: "word",
    text: item.word,
    words,
    prompt: `Say ${item.word.toUpperCase()}!`,
    model: item.word,
    glyph: item.glyph,
    cue: null,
    soundConfig: null,
    wordByWord: false,
  };
}

/**
 * The speech target for an item, falling back a tier when the item cannot
 * carry the level asked for.
 *
 * Expert → Intermediate → Beginner. A game should never be unable to offer
 * a speech moment because one item in a pack lacks a sentence.
 */
export function speechTargetWithFallback(
  item: ContentItem,
  level: MiniLearningLevel,
): MiniSpeechTarget | null {
  const order: MiniLearningLevel[] =
    level === "expert"
      ? ["expert", "intermediate", "beginner"]
      : level === "intermediate"
        ? ["intermediate", "beginner"]
        : ["beginner", "intermediate"];

  for (const candidate of order) {
    const target = speechTargetFor(item, candidate);
    if (target) return target;
  }
  return null;
}

/**
 * The text a mini-game *displays* for an item at a level — which is not
 * always the text a child is asked to say.
 *
 * Beginner shows the letter, Intermediate shows the phrase where the item
 * has one ("big moon"), Expert shows the sentence. Keeping this beside the
 * speech mapping is what stops the two drifting apart.
 */
export function displayTextFor(
  item: ContentItem,
  level: MiniLearningLevel,
): string {
  if (level === "beginner") return item.word;
  if (level === "expert") return item.sentence ?? item.phrase ?? item.word;
  return item.phrase ?? item.word;
}
