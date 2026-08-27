import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * MY BODY — body parts and the words for looking after them.
 *
 * A generic early-learning domain, and one that pairs naturally with speech
 * practice: mouth, lips and tongue are the articulators Miss Maya talks
 * about at every Beginner sound station in GAME-001.
 */
export const MY_BODY: ContentPack = {
  id: "my-body",
  title: "My Body",
  blurb: "Hands, feet and everything in between.",
  glyph: "🖐️",
  gradient: "from-[#ffc48a] to-[#e8825c]",
  items: buildItems("my-body", [
    { id: "mouth", word: "mouth", glyph: "👄", sound: "m", phrase: "open mouth", sentence: "I open my mouth.", color: "red", tags: ["body", "face", "speech"] },
    { id: "moustache", word: "moustache", glyph: "🥸", sound: "m", phrase: "silly moustache", sentence: "I have a silly moustache.", tags: ["body", "face"] },
    { id: "back", word: "back", glyph: "🧍", sound: "b", phrase: "straight back", sentence: "I stand up straight.", tags: ["body"] },
    { id: "brain", word: "brain", glyph: "🧠", sound: "b", phrase: "busy brain", sentence: "My brain is thinking.", color: "pink", tags: ["body"] },
    { id: "palm", word: "palm", glyph: "🤚", sound: "p", phrase: "flat palm", sentence: "I show my palm.", tags: ["body", "hand"] },
    { id: "shoulder", word: "shoulder", glyph: "🤷", sound: "s", phrase: "high shoulder", sentence: "I lift my shoulders up.", tags: ["body"] },
    { id: "leg", word: "leg", glyph: "🦵", sound: "l", phrase: "long leg", sentence: "I kick with my leg.", tags: ["body", "move"] },
    { id: "lips", word: "lips", glyph: "💋", sound: "l", phrase: "soft lips", sentence: "I press my lips together.", color: "pink", tags: ["body", "face", "speech"] },
    { id: "foot", word: "foot", glyph: "🦶", sound: "f", phrase: "fast foot", sentence: "I stamp my foot.", tags: ["body", "move"] },
    { id: "finger", word: "finger", glyph: "☝️", sound: "f", phrase: "one finger", sentence: "I point with my finger.", tags: ["body", "hand"] },
    { id: "face", word: "face", glyph: "😀", sound: "f", phrase: "happy face", sentence: "I have a happy face.", tags: ["body", "face"] },
    { id: "hand", word: "hand", glyph: "✋", phrase: "big hand", sentence: "I wave my hand.", tags: ["body", "hand"] },
    { id: "eye", word: "eye", glyph: "👁️", phrase: "big eye", sentence: "I look with my eyes.", color: "blue", tags: ["body", "face"] },
    { id: "ear", word: "ear", glyph: "👂", phrase: "little ear", sentence: "I listen with my ears.", tags: ["body", "face"] },
    { id: "nose", word: "nose", glyph: "👃", phrase: "small nose", sentence: "I smell with my nose.", tags: ["body", "face"] },
    { id: "hair", word: "hair", glyph: "💇", phrase: "long hair", sentence: "I brush my hair.", color: "brown", tags: ["body"] },
    { id: "tongue", word: "tongue", glyph: "👅", phrase: "pink tongue", sentence: "I move my tongue.", color: "pink", tags: ["body", "face", "speech"] },
    { id: "tooth", word: "tooth", glyph: "🦷", phrase: "white tooth", sentence: "I brush my teeth.", tags: ["body", "face"] },
  ]),
};
