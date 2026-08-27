import type { ContentPack } from "../types";
import { buildItems } from "./build";

/**
 * THINGS THAT GO — vehicles, and the pack that carries the most sound
 * recipes. Guess the Sound leans on it heavily; Bubble Blast and Story
 * Builder use the same items without any vehicle-specific code.
 */
export const THINGS_THAT_GO: ContentPack = {
  id: "things-that-go",
  title: "Things That Go",
  blurb: "Cars, trains, boats and rockets.",
  glyph: "🚗",
  gradient: "from-[#5cc8ff] to-[#2f6fd4]",
  items: buildItems("things-that-go", [
    { id: "motorbike", word: "motorbike", glyph: "🏍️", sound: "m", phrase: "fast motorbike", sentence: "The motorbike is going fast.", tags: ["vehicle", "road"] },
    { id: "bus", word: "bus", glyph: "🚌", sound: "b", phrase: "big bus", sentence: "The bus is stopping.", color: "yellow", tags: ["vehicle", "road"] },
    { id: "boat", word: "boat", glyph: "⛵", sound: "b", phrase: "little boat", sentence: "The boat is sailing.", color: "blue", listen: "boat-horn", tags: ["vehicle", "water"] },
    { id: "bike", word: "bike", glyph: "🚲", sound: "b", phrase: "red bike", sentence: "I am riding my bike.", color: "red", tags: ["vehicle", "road"] },
    { id: "plane", word: "plane", glyph: "✈️", sound: "p", phrase: "high plane", sentence: "The plane is flying.", listen: "plane-woosh", tags: ["vehicle", "sky"] },
    { id: "police-car", word: "police car", glyph: "🚓", sound: "p", phrase: "loud police car", sentence: "The police car is coming.", listen: "siren", tags: ["vehicle", "road"] },
    { id: "ship", word: "ship", glyph: "🚢", sound: "s", phrase: "big ship", sentence: "The ship is sailing.", tags: ["vehicle", "water"] },
    { id: "scooter", word: "scooter", glyph: "🛴", sound: "s", phrase: "small scooter", sentence: "I am riding a scooter.", tags: ["vehicle", "road"] },
    { id: "lorry", word: "lorry", glyph: "🚚", sound: "l", phrase: "long lorry", sentence: "The lorry is driving.", tags: ["vehicle", "road"] },
    { id: "fire-engine", word: "fire engine", glyph: "🚒", sound: "f", phrase: "red fire engine", sentence: "The fire engine is coming.", color: "red", listen: "siren", tags: ["vehicle", "road"] },
    { id: "ferry", word: "ferry", glyph: "⛴️", sound: "f", phrase: "big ferry", sentence: "The ferry is sailing.", tags: ["vehicle", "water"] },
    { id: "wagon", word: "wagon", glyph: "🛺", sound: "w", phrase: "little wagon", sentence: "The wagon is rolling.", tags: ["vehicle", "road"] },
    { id: "car", word: "car", glyph: "🚗", phrase: "blue car", sentence: "The car is driving.", color: "blue", listen: "car-horn", tags: ["vehicle", "road"] },
    { id: "train", word: "train", glyph: "🚂", phrase: "long train", sentence: "The train is going.", listen: "train-whistle", tags: ["vehicle", "track"] },
    { id: "helicopter", word: "helicopter", glyph: "🚁", phrase: "loud helicopter", sentence: "The helicopter is flying.", listen: "helicopter", tags: ["vehicle", "sky"] },
    { id: "rocket", word: "rocket", glyph: "🚀", phrase: "fast rocket", sentence: "The rocket is going up.", tags: ["vehicle", "space"] },
    { id: "tractor", word: "tractor", glyph: "🚜", phrase: "green tractor", sentence: "The tractor is working.", color: "green", tags: ["vehicle", "farm"] },
    { id: "digger", word: "digger", glyph: "🚧", phrase: "yellow digger", sentence: "The digger is digging.", color: "yellow", tags: ["vehicle", "work"] },
  ]),
};
