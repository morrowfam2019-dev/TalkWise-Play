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

/**
 * A gentle looping background theme, synthesised the same way as the sound
 * effects: a stepped pentatonic melody over a slow bass drone, scheduled on a
 * plain interval rather than a lookahead scheduler — background music has no
 * hard rhythmic deadline, so the small timer jitter doesn't matter.
 */
class MusicLoop {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;
  private playing = false;
  private stepIndex = 0;
  private intervalId: number | null = null;

  private readonly stepSeconds = 0.42;
  // C major pentatonic — no note in this set can clash, so the loop stays
  // pleasant however the steps land relative to the bass change underneath.
  private readonly melody = [
    261.63, 329.63, 392.0, 523.25, 440.0, 392.0, 329.63, 293.66,
  ];
  private readonly bassNotes = [130.81, 174.61]; // C3, F3

  attach(ctx: AudioContext) {
    this.ctx = ctx;
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(ctx.destination);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  start() {
    if (this.playing || !this.ctx) return;
    this.playing = true;
    this.stepIndex = 0;
    this.scheduleStep();
    this.intervalId = window.setInterval(() => this.scheduleStep(), this.stepSeconds * 1000);
  }

  stop() {
    this.playing = false;
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private scheduleStep() {
    const ctx = this.ctx;
    const gain = this.masterGain;
    if (!ctx || !gain) return;

    // Safari aggressively auto-suspends an AudioContext that's gone quiet
    // for a moment — and a stepped melody of short notes does exactly that
    // between beats. Left unchecked, that reads as the music cutting in and
    // out. Nudging it awake before every scheduled step keeps it running.
    if (ctx.state === "suspended") void ctx.resume();

    const start = ctx.currentTime + 0.02;
    const step = this.stepSeconds;

    const melodyFreq = this.melody[this.stepIndex % this.melody.length];
    const melodyOsc = ctx.createOscillator();
    const melodyAmp = ctx.createGain();
    melodyOsc.type = "triangle";
    melodyOsc.frequency.setValueAtTime(melodyFreq, start);
    melodyAmp.gain.setValueAtTime(0.0001, start);
    melodyAmp.gain.exponentialRampToValueAtTime(0.05, start + 0.02);
    melodyAmp.gain.exponentialRampToValueAtTime(0.0001, start + step * 0.92);
    melodyOsc.connect(melodyAmp);
    melodyAmp.connect(gain);
    melodyOsc.start(start);
    melodyOsc.stop(start + step);

    // A soft bass note every four steps, sustained under the next four notes.
    if (this.stepIndex % 4 === 0) {
      const bassFreq = this.bassNotes[(this.stepIndex / 4) % this.bassNotes.length];
      const bassOsc = ctx.createOscillator();
      const bassAmp = ctx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(bassFreq, start);
      bassAmp.gain.setValueAtTime(0.0001, start);
      bassAmp.gain.exponentialRampToValueAtTime(0.04, start + 0.08);
      bassAmp.gain.exponentialRampToValueAtTime(0.0001, start + step * 4 * 0.95);
      bassOsc.connect(bassAmp);
      bassAmp.connect(gain);
      bassOsc.start(start);
      bassOsc.stop(start + step * 4);
    }

    this.stepIndex += 1;
  }
}

class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private readonly music = new MusicLoop();

  private visibilityListenerAttached = false;

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
        this.music.attach(this.ctx);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      this.attachVisibilityResume();
    } catch {
      this.muted = true;
    }
  }

  /** A tab switch, an incoming call banner, or the OS briefly stealing
   * audio focus can all leave the context suspended after the page comes
   * back — resume it the moment the page is visible/foregrounded again. */
  private attachVisibilityResume() {
    if (this.visibilityListenerAttached || typeof document === "undefined") return;
    this.visibilityListenerAttached = true;
    const resume = () => {
      if (!this.muted && this.ctx?.state === "suspended") void this.ctx.resume();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("pageshow", resume);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.music.setMuted(muted);
  }

  isMuted() {
    return this.muted;
  }

  startMusic() {
    this.music.start();
  }

  stopMusic() {
    this.music.stop();
  }

  private tone({ freq, duration, type = "sine", gain = 0.12, delay = 0, sweepTo }: ToneOptions) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    if (ctx.state === "suspended") void ctx.resume();
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
