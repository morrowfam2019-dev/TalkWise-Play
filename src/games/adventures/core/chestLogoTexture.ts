import * as THREE from "three";

/**
 * The white "TJ" chest mark, drawn on a canvas at runtime.
 *
 * Same trick as `labelTexture.ts` and for the same reason: no font file to
 * ship and no CDN to fetch. A plain white box on the hoodie reads as a
 * laundry patch at play distance — the two letters are what make the
 * character on screen the same TJ a child just saw on the card.
 *
 * Transparent everywhere but the letters, so the hoodie colour shows
 * through and one texture works on any shirt.
 */

const SIZE = 256;

export function createChestLogoTexture(text = "TJ"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${SIZE * 0.62}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    // A soft dark rim keeps the letters legible against a light hoodie and
    // against the sky when he is mid-jump.
    ctx.lineWidth = SIZE * 0.045;
    ctx.strokeStyle = "rgba(12, 28, 60, 0.55)";
    ctx.strokeText(text, SIZE / 2, SIZE / 2 + SIZE * 0.02);
    ctx.fillText(text, SIZE / 2, SIZE / 2 + SIZE * 0.02);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
