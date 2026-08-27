/**
 * Saved-progress verification for TalkWise Play.
 *
 * Runs the *real* sanitizers and merge functions from `src/player` under
 * Node — no browser, no React — and asserts the promises the GAME-001
 * three-tier upgrade makes about existing saves:
 *
 *   1. A v1 flat profile still migrates into the GAME-001 namespace.
 *   2. A pre-tier v2 profile keeps every word-adventure record and simply
 *      gains empty Beginner and Expert tiers.
 *   3. Sanitising is idempotent — running it over its own output changes
 *      nothing, which matters because the household is re-sanitised on every
 *      read, on every write, and again server-side.
 *   4. Beginner and Expert writes never touch the Intermediate record, and
 *      GAME-001 writes never touch GAME-002.
 *   5. The wallet is never minted or lost by a migration.
 *
 * Usage:
 *   npm run verify:progress
 */
import { execFileSync } from "node:child_process";
import Module, { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(projectRoot, ".verify-progress-tmp");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let failures = 0;
let checks = 0;

function check(name, condition, detail = "") {
  checks += 1;
  if (!condition) failures += 1;
  console.log(
    `  ${condition ? "OK  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`,
  );
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
        files: ["../src/player/storage.ts"],
      },
      null,
      2,
    ),
  );
  execFileSync("npx", ["tsc", "-p", join(outDir, "tsconfig.json")], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  // TypeScript leaves `@/…` specifiers in the emitted CommonJS, so the same
  // alias the app's bundler resolves is taught to Node here.
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith("@/")) {
      return resolveFilename.call(
        this,
        join(outDir, request.slice(2)),
        ...rest,
      );
    }
    return resolveFilename.call(this, request, ...rest);
  };

  const require = createRequire(join(projectRoot, "package.json"));
  const storage = require(join(outDir, "player/storage.js"));
  const {
    sanitizeProfile,
    getLevelProgress,
    getMapProgress,
    getQuestProgress,
    getStationProgress,
    mergeRunResult,
    mergeStationResult,
    mergeQuestResult,
    markMapCelebration,
  } = storage;

  const GAME_001 = "GAME-001";
  const GAME_002 = "GAME-002";

  // --- 1. v1 flat profile ---------------------------------------------------
  console.log("\n=== 1. v1 flat profile migrates into GAME-001 ===");
  const v1 = {
    name: "Ari",
    totalCoins: 240,
    spentCoins: 60,
    currentStreak: 4,
    bestStreak: 9,
    lastPlayedDate: "2026-08-24",
    micEnabled: false,
    assistMode: true,
    owned: ["character-default", "hat-crown"],
    loadout: { characterId: "character-default", hatId: "hat-crown" },
    levels: {
      "m-adventure": { bestCheckpoints: 5, bestCoins: 78, completed: true },
      "p-party": { bestCheckpoints: 3, bestCoins: 41, completed: false },
    },
  };
  const fromV1 = sanitizeProfile(v1);
  check(
    "wallet carried across",
    fromV1.totalCoins === 240 && fromV1.spentCoins === 60,
  );
  check(
    "streak carried across",
    fromV1.currentStreak === 4 && fromV1.bestStreak === 9,
  );
  check(
    "settings carried across",
    fromV1.micEnabled === false && fromV1.assistMode === true,
  );
  check(
    "m-adventure record intact",
    getLevelProgress(fromV1, "m-adventure").bestCoins === 78 &&
      getLevelProgress(fromV1, "m-adventure").completed === true,
  );
  check(
    "p-party record intact",
    getLevelProgress(fromV1, "p-party").bestCheckpoints === 3 &&
      getLevelProgress(fromV1, "p-party").completed === false,
  );
  check("owned hat kept", fromV1.games[GAME_001].owned.includes("hat-crown"));
  check(
    "beginner tier defaulted",
    Object.keys(fromV1.games[GAME_001].beginner.maps).length === 0,
  );
  check(
    "expert tier defaulted",
    Object.keys(fromV1.games[GAME_001].expert.quests).length === 0,
  );

  // --- 2. pre-tier v2 profile ----------------------------------------------
  console.log(
    "\n=== 2. namespaced pre-tier profile gains the two new tiers ===",
  );
  const v2 = {
    name: "Bo",
    totalCoins: 500,
    spentCoins: 120,
    currentStreak: 2,
    bestStreak: 11,
    lastPlayedDate: "2026-08-25",
    micEnabled: true,
    assistMode: false,
    games: {
      [GAME_001]: {
        owned: ["character-default"],
        loadout: { characterId: "character-default" },
        levels: {
          "b-bay": { bestCheckpoints: 5, bestCoins: 90, completed: true },
        },
      },
      [GAME_002]: {
        owned: ["baller-nova"],
        loadout: { ballerId: "baller-nova" },
        highScores: { m: { bestScore: 7, bestBaskets: 5, bestStreak: 3 } },
        modes: { shootout: { "m:beginner": { bestScore: 7 } } },
      },
    },
  };
  const fromV2 = sanitizeProfile(v2);
  check(
    "b-bay record intact",
    getLevelProgress(fromV2, "b-bay").bestCoins === 90,
  );
  check("beginner tier present", fromV2.games[GAME_001].beginner !== undefined);
  check("expert tier present", fromV2.games[GAME_001].expert !== undefined);
  check(
    "GAME-002 high score untouched",
    fromV2.games[GAME_002].highScores.m?.bestScore === 7,
    JSON.stringify(fromV2.games[GAME_002].highScores),
  );
  check(
    "wallet unchanged",
    fromV2.totalCoins === 500 && fromV2.spentCoins === 120,
  );

  // --- 3. idempotence -------------------------------------------------------
  console.log("\n=== 3. sanitising is idempotent ===");
  const once = sanitizeProfile(v2);
  const twice = sanitizeProfile(once);
  const thrice = sanitizeProfile(twice);
  check(
    "second pass identical",
    JSON.stringify(once) === JSON.stringify(twice),
  );
  check(
    "third pass identical",
    JSON.stringify(twice) === JSON.stringify(thrice),
  );

  const v1Once = sanitizeProfile(v1);
  const v1Twice = sanitizeProfile(v1Once);
  check(
    "v1 migration idempotent",
    JSON.stringify(v1Once) === JSON.stringify(v1Twice),
  );

  // A save written by a future build that moved the key is read, not dropped.
  console.log(
    "\n=== 3b. an `intermediate.levels` shape merges rather than drops ===",
  );
  const nested = sanitizeProfile({
    ...v2,
    games: {
      ...v2.games,
      [GAME_001]: {
        ...v2.games[GAME_001],
        levels: {
          "b-bay": { bestCheckpoints: 5, bestCoins: 90, completed: true },
        },
        intermediate: {
          levels: {
            "w-woods": { bestCheckpoints: 4, bestCoins: 55, completed: false },
          },
        },
      },
    },
  });
  check("legacy key read", getLevelProgress(nested, "b-bay").bestCoins === 90);
  check(
    "nested key read",
    getLevelProgress(nested, "w-woods").bestCoins === 55,
  );

  // --- 4. tier isolation ----------------------------------------------------
  console.log("\n=== 4. tier and game isolation ===");
  const now = new Date("2026-08-25T12:00:00Z");
  let profile = sanitizeProfile(v2);

  profile = mergeStationResult(
    profile,
    "sunny-park",
    "m",
    { completed: true, coins: 5 },
    now,
  );
  profile = mergeStationResult(
    profile,
    "sunny-park",
    "m",
    { completed: true, coins: 5 },
    now,
  );
  check(
    "beginner turns counted",
    getStationProgress(profile, "sunny-park", "m").completions === 2 &&
      getStationProgress(profile, "sunny-park", "m").attempts === 2,
  );
  check("beginner coins to shared wallet", profile.totalCoins === 510);
  check(
    "intermediate record untouched by beginner",
    getLevelProgress(profile, "b-bay").bestCoins === 90,
  );
  check(
    "GAME-002 untouched by beginner",
    profile.games[GAME_002].highScores.m?.bestScore === 7,
  );

  profile = mergeQuestResult(
    profile,
    "m-moonlight",
    { scenes: 4, coins: 80, completed: true },
    now,
  );
  check(
    "expert run recorded",
    getQuestProgress(profile, "m-moonlight").completed === true &&
      getQuestProgress(profile, "m-moonlight").bestCoins === 80,
  );
  check(
    "beginner untouched by expert",
    getStationProgress(profile, "sunny-park", "m").completions === 2,
  );
  check(
    "intermediate untouched by expert",
    getLevelProgress(profile, "b-bay").bestCoins === 90,
  );

  profile = mergeRunResult(
    profile,
    "b-bay",
    { checkpoints: 5, coins: 40, completed: true },
    now,
  );
  check(
    "intermediate best kept (40 < 90)",
    getLevelProgress(profile, "b-bay").bestCoins === 90,
  );
  check(
    "expert untouched by intermediate",
    getQuestProgress(profile, "m-moonlight").bestCoins === 80,
  );

  const celebrated = markMapCelebration(profile, "sunny-park");
  const celebratedTwice = markMapCelebration(celebrated, "sunny-park");
  check(
    "map celebration recorded",
    getMapProgress(celebrated, "sunny-park").celebrated === true,
  );
  check("map celebration idempotent", celebrated === celebratedTwice);

  // --- 5. a full round trip through storage --------------------------------
  console.log("\n=== 5. round trip through JSON and back ===");
  const roundTripped = sanitizeProfile(JSON.parse(JSON.stringify(profile)));
  check(
    "everything survives a save/load",
    JSON.stringify(roundTripped) === JSON.stringify(sanitizeProfile(profile)),
  );
  check(
    "wallet not minted by round trip",
    roundTripped.totalCoins === profile.totalCoins,
  );

  console.log("");
  console.log(
    failures === 0
      ? `PROGRESS VERIFICATION PASS (${checks} checks)`
      : `PROGRESS VERIFICATION FAIL (${failures}/${checks} checks failed)`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
