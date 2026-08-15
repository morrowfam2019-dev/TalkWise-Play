import type { SpeechLevel } from "../types";

export const S_SOUND = {
  id: "s",
  label: "/S/",
  description: "Teeth together, tongue behind them, and let the air hiss.",
};

export const sSummit: SpeechLevel = {
  id: "s-summit",
  title: "S Summit",
  tagline: "Zigzag up the Summit of S and practice your /s/ words.",
  sound: S_SOUND,
  worldId: "summit-of-s",
  unlockRequires: "w-woods",
  challenges: [
    { id: "sun", word: "SUN", prompt: "Say SUN!", glyph: "☀️", praise: "GREAT JOB!", reward: 10 },
    { id: "snake", word: "SNAKE", prompt: "Say SNAKE!", glyph: "🐍", praise: "AWESOME!", reward: 10 },
    { id: "sock", word: "SOCK", prompt: "Say SOCK!", glyph: "🧦", praise: "NICE SPEAKING!", reward: 10 },
    { id: "star", word: "STAR", prompt: "Say STAR!", glyph: "⭐", praise: "YOU DID IT!", reward: 10 },
    { id: "soup", word: "SOUP", prompt: "Say SOUP!", glyph: "🍲", praise: "SUPER TALKING!", reward: 10 },
  ],
};
