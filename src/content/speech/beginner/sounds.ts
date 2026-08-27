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
 * `model` is the letter's **name** — "Em", not the isolated phoneme "mmm"
 * — said once, cleanly, never stretched out. Browser speech recognition
 * transcribes a spoken letter name reliably; it cannot reliably transcribe
 * an isolated consonant held in the mouth with no vowel around it (a glide
 * like /w/ especially). Modelling the letter name is what keeps what Miss
 * Maya says, what a child is asked to repeat, and what recognition listens
 * for all the same thing — see `SoundRecognition` for the full reasoning.
 *
 * `accepted` lists are the spellings browsers actually return for a spoken
 * letter name, not phonetic notation. They are deliberately wide — see
 * `SoundRecognition` for why.
 */
export const BEGINNER_SOUNDS: BeginnerSound[] = [
  {
    id: "m",
    display: "M",
    phoneme: "/m/",
    model: "Em",
    cue: "Put your lips together and hum: mmm.",
    glyph: "🌙",
    anchorWord: "moon",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "m",
        "mm",
        "mmm",
        "mmmm",
        "mmmmm",
        "em",
        "hm",
        "hmm",
        "hmmm",
        "um",
        "umm",
        "mhm",
        "mmhmm",
        "ma",
        "mah",
        "mama",
        "me",
        "my",
        "moo",
        "mom",
        "mum",
      ],
      acceptedPrefixes: ["m", "hm", "um"],
    },
  },
  {
    id: "b",
    display: "B",
    phoneme: "/b/",
    model: "Bee",
    cue: "Press your lips together, then pop them open: b.",
    glyph: "🫧",
    anchorWord: "ball",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "b",
        "bb",
        "bbb",
        "be",
        "bee",
        "bea",
        "buh",
        "bah",
        "ba",
        "baa",
        "bab",
        "baba",
        "boo",
        "bub",
        "bop",
        "bob",
        "bye",
      ],
      acceptedPrefixes: ["b"],
    },
  },
  {
    id: "p",
    display: "P",
    phoneme: "/p/",
    model: "Pee",
    cue: "Lips together, then puff the air out: p.",
    glyph: "🎈",
    anchorWord: "pig",
    group: "group1",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "p",
        "pp",
        "ppp",
        "pe",
        "pea",
        "pee",
        "puh",
        "pah",
        "pa",
        "paa",
        "papa",
        "poo",
        "pop",
        "pup",
        "up",
        "pow",
      ],
      acceptedPrefixes: ["p"],
    },
  },
  {
    id: "w",
    display: "W",
    phoneme: "/w/",
    model: "Double U",
    cue: "Round your lips like a little circle: wuh.",
    glyph: "💧",
    anchorWord: "water",
    group: "group2",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "w",
        "ww",
        "wuh",
        "wa",
        "wah",
        "waa",
        "wo",
        "woh",
        "woo",
        "wow",
        "we",
        "wee",
        "why",
        "one",
        "won",
        "whoa",
        "wu",
        "doubleu",
        "doubleyou",
        "dubya",
      ],
      acceptedPrefixes: ["w", "wh", "double", "dub"],
    },
  },
  {
    id: "f",
    display: "F",
    phoneme: "/f/",
    model: "Eff",
    cue: "Top teeth on your bottom lip, then blow: fff.",
    glyph: "🍃",
    anchorWord: "fish",
    group: "group2",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "f",
        "ff",
        "fff",
        "ffff",
        "ef",
        "eff",
        "fa",
        "fah",
        "fuh",
        "fee",
        "foo",
        "few",
        "if",
        "off",
        "huff",
        "puff",
        "ph",
      ],
      acceptedPrefixes: ["f", "ph"],
    },
  },
  {
    id: "l",
    display: "L",
    phoneme: "/l/",
    model: "El",
    cue: "Tongue tip up behind your top teeth, then sing: l.",
    glyph: "🦁",
    anchorWord: "lion",
    group: "group3",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "l",
        "ll",
        "lll",
        "el",
        "ell",
        "la",
        "lah",
        "laa",
        "lala",
        "luh",
        "lee",
        "le",
        "low",
        "loo",
        "hello",
        "yellow",
      ],
      acceptedPrefixes: ["l", "el"],
    },
  },
  {
    id: "s",
    display: "S",
    phoneme: "/s/",
    model: "Ess",
    cue: "Teeth together and let the air hiss out: sss.",
    glyph: "🐍",
    anchorWord: "sun",
    group: "group3",
    repetitions: 1,
    reward: 5,
    recognition: {
      accepted: [
        "s",
        "ss",
        "sss",
        "ssss",
        "es",
        "ess",
        "sa",
        "sah",
        "suh",
        "sea",
        "see",
        "so",
        "sew",
        "say",
        "sigh",
        "yes",
        "hiss",
        "this",
        "c",
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
