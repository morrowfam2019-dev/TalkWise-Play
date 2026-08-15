import type { SpeechLevel } from "../types";

export const B_SOUND = {
  id: "b",
  label: "/B/",
  description: "Lips together, then pop them open with your voice on.",
};

export const bBay: SpeechLevel = {
  id: "b-bay",
  title: "B Bay",
  tagline: "Explore Bubble Bay of B and practice your /b/ words.",
  sound: B_SOUND,
  worldId: "bubble-bay-of-b",
  unlockRequires: "p-party",
  challenges: [
    {
      id: "ball",
      word: "BALL",
      prompt: "Say BALL!",
      glyph: "⚽",
      praise: "GREAT JOB!",
      reward: 10,
    },
    {
      id: "bubble",
      word: "BUBBLE",
      prompt: "Say BUBBLE!",
      glyph: "🫧",
      praise: "AWESOME!",
      reward: 10,
    },
    {
      id: "boat",
      word: "BOAT",
      prompt: "Say BOAT!",
      glyph: "⛵",
      praise: "NICE SPEAKING!",
      reward: 10,
    },
    {
      id: "banana",
      word: "BANANA",
      prompt: "Say BANANA!",
      glyph: "🍌",
      praise: "YOU DID IT!",
      reward: 10,
    },
    {
      id: "bear",
      word: "BEAR",
      prompt: "Say BEAR!",
      glyph: "🐻",
      praise: "SUPER TALKING!",
      reward: 10,
    },
  ],
};
