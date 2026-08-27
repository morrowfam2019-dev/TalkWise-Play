import { listLevels } from "../index";
import { getSoundLadder } from "../tiers";
import type { ExpertQuest, ExpertScene, ExpertSceneKind } from "./types";

/**
 * The Expert quest library.
 *
 * One quest is hand-authored end to end — **Moonlight Meadow** for /m/ —
 * because the founder brief asks for one polished representative experience
 * before content is multiplied. The remaining sounds get quests assembled
 * from the sentences that already exist in `tiers.ts` through
 * `questFromLadder`, so every supported sound is genuinely playable today
 * without anyone inventing new speech curriculum to fill a screen.
 *
 * Replacing a generated quest with a hand-authored one later means adding it
 * to `AUTHORED` — the generator only fills gaps.
 */

const SCENE_KINDS: ExpertSceneKind[] = ["describe", "answer", "activate"];

/** Coins per scene. Higher than an Intermediate checkpoint: a sentence is
 * more production than a word, and the reward should say so. */
const SCENE_REWARD = 20;

/**
 * MOONLIGHT MEADOW — the polished representative Expert experience.
 *
 * Four scenes, four different communication acts: describe what you see,
 * answer a direct question, complete a character's sentence, and speak to
 * make something happen. Each outcome changes the meadow, so the story is
 * visibly driven by talking rather than by walking.
 */
const moonlightMeadow: ExpertQuest = {
  id: "m-moonlight",
  soundId: "m",
  title: "Moonlight Meadow",
  tagline: "The meadow has gone dark. Talk to Mira and bring the moon back.",
  characterName: "Mira the Moon Keeper",
  characterGlyph: "🧝",
  glyph: "🌙",
  cardGradient: "from-[#5b7cfa] to-[#2b3f8f]",
  scenes: [
    {
      id: "moonrise",
      kind: "describe",
      setup:
        "Mira is standing in a dark meadow. “Something is up there in the sky,” she says, “but I cannot quite make it out. Can you tell me what you see?”",
      ask: "Tell Mira what you can see.",
      sentence: "I see the big moon.",
      outcome:
        "The clouds slide apart and the moon rises over the meadow. Everything turns silver.",
      glyph: "🌙",
      reward: SCENE_REWARD,
    },
    {
      id: "picnic",
      kind: "answer",
      setup:
        "“Wonderful!” says Mira. “Now it is bright enough for a picnic. Who packed the basket, and what is in it?”",
      ask: "Answer Mira.",
      sentence: "My mom made me some milk.",
      outcome:
        "A checked blanket unrolls itself across the grass and a jug of milk lands right in the middle of it.",
      glyph: "🥛",
      reward: SCENE_REWARD,
    },
    {
      id: "monkey",
      kind: "answer",
      setup:
        "A monkey swings down from the tallest tree and points at the fruit bowl, chattering. Mira laughs. “I think somebody is asking for something. What does the monkey want?”",
      ask: "Tell Mira what the monkey wants.",
      sentence: "The monkey wants more bananas.",
      outcome:
        "The monkey cheers, grabs a banana, and swings a rope bridge down across the stream for you.",
      glyph: "🐵",
      reward: SCENE_REWARD,
    },
    {
      id: "lanterns",
      kind: "activate",
      setup:
        "At the far end of the bridge, a row of moon lanterns sits dark and cold. “They only light for a voice,” Mira says. “Say it with me.”",
      ask: "Say the sentence to light the lanterns.",
      sentence: "The moonlight makes the meadow warm.",
      outcome:
        "One by one, every lantern flickers awake. The meadow glows, and Mira gives you the Moon Keeper's badge.",
      glyph: "🏮",
      reward: SCENE_REWARD,
    },
  ],
};

const AUTHORED: ExpertQuest[] = [moonlightMeadow];

/** Story shells for generated quests, one per sound, so a generated quest
 * still has a place and a character rather than a bare sentence list. */
