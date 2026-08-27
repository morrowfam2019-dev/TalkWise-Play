import type { SpeechLevel } from "../types";

export const L_SOUND = {
  id: "l",
  label: "/L/",
  description: "Tongue tip up behind your top teeth, then let your voice out.",
};

export const lLagoon: SpeechLevel = {
  id: "l-lagoon",
  title: "L Lagoon",
  tagline: "Walk the ring around the Lagoon of L and practice your /l/ words.",
  sound: L_SOUND,
  worldId: "lagoon-of-l",
  unlockRequires: "s-summit",
  challenges: [
    {
      id: "lion",
      word: "LION",
      prompt: "Say LION!",
      glyph: "🦁",
      praise: "GREAT JOB!",
      reward: 10,
    },
    {
      id: "leaf",
      word: "LEAF",
      prompt: "Say LEAF!",
      glyph: "🍃",
      praise: "AWESOME!",
      reward: 10,
    },
    {
      id: "lamp",
      word: "LAMP",
      prompt: "Say LAMP!",
      glyph: "💡",
      praise: "NICE SPEAKING!",
      reward: 10,
    },
    {
      id: "log",
      word: "LOG",
      prompt: "Say LOG!",
      glyph: "🪵",
      praise: "YOU DID IT!",
      reward: 10,
    },
    {
      id: "lemon",
      word: "LEMON",
      prompt: "Say LEMON!",
      glyph: "🍋",
      praise: "SUPER TALKING!",
      reward: 10,
    },
  ],
};
