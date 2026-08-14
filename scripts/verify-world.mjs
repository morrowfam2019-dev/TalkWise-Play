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
import { rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
// Compiled inside the project so the emitted CommonJS resolves `three` from
// the project's own node_modules.
const outDir = join(projectRoot, ".verify-tmp");
rmSync(outDir, { recursive: true, force: true });

try {
  // Compile just the pure game logic to CommonJS so it can run under Node.
  execFileSync(
    "npx",
    [
      "tsc",
      "src/game/core/collision.ts",
      "src/game/core/controller.ts",
      "src/game/world/index.ts",
      "--rootDir", "src",
      "--outDir", outDir,
      "--module", "commonjs",
      "--target", "es2020",
      "--moduleResolution", "node",
      "--esModuleInterop",
      "--skipLibCheck",
    ],
    { cwd: projectRoot, stdio: "inherit" },
  );

  const require = createRequire(join(projectRoot, "package.json"));
  const { listWorlds } = require(join(outDir, "game/world/index.js"));
  const { PlayerController } = require(join(outDir, "game/core/controller.js"));
  const { buildCollisionBoxes, groundHeightAt } = require(
    join(outDir, "game/core/collision.js"),
  );

  const filter = process.argv[2];
  const worlds = listWorlds().filter((w) => !filter || w.id === filter);
  if (worlds.length === 0) {
    throw new Error(filter ? `world '${filter}' not found` : "no worlds registered");
  }

  let totalProblems = 0;

  for (const world of worlds) {
    console.log(`\n=== ${world.name} (${world.id}) ===`);
    const problems = verifyWorld(world, {
      PlayerController,
      buildCollisionBoxes,
      groundHeightAt,
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

function verifyWorld(world, { PlayerController, buildCollisionBoxes, groundHeightAt }) {
  const boxes = buildCollisionBoxes(world.solids);
  let problems = 0;

  // --- 1. Placement audit ---------------------------------------------------
  console.log("PLACEMENT AUDIT");

  const surfaceAt = (x, z) => groundHeightAt(boxes, x, z, Number.POSITIVE_INFINITY);

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

  {
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

  // --- 2. Traversal ---------------------------------------------------------
  console.log("\nTRAVERSAL");

  const controller = new PlayerController();
  controller.reset(world.spawn, world.spawnYaw);

  const route = world.checkpoints.map((anchor, index) => ({
    name: `CP${index + 1} ${anchor.id}`,
    target: anchor.position,
    goal: 2.0,
  }));
  route.push({ name: "FINISH portal", target: world.finish, goal: 2.3 });

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

      // Simulate jump pad boost if defined
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

      const result = controller.update(
        DT,
        { moveX, moveZ, jump: false },
        boxes,
        world.killPlane,
      );
      if (result.respawned) respawns += 1;

      elapsed += DT;
      totalTime += DT;
    }

    const p = controller.position;
    if (!arrived) problems += 1;

    let note = "";
    if (arrived && ty !== undefined && Math.abs(p.y - ty) > 0.9) {
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
