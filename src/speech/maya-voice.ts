/**
 * Miss Maya's voice — her recorded clips, and nothing else.
 *
 * ## Why there is no text-to-speech any more
 *
 * This module used to fall back to the browser's speech synthesiser
 * whenever a word had no recording, and it read every instruction, every
 * "good job" and every Expert sentence that way. On a real device that is a
 * robot voice, and a robot voice is the one thing a speech-practice app
 * must not put in a child's ear: the whole mechanic is *listen to Miss Maya,
 * then say it back*, so whatever comes out of the speaker is the target a
 * child imitates. Modelling a synthesiser's vowels teaches the wrong thing,
 * and it sounds nothing like the person the child is supposed to be
 * learning from.
 *
 * So the rule is now absolute: **Miss Maya's real recorded voice, or
 * silence.** Never a substitute, never a narrator, never an automatic
 * announcement. Sound comes out only when a child presses to hear a sound,
 * a word or a sentence.
 *
 * ## What that costs, honestly
 *
 * 35 words and 7 sounds are recorded today; the 152 mini-game pack words,
 * every instruction line and every sentence are not. Those simply make no
 * sound, and the UI hides the speaker button rather than offering one that
 * does nothing — see `hasWordClip` and friends, and the generated
 * `maya-clips.ts` that answers them.
 *
 * Dropping a new mp3 into `public/audio/maya/` and running
 * `npm run gen:maya-clips` is all it takes to light a button up. No code
 * change, in this file or any caller.
 */

import {
  MAYA_SENTENCE_CLIPS,
  MAYA_SOUND_CLIPS,
  MAYA_WORD_CLIPS,
} from "./maya-clips";

const wordClips = new Set(MAYA_WORD_CLIPS);
const soundClips = new Set(MAYA_SOUND_CLIPS);
const sentenceClips = new Set(MAYA_SENTENCE_CLIPS);

/** How a word maps to its file name. */
function wordKey(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * How a sentence maps to its file name: lowercase, punctuation dropped,
 * spaces to hyphens. "I see the big moon." → "i-see-the-big-moon".
 *
 * Fixed now, before any sentence has been recorded, so that a batch of
 * recordings can be named against it and simply appear.
 */
export function sentenceSlug(sentence: string): string {
  return sentence
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hasWordClip(word: string): boolean {
  return wordClips.has(wordKey(word));
}

export function hasSoundClip(soundId: string): boolean {
  return soundClips.has(soundId.trim().toLowerCase());
}

export function hasSentenceClip(sentence: string): boolean {
  return sentenceClips.has(sentenceSlug(sentence));
}

/**
 * Plays a clip. Best-effort by design: a rejected `play()` (autoplay
 * policy, a slow network) is swallowed, because a missing sound must never
 * surface as an error to a child mid-game.
 */
function playClip(path: string): void {
  if (typeof window === "undefined") return;
  try {
    const clip = new Audio(path);
    void clip.play().catch(() => {});
  } catch {
    // No Audio support at all. Silence is the correct outcome.
  }
}

/**
 * Plays Miss Maya saying one word. Returns whether there was anything to
 * play, so a caller can decide not to offer the button next time.
 */
export function playExampleWord(word: string): boolean {
  const key = wordKey(word);
  if (!wordClips.has(key)) return false;
  playClip(`/audio/maya/${encodeURIComponent(key)}.mp3`);
  return true;
}

/**
 * Plays Miss Maya modelling one speech sound — the letter's *name* ("Em"
 * for /m/), which is what the recordings are and what recognition listens
 * for. All seven supported sounds are recorded.
 */
export function playExampleSound(soundId: string): boolean {
  const key = soundId.trim().toLowerCase();
  if (!soundClips.has(key)) return false;
  playClip(`/audio/maya/sounds/${encodeURIComponent(key)}.mp3`);
  return true;
}

/**
 * Plays Miss Maya saying a whole sentence.
 *
 * No sentences are recorded yet, so this returns false everywhere today and
 * every sentence speaker button is hidden. The path convention above is
 * fixed so that a recording session lands as a pure content drop.
 */
export function playExampleSentence(sentence: string): boolean {
  const slug = sentenceSlug(sentence);
  if (!sentenceClips.has(slug)) return false;
  playClip(`/audio/maya/sentences/${encodeURIComponent(slug)}.mp3`);
  return true;
}
