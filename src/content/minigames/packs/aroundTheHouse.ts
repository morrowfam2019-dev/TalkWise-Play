import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * AROUND THE HOUSE — objects a child can point at from where they are
 * sitting, which is what makes this pack the strongest one for carry-over
 * practice off the screen.
 *
 * Carries most of the household sound recipes, so Guess the Sound has a
 * non-animal, non-vehicle theme to offer.
 */
export const AROUND_THE_HOUSE: ContentPack = {
  id: "around-the-house",
  title: "Around the House",
  blurb: "Things you can find at home.",
  glyph: "🏠",
  gradient: "from-[#a8d5ff] to-[#5b8ed6]",
  items: buildItems("around-the-house", [
    { id: "mug", word: "mug", glyph: "☕", sound: "m", phrase: "warm mug", sentence: "The mug is on the table.", color: "brown", shape: "circle", tags: ["home", "kitchen"] },
    { id: "mirror", word: "mirror", glyph: "🪞", sound: "m", phrase: "big mirror", sentence: "I can see me in the mirror.", shape: "oval", tags: ["home"] },
    { id: "bed", word: "bed", glyph: "🛏️", sound: "b", phrase: "soft bed", sentence: "The bed is in my room.", shape: "rectangle", tags: ["home", "bedroom"] },
    { id: "bath", word: "bath", glyph: "🛁", sound: "b", phrase: "warm bath", sentence: "The bath is full of water.", color: "blue", tags: ["home", "bathroom"] },
    { id: "pillow", word: "pillow", glyph: "🛌", sound: "p", phrase: "soft pillow", sentence: "The pillow is on my bed.", tags: ["home", "bedroom"] },
    { id: "pan", word: "pan", glyph: "🍳", sound: "p", phrase: "hot pan", sentence: "The pan is on the cooker.", shape: "circle", tags: ["home", "kitchen"] },
    { id: "sofa", word: "sofa", glyph: "🛋️", sound: "s", phrase: "big sofa", sentence: "The sofa is in the living room.", color: "green", shape: "rectangle", tags: ["home"] },
    { id: "soap", word: "soap", glyph: "🧼", sound: "s", phrase: "clean soap", sentence: "The soap is by the sink.", color: "blue", tags: ["home", "bathroom"] },
    { id: "spoon", word: "spoon", glyph: "🥄", sound: "s", phrase: "little spoon", sentence: "The spoon is in the bowl.", tags: ["home", "kitchen"] },
    { id: "lamp", word: "lamp", glyph: "💡", sound: "l", phrase: "bright lamp", sentence: "The lamp is next to my bed.", color: "yellow", tags: ["home"] },
    { id: "fan", word: "fan", glyph: "🌬️", sound: "f", phrase: "cool fan", sentence: "The fan is blowing air.", tags: ["home"] },
    { id: "fork", word: "fork", glyph: "🍴", sound: "f", phrase: "small fork", sentence: "The fork is on the plate.", tags: ["home", "kitchen"] },
    { id: "window", word: "window", glyph: "🪟", sound: "w", phrase: "big window", sentence: "The window is next to the door.", shape: "square", tags: ["home"] },
    { id: "clock", word: "clock", glyph: "🕐", phrase: "round clock", sentence: "The clock is on the wall.", shape: "circle", listen: "clock-tick", tags: ["home"] },
    { id: "door", word: "door", glyph: "🚪", phrase: "brown door", sentence: "The door is closed.", color: "brown", shape: "rectangle", listen: "knock", tags: ["home"] },
    { id: "phone", word: "phone", glyph: "📱", phrase: "little phone", sentence: "The phone is ringing.", shape: "rectangle", listen: "phone-ring", tags: ["home"] },
    { id: "bell", word: "bell", glyph: "🔔", sound: "b", phrase: "loud bell", sentence: "The bell is ringing at the door.", color: "yellow", listen: "doorbell", tags: ["home"] },
    { id: "tap", word: "tap", glyph: "🚰", phrase: "drippy tap", sentence: "The tap is dripping water.", listen: "water-drip", tags: ["home", "kitchen"] },
  ]),
};
