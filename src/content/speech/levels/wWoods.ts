import type { SpeechLevel } from "../types";

export const W_SOUND = {
  id: "w",
  label: "/W/",
  description: "Round your lips small, then open them wide.",
};

export const wWoods: SpeechLevel = {
  id: "w-woods",
  title: "W Woods",
  tagline:
    "Follow the trail through Whisper Woods and practice your /w/ words.",
  sound: W_SOUND,
  worldId: "whisper-woods-of-w",
  unlockRequires: "b-bay",
  challenges: [
    {
      id: "water",
      word: "WATER",
      prompt: "Say WATER!",
      glyph: "💧",
      praise: "GREAT JOB!",
      reward: 10,
    },
    {
      id: "wagon",
      word: "WAGON",
      prompt: "Say WAGON!",
      glyph: "🛒",
      praise: "AWESOME!",
      reward: 10,
    },
    {
      id: "window",
      word: "WINDOW",
      prompt: "Say WINDOW!",
      glyph: "🪟",
      praise: "NICE SPEAKING!",
      reward: 10,
    },
    {
      id: "worm",
      word: "WORM",
      prompt: "Say WORM!",
      glyph: "🪱",
      praise: "YOU DID IT!",
      reward: 10,
    },
    {
      id: "wolf",
      word: "WOLF",
      prompt: "Say WOLF!",
      glyph: "🐺",
      praise: "SUPER TALKING!",
      reward: 10,
    },
  ],
};
