/**
 * Speech Basketball's sound effects — synthesised with oscillators, same
 * no-shipped-audio-files approach as the adventure engine's `gameAudio`.
 * Kept as its own instance rather than extending `gameAudio` so the
 * basketball module stays fully isolated, per its own module boundary.
 *
 * The one exception is `cheer()`: a made basket deserves an actual excited
 * kid voice, not another oscillator beep, so it plays one of a small set of
 * short recorded clips (TalkWise's own TJ character voice) instead.
 */

/** Recorded "made it!" cheers — a real young voice, picked at random so the
 * same line doesn't repeat every basket. */
const CHEER_CLIPS = [
  "/audio/basketball/cheer-yay.mp3",
  "/audio/basketball/cheer-yes-woohoo.mp3",
  "/audio/basketball/cheer-nice-shot.mp3",
  "/audio/basketball/cheer-awesome.mp3",
  "/audio/basketball/cheer-woohoo-yay.mp3",
];

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
  private musicTimer: number | null = null;
  private musicGen = 0;
  private lastCheerIndex = -1;

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

  private tone({
    freq,
    duration,
    type = "sine",
    gain = 0.12,
    delay = 0,
    sweepTo,
  }: ToneOptions) {
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
    this.tone({
      freq: 260,
      duration: 0.1,
      type: "sine",
      gain: 0.06,
      sweepTo: 340,
    });
  }

  /** Clean make. */
  swish() {
    this.tone({ freq: 880, duration: 0.14, type: "triangle", gain: 0.09 });
    this.tone({
      freq: 1175,
      duration: 0.18,
      type: "triangle",
      gain: 0.08,
      delay: 0.08,
    });
    this.noiseBurst(0.12, 0.03, 0.1);
  }

  /** A real excited kid-voice cheer for a made basket — never repeats the
   * same clip twice in a row. Best-effort: a rejected `play()` (autoplay
   * policy, slow network) is swallowed exactly like the rest of this
   * class's audio, never surfaced to the caller. */
  cheer() {
    if (this.muted || typeof window === "undefined") return;
    let index = Math.floor(Math.random() * CHEER_CLIPS.length);
    if (CHEER_CLIPS.length > 1 && index === this.lastCheerIndex) {
      index = (index + 1) % CHEER_CLIPS.length;
    }
    this.lastCheerIndex = index;
    const clip = new Audio(CHEER_CLIPS[index]);
    clip.volume = 0.85;
    clip.play().catch(() => {});
  }

  /** Rim/backboard miss. */
  clank() {
    this.tone({ freq: 180, duration: 0.16, type: "square", gain: 0.07 });
    this.tone({
      freq: 140,
      duration: 0.2,
      type: "square",
      gain: 0.05,
      delay: 0.06,
    });
  }

  /** Hot/All-Star streak sting. */
  streak() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, index) => {
      this.tone({
        freq,
        duration: 0.16,
        type: "triangle",
        gain: 0.1,
        delay: index * 0.07,
      });
    });
  }

  /** Round-complete buzzer. */
  buzzer() {
    this.tone({ freq: 220, duration: 0.6, type: "sawtooth", gain: 0.08 });
  }

  // --- Time Attack additions ---------------------------------------------
  //
  // All synthesised the same way as the originals — nothing sampled, so
  // nothing can resemble a commercial arcade or broadcast cue. Gains are kept
  // at or below the existing levels: this mode fires many more sounds per
  // second than Shootout and must not become the loud mode.

  /** Ball meeting the floor. Quiet — this one repeats constantly. */
  bounce() {
    this.tone({
      freq: 150,
      duration: 0.09,
      type: "sine",
      gain: 0.045,
      sweepTo: 95,
    });
  }

  /** Ball off the backboard: duller and woodier than the rim clank. */
  backboard() {
    this.tone({
      freq: 210,
      duration: 0.12,
      type: "triangle",
      gain: 0.055,
      sweepTo: 160,
    });
  }

  /** One tick of the 3-2-1 lead-in. */
  countdownTick() {
    this.tone({ freq: 520, duration: 0.13, type: "square", gain: 0.06 });
  }

  /** The "GO!" that starts the clock. */
  countdownGo() {
    this.tone({ freq: 784, duration: 0.16, type: "triangle", gain: 0.09 });
    this.tone({
      freq: 1047,
      duration: 0.22,
      type: "triangle",
      gain: 0.08,
      delay: 0.1,
    });
  }

  /** Urgency pip for each of the final five seconds. */
  urgentTick() {
    this.tone({ freq: 660, duration: 0.1, type: "square", gain: 0.07 });
  }

  /** A basket dropping in during the arcade round. */
  score() {
    this.tone({ freq: 988, duration: 0.11, type: "triangle", gain: 0.075 });
    this.tone({
      freq: 1319,
      duration: 0.14,
      type: "triangle",
      gain: 0.06,
      delay: 0.06,
    });
  }

  /** End of the 30 seconds — longer and lower than the Shootout buzzer. */
  finalBuzzer() {
    this.tone({ freq: 180, duration: 0.9, type: "sawtooth", gain: 0.085 });
    this.tone({
      freq: 120,
      duration: 0.9,
      type: "sawtooth",
      gain: 0.06,
      delay: 0.02,
    });
  }

  // --- Background music ----------------------------------------------------
  //
  // A soft, looping instrumental chord bed — synthesised the same way as
  // every other cue here, no shipped audio file. Replaces the old
  // browser-TTS "coach" lines: no voice, just music under the gameplay.
  // Self-schedules one chord at a time so it can be stopped cleanly
  // (`musicGen` invalidates any chord already queued via setTimeout).

  private readonly musicChords: number[][] = [
    [261.63, 329.63, 392.0], // C major
    [220.0, 261.63, 329.63], // A minor
    [174.61, 220.0, 261.63], // F major
    [196.0, 246.94, 293.66], // G major
  ];

  startMusic() {
    if (this.muted || !this.ctx || this.musicTimer !== null) return;
    const gen = (this.musicGen += 1);
    const chordSeconds = 2.4;
    let chordIndex = 0;

    const scheduleNext = () => {
      if (gen !== this.musicGen || !this.ctx) return;
      const chord = this.musicChords[chordIndex % this.musicChords.length];
      chord.forEach((freq, i) => {
        this.tone({
          freq,
          duration: chordSeconds * 0.95,
          type: "sine",
          gain: 0.02,
          delay: i * 0.02,
        });
      });
      chordIndex += 1;
      this.musicTimer = window.setTimeout(scheduleNext, chordSeconds * 1000);
    };

    scheduleNext();
  }

  stopMusic() {
    this.musicGen += 1;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const hoopAudio = new HoopAudio();
