/** Laptop speakers roll off low frequencies; a short 220 Hz sine is inaudible. */
const CUE_HZ = 660;
const END_HZ = 880;
const TONE_SECONDS = 0.3;

/** Short audible cues, scheduled on the audio clock; cancellation also settles previews. */
export class LessonAudio {
  private context: AudioContext | null = null;
  private oscillators = new Set<OscillatorNode>();
  private timers = new Set<number>();
  private generation = 0;
  private unlocked = false;

  private async ready() {
    this.context ??= new AudioContext();
    await this.context.resume();
    if (this.context.state !== 'running') {
      throw new Error('Audio could not start. Check your sound output.');
    }
    return this.context;
  }

  private tone(context: AudioContext, at: number, frequency: number) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.3, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    this.oscillators.add(oscillator);
    oscillator.addEventListener(
      'ended',
      () => {
        this.oscillators.delete(oscillator);
        oscillator.disconnect();
        gain.disconnect();
      },
      { once: true }
    );
    oscillator.start(at);
    oscillator.stop(at + TONE_SECONDS);
    return oscillator;
  }

  private later(callback: () => void, delay: number) {
    const { generation } = this;
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      if (generation === this.generation) callback();
    }, delay);
    this.timers.add(timer);
  }

  async preview(): Promise<boolean> {
    this.cancel();
    const { generation } = this;
    const context = await this.ready();
    if (generation !== this.generation) return false;
    this.tone(context, context.currentTime + 0.02, CUE_HZ);
    this.unlocked = true;
    return true;
  }

  /** Callback timestamps describe cue onset, not the browser timer's delivery time. */
  async start(onStart: (time: number) => void, onEnd: (time: number) => void) {
    if (!this.unlocked) throw new Error('Hear the chime before starting.');
    this.cancel();
    const { generation } = this;
    const context = await this.ready();
    if (generation !== this.generation) return;
    const start = context.currentTime + 0.02;
    const wallStart = Date.now() + 20;
    this.tone(context, start, CUE_HZ);
    this.tone(context, start + 10, END_HZ);
    this.tone(context, start + 10.4, END_HZ);
    this.later(() => onStart(wallStart), 20);
    this.later(() => onEnd(wallStart + 10000), 10020);
  }

  cancel() {
    this.generation++;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const oscillator of this.oscillators) {
      try {
        oscillator.stop();
      } catch {
        // The ended callback may remove an oscillator between iteration and stop.
      }
    }
    this.oscillators.clear();
  }

  dispose() {
    this.cancel();
    const { context } = this;
    this.context = null;
    this.unlocked = false;
    if (context && context.state !== 'closed') void context.close();
  }
}
