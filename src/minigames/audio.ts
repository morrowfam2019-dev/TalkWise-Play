/**
 * The mini-game collection's sound effects, and the player for Guess the
 * Sound's synthesis recipes.
 *
 * Synthesised with oscillators and shaped noise, the same no-shipped-audio
 * approach GAME-001 and GAME-002 already use — which is what keeps six
 * mini-games loading instantly on a phone (§14, §31) and what makes §28's
 * "no copyrighted sounds used" true by construction.
 *
 * One instance shared by all six games rather than one per game: unlike
 * GAME-002, which keeps its own audio to preserve its module boundary,
 * the mini-games are explicitly a family sharing a framework, and six
 * AudioContexts on an iPhone is six times the wake-up cost for no benefit.
 *
 * Every method is best-effort. A blocked AudioContext, a rejected resume,
 * an unsupported browser — all of it is swallowed, because a silent game is
 * a playable game and a crashed one is not.
 */

import {
  getListenRecipe,
  listenRecipeDurationMs,
  type ListenRecipe,
} from "@/content/minigames/listen";
import type { ListenRecipeId } from "@/content/minigames/types";

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  sweepTo?: number;
  wobbleDepth?: number;
  wobbleHz?: number;
}

interface NoiseOptions {
  duration: number;
  gain?: number;
  delay?: number;
  filterHz?: number;
  filterQ?: number;
  shape?: "decay" | "swell" | "flat";
}

class MiniGameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  /**
   * Creates or resumes the AudioContext.
   *
   * Must be called from inside a user gesture — iOS Safari will not start
   * an AudioContext otherwise. Every mini-game calls it from the same
   * place: the "PLAY" tap on its setup screen, which is a real gesture and
   * happens before any sound is needed.
   */
  unlock(): void {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
    } catch {
      this.muted = true;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  private tone({
    freq,
    duration,
    type = "sine",
    gain = 0.1,
    delay = 0,
    sweepTo,
    wobbleDepth,
    wobbleHz,
  }: ToneOptions): void {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(1, sweepTo),
        start + duration,
      );
    }

    // Vibrato: a second oscillator modulating this one's frequency. It is
    // what turns a flat tone into a bleat or a warble, and it is the whole
    // difference between "a sound" and "a sheep".
    let lfo: OscillatorNode | null = null;
    let lfoGain: GainNode | null = null;
    if (wobbleDepth && wobbleHz) {
      lfo = ctx.createOscillator();
      lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(wobbleHz, start);
      lfoGain.gain.setValueAtTime(wobbleDepth, start);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(start);
      lfo.stop(start + duration + 0.05);
    }

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private noise({
    duration,
    gain = 0.08,
    delay = 0,
    filterHz,
    filterQ = 1,
    shape = "decay",
  }: NoiseOptions): void {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      const envelope =
        shape === "decay"
          ? 1 - t
          : shape === "swell"
            ? Math.sin(Math.PI * t)
            : 1;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, start);

    if (filterHz) {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(filterHz, start);
      filter.Q.setValueAtTime(filterQ, start);
      source.connect(filter);
      filter.connect(amp);
    } else {
      source.connect(amp);
    }

    amp.connect(ctx.destination);
    source.start(start);
  }

  // --- Shared mini-game cues ----------------------------------------------

  /** A correct action. Rises with the combo, so a x3 run *sounds* better. */
  correct(comboMultiplier = 1): void {
    const base = 700 + Math.min(3, comboMultiplier - 1) * 130;
    this.tone({ freq: base, duration: 0.1, type: "triangle", gain: 0.08 });
    this.tone({
      freq: base * 1.34,
      duration: 0.13,
      type: "triangle",
      gain: 0.07,
      delay: 0.055,
    });
  }

  /**
   * A wrong action.
   *
   * Deliberately soft, short, and *not* a buzzer. §17 forbids failure
   * language, and a harsh negative cue is failure language with no words in
   * it. This is a gentle "not that one" — a low, quick blip a child barely
   * registers, which is exactly the brief.
   */
  gentleMiss(): void {
    this.tone({
      freq: 300,
      duration: 0.1,
      type: "sine",
      gain: 0.045,
      sweepTo: 240,
    });
  }

  /** A bubble popping. */
  pop(): void {
    this.tone({
      freq: 620,
      duration: 0.06,
      type: "sine",
      gain: 0.07,
      sweepTo: 1200,
    });
    this.noise({ duration: 0.05, gain: 0.03, filterHz: 2200, shape: "decay" });
  }

  /** An object snapping into a drop target. */
  snap(): void {
    this.tone({
      freq: 480,
      duration: 0.07,
      type: "square",
      gain: 0.05,
      sweepTo: 760,
    });
  }

  /** One tick of the 3-2-1 lead-in. */
  countdownTick(): void {
    this.tone({ freq: 520, duration: 0.13, type: "square", gain: 0.06 });
  }

  /** The "GO!" that starts a timed round. */
  countdownGo(): void {
    this.tone({ freq: 784, duration: 0.16, type: "triangle", gain: 0.09 });
    this.tone({
      freq: 1047,
      duration: 0.22,
      type: "triangle",
      gain: 0.08,
      delay: 0.1,
    });
  }

  /** Urgency pip for each of the final seconds. */
  urgentTick(): void {
    this.tone({ freq: 660, duration: 0.1, type: "square", gain: 0.06 });
  }

  /** A combo multiplier going up. */
  comboUp(multiplier: number): void {
    const notes = [523, 659, 784, 1047].slice(0, Math.min(4, multiplier + 1));
    notes.forEach((freq, index) => {
      this.tone({
        freq,
        duration: 0.13,
        type: "triangle",
        gain: 0.075,
        delay: index * 0.055,
      });
    });
  }

  /** A power-up switching on. */
  powerUp(): void {
    this.tone({
      freq: 392,
      duration: 0.5,
      type: "triangle",
      gain: 0.08,
      sweepTo: 1568,
    });
    this.noise({ duration: 0.4, gain: 0.03, filterHz: 3000, shape: "swell" });
  }

  /** End of a session. Warm, not a buzzer — nothing here is a failure. */
  finish(): void {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, index) => {
      this.tone({
        freq,
        duration: 0.28,
        type: "triangle",
        gain: 0.07,
        delay: index * 0.09,
      });
    });
  }

  /** Coins landing in the wallet on the results screen. */
  coins(): void {
    for (let i = 0; i < 3; i += 1) {
      this.tone({
        freq: 1200 + i * 180,
        duration: 0.09,
        type: "sine",
        gain: 0.055,
        delay: i * 0.08,
      });
    }
  }

  // --- Guess the Sound -----------------------------------------------------

  /**
   * Plays one synthesis recipe from the content layer.
   *
   * The recipe is data (`content/minigames/listen.ts`); this is the only
   * code that knows how to turn it into sound. That split is what lets a
   * sound be re-tuned as a content change.
   */
  playRecipe(recipe: ListenRecipe): void {
    for (const layer of recipe.layers) {
      if (layer.type === "tone") {
        this.tone({
          freq: layer.freq,
          duration: layer.duration,
          type: layer.wave,
          gain: layer.gain,
          delay: layer.delay,
          sweepTo: layer.sweepTo,
          wobbleDepth: layer.wobbleDepth,
          wobbleHz: layer.wobbleHz,
        });
      } else {
        this.noise({
          duration: layer.duration,
          gain: layer.gain,
          delay: layer.delay,
          filterHz: layer.filterHz,
          filterQ: layer.filterQ,
          shape: layer.shape,
        });
      }
    }
  }

  /** Plays a recipe by id. Returns how long it will run, or 0 if unknown. */
  playListen(id: ListenRecipeId): number {
    const recipe = getListenRecipe(id);
    if (!recipe) return 0;
    this.playRecipe(recipe);
    return listenRecipeDurationMs(recipe);
  }
}

export const miniAudio = new MiniGameAudio();
