/**
 * The mini-game content service.
 *
 * Mini-games do not own word lists, exactly as `content/speech/engine.ts`
 * says games do not own speech targets. A mini-game describes what it needs
 * — a pack, a learning level, how many items, and which properties those
 * items must carry — and this layer answers with content:
 *
 * ```
 * gameId + packId + level + targetSound + requires + practiceTrack
 *   + languageBackground + count  →  ContentItem[]
 * ```
 *
 * ## Why the request carries fields nothing reads yet
 *
 * `practiceTrack` and `languageBackground` are honoured in the signature and
 * default to Speech Development / no background — the identical decision
 * `content/speech/engine.ts` documents and for the identical reason. Adding
 * an English Pronunciation track with per-background item pools later must be
 * a data change *here*, not six mini-game engines duplicated per language
 * (§6 of the build plan).
 *
 * ## Randomisation, and its limit
 *
 * §15 asks for varied order, varied distractors and varied placement so the
 * collection does not develop the repetitiveness competitors are criticised
 * for. §15 also says not to randomise so hard that curriculum quality
 * breaks. Both are honoured:
 *
 * - selection is **seeded** (`createRng`), so a session is reproducible and
 *   testable, and the default seed changes daily rather than every render —
 *   a child gets a different set today than yesterday, but not a different
 *   set every time they blink;
 * - the *pool* an item is drawn from is never randomised. Level filtering,
 *   sound filtering and capability filtering all happen first, so shuffling
 *   can only ever reorder content that was already appropriate.
 */

import type {
  LanguageBackground,
  PracticeTrack,
} from "@/content/speech/engine";
import { ANIMAL_WORLD } from "./packs/animalWorld";
import { AROUND_THE_HOUSE } from "./packs/aroundTheHouse";
import { ACTION_TIME } from "./packs/actionTime";
import { COLORS_AND_SHAPES } from "./packs/colorsAndShapes";
import { FEELINGS } from "./packs/feelings";
import { FOOD_FUN } from "./packs/foodFun";
import { MY_BODY } from "./packs/myBody";
import { OUTSIDE_ADVENTURES } from "./packs/outsideAdventures";
import { THINGS_THAT_GO } from "./packs/thingsThatGo";
import type {
  ContentCapability,
  ContentItem,
  ContentPack,
  ContentPackId,
  MiniLearningLevel,
} from "./types";

/**
 * Every pack, in the order the pack picker shows them. Ordering is a
 * product choice — the most universally recognisable themes first, so a
 * three-year-old's first pack card is animals and not feelings.
 */
const PACKS: ContentPack[] = [
  ANIMAL_WORLD,
  COLORS_AND_SHAPES,
  FOOD_FUN,
  THINGS_THAT_GO,
  ACTION_TIME,
  MY_BODY,
  AROUND_THE_HOUSE,
  OUTSIDE_ADVENTURES,
  FEELINGS,
];

export function listContentPacks(): ContentPack[] {
  return PACKS;
}

const PACK_BY_ID = new Map(PACKS.map((pack) => [pack.id, pack]));

export function getContentPack(id: ContentPackId): ContentPack {
  const pack = PACK_BY_ID.get(id);
  if (!pack) throw new Error(`Unknown TalkWise content pack: ${id}`);
  return pack;
}

const ALL_ITEMS: ContentItem[] = PACKS.flatMap((pack) => pack.items);
const ITEM_BY_ID = new Map(ALL_ITEMS.map((item) => [item.id, item]));

export function listAllContentItems(): ContentItem[] {
  return ALL_ITEMS;
}

export function getContentItem(id: string): ContentItem | undefined {
  return ITEM_BY_ID.get(id);
}

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

/**
 * mulberry32 — a small, fast, well-distributed 32-bit PRNG.
 *
 * Deliberately not `Math.random`: a seeded generator is what makes a round
 * reproducible from its seed, which is what makes the content layer
 * verifiable in `npm run verify:minigames` without a browser.
 */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, driven by a supplied generator. Never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A seed that changes once per local calendar day.
 *
 * The §15 "daily variation" hook: with no explicit seed, a mini-game lays
 * out a different set of targets each day and the same set within a day.
 * That is the balance between "it never feels the same" and "my child got
 * confused because it reshuffled mid-session".
 */
