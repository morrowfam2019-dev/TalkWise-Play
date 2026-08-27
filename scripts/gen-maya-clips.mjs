/**
 * Regenerates `src/speech/maya-clips.ts` from what is actually in
 * `public/audio/maya/`.
 *
 * ## Why this is generated rather than hand-written
 *
 * Since browser text-to-speech was removed, a word with no recording is
 * silent — so the UI has to know, at render time, whether pressing the
 * speaker button will do anything, and hide it when it will not. A
 * hand-maintained list of "words Miss Maya has recorded" would drift the
 * first time somebody drops an mp3 in without editing it, and the failure
 * mode is invisible: a button that looks fine and does nothing.
 *
 * So the filesystem is the source of truth and this file is derived from it.
 * `npm run verify:maya` fails if the checked-in manifest is stale.
 *
 * Usage:
 *   npm run gen:maya-clips
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const audioRoot = join(projectRoot, "public", "audio", "maya");

function clipsIn(dir) {
  const path = join(audioRoot, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.toLowerCase().endsWith(".mp3"))
    .map((name) => name.slice(0, -4).toLowerCase())
    .sort();
}

const words = existsSync(audioRoot)
  ? readdirSync(audioRoot)
      .filter((name) => name.toLowerCase().endsWith(".mp3"))
      .map((name) => name.slice(0, -4).toLowerCase())
      .sort()
  : [];
const sounds = clipsIn("sounds");
const sentences = clipsIn("sentences");

const asList = (items) =>
  items.length === 0
    ? "\n]"
    : `\n  ${items.map((item) => JSON.stringify(item)).join(",\n  ")},\n]`;

const output = `/**
 * Which Miss Maya recordings exist. GENERATED — do not edit by hand.
 *
 * Run \`npm run gen:maya-clips\` after adding or removing an mp3 under
 * \`public/audio/maya/\`. \`npm run verify:maya\` fails if this is stale.
 *
 * The UI reads this to decide whether to show a speaker button at all:
 * since text-to-speech was removed, a word with no recording is silent, and
 * a button that does nothing is worse than no button.
 */

/** Words with a clip at \`/audio/maya/<word>.mp3\`. */
export const MAYA_WORD_CLIPS: readonly string[] = [${asList(words)};

/** Sound ids with a clip at \`/audio/maya/sounds/<id>.mp3\`. */
export const MAYA_SOUND_CLIPS: readonly string[] = [${asList(sounds)};

/** Sentence slugs with a clip at \`/audio/maya/sentences/<slug>.mp3\`. */
export const MAYA_SENTENCE_CLIPS: readonly string[] = [${asList(sentences)};
`;

const target = join(projectRoot, "src", "speech", "maya-clips.ts");
const previous = existsSync(target)
  ? (await import("node:fs")).readFileSync(target, "utf8")
  : "";

if (process.argv.includes("--check")) {
  if (previous !== output) {
    console.error(
      "maya-clips.ts is stale. Run `npm run gen:maya-clips` and commit the result.",
    );
    process.exit(1);
  }
  console.log(
    `MAYA CLIP MANIFEST UP TO DATE (${words.length} words, ${sounds.length} sounds, ${sentences.length} sentences)`,
  );
} else {
  writeFileSync(target, output);
  console.log(
    `Wrote ${target}\n  ${words.length} words, ${sounds.length} sounds, ${sentences.length} sentences`,
  );
}
