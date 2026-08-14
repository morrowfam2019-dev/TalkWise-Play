/**
 * Microphone audio capture and speech detection.
 *
 * Detects when the user speaks by monitoring audio volume.
 * Does not perform pronunciation scoring — just detects an attempt.
 */

export type SpeechDetectionStatus = "idle" | "listening" | "detected";

const VOLUME_THRESHOLD = 0.02; // Adjust sensitivity (0-1)
const DETECTION_DURATION_MS = 300; // How long sound must exceed threshold
const SILENCE_TIMEOUT_MS = 1500; // Stop listening after silence

export class AudioCaptureManager {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private volumeExceededSince: number | null = null;
  private silenceSince: number | null = null;
  private statusCallback: ((status: SpeechDetectionStatus) => void) | null =
    null;
  private detectedCallback: ((
    ) => void) | null = null;

  async requestPermission(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  async startListening(
    onDetected: () => void,
    onStatus?: (status: SpeechDetectionStatus) => void,
  ): Promise<void> {
    if (!this.mediaStream) {
      throw new Error("No media stream available");
    }

    this.detectedCallback = onDetected;
    this.statusCallback = onStatus ?? null;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (!this.analyser) {
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(
        bufferLength,
      ) as Uint8Array<ArrayBuffer>;
    }

    this.volumeExceededSince = null;
    this.silenceSince = Date.now();
    this.updateStatus("listening");
    this.detectVolume();
  }

  private detectVolume(): void {
    if (!this.analyser || !this.dataArray) return;

    this.analyser.getByteFrequencyData(this.dataArray as any);

    const average =
      this.dataArray.reduce((a, b) => a + b) / this.dataArray.length / 255;

    if (average > VOLUME_THRESHOLD) {
      if (this.volumeExceededSince === null) {
        this.volumeExceededSince = Date.now();
      }

      this.silenceSince = Date.now();

      const duration = Date.now() - this.volumeExceededSince;
      if (duration >= DETECTION_DURATION_MS) {
        this.onSpeechDetected();
        return;
      }
    }

    // Check for timeout (silence)
    if (
      this.silenceSince &&
      Date.now() - this.silenceSince > SILENCE_TIMEOUT_MS &&
      this.volumeExceededSince !== null
    ) {
      // Had sound but now it's been silent
      this.onSpeechDetected();
      return;
    }

    this.animationId = requestAnimationFrame(() => this.detectVolume());
  }

  private onSpeechDetected(): void {
    this.updateStatus("detected");
    this.stopListening();
    if (this.detectedCallback) {
      this.detectedCallback();
    }
  }

  stopListening(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.updateStatus("idle");
  }

  private updateStatus(status: SpeechDetectionStatus): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  dispose(): void {
    this.stopListening();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}
