import * as THREE from "three";

/**
 * Canvas-drawn text textures for in-world signage.
 *
 * Avoids shipping a font file or fetching one from a CDN — the checkpoint
 * word labels are drawn with the system UI font at runtime.
 */

const WIDTH = 512;
const HEIGHT = 224;

export interface LabelStyle {
  background: string;
  border: string;
  text: string;
}

export const LABEL_PENDING: LabelStyle = {
  background: "#ffffff",
  border: "#f5c33b",
  text: "#141420",
};

export const LABEL_DONE: LabelStyle = {
  background: "#2ecc71",
  border: "#ffffff",
  text: "#ffffff",
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function createLabelTexture(text: string, style: LabelStyle): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const inset = 14;
    roundedRect(ctx, inset, inset, WIDTH - inset * 2, HEIGHT - inset * 2, 44);
    ctx.fillStyle = style.background;
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = style.border;
    ctx.stroke();

    ctx.fillStyle = style.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = 104;
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > WIDTH - 90 && fontSize > 36) {
      fontSize -= 6;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    }
    ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

export const LABEL_ASPECT = WIDTH / HEIGHT;
