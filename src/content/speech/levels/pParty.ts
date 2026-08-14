import type { SpeechLevel } from "../types";

export const P_SOUND = {
  id: "p",
  label: "/P/",
  description: "Lips together, then a little puff of air.",
};

export const pParty: SpeechLevel = {
  id: "p-party",
  title: "P Party",
  tagline: "Explore the Party Plaza of P and practice your /p/ words.",
  sound: P_SOUND,
  worldId: "party-plaza-of-p",
  challenges: [
    {
      id: "pop",
      word: "POP",
      prompt: "Say POP!",
      glyph: "🎈",
      praise: "GREAT JOB!",
      reward: 10,
    },
    {
      id: "pig",
      word: "PIG",
      prompt: "Say PIG!",
      glyph: "🐷",
      praise: "AWESOME!",
      reward: 10,
    },
    {
      id: "pizza",
      word: "PIZZA",
      prompt: "Say PIZZA!",
      glyph: "🍕",
      praise: "NICE SPEAKING!",
      reward: 10,
    },
    {
      id: "penguin",
      word: "PENGUIN",
      prompt: "Say PENGUIN!",
      glyph: "🐧",
      praise: "YOU DID IT!",
      reward: 10,
    },
    {
      id: "panda",
      word: "PANDA",
      prompt: "Say PANDA!",
      glyph: "🐼",
      praise: "SUPER TALKING!",
      reward: 10,
    },
  ],
};
