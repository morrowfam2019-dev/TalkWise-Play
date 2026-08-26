import type { BeginnerSound } from "./types";

/**
 * The Beginner sound library.
 *
 * **Only sounds TalkWise already supports appear here.** Every entry below
 * has a matching Intermediate word adventure, a Miss Maya recording for its
 * anchor word, and Expert sentences in `tiers.ts`, so the whole
 * sound → word → sentence ladder is real for each one. No placeholder
 * curriculum was invented to pad the map out: seven stations in one world is
 * the honest shape of the current library, and adding the eighth sound later
 * is one record here plus one anchor in the map file.
 *
 * `model` is a single, un-elongated production — "M", not "mmmmm" or
 * "m-m-m" — matching founder feedback that repeated or stretched-out
 * examples read as harder to imitate, not easier. Miss Maya's recording for
 * each sound follows the same rule: she says it once, cleanly.
 *
 * `accepted` lists are the spellings browsers actually return when a child
 * hums or buzzes an isolated consonant, not phonetic notation. They are
 * deliberately wide — see `SoundRecognition` for why.
 */
export const BEGINNER_SOUNDS: BeginnerSound[] = [
  {
    id: "m",
    display: "M",
    phoneme: "/m/",
    model: "M",
    cue: "Put your lips together and hum: mmm.",
    glyph: "🌙",
    anchorWord: "moon",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "m", "mm", "mmm", "mmmm", "mmmmm", "em", "hm", "hmm", "hmmm",
        "um", "umm", "mhm", "mmhmm", "ma", "mah", "mama", "me", "my",
        "moo", "mom", "mum",
      ],
      acceptedPrefixes: ["m", "hm", "um"],
    },
  },
  {
    id: "b",
    display: "B",
    phoneme: "/b/",
    model: "B",
    cue: "Press your lips together, then pop them open: b.",
    glyph: "🫧",
    anchorWord: "ball",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "b", "bb", "bbb", "be", "bee", "bea", "buh", "bah", "ba", "baa",
        "bab", "baba", "boo", "bub", "bop", "bob", "bye",
      ],
      acceptedPrefixes: ["b"],
    },
  },
  {
    id: "p",
    display: "P",
    phoneme: "/p/",
    model: "P",
    cue: "Lips together, then puff the air out: p.",
    glyph: "🎈",
    anchorWord: "pig",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "p", "pp", "ppp", "pe", "pea", "pee", "puh", "pah", "pa", "paa",
        "papa", "poo", "pop", "pup", "up", "pow",
      ],
      acceptedPrefixes: ["p"],
    },
  },
  {
    id: "w",
    display: "W",
    phoneme: "/w/",
    model: "W",
    cue: "Round your lips like a little circle: wuh.",
    glyph: "💧",
    anchorWord: "water",
    group: "group2",
    repetitions: 1,
    reward: 5,
    recognition: {
      // /w/ is a glide: said alone (no vowel riding on it) it decays too
      // fast to transcribe as anything starting with "w" at all, so a real
      // attempt is more likely to come back as a short vowel-ish interjection
      // than a w-word. Listed here rather than assumed, same rule as every
      // other sound in this file.
      accepted: [
        "w", "ww", "wuh", "wa", "wah", "waa", "wo", "woh", "woo", "wow",
        "we", "wee", "why", "one", "won", "whoa", "wu",
        "oo", "ooh", "oh", "ohh", "uh", "uhh", "huh", "who", "hoo", "hu",
        "boo", "goo", "hwa", "hwuh",
      ],
      acceptedPrefixes: ["w", "wh", "oo", "ooh", "uh", "who"],
    },
  },
  {
    id: "f",
    display: "F",
    phoneme: "/f/",
    model: "F",
    cue: "Top teeth on your bottom lip, then blow: fff.",
    glyph: "🍃",
    anchorWord: "fish",
    group: "group2",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "f", "ff", "fff", "ffff", "ef", "eff", "fa", "fah", "fuh", "fee",
        "foo", "few", "if", "off", "huff", "puff", "ph",
      ],
      acceptedPrefixes: ["f", "ph"],
    },
  },
  {
    id: "l",
    display: "L",
    phoneme: "/l/",
    model: "L",
    cue: "Tongue tip up behind your top teeth, then sing: l.",
    glyph: "🦁",
    anchorWord: "lion",
    group: "group3",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "l", "ll", "lll", "el", "ell", "la", "lah", "laa", "lala", "luh",
        "lee", "le", "low", "loo", "hello", "yellow",
      ],
      acceptedPrefixes: ["l", "el"],
    },
  },
  {
    id: "s",
    display: "S",
    phoneme: "/s/",
    model: "S",
    cue: "Teeth together and let the air hiss out: sss.",
    glyph: "🐍",
    anchorWord: "sun",
    group: "group3",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "s", "ss", "sss", "ssss", "es", "ess", "sa", "sah", "suh", "sea",
        "see", "so", "sew", "say", "sigh", "yes", "hiss", "this", "c",
      ],
      acceptedPrefixes: ["s", "es", "c"],
    },
  },
];

export function getBeginnerSound(id: string): BeginnerSound | undefined {
  return BEGINNER_SOUNDS.find((sound) => sound.id === id);
}

export function listBeginnerSoundsInGroup(groupId: string): BeginnerSound[] {
  return BEGINNER_SOUNDS.filter((sound) => sound.group === groupId);
}
