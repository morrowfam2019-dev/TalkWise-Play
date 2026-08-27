/**
 * Colour & Shape Hunt's scene builder — pure data, no React.
 *
 * ## The invariant this file exists to guarantee
 *
 * Every instruction must have **exactly one** right answer in the scene.
 * "Find something blue" is a broken instruction if two blue things are on
 * screen, and a child who taps the other blue thing has been told they are
 * wrong for being right. So the scene is not generated and then described —
 * it is generated, and then only the objects whose description is *unique*
 * are eligible to be asked for.
 *
 * That is also what lets the descriptor grow with the level without three
 * separate scene generators:
 *
 * - **Beginner** — colour alone. "Find something blue."
 * - **Intermediate** — colour + shape. "Find the blue circle."
 * - **Expert** — size + colour + shape, and where it is. "Find the small
 *   blue circle next to the tree." Following a two-clause direction is the
 *   listening skill §5 asks this tier to build.
 *
 * Positions are percentages of the stage, so the scene reflows with the
 * screen and a phone in landscape does not push an object off the edge.
 */

import { contentPoolFor, createRng, shuffle } from "@/content/minigames";
import { getColor, SIZES, type SizeId } from "@/content/minigames/attributes";
import type {
  ColorId,
  ContentItem,
  ContentPackId,
  MiniLearningLevel,
  ShapeId,
} from "@/content/minigames/types";
import { GAME_COLOR_SHAPE_HUNT } from "@/platform/games/registry";

/** Objects placed in the scene. */
export const SCENE_SIZE = 10;

/** Finds in a session. §14: 1–2 minutes. */
export const FINDS_PER_SESSION = 8;

/** Which finds open the speech gate. See the note in the game component. */
export const SPEECH_ON_FINDS = [0, 3, 6];

export interface SceneObject {
  id: string;
  item: ContentItem;
  color: ColorId;
  shape: ShapeId;
  size: SizeId;
  /** Percentage of the stage. */
  xPercent: number;
  yPercent: number;
  /** Small idle rotation, so a scene does not read as a spreadsheet. */
  tiltDeg: number;
}

export interface HuntRound {
  index: number;
  targetId: string;
  /** The instruction, as shown. */
  prompt: string;
  /** What Miss Maya reads out — the same words, said as a sentence. */
  spoken: string;
  /** What the child is asked to say afterwards, when speech is offered. */
  sayWord: string;
}

export interface HuntPlan {
  objects: SceneObject[];
  rounds: HuntRound[];
}

/**
 * The box objects are placed in, as stage percentages.
 *
 * Not 0–100. An object is positioned by its *centre* and can be nearly
 * seven rem across, so a centre at 8% puts a third of it off the left edge —
 * where a child cannot tap it, and where the game would then ask them to
 * find it. These insets are sized for the largest object on the narrowest
 * phone, which is the case that has to work.
 */
const SAFE_X = { min: 17, max: 83 };
const SAFE_Y = { min: 11, max: 89 };

/**
 * Lays objects out on a jittered grid inside the safe box.
 *
 * A grid keeps them from overlapping — two objects on top of each other is
 * an untappable target, which §16's large-touch-target rule rules out — and
 * the jitter keeps it from looking like a table. Deliberately not a random
 * scatter with collision rejection: that can loop, and a scene generator
 * that occasionally takes a long time is a scene generator that occasionally
 * stutters on a phone.
 */
function layout(count: number, rng: () => number): { x: number; y: number }[] {
  const columns = count <= 6 ? 2 : 3;
  const rows = Math.ceil(count / columns);
  const spanX = SAFE_X.max - SAFE_X.min;
  const spanY = SAFE_Y.max - SAFE_Y.min;
  const cells: { x: number; y: number }[] = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    // Cell centres, then a jitter of at most a third of a cell so two
    // neighbours can never drift into each other.
    const cellWidth = spanX / columns;
    const cellHeight = spanY / rows;
    cells.push({
      x: SAFE_X.min + cellWidth * (column + 0.5 + (rng() - 0.5) * 0.34),
      y: SAFE_Y.min + cellHeight * (row + 0.5 + (rng() - 0.5) * 0.34),
    });
  }
  return shuffle(cells, rng);
}