export function dailySeed(now: Date = new Date()): number {
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// ---------------------------------------------------------------------------
// Requesting content
// ---------------------------------------------------------------------------

export interface ContentRequest {
  /** Permanent game id, e.g. "GAME-003". Recorded, not branched on. */
  gameId: string;
  /** A specific pack, or "mixed" to draw across every pack. */
  packId: ContentPackId | "mixed";
  level: MiniLearningLevel;
  /** How many items the caller wants. Fewer are returned if the pool is
   * smaller — callers must handle a short answer rather than assume. */
  count: number;
  /** Restrict to items starting with this `content/speech` sound id. */
  targetSound?: string | null;
  /** Properties an item must carry to be usable by this game. */
  requires?: ContentCapability[];
  /** Defaults to Speech Development. */
  practiceTrack?: PracticeTrack;
  /** Only meaningful on the English Pronunciation track. */
  languageBackground?: LanguageBackground | null;
  /** Defaults to today's seed. */
  seed?: number;
}

function hasCapability(
  item: ContentItem,
  capability: ContentCapability,
): boolean {
  switch (capability) {
    case "color":
      return item.color !== null;
    case "shape":
      return item.shape !== null;
    case "action":
      return item.action !== null;
    case "listen":
      return item.listen !== null;
    case "phrase":
      return item.phrase !== null;
    case "sentence":
      return item.sentence !== null;
  }
}

/**
 * The pool a request draws from, before any shuffling: everything that is
 * genuinely appropriate, in stable content order.
 *
 * Exported because Bubble Blast and Sound Match both need to know the whole
 * legal pool to pick distractors out of, not just the items they drew.
 */
export function contentPoolFor(request: ContentRequest): ContentItem[] {
  const source =
    request.packId === "mixed"
      ? ALL_ITEMS
      : getContentPack(request.packId).items;
  const track = request.practiceTrack ?? "speech-development";
  const requires = request.requires ?? [];

  return source.filter((item) => {
    if (!item.levels.includes(request.level)) return false;
    if (!item.practiceTracks.includes(track)) return false;
    if (request.targetSound && item.targetSound !== request.targetSound) {
      return false;
    }
    return requires.every((capability) => hasCapability(item, capability));
  });
}

/**
 * The one call every mini-game makes to get things to practise with.
 *
 * Returns at most `count` items, shuffled by the request's seed. Returns
 * fewer — including none — when the filtered pool is genuinely smaller than
 * asked for; a caller that cannot run on a short answer must check, because
 * padding the answer with inappropriate content would be worse than a
 * shorter round.
 */
export function requestContentItems(request: ContentRequest): ContentItem[] {
  if (request.count <= 0) return [];
  const pool = contentPoolFor(request);
  if (pool.length === 0) return [];
  const rng = createRng(request.seed ?? dailySeed());
  return shuffle(pool, rng).slice(0, request.count);
}

/**
 * Sounds that are easy to confuse with each other in early speech, so that a
 * distractor never quietly turns a *listening* task into an articulation
 * discrimination task the game never claimed to be teaching.
 *
 * §7's Bubble Blast brief is explicit about this: at the Intermediate tier a
 * child popping /m/ pictures should not be sorting *moon* from *noon*.
 *
 * The pairings are the standard early-acquisition confusions — nasals with
 * each other, the bilabial stops with each other, and the glides and
 * liquids with each other — restricted to the sounds TalkWise actually
 * teaches. Not a clinical instrument; a content-selection guard rail.
 */
const CONFUSABLE_SOUNDS: Record<string, string[]> = {
  m: ["b", "p"],
  b: ["p", "m"],
  p: ["b", "m"],
  f: ["s"],
  s: ["f"],
  l: ["w"],
  w: ["l"],
};

export interface DistractorRequest {
  /** The item the distractors must not be confusable with. */
  target: ContentItem;
  /** Everything legal to draw from. Usually a `contentPoolFor` result over
   * the same pack and level, without the sound filter. */
  pool: ContentItem[];
  count: number;
  rng: () => number;
  /** Ids already on screen, which must not be drawn again. */
  exclude?: string[];
}

/**
 * Picks distractors that are wrong for the right reasons.
 *
 * Preference order:
 *
 * 1. items whose sound is neither the target's sound nor confusable with it
 *    — a clean "not this one";
 * 2. anything else still legal, if the first tier cannot fill the request.
 *
 * The fallback matters: a small pack must still be able to run a round.
 * Refusing to fill would strand a child on a loading screen, which is a
 * worse outcome than a slightly harder distractor.
 */
export function pickDistractors(request: DistractorRequest): ContentItem[] {
  const { target, pool, count, rng } = request;
  const excluded = new Set([target.id, ...(request.exclude ?? [])]);
  const confusable = new Set(
    target.targetSound ? (CONFUSABLE_SOUNDS[target.targetSound] ?? []) : [],
  );

  const candidates = pool.filter((item) => !excluded.has(item.id));
  const clean = candidates.filter(
    (item) =>
      item.targetSound !== target.targetSound &&
      !(item.targetSound !== null && confusable.has(item.targetSound)),
  );

  const picked = shuffle(clean, rng).slice(0, count);
  if (picked.length >= count) return picked;

  const pickedIds = new Set(picked.map((item) => item.id));
  const rest = shuffle(
    candidates.filter((item) => !pickedIds.has(item.id)),
    rng,
  );
  return [...picked, ...rest.slice(0, count - picked.length)];
}

/** Whether two items would be confusable as target and distractor. */
export function isConfusablePair(a: ContentItem, b: ContentItem): boolean {
  if (!a.targetSound || !b.targetSound) return false;
  if (a.targetSound === b.targetSound) return true;
  return (CONFUSABLE_SOUNDS[a.targetSound] ?? []).includes(b.targetSound);
}

/** Sound ids that have at least one item somewhere in the library. */
export function listContentSounds(): string[] {
  const sounds = new Set<string>();
  for (const item of ALL_ITEMS) {
    if (item.targetSound) sounds.add(item.targetSound);
  }
  return [...sounds].sort();
}

export type {
  ContentCapability,
  ContentItem,
  ContentPack,
  ContentPackId,
  MiniLearningLevel,
};
