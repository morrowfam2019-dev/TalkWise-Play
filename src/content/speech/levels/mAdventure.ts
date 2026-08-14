import type { SpeechLevel } from "../types";

export const M_SOUND = {
  id: "m",
  label: "/M/",
  description: "Lips together, humming sound.",
};

export const mAdventure: SpeechLevel = {
  id: "m-adventure",
  title: "M Adventure",
  tagline: "Climb the Mountain of M and practice your /m/ words.",
  sound: M_SOUND,
  worldId: "mountain-of-m",
  challenges: [
    {
      id: "mom",
      word: "MOM",
      prompt: "Say MOM!",
      glyph: "💖",
      praise: "GREAT JOB!",
      reward: 10,
    },
    {
      id: "moon",
      word: "MOON",
      prompt: "Say MOON!",
      glyph: "🌙",
      praise: "AWESOME!",
      reward: 10,
    },
    {
      id: "milk",
      word: "MILK",
      prompt: "Say MILK!",
      glyph: "🥛",
      praise: "NICE SPEAKING!",
      reward: 10,
    },
    {
      id: "mouse",
      word: "MOUSE",
      prompt: "Say MOUSE!",
      glyph: "🐭",
      praise: "YOU DID IT!",
      reward: 10,
    },
    {
      id: "monkey",
      word: "MONKEY",
      prompt: "Say MONKEY!",
      glyph: "🐵",
      praise: "SUPER TALKING!",
      reward: 10,
    },
  ],
};
