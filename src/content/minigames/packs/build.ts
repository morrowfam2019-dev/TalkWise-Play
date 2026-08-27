/**
 * The one builder every content pack uses.
 *
 * Pack files are data tables and should read like data tables. This fills in
 * the fields an item does not set, and — importantly — **derives `levels`
 * from what the item actually carries**, so a pack cannot claim an item is
 * usable at Intermediate when it has no phrase, or at Expert when it has no
 * sentence. That invariant is checked again by `npm run verify:minigames`,
 * but deriving it here means it cannot be got wrong in the first place.
 */

import type {
  ActionId,
  ColorId,
  ContentItem,
  ContentPackId,
  ListenRecipeId,
  MiniLearningLevel,
  ShapeId,
} from "../types";

export interface ItemDraft {
  /** Unique within the pack. The full id is `${packId}/${id}`. */
  id: string;
  word: string;
  glyph: string;
  /** A `content/speech` sound id, when the word starts with a sound
   * TalkWise teaches. Omit otherwise — the item stays fully usable. */
  sound?: string;
  phrase?: string;
  sentence?: string;
  color?: ColorId;
  shape?: ShapeId;
  action?: ActionId;
  listen?: ListenRecipeId;
  tags?: string[];
}

export function buildItems(
  packId: ContentPackId,
  drafts: ItemDraft[],
): ContentItem[] {
  return drafts.map((draft) => {
    const levels: MiniLearningLevel[] = ["beginner"];
    if (draft.phrase) levels.push("intermediate");
    if (draft.sentence) levels.push("expert");

    return {
      id: `${packId}/${draft.id}`,
      packId,
      word: draft.word,
      glyph: draft.glyph,
      targetSound: draft.sound ?? null,
      phrase: draft.phrase ?? null,
      sentence: draft.sentence ?? null,
      color: draft.color ?? null,
      shape: draft.shape ?? null,
      action: draft.action ?? null,
      listen: draft.listen ?? null,
      tags: draft.tags ?? [],
      // Everything ships on the Speech Development track. English
      // Pronunciation is reserved in the type, not populated — see the note
      // in `types.ts` and §6 of the build plan.
      practiceTracks: ["speech-development"],
      languageBackgrounds: null,
      levels,
    };
  });
}
