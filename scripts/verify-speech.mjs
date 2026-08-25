/**
 * Speech-content verification for TalkWise Play.
 *
 * Runs the *real* recognition rule and the *real* content registries under
 * Node and checks the things that would otherwise only show up with a child
 * and a microphone:
 *
 *   1. Every Beginner sound is matched by every transcript its own config
 *      lists, and by its anchor word.
 *   2. Silence and unrelated speech are not matched as a sound.
 *   3. The three-stage ladder joins up: every Beginner sound has an
 *      Intermediate word adventure and an Expert sentence quest under the
 *      same sound id.
 *   4. Every Expert sentence splits into words recognition can actually
 *      match on — no empty or punctuation-only tokens.
 *
 * Usage:
 *   npm run verify:speech
 */
import { execFileSync } from "node:child_process";
import Module, { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(projectRoot, ".verify-speech-tmp");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let failures = 0;
let checks = 0;

function check(name, condition, detail = "") {
  checks += 1;
  if (!condition) failures += 1;
  if (!condition || process.env.VERBOSE) {
    console.log(`  ${condition ? "OK  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
  }
}

try {
  writeFileSync(
    join(outDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../tsconfig.json",
        compilerOptions: {
          noEmit: false,
          rootDir: "../src",
          outDir: ".",
          module: "commonjs",
          moduleResolution: "node",
          target: "es2020",
          isolatedModules: false,
          incremental: false,
          types: [],
        },
        include: [],
        exclude: ["../node_modules"],
        files: [
          "../src/speech/recognition.ts",
          "../src/content/speech/curriculum.ts",
          "../src/content/speech/engine.ts",
        ],
      },
      null,
      2,
    ),
  );
  execFileSync("npx", ["tsc", "-p", join(outDir, "tsconfig.json")], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith("@/")) {
      return resolveFilename.call(this, join(outDir, request.slice(2)), ...rest);
    }
    return resolveFilename.call(this, request, ...rest);
  };

  const require = createRequire(join(projectRoot, "package.json"));
  const { isSoundMatch } = require(join(outDir, "speech/recognition.js"));
  const { getSoundCurriculum, listSoundCurricula } = require(
    join(outDir, "content/speech/curriculum.js"),
  );
  const { BEGINNER_SOUNDS, BEGINNER_GROUPS } = require(
    join(outDir, "content/speech/beginner/index.js"),
  );
  const { listExpertQuests } = require(join(outDir, "content/speech/expert/index.js"));
  const { splitTargetWords } = require(join(outDir, "content/speech/engine.js"));

  const configFor = (sound) => ({
    accepted: sound.recognition.accepted,
    acceptedPrefixes: sound.recognition.acceptedPrefixes,
    anchorWord: sound.anchorWord,
  });

  // --- 1. every listed transcript matches its own sound ---------------------
  console.log("\n=== 1. each sound matches everything its config lists ===");
  for (const sound of BEGINNER_SOUNDS) {
    const config = configFor(sound);
    for (const token of sound.recognition.accepted) {
      check(`${sound.phoneme} accepts "${token}"`, isSoundMatch(token, config));
    }
    check(
      `${sound.phoneme} accepts its anchor word "${sound.anchorWord}"`,
      isSoundMatch(sound.anchorWord, config),
    );
    // Browsers punctuate and capitalise; the rule strips both.
    check(
      `${sound.phoneme} ignores punctuation and case`,
      isSoundMatch(` ${sound.anchorWord.toUpperCase()}. `, config),
    );
    check(
      `${sound.phoneme} accepts an elongated production`,
      isSoundMatch(sound.model, config),
      sound.model,
    );
  }
  console.log(`  ${BEGINNER_SOUNDS.length} sounds checked`);

  // --- 2. silence and unrelated speech are not a match ----------------------
  console.log("\n=== 2. silence and unrelated speech do not count ===");
  const NOISE = ["", "   ", "...", "!!!"];
  for (const sound of BEGINNER_SOUNDS) {
    const config = configFor(sound);
    for (const noise of NOISE) {
      check(
        `${sound.phoneme} rejects ${JSON.stringify(noise)}`,
        !isSoundMatch(noise, config),
      );
    }
  }
  // One clearly-unrelated utterance per sound, chosen to share no letters
  // with the target where possible.
  const UNRELATED = {
    m: "the quick red fox",
    b: "hello there kitty",
    p: "another giraffe now",
    w: "big red apple",
    f: "monkey rides again",
    l: "big orange dog",
    s: "big orange kitten",
  };
  for (const sound of BEGINNER_SOUNDS) {
    const phrase = UNRELATED[sound.id];
    if (!phrase) continue;
    check(
      `${sound.phoneme} rejects "${phrase}"`,
      !isSoundMatch(phrase, configFor(sound)),
    );
  }

  // --- 3. the three-stage ladder joins up -----------------------------------
  console.log("\n=== 3. sound → word → sentence, for every Beginner sound ===");
  for (const sound of BEGINNER_SOUNDS) {
    const ladder = getSoundCurriculum(sound.id);
    check(`${sound.phoneme} has a Beginner station record`, ladder.beginner !== undefined);
    check(
      `${sound.phoneme} has an Intermediate word adventure`,
      ladder.intermediate !== undefined,
      ladder.intermediate?.title,
    );
    check(
      `${sound.phoneme} has Intermediate target words`,
      (ladder.intermediate?.challenges.length ?? 0) > 0,
    );
    check(
      `${sound.phoneme} has an Expert sentence quest`,
      ladder.expert !== undefined,
      ladder.expert?.title,
    );
    check(`${sound.phoneme} has Expert sentences`, ladder.sentences.length > 0);
    check(
      `${sound.phoneme} anchor word is a real Intermediate target`,
      (ladder.intermediate?.challenges ?? []).some(
        (challenge) => challenge.word.toLowerCase() === sound.anchorWord.toLowerCase(),
      ),
      sound.anchorWord,
    );
  }
  check(
    "every group has at least one sound",
    BEGINNER_GROUPS.every((group) =>
      BEGINNER_SOUNDS.some((sound) => sound.group === group.id),
    ),
  );
  check(
    "every sound belongs to a registered group",
    BEGINNER_SOUNDS.every((sound) =>
      BEGINNER_GROUPS.some((group) => group.id === sound.group),
    ),
  );

  // --- 4. Expert sentences split into recognisable words --------------------
  console.log("\n=== 4. Expert sentences split into recognisable words ===");
  let sentenceCount = 0;
  for (const quest of listExpertQuests()) {
    check(`${quest.title} has scenes`, quest.scenes.length > 0);
    for (const scene of quest.scenes) {
      sentenceCount += 1;
      const words = splitTargetWords(scene.sentence);
      check(
        `${quest.id}/${scene.id} splits into words`,
        words.length > 1,
        scene.sentence,
      );
      check(
        `${quest.id}/${scene.id} every word is matchable`,
        words.every((word) => word.normalized.length > 0),
        words.map((word) => word.normalized).join("|"),
      );
      check(
        `${quest.id}/${scene.id} word ids are unique`,
        new Set(words.map((word) => word.id)).size === words.length,
      );
    }
  }
  console.log(
    `  ${listExpertQuests().length} quests, ${sentenceCount} sentences checked`,
  );

  // --- Content inventory ----------------------------------------------------
  console.log("\n=== Content inventory ===");
  for (const entry of listSoundCurricula()) {
    const group = entry.beginner
      ? (BEGINNER_GROUPS.find((g) => g.id === entry.beginner.group)?.title ?? "—")
      : "—";
    console.log(
      `  ${entry.label.padEnd(5)} ${group.padEnd(20)} ` +
        `beginner=${entry.beginner ? "yes" : "no "}  ` +
        `words=${String(entry.intermediate?.challenges.length ?? 0).padStart(2)}  ` +
        `sentences=${String(entry.sentences.length).padStart(2)}  ` +
        `expert=${entry.expert ? entry.expert.title : "none"}`,
    );
  }

  console.log("");
  console.log(
    failures === 0
      ? `SPEECH VERIFICATION PASS (${checks} checks)`
      : `SPEECH VERIFICATION FAIL (${failures}/${checks} checks failed)`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
