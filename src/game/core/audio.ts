/**
 * Tiny synthesised sound effects.
 *
 * Everything is generated with oscillators at runtime — no audio files, no
 * third-party samples, nothing with licensing questions attached, and no extra
 * bytes to download on a phone.
 */

type Wave = OscillatorType;

interface ToneOptions {
  freq: number;
  duration: number;
  type?: Wave;
  gain?: number;
  delay?: number;
  /** Optional glide target, for rising or falling sweeps. */
  sweepTo?: number;
}

class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  /** Must be called from a user gesture before the first sound. */
  unlock() {
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

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted() {
    return this.muted;
  }

  private tone({ freq, duration, type = "sine", gain = 0.12, delay = 0, sweepTo }: ToneOptions) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);
    }

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  coin() {
    this.tone({ freq: 988, duration: 0.09, type: "triangle", gain: 0.1 });
    this.tone({ freq: 1319, duration: 0.12, type: "triangle", gain: 0.09, delay: 0.07 });
  }

  jump() {
    this.tone({ freq: 320, duration: 0.14, type: "sine", gain: 0.07, sweepTo: 620 });
  }

  checkpointFound() {
    this.tone({ freq: 523, duration: 0.16, type: "sine", gain: 0.09 });
    this.tone({ freq: 784, duration: 0.2, type: "sine", gain: 0.08, delay: 0.1 });
  }

  challengeComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, index) => {
      this.tone({ freq, duration: 0.2, type: "triangle", gain: 0.1, delay: index * 0.09 });
    });
  }

  unlockFinish() {
    this.tone({ freq: 392, duration: 0.5, type: "sawtooth", gain: 0.05, sweepTo: 880 });
    this.tone({ freq: 587, duration: 0.4, type: "triangle", gain: 0.08, delay: 0.15 });
  }

  levelComplete() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, index) => {
      this.tone({ freq, duration: 0.32, type: "triangle", gain: 0.11, delay: index * 0.13 });
    });
    this.tone({ freq: 262, duration: 0.9, type: "sine", gain: 0.07, delay: 0.1 });
  }
}

export const gameAudio = new GameAudio();
