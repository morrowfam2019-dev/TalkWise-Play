/**
 * EXPERT — Sentence Adventures content model.
 *
 * Expert is not Intermediate with longer words. The unit of practice is a
 * **sentence used to do something**: a child says a whole sentence to a
 * character, and the story moves because they said it. So the content model
 * here is a story, not a word list — a quest is an ordered set of scenes,
 * each of which pairs a situation with the sentence that resolves it.
 *
 * Sentences are drawn from the shared sound ladders in `tiers.ts` wherever
 * possible, so the same target sound a child met as /m/ in Beginner and as
 * MOON in Intermediate comes back here inside connected speech. Nothing in
 * this file knows how a scene is rendered.
 */

/**
 * What kind of communication act a scene asks for.
 *
 * The renderer uses this to frame the ask ("Tell Mira what you see") and to
 * pick the scene's staging. It is deliberately a small closed set: adding a
 * sixth kind should be a considered product decision, not a content typo.
 */
export type ExpertSceneKind =
  /** Answer a character who has asked you something. */
  | "answer"
  /** Say what you can see. */
  | "describe"
  /** Complete the sentence the character started. */
  | "finish"
  /** Say the sentence to make something in the world happen. */
  | "activate"
  /** Greet or thank a character. */
  | "greet";

/** One story beat: a situation, the sentence that resolves it, the result. */
export interface ExpertScene {
  /** Stable id, unique within its quest. */
  id: string;
  kind: ExpertSceneKind;
  /** The situation, in the character's or narrator's voice. */
  setup: string;
  /** What the child is being asked to do, in one short line. */
  ask: string;
  /** The sentence to say. Recognised word by word. */
  sentence: string;
  /** What happens in the story once the sentence is said. */
  outcome: string;
  /** Emoji staging for the scene. */
  glyph: string;
  /** Coins awarded for completing the scene. */
  reward: number;
}

/** One Expert story: a character, a place, and a run of scenes. */
export interface ExpertQuest {
  /** Stable id used in routes and saved progress, e.g. "m-moonlight". */
  id: string;
  /**
   * The target sound this quest practices, matching `SpeechSound.id` and
   * `BeginnerSound.id`. This is the join that makes one sound run all three
   * stages.
   */
  soundId: string;
  /** Kid-facing title. */
  title: string;
  /** One line for the quest card. */
  tagline: string;
  /** The character the child talks to. */
  characterName: string;
  /** The character's emoji stand-in. */
  characterGlyph: string;
  /** Emoji for the quest card. */
  glyph: string;
  /** Tailwind gradient classes for the card banner. */
  cardGradient: string;
  scenes: ExpertScene[];
}
