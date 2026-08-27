import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * FEELINGS — emotion words.
 *
 * Sentences here are first-person on purpose ("I feel happy today") rather
 * than third-person descriptions of a picture. A child naming their own
 * feeling is the communication skill worth practising; labelling a stranger's
 * cartoon face is not the same thing.
 */
export const FEELINGS: ContentPack = {
  id: "feelings",
  title: "Feelings",
  blurb: "Words for how we feel today.",
  glyph: "😊",
  gradient: "from-[#ffd76e] to-[#f2856d]",
  items: buildItems("feelings", [
    { id: "mad", word: "mad", glyph: "😠", sound: "m", phrase: "very mad", sentence: "I feel mad right now.", color: "red", tags: ["feeling"] },
    { id: "brave", word: "brave", glyph: "🦸", sound: "b", phrase: "so brave", sentence: "I feel brave today.", tags: ["feeling"] },
    { id: "proud", word: "proud", glyph: "🏅", sound: "p", phrase: "very proud", sentence: "I feel proud of my work.", color: "yellow", tags: ["feeling"] },
    { id: "sad", word: "sad", glyph: "😢", sound: "s", phrase: "a bit sad", sentence: "I feel sad today.", color: "blue", tags: ["feeling"] },
    { id: "silly", word: "silly", glyph: "🤪", sound: "s", phrase: "so silly", sentence: "I feel silly today.", tags: ["feeling"] },
    { id: "sleepy", word: "sleepy", glyph: "🥱", sound: "s", phrase: "very sleepy", sentence: "I feel sleepy right now.", tags: ["feeling"] },
    { id: "shy", word: "shy", glyph: "🙈", sound: "s", phrase: "a bit shy", sentence: "I feel shy with new people.", tags: ["feeling"] },
    { id: "loved", word: "loved", glyph: "🥰", sound: "l", phrase: "very loved", sentence: "I feel loved by my family.", color: "pink", tags: ["feeling"] },
    { id: "funny", word: "funny", glyph: "😂", sound: "f", phrase: "so funny", sentence: "I feel funny and I want to laugh.", tags: ["feeling"] },
    { id: "worried", word: "worried", glyph: "😟", sound: "w", phrase: "a bit worried", sentence: "I feel worried about that.", tags: ["feeling"] },
    { id: "happy", word: "happy", glyph: "😀", phrase: "very happy", sentence: "I feel happy today.", color: "yellow", tags: ["feeling"] },
    { id: "excited", word: "excited", glyph: "🤩", phrase: "so excited", sentence: "I feel excited about today.", tags: ["feeling"] },
    { id: "calm", word: "calm", glyph: "😌", phrase: "nice and calm", sentence: "I feel calm and quiet.", color: "green", tags: ["feeling"] },
    { id: "surprised", word: "surprised", glyph: "😲", phrase: "very surprised", sentence: "I feel surprised by that.", tags: ["feeling"] },
  ]),
};
