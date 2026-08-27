/**
 * Colours, shapes and action verbs — the vocabulary Colour & Shape Hunt and
 * Story Builder teach, and the descriptors every other mini-game can layer
 * on top of a content item.
 *
 * Kept out of the packs so that "blue" is defined exactly once. A pack item
 * says `color: "blue"`; what blue *looks like*, what it is called, and how
 * Miss Maya says it live here.
 *
 * Colours are chosen for contrast against the light game stages and against
 * each other — a child sorting red from orange on a phone in daylight is
 * the actual test. `swatch` is the fill; `ink` is a text colour guaranteed
 * readable on that fill.
 */

import type { ActionId, ColorId, ShapeId } from "./types";

export interface ColorDefinition {
  id: ColorId;
  label: string;
  /** Fill colour for the object. */
  swatch: string;
  /** A darker tone of the same hue, for outlines and depth. */
  shade: string;
  /** Text colour that stays readable on `swatch`. */
  ink: string;
}

export const COLORS: ColorDefinition[] = [
  { id: "red", label: "red", swatch: "#f0483d", shade: "#b32b22", ink: "#ffffff" },
  { id: "blue", label: "blue", swatch: "#2f7fd4", shade: "#1c5292", ink: "#ffffff" },
  { id: "yellow", label: "yellow", swatch: "#f5c33b", shade: "#c2921a", ink: "#141420" },
  { id: "green", label: "green", swatch: "#3fbf62", shade: "#248441", ink: "#ffffff" },
  { id: "orange", label: "orange", swatch: "#ff8a3d", shade: "#c95c17", ink: "#141420" },
  { id: "purple", label: "purple", swatch: "#a273e8", shade: "#6f45b0", ink: "#ffffff" },
  { id: "pink", label: "pink", swatch: "#ff87c2", shade: "#cc5090", ink: "#141420" },
  { id: "brown", label: "brown", swatch: "#a5713f", shade: "#6f4a26", ink: "#ffffff" },
];

const COLOR_BY_ID = new Map(COLORS.map((color) => [color.id, color]));

export function getColor(id: ColorId): ColorDefinition {
  const color = COLOR_BY_ID.get(id);
  if (!color) throw new Error(`Unknown TalkWise colour: ${id}`);
  return color;
}

export interface ShapeDefinition {
  id: ShapeId;
  label: string;
  /**
   * SVG path drawn inside a 0 0 100 100 viewBox, so a shape can be rendered
   * at any size with one fill and one stroke. Original geometry — no traced
   * or imported artwork anywhere in this collection.
   */
  path: string;
}

export const SHAPES: ShapeDefinition[] = [
  {
    id: "circle",
    label: "circle",
    path: "M50 6a44 44 0 1 0 0.1 0z",
  },
  {
    id: "square",
    label: "square",
    path: "M14 14h72a8 8 0 0 1 8 8v56a8 8 0 0 1-8 8H14a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z",
  },
  {
    id: "triangle",
    label: "triangle",
    path: "M50 8 94 86a6 6 0 0 1-5 9H11a6 6 0 0 1-5-9z",
  },
  {
    id: "star",
    label: "star",
    path: "M50 6 62 38l34 2-26 22 8 33-28-18-28 18 8-33L4 40l34-2z",
  },
  {
    id: "heart",
    label: "heart",
    path: "M50 92 12 56a23 23 0 0 1 38-26 23 23 0 0 1 38 26z",
  },
  {
    id: "rectangle",
    label: "rectangle",
    path: "M8 26h84a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8V34a8 8 0 0 1 8-8z",
  },
  {
    id: "diamond",
    label: "diamond",
    path: "M50 4 96 50 50 96 4 50z",
  },
  {
    id: "oval",
    label: "oval",
    path: "M50 12c26 0 44 17 44 38S76 88 50 88 6 71 6 50s18-38 44-38z",
  },
];

const SHAPE_BY_ID = new Map(SHAPES.map((shape) => [shape.id, shape]));

export function getShape(id: ShapeId): ShapeDefinition {
  const shape = SHAPE_BY_ID.get(id);
  if (!shape) throw new Error(`Unknown TalkWise shape: ${id}`);
  return shape;
}

/** Size words that stack on top of a colour and a shape at Expert. */
export type SizeId = "big" | "small";

export const SIZES: { id: SizeId; label: string; scale: number }[] = [
  { id: "big", label: "big", scale: 1.28 },
  { id: "small", label: "small", scale: 0.72 },
];

export interface ActionDefinition {
  id: ActionId;
  /** Bare verb, as the prompt shows it: "jump". */
  label: string;
  /** Progressive form for sentences: "jumping". */
  progressive: string;
  /** Two-word phrase for the Intermediate tier: "jump high". */
  phrase: string;
  glyph: string;
  /**
   * Which CSS keyframe animation the character plays. The animations live in
   * `globals.css` as `tw-act-*` so they are shared, GPU-friendly transforms
   * rather than per-game JavaScript tweens.
   */
  animation: string;
}

export const ACTIONS: ActionDefinition[] = [
  { id: "jump", label: "jump", progressive: "jumping", phrase: "jump high", glyph: "🦘", animation: "tw-act-jump" },
  { id: "run", label: "run", progressive: "running", phrase: "run fast", glyph: "🏃", animation: "tw-act-run" },
  { id: "clap", label: "clap", progressive: "clapping", phrase: "clap loud", glyph: "👏", animation: "tw-act-clap" },
  { id: "spin", label: "spin", progressive: "spinning", phrase: "spin around", glyph: "🌀", animation: "tw-act-spin" },
  { id: "eat", label: "eat", progressive: "eating", phrase: "eat lunch", glyph: "🍎", animation: "tw-act-eat" },
  { id: "sleep", label: "sleep", progressive: "sleeping", phrase: "sleep well", glyph: "😴", animation: "tw-act-sleep" },
  { id: "wave", label: "wave", progressive: "waving", phrase: "wave hello", glyph: "👋", animation: "tw-act-wave" },
  { id: "dance", label: "dance", progressive: "dancing", phrase: "dance along", glyph: "💃", animation: "tw-act-dance" },
  { id: "drink", label: "drink", progressive: "drinking", phrase: "drink water", glyph: "🥤", animation: "tw-act-drink" },
  { id: "sit", label: "sit", progressive: "sitting", phrase: "sit down", glyph: "🪑", animation: "tw-act-sit" },
];

const ACTION_BY_ID = new Map(ACTIONS.map((action) => [action.id, action]));

export function getAction(id: ActionId): ActionDefinition {
  const action = ACTION_BY_ID.get(id);
  if (!action) throw new Error(`Unknown TalkWise action: ${id}`);
  return action;
}
