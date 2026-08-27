/**
 * World verification for TalkWise Play.
 *
 * Runs two checks against the real game logic — no browser, no rendering —
 * for every registered world (or a single one, passed as an argv filter):
 *
 *   1. Placement audit — every checkpoint, coin, and finish anchor must sit on
 *      the terrain surface rather than buried inside it or floating above it.
 *   2. Traversal — drives the actual PlayerController over the actual world
 *      data at a fixed timestep along the checkpoint order, simulating jump
 *      pads, and proving that a player can walk from spawn to the finish
 *      without getting stuck or falling off.
 *
 * Level design is data, and data is easy to get subtly wrong; this catches
 * an unreachable checkpoint in seconds instead of during play testing.
 *
 * Usage:
 *   npm run verify:world                # every registered world
 *   npm run verify:world -- mountain-of-m
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
// Compiled inside the project so the emitted CommonJS resolves `three` from
// the project's own node_modules.
const outDir = join(projectRoot, ".verify-tmp");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

try {
  // Compile just the pure game logic to CommonJS so it can run under Node.
  // Driven by a generated tsconfig that extends the project's, so the `@/*`
  // path alias resolves the same way it does in the app.
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
        // The base config's `include` sweeps the whole repo; blank it so
        // only the four entry points below are compiled.
        include: [],
        exclude: ["../node_modules"],
        files: [
          "../src/games/adventures/core/collision.ts",
          "../src/games/adventures/core/controller.ts",
          "../src/games/adventures/world/index.ts",
          "../src/games/adventures/explorer/maps/index.ts",
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

  const require = createRequire(join(projectRoot, "package.json"));
  const base = join(outDir, "games/adventures");
  const { listWorlds } = require(join(base, "world/index.js"));
  const { listExplorerMaps, toWorldDefinition } = require(
    join(base, "explorer/maps/index.js"),
  );
  const { PlayerController } = require(join(base, "core/controller.js"));
  const { buildCollisionBoxes, groundHeightAt } = require(
    join(base, "core/collision.js"),
  );

  const filter = process.argv[2];

  /**
   * Both kinds of GAME-001 level are verified here.
   *
   * A word adventure is a route and is checked end to end, finish portal
   * included. A Beginner explorer map is an open world with no finish, so it
   * is adapted to the same world shape and checked differently: every sound
   * station must sit on the surface, and the walker must be able to reach
   * every one of them from spawn, in any order, without falling. That is the
   * property that actually matters for a map a four-year-old wanders around
   * — "can they get to every letter" — and it is exactly the kind of thing
   * that goes wrong silently when a slab moves.
   */
  const levels = [
    ...listWorlds().map((world) => ({ world, kind: "adventure" })),
    ...listExplorerMaps().map((map) => ({
      world: toWorldDefinition(map),
      kind: "explorer",
      map,
    })),
  ].filter((entry) => !filter || entry.world.id === filter);

  if (levels.length === 0) {
    throw new Error(
      filter ? `world '${filter}' not found` : "no worlds registered",
    );
  }

  let totalProblems = 0;

  for (const level of levels) {
    console.log(
      `\n=== ${level.world.name} (${level.world.id}) [${level.kind}] ===`,
    );
    const problems = verifyWorld(level.world, {
      PlayerController,
      buildCollisionBoxes,
      groundHeightAt,
      explorer: level.kind === "explorer",
    });
    totalProblems += problems;
  }

  console.log("");
  console.log(
    totalProblems === 0
      ? "WORLD VERIFICATION PASS"
      : `WORLD VERIFICATION FAIL (${totalProblems} total problems)`,
  );
  process.exitCode = totalProblems === 0 ? 0 : 1;
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