interface QuestShell {
  soundId: string;
  title: string;
  tagline: string;
  characterName: string;
  characterGlyph: string;
  glyph: string;
  cardGradient: string;
  /** Framing for scene N, paired with ladder sentence N. */
  setups: string[];
  outcomes: string[];
}

const SHELLS: QuestShell[] = [
  {
    soundId: "p",
    title: "Pepper's Party",
    tagline: "Pepper is throwing a party and needs your voice to set it up.",
    characterName: "Pepper the Party Panda",
    characterGlyph: "🐼",
    glyph: "🎉",
    cardGradient: "from-[#ff8fb1] to-[#d63f77]",
    setups: [
      "Pepper is holding an empty plate. “The kitchen will only send out an order it can hear,” she says. “What should I ask for?”",
      "A penguin waddles in wearing a party hat and stands next to the panda, waiting to be introduced.",
      "One pink balloon is floating stubbornly out of reach above the table.",
    ],
    outcomes: [
      "A steaming pizza slides out of the kitchen hatch and lands on the plate.",
      "The penguin and the panda start a dance and the whole plaza joins in.",
      "The balloon drifts down, pops in a shower of confetti, and the party starts properly.",
    ],
  },
  {
    soundId: "b",
    title: "Bubble Bay Rescue",
    tagline: "A little boat is stuck out in the bay. Talk it home.",
    characterName: "Bo the Bay Bear",
    characterGlyph: "🐻",
    glyph: "⛵",
    cardGradient: "from-[#5ad2f0] to-[#2477b8]",
    setups: [
      "A baby bear is sitting on the jetty, staring at something bobbing in the water. “What has it got?” he asks.",
      "The ball has drifted out past the rocks. Bo says the tide only answers to somebody who says what they can do.",
      "Through the mist you can just make out a small blue boat, ringed by bubbles.",
    ],
    outcomes: [
      "The bear holds up a bright blue ball and waves it at you.",
      "A wave rolls in, bounces the ball right back to the jetty, and Bo catches it.",
      "The bubbles carry the boat safely in to the dock, and Bo ties it up.",
    ],
  },
  {
    soundId: "w",
    title: "Windy Woods Wagon",
    tagline: "Help Willa get her wagon up the hill before the weather turns.",
    characterName: "Willa the Woodkeeper",
    characterGlyph: "🧑‍🌾",
    glyph: "🛒",
    cardGradient: "from-[#8fd36b] to-[#3f8f4a]",
    setups: [
      "Something moves in the trees beyond the cabin window. Willa goes very still. “Tell me what is out there,” she whispers.",
      "Willa hands you an empty cup and points at the kettle on the stove.",
      "The wagon is loaded and the hill looks steep. Willa takes one handle and looks at you.",
    ],
    outcomes: [
      "The wolf sees you, wags its tail, and trots off happily into the woods.",
      "Willa fills the cup and you both sit down by the window.",
      "The wagon rolls up the hill with the two of you pulling, and the woods open out at the top.",
    ],
  },
  {
    soundId: "s",
    title: "Sunny Summit",
    tagline: "Climb to the summit with Sam and wake the sky up.",
    characterName: "Sam the Summit Snake",
    characterGlyph: "🐍",
    glyph: "☀️",
    cardGradient: "from-[#ffc95a] to-[#e08a1e]",
    setups: [
      "Sam is coiled on a warm rock, refusing to move until somebody describes him properly.",
      "At the top of the trail the sky is still grey. Sam says the sun comes out for a voice that names it.",
      "A picnic table sits at the summit with an empty bowl on it, and Sam is very obviously hungry.",
    ],
    outcomes: [
      "Sam laughs so hard he falls off the rock, then slides ahead to show you the trail.",
      "The clouds burn away and a single bright star hangs over the summit.",
      "The bowl fills with soup and the two of you eat it looking out over everything.",
    ],
  },
  {
    soundId: "l",
    title: "Lantern Lagoon",
    tagline: "The lagoon lights are out. Say them back on, one by one.",
    characterName: "Lulu the Lagoon Lion",
    characterGlyph: "🦁",
    glyph: "🏮",
    cardGradient: "from-[#ffd35a] to-[#c98a12]",
    setups: [
      "A very small lion is sitting by the water with a lemon in both paws, making a face.",
      "The first lantern on the jetty is dark. Lulu says it only lights for somebody who says which one they like.",
      "A long log lies across the channel, covered in leaves, blocking the way to the last lantern.",
    ],
    outcomes: [
      "The lion pulls the funniest face you have ever seen, and the water lights up around her.",
      "The yellow lamp flares on and lays a golden stripe across the lagoon.",
      "The leaves lift off in a spiral and the log rolls aside, opening the channel.",
    ],
  },
  {
    soundId: "f",
    title: "Fern Falls Friends",
    tagline: "Five frogs are missing at the falls. Talk them home.",
    characterName: "Finn the Falls Fox",
    characterGlyph: "🦊",
    glyph: "💦",
    cardGradient: "from-[#7be0c8] to-[#1f9e86]",
    setups: [
      "Finn comes tearing down the path and skids to a stop. “You will never guess what I just found,” he pants.",
      "A single feather is drifting down through the spray, turning slowly.",
      "The old fan above the waterwheel is rattling and will not stop.",
    ],
    outcomes: [
      "Five frogs hop out from behind the rock in a line, croaking a welcome.",
      "The feather lands in your open hand, soft as anything.",
      "The fan sighs to a stop, and in the quiet you can hear the whole falls.",
    ],
  },
];

