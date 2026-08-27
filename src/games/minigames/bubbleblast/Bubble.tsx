"use client";

/**
 * One bubble.
 *
 * ## The touch rule, made concrete
 *
 * This is where §16 stops being a principle and becomes code. A bubble pops
 * on **release**, near where the finger landed, once per press, with a
 * cooldown — all of it from the shared `useIntentionalTap`. Holding a
 * finger on a bubble pops nothing. Dragging a finger across the field pops
 * nothing. Resting a palm on the screen pops nothing.
 *
 * The visual squash on press is deliberately *only* visual: `onArm` changes
 * how the bubble looks so a child knows the game felt them, and cannot
 * change the score. That split is the whole point — immediate feedback
 * without accidental scoring.
 *
 * Once popped it becomes inert immediately (`disabled`), so the pop
 * animation cannot be tapped a second time on its way out.
 */

import { useState } from "react";
import { useIntentionalTap } from "@/minigames/touch";
import {
  BUBBLE_TINTS,
  RISE_DVH,
  type Bubble as BubbleData,
} from "./core/field";

export function BubbleView({
  bubble,
  popped,
  onPop,
}: {
  bubble: BubbleData;
  popped: boolean;
  /** Given the bubble and where on the field it was popped, in percent. */
  onPop: (bubble: BubbleData, xPercent: number, yPercent: number) => void;
}) {
  const [pressed, setPressed] = useState(false);

  const handlers = useIntentionalTap(
    () => {
      setPressed(false);
      // Read the live position off the element: the rise is a CSS animation,
      // so this is the only place that knows where the bubble actually is.
      const element = document.getElementById(`bubble-${bubble.key}`);
      const field = element?.closest("[data-bubble-field]");
      if (element && field) {
        const box = element.getBoundingClientRect();
        const stage = field.getBoundingClientRect();
        onPop(
          bubble,
          ((box.left + box.width / 2 - stage.left) / stage.width) * 100,
          ((box.top + box.height / 2 - stage.top) / stage.height) * 100,
        );
      } else {
        onPop(bubble, bubble.xPercent, 50);
      }
    },
    {
      disabled: popped,
      onArm: () => setPressed(true),
    },
  );

  return (
    <div
      className="tw-bubble absolute bottom-[-8rem]"
      style={
        {
          left: `${bubble.xPercent}%`,
          "--tw-drift": `${bubble.driftPx}px`,
          "--tw-rise": `-${RISE_DVH}dvh`,
          "--tw-bubble-duration": `${bubble.durationMs}ms`,
        } as React.CSSProperties
      }
    >
      <button
        id={`bubble-${bubble.key}`}
        type="button"
        aria-label={
          bubble.face === "letter"
            ? `Bubble showing the letter ${bubble.label}`
            : `Bubble showing a ${bubble.label}`
        }
        disabled={popped}
        {...handlers}
        onPointerLeave={() => {
          setPressed(false);
          handlers.onPointerLeave();
        }}
        onPointerCancel={() => {
          setPressed(false);
          handlers.onPointerCancel();
        }}
        className={`flex touch-none flex-col items-center justify-center rounded-full border-4 border-white/85 bg-gradient-to-br shadow-lg backdrop-blur-[1px] transition-transform ${
          BUBBLE_TINTS[bubble.tint]
        } ${popped ? "tw-popped" : ""} ${pressed && !popped ? "scale-90" : ""}`}
        style={{
          width: `${bubble.sizeRem}rem`,
          height: `${bubble.sizeRem}rem`,
        }}
      >
        {bubble.face === "letter" ? (
          <span className="text-4xl font-black text-[#141420] drop-shadow-sm">
            {bubble.label}
          </span>
        ) : (
          <>
            <span className="text-3xl leading-none drop-shadow-sm" aria-hidden>
              {bubble.glyph}
            </span>
            <span className="mt-0.5 max-w-full truncate px-1 text-[0.6rem] font-black text-[#141420] uppercase">
              {bubble.label}
            </span>
          </>
        )}
      </button>
    </div>
  );
}
