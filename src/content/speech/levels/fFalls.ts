import type { SpeechLevel } from "../types";

export const F_SOUND = {
  id: "f",
  label: "/F/",
  description: "Top teeth on your bottom lip, then blow the air through.",
};

export const fFalls: SpeechLevel = {
  id: "f-falls",
  title: "F Falls",
  tagline: "Climb the spiral at Fern Falls and practice your /f/ words.",
  sound: F_SOUND,
  worldId: "fern-falls-of-f",
  unlockRequires: "l-lagoon",
  challenges: [
    { id: "fish", word: "FISH", prompt: "Say FISH!", glyph: "🐟", praise: "GREAT JOB!", reward: 10 },
    { id: "frog", word: "FROG", prompt: "Say FROG!", glyph: "🐸", praise: "AWESOME!", reward: 10 },
    { id: "fan", word: "FAN", prompt: "Say FAN!", glyph: "🌀", praise: "NICE SPEAKING!", reward: 10 },
    { id: "fox", word: "FOX", prompt: "Say FOX!", glyph: "🦊", praise: "YOU DID IT!", reward: 10 },
    { id: "feather", word: "FEATHER", prompt: "Say FEATHER!", glyph: "🪶", praise: "SUPER TALKING!", reward: 10 },
  ],
};
