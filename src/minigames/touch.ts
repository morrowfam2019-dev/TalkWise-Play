"use client";

/**
 * Touch safety for young hands.
 *
 * ## The problem this exists to fix
 *
 * §16 of the build plan names it directly: a recent competitor review
 * complains that *resting a finger on the screen unintentionally advances
 * the activity*. That is not a nitpick — it is the difference between a
 * four-year-old playing a game and a four-year-old watching a game play
 * itself while their palm rests on the glass.
 *
 * Three rules, applied to every meaningful action in all six mini-games:
 *
 * 1. **An action fires on release, not on press.** `pointerdown` only arms
 *    it. Nothing meaningful happens while a finger is merely down, so a
 *    resting palm can never advance anything.
 * 2. **The release must be near the press.** A pointer that has travelled
 *    beyond `MOVE_TOLERANCE_PX` is a scroll or a drag, not a tap, and the
 *    arm is cancelled.
 * 3. **A hold is not a repeat.** The arm is one-shot: holding a finger down
 *    fires nothing and re-arms nothing. There is no repeat timer to farm.
 *
 * Plus a **cooldown** (`TAP_COOLDOWN_MS`) so a fast double-tap or a
 * bouncing finger cannot register twice on what a child experienced as one
 * tap.
 *
 * ## Why not just `onClick`
 *
 * On iOS Safari a synthetic click can arrive from a long-press, and it
 * arrives ~300 ms late unless touch-action is right — which in a
 * thirty-second arcade round reads as the game ignoring you. Pointer events
 * give the immediate feedback of a press *and* the intentionality of a
 * release, which is exactly the combination §16 asks for.
 */

import { useCallback, useEffect, useRef } from "react";

/** How far a pointer may travel between press and release and still be a tap. */
export const MOVE_TOLERANCE_PX = 18;

/** Minimum gap between two accepted taps on the same surface. */
export const TAP_COOLDOWN_MS = 120;

export interface IntentionalTapHandlers {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  /** Keyboard parity — a tap target must be reachable without a pointer. */
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Builds the handler set for one intentional-tap target.
 *
 * `onTap` is called at most once per genuine press-and-release, never while
 * a finger is held, and never twice inside the cooldown.
 *
 * `onArm` is optional and fires on press — for the *visual* squash that
 * makes a button feel alive. It must never change game state; that is the
 * whole point of the split.
 */
export function useIntentionalTap(
  onTap: () => void,
  options: { disabled?: boolean; onArm?: () => void; cooldownMs?: number } = {},
): IntentionalTapHandlers {
  const { disabled = false, onArm, cooldownMs = TAP_COOLDOWN_MS } = options;
  const armedRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastFiredRef = useRef(0);

  const disarm = useCallback(() => {
    armedRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return;
      // One arm at a time. A second finger landing on the same target while
      // the first is down does not create a second pending tap.
      if (armedRef.current !== null) return;
      armedRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      onArm?.();
    },
    [disabled, onArm],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      const armed = armedRef.current;
      armedRef.current = null;
      if (disabled || armed === null) return;
      if (armed.id !== event.pointerId) return;

      const dx = event.clientX - armed.x;
      const dy = event.clientY - armed.y;
      if (Math.hypot(dx, dy) > MOVE_TOLERANCE_PX) return;

      const now = Date.now();
      if (now - lastFiredRef.current < cooldownMs) return;
      lastFiredRef.current = now;

      onTap();
    },
    [disabled, onTap, cooldownMs],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      // Held keys autorepeat; the same one-shot rule applies as to a held
      // finger, so a leaned-on space bar cannot farm anything either.
      if (event.repeat) return;
      event.preventDefault();
      const now = Date.now();
      if (now - lastFiredRef.current < cooldownMs) return;
      lastFiredRef.current = now;
      onTap();
    },
    [disabled, onTap, cooldownMs],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: disarm,
    onPointerLeave: disarm,
    onKeyDown: handleKeyDown,
  };
}

// ---------------------------------------------------------------------------
// Drag and drop
// ---------------------------------------------------------------------------

export interface DragState {
  /** Which draggable is in hand, or null. */
  itemId: string | null;
  /** Current pointer position in client coordinates. */
  x: number;
  y: number;
  /** True once the pointer has moved far enough to count as a real drag. */
  moved: boolean;
}

export const EMPTY_DRAG: DragState = { itemId: null, x: 0, y: 0, moved: false };

/** How far a pointer must travel before a press becomes a drag. */
export const DRAG_START_PX = 8;

export interface DragController {
  drag: React.RefObject<DragState>;
  start: (itemId: string, event: React.PointerEvent) => void;
  move: (event: React.PointerEvent) => void;
  /** Ends the drag and reports where it was released, or null if it never
   * became a real drag. */
  end: (
    event: React.PointerEvent,
  ) => { itemId: string; x: number; y: number } | null;
  cancel: () => void;
}

/**
 * Whether a client point is inside an element's box, with an optional
 * forgiveness margin.
 *
 * The margin is why Sound Match's chest accepts a drop that lands just
 * short of it: a child releasing a picture "at" a target genuinely means
 * it, and demanding pixel accuracy from a four-year-old's finger is the
 * kind of precision §11's "large touch targets" rules out.
 */
export function isInsideRect(
  rect: DOMRect | null,
  x: number,
  y: number,
  margin = 0,
): boolean {
  if (!rect) return false;
  return (
    x >= rect.left - margin &&
    x <= rect.right + margin &&
    y >= rect.top - margin &&
    y <= rect.bottom + margin
  );
}

/**
 * Locks the page against the browser gestures that ruin a touch game:
 * pull-to-refresh, rubber-band scrolling, and double-tap zoom.
 *
 * Scoped to a mounted mini-game and fully reverted on unmount, so it can
 * never leak out and make the rest of TalkWise Play unscrollable — which is
 * why this is a hook rather than a global stylesheet rule.
 */
export function useGestureLock(active = true): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const body = document.body;
    const previousOverscroll = body.style.overscrollBehavior;
    const previousTouchAction = body.style.touchAction;
    const previousUserSelect = body.style.userSelect;
    body.style.overscrollBehavior = "none";
    body.style.touchAction = "manipulation";
    body.style.userSelect = "none";
    return () => {
      body.style.overscrollBehavior = previousOverscroll;
      body.style.touchAction = previousTouchAction;
      body.style.userSelect = previousUserSelect;
    };
  }, [active]);
}
