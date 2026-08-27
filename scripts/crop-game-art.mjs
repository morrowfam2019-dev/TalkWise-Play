/**
 * Re-crops the six mini-game card panels from an approved cover sheet.
 *
 * The sheet is a 3×2 grid of finished cards; only the illustrated panel at
 * the top of each card is ours to use — the title, blurb and PLAY button
 * below it are rendered by the app, so baking them into the image would
 * duplicate them and freeze the copy.
 *
 * Usage:
 *   node scripts/crop-game-art.mjs <path-to-sheet.png>
 *
 * Requires Python with Pillow (`pip install pillow`), which is how the
 * originals were cut. Kept as a script so a re-issued sheet is one command
 * rather than a hunt for the numbers.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const sheet = process.argv[2];
if (!sheet) {
  console.error("Usage: node scripts/crop-game-art.mjs <path-to-sheet.png>");
  process.exit(1);
}

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(projectRoot, "public", "characters", "games");

// Grid and panel geometry of the approved sheet: 1536×1024, six 512×512
// cells, and the illustrated panel is the top 314px of each cell.
const script = `
from PIL import Image
import sys, os
src = Image.open(sys.argv[1]).convert("RGB")
# The sheet still has six cells. Cells 5 and 6 were Action Dash and Story
# Builder, both cut from the collection, so those cells are skipped.
keys = [["bubble-blast","sound-match","color-shape-hunt"],
        ["guess-the-sound",None,None]]
CELL, ART_H = 512, 314
for cy, row in enumerate(keys):
    for cx, key in enumerate(row):
        if key is None:
            continue
        panel = src.crop((cx*CELL, cy*CELL, (cx+1)*CELL, cy*CELL+ART_H))
        out = os.path.join(sys.argv[2], key + ".webp")
        panel.save(out, "WEBP", quality=88, method=6)
        print(out, os.path.getsize(out)//1024, "KB")
`;

execFileSync("python3", ["-c", script, sheet, outDir], { stdio: "inherit" });
