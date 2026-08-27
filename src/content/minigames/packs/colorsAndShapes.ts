import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * COLOURS & SHAPES — the pack Colour & Shape Hunt is built on.
 *
 * Every item here carries **both** a colour and a shape, which is what lets
 * GAME-005 stack descriptors as the level rises: "blue" at Beginner, "blue
 * circle" at Intermediate, "the small blue circle" at Expert. No other pack
 * guarantees both, so Hunt requests this pack's capabilities rather than
 * assuming a pack.
 *
 * The objects are deliberately ordinary things rather than abstract swatches:
 * a child hunting a *blue ball* is doing vocabulary as well as colour
 * matching, and a bare coloured square teaches only the colour.
 */
export const COLORS_AND_SHAPES: ContentPack = {
  id: "colors-and-shapes",
  title: "Colours & Shapes",
  blurb: "Find the colour, find the shape.",
  glyph: "🔵",
  gradient: "from-[#ff87c2] to-[#a273e8]",
  items: buildItems("colors-and-shapes", [
    { id: "moon", word: "moon", glyph: "🌙", sound: "m", phrase: "yellow moon", sentence: "I see the big yellow moon.", color: "yellow", shape: "circle", tags: ["sky"] },
    { id: "ball", word: "ball", glyph: "⚽", sound: "b", phrase: "blue ball", sentence: "The blue ball is bouncing.", color: "blue", shape: "circle", tags: ["toy"] },
    { id: "box", word: "box", glyph: "📦", sound: "b", phrase: "brown box", sentence: "The brown box is square.", color: "brown", shape: "square", tags: ["home"] },
    { id: "balloon", word: "balloon", glyph: "🎈", sound: "b", phrase: "red balloon", sentence: "The red balloon is floating.", color: "red", shape: "oval", tags: ["party"] },
    { id: "present", word: "present", glyph: "🎁", sound: "p", phrase: "pink present", sentence: "The pink present is a square.", color: "pink", shape: "square", tags: ["party"] },
    { id: "plate", word: "plate", glyph: "🍽️", sound: "p", phrase: "white plate", sentence: "The plate is a big circle.", color: "blue", shape: "circle", tags: ["home"] },
    { id: "star", word: "star", glyph: "⭐", sound: "s", phrase: "yellow star", sentence: "I see a yellow star.", color: "yellow", shape: "star", tags: ["sky"] },
    { id: "sun", word: "sun", glyph: "☀️", sound: "s", phrase: "orange sun", sentence: "The orange sun is a circle.", color: "orange", shape: "circle", tags: ["sky"] },
    { id: "sign", word: "sign", glyph: "🔺", sound: "s", phrase: "red sign", sentence: "The red sign is a triangle.", color: "red", shape: "triangle", tags: ["street"] },
    { id: "leaf", word: "leaf", glyph: "🍃", sound: "l", phrase: "green leaf", sentence: "The green leaf is small.", color: "green", shape: "oval", tags: ["garden"] },
    { id: "lolly", word: "lolly", glyph: "🍭", sound: "l", phrase: "purple lolly", sentence: "The purple lolly is a circle.", color: "purple", shape: "circle", tags: ["treat"] },
    { id: "flag", word: "flag", glyph: "🚩", sound: "f", phrase: "red flag", sentence: "The red flag is a triangle.", color: "red", shape: "triangle", tags: ["park"] },
    { id: "flower", word: "flower", glyph: "🌸", sound: "f", phrase: "pink flower", sentence: "The pink flower is small.", color: "pink", shape: "circle", tags: ["garden"] },
    { id: "window", word: "window", glyph: "🪟", sound: "w", phrase: "big window", sentence: "The window is a big square.", color: "blue", shape: "square", tags: ["home"] },
    { id: "wheel", word: "wheel", glyph: "🛞", sound: "w", phrase: "black wheel", sentence: "The wheel is a circle.", color: "brown", shape: "circle", tags: ["vehicle"] },
    { id: "kite", word: "kite", glyph: "🪁", phrase: "orange kite", sentence: "The orange kite is a diamond.", color: "orange", shape: "diamond", tags: ["park"] },
    { id: "heart", word: "heart", glyph: "💜", phrase: "purple heart", sentence: "I see a purple heart.", color: "purple", shape: "heart", tags: ["shape"] },
    { id: "door", word: "door", glyph: "🚪", phrase: "brown door", sentence: "The brown door is a rectangle.", color: "brown", shape: "rectangle", tags: ["home"] },
    { id: "book", word: "book", glyph: "📗", phrase: "green book", sentence: "The green book is a rectangle.", color: "green", shape: "rectangle", tags: ["home"] },
    { id: "orange", word: "orange", glyph: "🍊", phrase: "orange fruit", sentence: "The orange is a small circle.", color: "orange", shape: "circle", tags: ["food"] },
  ]),
};
