/**
 * Unified input for keyboard, mouse-look, and touch.
 *
 * The game loop reads a single normalised intent each frame, so desktop and
 * mobile paths never diverge in gameplay code. Touch controls are first-class
 * here rather than bolted on: the deployed prototype is tested on a phone.
 */

const FORWARD_KEYS = ["KeyW", "ArrowUp"];
const BACK_KEYS = ["KeyS", "ArrowDown"];
const LEFT_KEYS = ["KeyA", "ArrowLeft"];
const RIGHT_KEYS = ["KeyD", "ArrowRight"];
/** One action button, whatever the level calls it. Shift joins Space so a
 * slide level has a key that already feels like "duck" on a keyboard. */
const ACTION_KEYS = ["Space", "ShiftLeft", "ShiftRight"];
const YAW_LEFT_KEYS = ["KeyQ"];
const YAW_RIGHT_KEYS = ["KeyE"];

const PREVENT_DEFAULT = new Set([
  ...FORWARD_KEYS,
  ...BACK_KEYS,
  ...LEFT_KEYS,
  ...RIGHT_KEYS,
  ...ACTION_KEYS,
]);

export interface MoveIntent {
  /** Strafe, -1 (left) to 1 (right). */
  x: number;
  /** Forward, -1 (back) to 1 (forward). */
  y: number;
}

export class GameInput {
  private keys = new Set<string>();
  private stickX = 0;
  private stickY = 0;
  private touchAction = false;

  private lookDeltaX = 0;
  private lookDeltaY = 0;
  private lookPointerId: number | null = null;
  private lastLookX = 0;
  private lastLookY = 0;
  private enabled = true;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    this.keys.add(event.code);
    if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  private readonly onBlur = () => {
    this.keys.clear();
    this.stickX = 0;
    this.stickY = 0;
    this.touchAction = false;
    this.lookPointerId = null;
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    if (this.lookPointerId !== null) return;
    this.lookPointerId = event.pointerId;
    this.lastLookX = event.clientX;
    this.lastLookY = event.clientY;
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.lookPointerId) return;
    this.lookDeltaX += event.clientX - this.lastLookX;
    this.lookDeltaY += event.clientY - this.lastLookY;
    this.lastLookX = event.clientX;
    this.lastLookY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.lookPointerId) return;
    this.lookPointerId = null;
  };

  /** Binds keyboard globally and look-drag to the given element. */
  attach(lookTarget: HTMLElement): () => void {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    lookTarget.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);

    return () => {
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("keyup", this.onKeyUp);
      window.removeEventListener("blur", this.onBlur);
      lookTarget.removeEventListener("pointerdown", this.onPointerDown);
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerUp);
      this.onBlur();
    };
  }

  /** Virtual joystick vector, in the range -1..1 on each axis. */
  setStick(x: number, y: number) {
    this.stickX = x;
    this.stickY = y;
  }

  /** On-screen action button state — jump or slide, per the level. */
  setTouchAction(held: boolean) {
    this.touchAction = held;
  }

  /** Suspends movement input while a modal is open. */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.onBlur();
  }

  private held(codes: string[]): boolean {
    return codes.some((code) => this.keys.has(code));
  }

  getMove(): MoveIntent {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = this.stickX;
    let y = this.stickY;
    if (this.held(LEFT_KEYS)) x -= 1;
    if (this.held(RIGHT_KEYS)) x += 1;
    if (this.held(FORWARD_KEYS)) y += 1;
    if (this.held(BACK_KEYS)) y -= 1;

    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  /** Whether the level's action button is held this frame. */
  isActionHeld(): boolean {
    if (!this.enabled) return false;
    return this.touchAction || this.held(ACTION_KEYS);
  }

  /** Keyboard camera nudge, in radians per second. */
  getKeyboardYaw(): number {
    if (!this.enabled) return 0;
    let yaw = 0;
    if (this.held(YAW_LEFT_KEYS)) yaw += 1;
    if (this.held(YAW_RIGHT_KEYS)) yaw -= 1;
    return yaw;
  }

  /** Returns accumulated drag since the last call, then clears it. */
  consumeLook(): { x: number; y: number } {
    const x = this.lookDeltaX;
    const y = this.lookDeltaY;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    if (!this.enabled) return { x: 0, y: 0 };
    return { x, y };
  }
}
