/**
 * Mini Games Launch Collection 01 verification.
 *
 * Runs the *real* framework and *real* content under Node — no browser, no
 * React, no rendering — and checks the promises that would otherwise only
 * surface with a child, a phone and a lot of patience:
 *
 *   1. The content library is internally honest: no duplicate ids, every
 *      level claim backed by the field it needs, every sound recipe real.
 *   2. Every mini-game can actually fill a session from every pack it
 *      offers, at every level it offers. This is the check that catches a
 *      pack/level combination that would strand a child on "not ready yet".
 *   3. Distractors never collide with the target's sound.
 *   4. The session engine's scoring, combo and accuracy rules.
 *   5. The coin formula, including its cap, its daily decay and its
 *      anti-farming guard.
 *   6. The four save namespaces stay isolated, migrate additively, and
 *      sanitise idempotently.
 *
 * Usage:
 *   npm run verify:minigames
 */
import { execFileSync } from "node:child_process";
import Module, { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(projectRoot, ".verify-minigames-tmp");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let failures = 0;
let checks = 0;

function check(name, condition, detail = "") {
  checks += 1;
  if (!condition) failures += 1;
  if (!condition || process.env.VERBOSE) {
    console.log(
      `  ${condition ? "OK  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`,
    );
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
          jsx: "react-jsx",
          types: [],
        },
        include: [],
        exclude: ["../node_modules"],
        files: [
          "../src/content/minigames/index.ts",
          "../src/minigames/registry.ts",
          "../src/minigames/rewards.ts",
          "../src/minigames/session.ts",
          "../src/player/storage.ts",
          "../src/games/minigames/bubbleblast/core/field.ts",
          "../src/games/minigames/soundmatch/core/rounds.ts",
          "../src/games/minigames/colorshapehunt/core/scene.ts",
          "../src/games/minigames/guessthesound/core/rounds.ts",
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
  const content = require(join(outDir, "content/minigames/index.js"));
  const listen = require(join(outDir, "content/minigames/listen.js"));
  const attributes = require(join(outDir, "content/minigames/attributes.js"));
  const registry = require(join(outDir, "minigames/registry.js"));
  const rewards = require(join(outDir, "minigames/rewards.js"));
  const session = require(join(outDir, "minigames/session.js"));
  const storage = require(join(outDir, "player/storage.js"));
  const minigameState = require(join(outDir, "player/games/minigames.js"));
  const platform = require(join(outDir, "platform/games/registry.js"));

  const bubble = require(
    join(outDir, "games/minigames/bubbleblast/core/field.js"),
  );
  const match = require(
    join(outDir, "games/minigames/soundmatch/core/rounds.js"),
  );
  const hunt = require(
    join(outDir, "games/minigames/colorshapehunt/core/scene.js"),
  );
  const guess = require(
    join(outDir, "games/minigames/guessthesound/core/rounds.js"),
  );

  const LEVELS = ["beginner", "intermediate", "expert"];

  // --- 1. Content library integrity ---------------------------------------
  console.log("\n=== 1. content library integrity ===");
  const items = content.listAllContentItems();
  const packs = content.listContentPacks();

  const ids = new Set();
  let duplicates = 0;
  for (const item of items) {
    if (ids.has(item.id)) duplicates += 1;
    ids.add(item.id);
  }
  check(
    `${items.length} items across ${packs.length} packs`,
    items.length > 100,
  );
  check("no duplicate item ids", duplicates === 0, `${duplicates} duplicates`);

  let levelLies = 0;
  let badRecipes = 0;
  let badColors = 0;
  let badShapes = 0;
  let badActions = 0;
  for (const item of items) {
    if (item.levels.includes("intermediate") && !item.phrase) levelLies += 1;
    if (item.levels.includes("expert") && !item.sentence) levelLies += 1;
    if (!item.levels.includes("beginner")) levelLies += 1;
    if (item.listen && !listen.getListenRecipe(item.listen)) badRecipes += 1;
    if (item.color) {
      try {
        attributes.getColor(item.color);
      } catch {
        badColors += 1;
      }
    }
    if (item.shape) {
      try {
        attributes.getShape(item.shape);
      } catch {
        badShapes += 1;
      }
    }
    if (item.action) {
      try {
        attributes.getAction(item.action);
      } catch {
        badActions += 1;
      }
    }
  }
  check(
    "no item claims a level it cannot serve",
    levelLies === 0,
    `${levelLies} bad`,
  );
  check("every listen id resolves to a recipe", badRecipes === 0);
  check(
    "every colour/shape/action id resolves",
    badColors + badShapes + badActions === 0,
  );

  // Every sound recipe must actually make a sound, and terminate.
  let emptyRecipes = 0;
  let longRecipes = 0;
  for (const recipe of listen.LISTEN_RECIPES) {
    if (recipe.layers.length === 0) emptyRecipes += 1;
    if (listen.listenRecipeDurationMs(recipe) > 3000) longRecipes += 1;
  }
  check(
    `${listen.LISTEN_RECIPES.length} sound recipes, none empty`,
    emptyRecipes === 0,
  );
  check("no recipe runs longer than 3 seconds", longRecipes === 0);

  // --- 2. Every game can fill a session from every pack it offers ----------
  console.log("\n=== 2. every game × pack × level is playable ===");
  const planners = {
    "GAME-003": (packId, level, seed) =>
      bubble.planRound({ packId, level, seed }),
    "GAME-004": (packId, level, seed) =>
      match.planSession({ packId, level, seed }),
    "GAME-005": (packId, level, seed) => hunt.planHunt({ packId, level, seed }),
    "GAME-006": (packId, level, seed) =>
      guess.planSounds({ packId, level, seed }),
  };

  // Several days' worth of seeds, because a plan that works on one day's
  // shuffle and not the next is exactly the bug this catches.
  const SEEDS = [20260101, 20260215, 20260327, 20260704, 20261119, 1, 999999];

  for (const definition of registry.listMiniGames()) {
    const allowed = registry.packsFor(definition);
    let combinations = 0;
    let failed = 0;
    const failedDetail = [];

    for (const packId of allowed) {
      for (const level of definition.levels) {
        for (const seed of SEEDS) {
          combinations += 1;
          const plan = planners[definition.id](packId, level, seed);
          const ok =
            plan !== null &&
            plan !== undefined &&
            (Array.isArray(plan) ? plan.length > 0 : true);
          if (!ok) {
            failed += 1;
            if (failedDetail.length < 4)
              failedDetail.push(`${packId}/${level}@${seed}`);
          }
        }
      }
    }
    check(
      `${definition.id} playable across ${combinations} pack/level/seed combinations`,
      failed === 0,
      failedDetail.join(", "),
    );
  }

  // --- 3. Distractors never collide with the target ------------------------
  console.log("\n=== 3. distractors avoid the target's sound ===");
  let collisions = 0;
  let distractorRounds = 0;
  for (const packId of packs.map((pack) => pack.id)) {
    for (const seed of SEEDS.slice(0, 4)) {
      const rounds = match.planSession({ packId, level: "intermediate", seed });
      if (!rounds) continue;
      for (const round of rounds) {
        distractorRounds += 1;
        for (const choice of round.choices) {
          if (choice.isTarget) continue;
          if (content.isConfusablePair(round.target, choice.item))
            collisions += 1;
        }
      }
    }
  }
  check(
    `no confusable distractor in ${distractorRounds} Sound Match rounds`,
    collisions === 0,
    `${collisions} collisions`,
  );

  // Colour & Shape Hunt's central invariant: exactly one right answer.
  console.log("\n=== 3b. every hunt instruction has exactly one answer ===");
  let ambiguous = 0;
  let huntRounds = 0;
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const plan = hunt.planHunt({ packId: "colors-and-shapes", level, seed });
      if (!plan) continue;
      for (const round of plan.rounds) {
        huntRounds += 1;
        const target = plan.objects.find((o) => o.id === round.targetId);
        const key = (o) =>
          level === "beginner"
            ? o.color
            : level === "intermediate"
              ? `${o.color}/${o.shape}`
              : `${o.size}/${o.color}/${o.shape}`;
        const matches = plan.objects.filter((o) => key(o) === key(target));
        if (matches.length !== 1) ambiguous += 1;
      }
    }
  }
  check(
    `no ambiguous instruction in ${huntRounds} hunt rounds`,
    ambiguous === 0,
    `${ambiguous} ambiguous`,
  );

  // --- 4. The session engine ------------------------------------------------
  console.log("\n=== 4. session scoring, combos and accuracy ===");
  let state = session.EMPTY_SESSION;
  for (let i = 0; i < 2; i += 1) state = session.scoreCorrect(state, 100);
  check(
    "first two correct are x1",
    state.score === 200,
    `score=${state.score}`,
  );
  state = session.scoreCorrect(state, 100);
  check(
    "third correct earns x2 on itself",
    state.score === 400,
    `score=${state.score}`,
  );
  for (let i = 0; i < 3; i += 1) state = session.scoreCorrect(state, 100);
  check("sixth correct earns x3", state.score === 400 + 200 + 200 + 300);
  check("best combo tracked", state.bestCombo === 6);

  const beforeWrong = state.score;
  state = session.scoreWrong(state);
  check("a wrong action deducts nothing", state.score === beforeWrong);
  check("a wrong action breaks the combo", state.combo === 0);
  check("a wrong action keeps the best combo", state.bestCombo === 6);
  check(
    "accuracy counts attempts",
    session.sessionAccuracy(state) === 86,
    `${session.sessionAccuracy(state)}%`,
  );
  check(
    "an untouched session is 0%, not 100%",
    session.sessionAccuracy(session.EMPTY_SESSION) === 0,
  );
  check(
    "combo multiplier caps",
    session.comboMultiplier(500) === session.MAX_COMBO_MULTIPLIER,
  );

  // --- 5. The coin formula --------------------------------------------------
  console.log("\n=== 5. coin formula and anti-farming ===");
  const base = {
    score: 2000,
    pointsPerCoin: 220,
    level: "beginner",
    spoke: true,
    isPersonalBest: false,
    sessionsAlreadyPlayedToday: 0,
    meaningful: true,
  };
  const first = rewards.computeMiniGameReward(base);
  check("a strong first session pays", first.coins > 5, `${first.coins} coins`);
  check(
    "a session can never exceed the cap",
    rewards.computeMiniGameReward({
      ...base,
      score: 999999,
      isPersonalBest: true,
      level: "expert",
    }).coins <= rewards.SESSION_CAP,
  );
  check(
    "speech participation pays even with no score",
    rewards.computeMiniGameReward({ ...base, score: 0 }).coins >=
      rewards.SPEECH_PARTICIPATION_COINS,
  );
  const fourth = rewards.computeMiniGameReward({
    ...base,
    sessionsAlreadyPlayedToday: 4,
  });
  const ninth = rewards.computeMiniGameReward({
    ...base,
    sessionsAlreadyPlayedToday: 9,
  });
  check("the fourth session of the day pays less", fourth.coins < first.coins);
  check("the ninth pays less than the fourth", ninth.coins < fourth.coins);
  check("the ninth still pays something", ninth.coins >= 1);
  check(
    "a session too short to be practice pays only the floor",
    rewards.computeMiniGameReward({ ...base, meaningful: false }).coins === 1,
  );
  check(
    "a short session is not meaningful",
    rewards.isMeaningfulSession({ durationMs: 2000, correctActions: 5 }) ===
      false,
  );
  check(
    "a session with nothing right is not meaningful",
    rewards.isMeaningfulSession({ durationMs: 60000, correctActions: 0 }) ===
      false,
  );
  check(
    "a real session is meaningful",
    rewards.isMeaningfulSession({ durationMs: 30000, correctActions: 4 }) ===
      true,
  );

  // --- 6. Save namespaces ---------------------------------------------------
  console.log("\n=== 6. four namespaces, isolated and additive ===");
  const MINI_IDS = platform.MINI_GAME_IDS;
  check("four mini-game ids registered", MINI_IDS.length === 4);

  // A profile saved before this collection existed.
  const preCollection = {
    name: "Sam",
    totalCoins: 300,
    spentCoins: 40,
    currentStreak: 5,
    bestStreak: 11,
    lastPlayedDate: "2026-08-20",
    micEnabled: true,
    assistMode: false,
    games: {
      "GAME-001": {
        owned: ["character-default", "hat-crown"],
        loadout: { characterId: "character-default", hatId: "hat-crown" },
        levels: {
          "m-adventure": { bestCheckpoints: 5, bestCoins: 78, completed: true },
        },
      },
      "GAME-002": {
        owned: ["baller-tj"],
        loadout: { ballerId: "baller-tj", jerseyId: null },
        highScores: { m: { bestScore: 40, bestBaskets: 4, bestStreak: 3 } },
      },
    },
  };
  const migrated = storage.sanitizeProfile(preCollection);
  check("wallet untouched by the migration", migrated.totalCoins === 300);
  check(
    "streak untouched",
    migrated.currentStreak === 5 && migrated.bestStreak === 11,
  );
  check(
    "GAME-001 record intact",
    storage.getLevelProgress(migrated, "m-adventure").bestCoins === 78,
  );
  check(
    "GAME-002 high score intact",
    migrated.games["GAME-002"].highScores.m.bestScore === 40,
  );
  check(
    "all four mini-game namespaces present and empty",
    MINI_IDS.every(
      (id) =>
        migrated.games[id] &&
        Object.keys(migrated.games[id].records).length === 0 &&
        migrated.games[id].collected.length === 0,
    ),
  );

  // Four independent objects, not one shared by reference.
  const shared = MINI_IDS.some((a) =>
    MINI_IDS.some((b) => a !== b && migrated.games[a] === migrated.games[b]),
  );
  check("no two namespaces share an object", shared === false);

  // A session in one mini-game touches nothing else.
  const outcome = {
    packId: "animal-world",
    level: "intermediate",
    score: 1400,
    accuracy: 72,
    bestCombo: 5,
    completed: true,
    countsTowardDaily: true,
    coinsEarned: 11,
  };
  const afterBubble = storage.mergeMiniGameResult(
    migrated,
    "GAME-003",
    outcome,
  );
  check("coins land in the shared wallet", afterBubble.totalCoins === 311);
  check(
    "the record lands in GAME-003",
    minigameState.getMiniRecordFrom(
      afterBubble.games["GAME-003"],
      "animal-world",
      "intermediate",
    ).bestScore === 1400,
  );
  check(
    "no other mini-game namespace changed",
    MINI_IDS.filter((id) => id !== "GAME-003").every(
      (id) => Object.keys(afterBubble.games[id].records).length === 0,
    ),
  );
  check(
    "GAME-001 untouched by a mini-game session",
    JSON.stringify(afterBubble.games["GAME-001"]) ===
      JSON.stringify(migrated.games["GAME-001"]),
  );
  check(
    "GAME-002 untouched by a mini-game session",
    JSON.stringify(afterBubble.games["GAME-002"]) ===
      JSON.stringify(migrated.games["GAME-002"]),
  );

  // Personal best must be read before the merge, not after.
  check(
    "a higher score is a personal best before merging",
    minigameState.isMiniPersonalBest(
      afterBubble.games["GAME-003"],
      "animal-world",
      "intermediate",
      1500,
    ) === true,
  );
  check(
    "an equal score is not a personal best",
    minigameState.isMiniPersonalBest(
      afterBubble.games["GAME-003"],
      "animal-world",
      "intermediate",
      1400,
    ) === false,
  );

  // A session that does not count toward the day must not advance the counter.
  const notMeaningful = storage.mergeMiniGameResult(afterBubble, "GAME-003", {
    ...outcome,
    score: 10,
    countsTowardDaily: false,
  });
  check(
    "a non-meaningful session does not advance the daily counter",
    minigameState.getMiniPlaysToday(notMeaningful.games["GAME-003"]) ===
      minigameState.getMiniPlaysToday(afterBubble.games["GAME-003"]),
  );
  check(
    "but it still records the play",
    minigameState.getMiniRecordFrom(
      notMeaningful.games["GAME-003"],
      "animal-world",
      "intermediate",
    ).plays === 2,
  );
  check(
    "and it cannot lower the personal best",
    minigameState.getMiniRecordFrom(
      notMeaningful.games["GAME-003"],
      "animal-world",
      "intermediate",
    ).bestScore === 1400,
  );

  // Idempotent sanitising, which the household relies on at every layer.
  const once = storage.sanitizeProfile(afterBubble);
  const twice = storage.sanitizeProfile(once);
  check(
    "sanitising is idempotent",
    JSON.stringify(once) === JSON.stringify(twice),
  );
  const roundTripped = storage.sanitizeProfile(
    JSON.parse(JSON.stringify(afterBubble)),
  );
  check(
    "everything survives a save/load",
    JSON.stringify(roundTripped) === JSON.stringify(once),
  );
  check("wallet not minted by a round trip", roundTripped.totalCoins === 311);

  // Garbage in a mini-game slice must not take the profile down with it.
  const corrupt = storage.sanitizeProfile({
    ...preCollection,
    games: {
      ...preCollection.games,
      "GAME-005": { records: "nope", collected: 42, dailyPlays: null },
    },
  });
  check(
    "a corrupt mini-game slice sanitises to an empty one",
    Object.keys(corrupt.games["GAME-005"].records).length === 0 &&
      Array.isArray(corrupt.games["GAME-005"].collected),
  );
  check("a corrupt slice does not harm the wallet", corrupt.totalCoins === 300);

  console.log("");
  console.log(
    failures === 0
      ? `MINI GAMES VERIFICATION PASS (${checks} checks)`
      : `MINI GAMES VERIFICATION FAIL (${failures}/${checks} checks failed)`,
  );
  process.exitCode = failures === 0 ? 0 : 1;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