function dedupeByColor(items: ContentItem[]): ContentItem[] {
  const seen = new Set<string>();
  const unique: ContentItem[] = [];
  for (const item of items) {
    if (!item.color || seen.has(item.color)) continue;
    seen.add(item.color);
    unique.push(item);
  }
  return unique;
}

/** The nearest other object, for Expert's "next to the ..." clause. */
function nearestNeighbour(
  target: SceneObject,
  objects: SceneObject[],
): SceneObject | null {
  let best: SceneObject | null = null;
  let bestDistance = Infinity;
  for (const other of objects) {
    if (other.id === target.id) continue;
    const distance = Math.hypot(
      other.xPercent - target.xPercent,
      other.yPercent - target.yPercent,
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = other;
    }
  }
  return best;
}

/** The descriptor a level uses, as a comparable key. */
function descriptorKey(object: SceneObject, level: MiniLearningLevel): string {
  if (level === "beginner") return object.color;
  if (level === "intermediate") return `${object.color}/${object.shape}`;
  return `${object.size}/${object.color}/${object.shape}`;
}

function describe(object: SceneObject, level: MiniLearningLevel): string {
  const color = getColor(object.color).label;
  if (level === "beginner") return `something ${color}`;
  if (level === "intermediate") return `the ${color} ${object.shape}`;
  const size = SIZES.find((entry) => entry.id === object.size)?.label ?? "";
  return `the ${size} ${color} ${object.shape}`;
}

/**
 * Builds a whole session.
 *
 * Returns null when the pack cannot fill a scene — Colour & Shape Hunt
 * requires items carrying both a colour and a shape, and its registry entry
 * already restricts it to the pack that guarantees them, so this is a
 * belt-and-braces check rather than an expected path.
 */
export function planHunt(options: {
  packId: ContentPackId;
  level: MiniLearningLevel;
  seed: number;
}): HuntPlan | null {
  const { packId, level, seed } = options;
  const rng = createRng(seed);

  const pool = contentPoolFor({
    gameId: GAME_COLOR_SHAPE_HUNT,
    packId,
    level,
    count: 0,
    requires: ["color", "shape"],
  });
  if (pool.length < 6) return null;

  // At Beginner the descriptor is the colour alone, so two objects sharing
  // a colour make *both* of them unaskable. Deduplicating by colour first
  // means nearly every object in a Beginner scene is a legal target and a
  // session runs its full length, instead of quietly ending after five
  // finds because the scene happened to contain three blue things.
  const shuffled = shuffle(pool, rng);
  const chosen =
    level === "beginner"
      ? dedupeByColor(shuffled).slice(0, SCENE_SIZE)
      : shuffled.slice(0, SCENE_SIZE);
  const cells = layout(chosen.length, rng);

  const objects: SceneObject[] = chosen.map((item, index) => ({
    id: item.id,
    item,
    color: item.color as ColorId,
    shape: item.shape as ShapeId,
    // Size is assigned by the scene, not carried by the item: "big" and
    // "small" are only meaningful relative to what else is on screen.
    size: index % 2 === 0 ? "big" : "small",
    xPercent: cells[index].x,
    yPercent: cells[index].y,
    tiltDeg: (rng() - 0.5) * 16,
  }));

  // Only objects whose descriptor is unique in this scene may be asked for.
  const counts = new Map<string, number>();
  for (const object of objects) {
    const key = descriptorKey(object, level);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const askable = objects.filter(
    (object) => counts.get(descriptorKey(object, level)) === 1,
  );
  if (askable.length < 3) return null;

  const rounds = shuffle(askable, rng)
    .slice(0, FINDS_PER_SESSION)
    .map((object, index) => {
      const description = describe(object, level);

      if (level === "expert") {
        const neighbour = nearestNeighbour(object, objects);
        const where = neighbour ? ` next to the ${neighbour.item.word}` : "";
        return {
          index,
          targetId: object.id,
          prompt: `Find ${description}${where}`,
          spoken: `Find ${description}${where}.`,
          sayWord: object.item.word,
        };
      }

      return {
        index,
        targetId: object.id,
        prompt: `Find ${description}`,
        spoken: `Find ${description}.`,
        sayWord:
          level === "beginner"
            ? getColor(object.color).label
            : object.item.word,
      };
    });

  return { objects, rounds };
}
