"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { GameInput } from "../core/input";

const STICK_RADIUS = 54;
const COARSE_QUERY = "(pointer: coarse)";

function subscribeCoarsePointer(onChange: () => void): () => void {
  const media = window.matchMedia(COARSE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getCoarsePointer(): boolean {
  return window.matchMedia(COARSE_QUERY).matches;
}

/**
 * On-screen joystick and jump button.
 *
 * Rendered only for coarse pointers so a desktop player never sees them. They
 * write straight into GameInput, so the gameplay loop treats a thumb exactly
 * like a keyboard.
 */
export function TouchControls({ input }: { input: GameInput }) {
  const isTouch = useSyncExternalStore(
    subscribeCoarsePointer,
    getCoarsePointer,
    () => false,
  );

  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [jumpHeld, setJumpHeld] = useState(false);

  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const center = useRef({ x: 0, y: 0 });

  const release = useCallback(() => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    input.setStick(0, 0);
  }, [input]);

  const handleDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return;
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerId.current = event.pointerId;
    center.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerId !== pointerId.current) return;
      let dx = event.clientX - center.current.x;
      let dy = event.clientY - center.current.y;
      const distance = Math.hypot(dx, dy);
      if (distance > STICK_RADIUS) {
        dx = (dx / distance) * STICK_RADIUS;
        dy = (dy / distance) * STICK_RADIUS;
      }
      setKnob({ x: dx, y: dy });
      input.setStick(dx / STICK_RADIUS, -dy / STICK_RADIUS);
    },
    [input],
  );

  const handleUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerId !== pointerId.current) return;
      release();
    },
    [release],
  );

  const pressJump = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      input.setTouchJump(true);
      setJumpHeld(true);
    },
    [input],
  );

  const releaseJump = useCallback(() => {
    input.setTouchJump(false);
    setJumpHeld(false);
  }, [input]);

  useEffect(() => () => release(), [release]);

  if (!isTouch) return null;

  return (
    <>
      <div
        ref={baseRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        className="pointer-events-auto absolute bottom-6 left-5 grid h-36 w-36 touch-none place-items-center rounded-full border-4 border-white/60 bg-[#141420]/35 backdrop-blur-sm select-none"
        aria-label="Move"
      >
        <div
          className="h-16 w-16 rounded-full border-4 border-white/80 bg-white/70 shadow-lg"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      <button
        type="button"
        onPointerDown={pressJump}
        onPointerUp={releaseJump}
        onPointerCancel={releaseJump}
        className={`pointer-events-auto absolute right-6 bottom-8 h-24 w-24 touch-none rounded-full border-4 border-white/80 text-lg font-extrabold text-[#141420] shadow-xl transition-transform select-none ${
          jumpHeld ? "scale-90 bg-[#ffd76a]" : "bg-[#f5c33b]"
        }`}
        aria-label="Jump"
      >
        JUMP
      </button>
    </>
  );
}