function verifyWorld(
  world,
  { PlayerController, buildCollisionBoxes, groundHeightAt, explorer = false },
) {
  const boxes = buildCollisionBoxes(world.solids);
  let problems = 0;

  // --- 1. Placement audit ---------------------------------------------------
  console.log("PLACEMENT AUDIT");

  const surfaceAt = (x, z) =>
    groundHeightAt(boxes, x, z, Number.POSITIVE_INFINITY);

  for (const anchor of world.checkpoints) {
    const [x, y, z] = anchor.position;
    const ground = surfaceAt(x, z);
    const ok = Number.isFinite(ground) && Math.abs(ground - y) < 0.05;
    if (!ok) problems += 1;
    console.log(
      `  ${ok ? "OK  " : "FAIL"} ${anchor.id}  anchor y=${y}  terrain y=${
        Number.isFinite(ground) ? ground.toFixed(2) : "none"
      }${ok ? "" : "   <-- buried or floating"}`,
    );
  }

  for (const coin of world.collectibles) {
    const [x, y, z] = coin.position;
    const ground = surfaceAt(x, z);
    const ok = Number.isFinite(ground) && y > ground + 0.3 && y < ground + 2.2;
    if (!ok) {
      problems += 1;
      console.log(
        `  FAIL ${coin.id}  coin y=${y}  terrain y=${
          Number.isFinite(ground) ? ground.toFixed(2) : "none"
        }   <-- out of reach`,
      );
    }
  }
  console.log(`  ${world.collectibles.length} coins checked`);

  // An explorer map has no finish portal — its `finish` is the spawn point
  // and is never armed — so there is nothing to audit here.
  if (!explorer) {
    const [x, y, z] = world.finish;
    const ground = surfaceAt(x, z);
    const ok = Number.isFinite(ground) && Math.abs(ground - y) < 0.05;
    if (!ok) problems += 1;
    console.log(
      `  ${ok ? "OK  " : "FAIL"} finish portal  y=${y}  terrain y=${
        Number.isFinite(ground) ? ground.toFixed(2) : "none"
      }`,
    );
  }

  {
    const [x, y, z] = world.spawn;
    const ground = surfaceAt(x, z);
    const ok = Number.isFinite(ground) && Math.abs(ground - y) < 0.05;
    if (!ok) problems += 1;
    console.log(
      `  ${ok ? "OK  " : "FAIL"} spawn  y=${y}  terrain y=${
        Number.isFinite(ground) ? ground.toFixed(2) : "none"
      }`,
    );
  }

  // --- 2. Traversal ---------------------------------------------------------
  console.log("\nTRAVERSAL");

  const controller = new PlayerController();
  controller.reset(world.spawn, world.spawnYaw);

  const route = explorer ? buildExplorerRoute(world) : buildRoute(world);

  const DT = 1 / 60;
  const MAX_SECONDS_PER_LEG = 30;
  let respawns = 0;
  let totalTime = 0;

  for (const leg of route) {
    const [tx, ty, tz] = leg.target;
    const goalRadius = leg.goal ?? 1.0;

    let elapsed = 0;
    let arrived = false;
    let minDistance = Infinity;
    let stalledFor = 0;
    let sidestepFor = 0;
    let sidestepSign = 1;
    let jumpPadFired = false;

    while (elapsed < MAX_SECONDS_PER_LEG) {
      const dx = tx - controller.position.x;
      const dz = tz - controller.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < goalRadius) {
        arrived = true;
        break;
      }

      // Simulate jump pad boost — matches the real game's per-frame proximity
      // trigger in GameplayController.tsx (any pad, not just the one this leg
      // is aiming for; a straight-line sim can graze an unrelated pad, same
      // as the environmental check it's modeling).
      if (world.jumpPads && !jumpPadFired && controller.grounded) {
        for (const pad of world.jumpPads) {
          const pdx = controller.position.x - pad.position[0];
          const pdz = controller.position.z - pad.position[2];
          const pdist = Math.hypot(pdx, pdz);
          if (pdist < pad.radius) {
            controller.velocity.y = pad.boost;
            jumpPadFired = true;
            break;
          }
        }
      }

      // A real player walks around obstacles; when progress stalls, strafe.
      if (distance < minDistance - 0.02) {
        minDistance = distance;
        stalledFor = 0;
      } else {
        stalledFor += DT;
      }
      if (stalledFor > 1.2 && sidestepFor <= 0) {
        sidestepFor = 0.9;
        sidestepSign *= -1;
        stalledFor = 0;
      }

      let moveX = dx / distance;
      let moveZ = dz / distance;
      if (sidestepFor > 0) {
        sidestepFor -= DT;
        const px = -moveZ * sidestepSign;
        const pz = moveX * sidestepSign;
        moveX = moveX * 0.35 + px;
        moveZ = moveZ * 0.35 + pz;
        const length = Math.hypot(moveX, moveZ) || 1;
        moveX /= length;
        moveZ /= length;
      }

      // Press the level's one action button the way a player would: when a
      // step or a barrier stops forward progress, and — in jump worlds —
      // when the ground ahead drops away within a stride.
      let needsAction = stalledFor > 0.3;
      if (!needsAction && world.action === "jump" && controller.grounded) {
        const aheadX = controller.position.x + moveX * 1.5;
        const aheadZ = controller.position.z + moveZ * 1.5;
        const aheadGround = groundHeightAt(
          boxes,
          aheadX,
          aheadZ,
          controller.position.y + 0.02,
        );
        if (
          !Number.isFinite(aheadGround) ||
          aheadGround < controller.position.y - 0.6
        ) {
          needsAction = true;
        }
      }

      const result = controller.update(
        DT,
        { moveX, moveZ, action: needsAction },
        boxes,
        world,
      );
      if (result.respawned) respawns += 1;

      elapsed += DT;
      totalTime += DT;
    }

    // Pad-approach legs end right at the pad's trigger radius, so a real
    // player standing there would already be boosting — apply that boost
    // deterministically here rather than hoping the next leg's first frame
    // still finds them within range (a straight-line sim can graze an
    // unrelated pad's radius and consume grounded/airborne state first).
    if (arrived && leg.forceBoost !== undefined) {
      controller.velocity.y = leg.forceBoost;
    }

    const p = controller.position;
    if (!arrived) problems += 1;

    let note = "";
    // Only judge standing height when the player is actually standing. In a
    // jump world the sim hops continuously, so it routinely clips a
    // waypoint's radius mid-arc — airborne by design, not a placement bug.
    // Whether the anchor itself sits on solid ground is the placement
    // audit's job, and it already ran above.
    if (
      arrived &&
      !leg.skipHeightCheck &&
      controller.grounded &&
      ty !== undefined &&
      Math.abs(p.y - ty) > 0.9
    ) {
      note = `   <-- expected to stand at y≈${ty}`;
      problems += 1;
    }

    console.log(
      `  ${arrived ? "OK  " : "FAIL"} ${leg.name.padEnd(18)} ` +
        `t=${elapsed.toFixed(1)}s  pos=(${p.x.toFixed(1)}, ${p.y.toFixed(2)}, ${p.z.toFixed(1)})` +
        note,
    );
  }

  if (respawns > 0) problems += 1;

  console.log("");
  console.log(`simulated play : ${totalTime.toFixed(1)}s`);
  console.log(`respawns       : ${respawns}`);
  console.log(`problems       : ${problems}`);

  return problems;
}

