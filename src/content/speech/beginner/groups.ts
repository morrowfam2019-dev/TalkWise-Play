import type { BeginnerGroup } from "./types";

/**
 * The three Beginner sound groups.
 *
 * ## How the ordering was chosen
 *
 * Groups follow the broad consensus on **typical English consonant
 * acquisition order** — the Early-8 / Middle-8 / Late-8 grouping described
 * by Shriberg (1993), and the age-of-acquisition norms consolidated in
 * Crowe & McLeod's (2020) review of English consonant acquisition. Within
 * that, sounds are clustered by how they are *made*, because a pre-K learner
 * imitating a face benefits from practising one articulator at a time.
 *
 * ## What this ordering is not
 *
 * It is a way of ordering *content*, not a developmental assessment.
 * Children acquire sounds in different orders and on different timelines,
 * and plenty of children will find a Map 3 sound easier than a Map 1 sound.
 * Nothing here is a diagnosis, a milestone claim, or a statement about what
 * a child "should" be able to do at a given age. Maps are not locked behind
 * one another and a family can start anywhere.
 *
 * The kid-facing names describe the sounds ("Lip Sounds"), never the learner.
 */
export const BEGINNER_GROUPS: BeginnerGroup[] = [
  {
    id: "group1",
    title: "Lip Sounds",
    blurb: "Sounds you make with your lips together.",
    rationale:
      "/m/, /b/ and /p/ are bilabials — made by pressing both lips together. " +
      "They are among the earliest English consonants children typically " +
      "produce (Shriberg's Early-8), and they are the easiest to imitate " +
      "because the whole movement is visible on a speaker's face.",
    glyph: "👄",
  },
  {
    id: "group2",
    title: "Air Sounds",
    blurb: "Sounds you make by letting the air flow.",
    rationale:
      "/w/ rounds the lips and /f/ rests the top teeth on the bottom lip; " +
      "both are produced with continuous airflow rather than a full stop. " +
      "/w/ is early-developing and /f/ typically follows it (Middle-8), so " +
      "they sit together as the natural step on from the lip sounds — still " +
      "visible on the face, but now about steady breath.",
    glyph: "🌬️",
  },
  {
    id: "group3",
    title: "Tongue-Tip Sounds",
    blurb: "Sounds you make with the tip of your tongue.",
    rationale:
      "/l/ and /s/ are both later-developing (Late-8) and depend on precise " +
      "tongue-tip placement that a child cannot see on a speaker's face. " +
      "They usually need the most modelling and the most practice, which is " +
      "why they anchor the third map rather than the first.",
    glyph: "👅",
  },
];

export function getBeginnerGroup(id: string): BeginnerGroup | undefined {
  return BEGINNER_GROUPS.find((group) => group.id === id);
}
