/**
 * One coloured shape, drawn from the shared shape geometry.
 *
 * Used by Colour & Shape Hunt for its objects and by Sound Match for its
 * drop-target silhouettes. Inline SVG rather than an image so it scales to
 * any size without a second asset, tints to any colour without a second
 * file, and costs nothing to load — §31's asset reuse rule, taken literally.
 */

import { getColor, getShape } from "@/content/minigames/attributes";
import type { ColorId, ShapeId } from "@/content/minigames/types";

export function ShapeGlyph({
  shape,
  color,
  className = "h-full w-full",
  outlineOnly = false,
}: {
  shape: ShapeId;
  color: ColorId;
  className?: string;
  /** Draws the silhouette only — the "which shape fits here" target. */
  outlineOnly?: boolean;
}) {
  const shapeDef = getShape(shape);
  const colorDef = getColor(color);

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d={shapeDef.path}
        fill={outlineOnly ? "none" : colorDef.swatch}
        stroke={outlineOnly ? colorDef.shade : colorDef.shade}
        strokeWidth={outlineOnly ? 6 : 4}
        strokeDasharray={outlineOnly ? "10 7" : undefined}
        strokeLinejoin="round"
      />
    </svg>
  );
}