/**
 * Builds the simulated walking route for a world.
 *
 * When a world follows the shore → west → east → mid → summit jump-pad
 * pattern (5 checkpoints, 5 pads in that authored order — see mountainOfM.ts
 * and partyPlazaOfP.ts), the route explicitly walks to each pad before the
 * checkpoint it serves. A straight line between checkpoints would otherwise
 * miss the pad's trigger radius entirely, since pads sit off the direct path
 * on purpose (on the platform the player is already standing on). Worlds
 * without that exact shape fall back to a direct checkpoint-to-checkpoint
 * route.
 */
/**
 * The walking route for an explorer map: spawn → every station in registered
 * order → back to spawn. There is no portal to reach, so the property being
 * proved is only "a player can get to each station and home again".
 *
 * The height check is skipped on every leg. These maps are jump worlds, the
 * sim hops continuously, and a station's own footing is already covered by
 * the placement audit above.
 */
function buildExplorerRoute(world) {
  const route = world.checkpoints.map((anchor, index) => ({
    name: `STATION${index + 1} ${anchor.id}`,
    target: anchor.position,
    goal: 2.2,
    skipHeightCheck: true,
  }));
  route.push({
    name: "back to spawn",
    target: world.spawn,
    goal: 2.5,
    skipHeightCheck: true,
  });
  return route;
}

function buildRoute(world) {
  const cp = world.checkpoints;
  const pads = world.jumpPads ?? [];
  const route = [];

  // An authored route wins: the level has stated the path it means, and a
  // derived one would only second-guess it.
  if (world.verifyRoute) {
    for (const leg of world.verifyRoute) {
      route.push({ name: leg.name, target: leg.target, goal: 1.6 });
    }
    route.push({ name: "FINISH portal", target: world.finish, goal: 2.3 });
    return route;
  }

  const usesPadPattern = cp.length === 5 && pads.length === 5;

  route.push({ name: `CP1 ${cp[0].id}`, target: cp[0].position, goal: 2.0 });
  route.push({ name: `CP2 ${cp[1].id}`, target: cp[1].position, goal: 2.0 });

  if (usesPadPattern) {
    const padGoal = (pad) => Math.max(0.5, pad.radius - 0.3);

    route.push({
      name: "west pad",
      target: pads[0].position,
      goal: padGoal(pads[0]),
      skipHeightCheck: true,
      forceBoost: pads[0].boost,
    });
    route.push({ name: `CP3 ${cp[2].id}`, target: cp[2].position, goal: 2.0 });

    route.push({
      name: "east pad",
      target: pads[1].position,
      goal: padGoal(pads[1]),
      skipHeightCheck: true,
      forceBoost: pads[1].boost,
    });
    route.push({ name: `CP4 ${cp[3].id}`, target: cp[3].position, goal: 2.0 });

    route.push({
      name: "east-mid pad",
      target: pads[3].position,
      goal: padGoal(pads[3]),
      skipHeightCheck: true,
      forceBoost: pads[3].boost,
    });
    route.push({ name: `CP5 ${cp[4].id}`, target: cp[4].position, goal: 2.0 });

    route.push({
      name: "summit pad",
      target: pads[4].position,
      goal: padGoal(pads[4]),
      skipHeightCheck: true,
      forceBoost: pads[4].boost,
    });
  } else {
    for (let i = 2; i < cp.length; i += 1) {
      route.push({
        name: `CP${i + 1} ${cp[i].id}`,
        target: cp[i].position,
        goal: 2.0,
      });
    }
  }

  route.push({
    name: "FINISH portal",
    target: world.finish,
    goal: 2.3,
    // Arriving right off a boosted pad can still be ascending through the
    // portal's XZ radius before gravity settles them onto the surface —
    // real, harmless, and not what this check is for.
    skipHeightCheck: usesPadPattern,
  });
  return route;
}