const ASK_BY_KIND: Record<ExpertSceneKind, string> = {
  answer: "Answer the question out loud.",
  describe: "Say what you can see.",
  finish: "Finish the sentence.",
  activate: "Say the sentence to make it happen.",
  greet: "Say hello.",
};

/**
 * Builds a quest for one sound out of its existing ladder sentences and a
 * story shell. Returns undefined when the sound has no sentences yet, which
 * is the honest answer for a sound the library has not reached.
 */
function questFromShell(shell: QuestShell): ExpertQuest | undefined {
  const ladder = getSoundLadder(shell.soundId);
  if (!ladder || ladder.sentences.length === 0) return undefined;

  const scenes: ExpertScene[] = ladder.sentences.map((sentence, index) => {
    const kind = SCENE_KINDS[index % SCENE_KINDS.length];
    return {
      id: `${shell.soundId}-scene-${index + 1}`,
      kind,
      setup: shell.setups[index] ?? shell.setups[shell.setups.length - 1],
      ask: ASK_BY_KIND[kind],
      sentence,
      outcome:
        shell.outcomes[index] ?? shell.outcomes[shell.outcomes.length - 1],
      glyph: shell.characterGlyph,
      reward: SCENE_REWARD,
    };
  });

  return {
    id: `${shell.soundId}-quest`,
    soundId: shell.soundId,
    title: shell.title,
    tagline: shell.tagline,
    characterName: shell.characterName,
    characterGlyph: shell.characterGlyph,
    glyph: shell.glyph,
    cardGradient: shell.cardGradient,
    scenes,
  };
}

/** Authored quests first, then generated ones for every other supported
 * sound, in the same order the Intermediate levels are registered. */
const QUESTS: ExpertQuest[] = (() => {
  const all = [...AUTHORED];
  for (const shell of SHELLS) {
    if (all.some((quest) => quest.soundId === shell.soundId)) continue;
    const quest = questFromShell(shell);
    if (quest) all.push(quest);
  }
  const order = listLevels().map((level) => level.sound.id);
  return all.sort(
    (a, b) => order.indexOf(a.soundId) - order.indexOf(b.soundId),
  );
})();

export function listExpertQuests(): ExpertQuest[] {
  return QUESTS;
}

export function getExpertQuest(id: string): ExpertQuest | undefined {
  return QUESTS.find((quest) => quest.id === id);
}

export function getExpertQuestForSound(
  soundId: string,
): ExpertQuest | undefined {
  return QUESTS.find((quest) => quest.soundId === soundId);
}
