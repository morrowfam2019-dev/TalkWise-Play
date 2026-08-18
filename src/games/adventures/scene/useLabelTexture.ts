"use client";

import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import { createLabelTexture, type LabelStyle } from "../core/labelTexture";

/** Builds a canvas label texture and disposes it when it changes or unmounts. */
export function useLabelTexture(text: string, style: LabelStyle): THREE.CanvasTexture {
  const texture = useMemo(() => createLabelTexture(text, style), [text, style]);

  useEffect(() => () => texture.dispose(), [texture]);

  return texture;
}
