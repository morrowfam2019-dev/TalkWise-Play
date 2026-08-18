/**
 * Speech Basketball's sound effects — synthesised with oscillators, same
 * no-shipped-audio-files approach as the adventure engine's `gameAudio`.
 * Kept as its own instance rather than extending `gameAudio` so the
 * basketball module stays fully isolated, per its own module boundary.
 */

type Wave = OscillatorType;

interface ToneOptions {
  freq: number;
  duration: number;
  type?: Wave;
  gain?: number;
  delay?: number;
  sweepTo?: number;
}

class HoopAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

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

  private noiseBurst(duration: number, gain: number, delay = 0) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(gain, start);
    source.connect(amp);
    amp.connect(ctx.destination);
    source.start(start);
  }

  /** Ball leaving the shooter's hands. */
  release() {
    this.tone({ freq: 260, duration: 0.1, type: "sine", gain: 0.06, sweepTo: 340 });
  }

  /** Clean make. */
  swish() {
    this.tone({ freq: 880, duration: 0.14, type: "triangle", gain: 0.09 });
    this.tone({ freq: 1175, duration: 0.18, type: "triangle", gain: 0.08, delay: 0.08 });
    this.noiseBurst(0.12, 0.03, 0.1);
  }

  /** Rim/backboard miss. */
  clank() {
    this.tone({ freq: 180, duration: 0.16, type: "square", gain: 0.07 });
    this.tone({ freq: 140, duration: 0.2, type: "square", gain: 0.05, delay: 0.06 });
  }

  /** Hot/All-Star streak sting. */
  streak() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, index) => {
      this.tone({ freq, duration: 0.16, type: "triangle", gain: 0.1, delay: index * 0.07 });
    });
  }

  /** Round-complete buzzer. */
  buzzer() {
    this.tone({ freq: 220, duration: 0.6, type: "sawtooth", gain: 0.08 });
  }
}

export const hoopAudio = new HoopAudio();
