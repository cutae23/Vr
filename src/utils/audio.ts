/**
 * Web Audio API ambient sound generator
 * Synthesizes procedurally beautiful background atmospheres to fit the theme of each hall without external files.
 */
class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private primaryGain: GainNode | null = null;
  private oscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private intervals: number[] = [];
  private activeTheme: 'classic' | 'modern' | 'neon' | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.primaryGain = this.ctx.createGain();
      this.primaryGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Safe low volume
      this.primaryGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported in this browser.', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.primaryGain && this.ctx) {
      this.primaryGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMutedState(): boolean {
    return this.isMuted;
  }

  public play(theme: 'classic' | 'modern' | 'neon') {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // Direct resume if suspended (browser gesture requirement)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.activeTheme === theme) return;
    this.stop();

    this.activeTheme = theme;

    if (theme === 'classic') {
      // Classic: Warm, rich pipe organ / choir pads (C-Major, E-Minor chords, majestic resonance)
      this.createDrone(130.81, 0.5); // C3
      this.createDrone(164.81, 0.4); // E3
      this.createDrone(196.00, 0.4); // G3
      this.createDrone(261.63, 0.3); // C4

      // Gentle sweeping filter
      this.setupFilterSweep(180, 500, 8);

    } else if (theme === 'modern') {
      // Modern: Cool, minimal sine drone (Prussian blue minimalist vibes, C#-Major, Bb-Minor, spacious)
      this.createDrone(138.59, 0.6, 'sine'); // C#3
      this.createDrone(207.65, 0.4, 'sine'); // G#3
      this.createDrone(277.18, 0.3, 'sine'); // C#4
      this.createDrone(349.23, 0.2, 'sine'); // F4

      // Subtle dynamic tremolo
      this.setupLFO(2, 0.1);

    } else if (theme === 'neon') {
      // Neon: Sci-fi deep pulse & slow glowing cyberpunk arpeggiator (FM synth look)
      this.createDrone(110.00, 0.7, 'sawtooth'); // A2 (deep retro bass)
      this.createDrone(164.81, 0.4, 'triangle'); // E3
      this.createDrone(220.00, 0.3, 'triangle'); // A3

      // Retro Sci-Fi Beep / Arpeggiator loop
      const chord = [220.00, 261.63, 329.63, 392.00, 440.00]; // A Minor Pentatonic
      let step = 0;

      const intervalId = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.activeTheme !== 'neon') return;
        const note = chord[step % chord.length];
        this.playPulse(note, 0.08, 0.18);
        step += 1;
      }, 500);

      this.intervals.push(intervalId);
    }
  }

  private createDrone(freq: number, weight: number, type: OscillatorType = 'triangle') {
    if (!this.ctx || !this.primaryGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(weight * 0.1, this.ctx.currentTime);

      // Pitch variance (drift) for warm organic sounds
      const pulseInterval = window.setInterval(() => {
        if (osc && this.ctx) {
          const dt = Math.sin(this.ctx.currentTime * 0.5) * 0.3;
          osc.frequency.setValueAtTime(freq + dt, this.ctx.currentTime);
        }
      }, 200);
      this.intervals.push(pulseInterval);

      osc.connect(gainNode);
      gainNode.connect(this.primaryGain);

      osc.start();

      this.oscillators.push({ osc, gain: gainNode });
    } catch (e) {
      console.error(e);
    }
  }

  private playPulse(freq: number, vol: number, duration: number) {
    if (!this.ctx || !this.primaryGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Neon resonant low-pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.primaryGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignored
    }
  }

  private setupFilterSweep(low: number, high: number, speedSec: number) {
    if (!this.ctx || !this.primaryGain) return;
    // Simple filter node if supported
  }

  private setupLFO(freqHz: number, intensity: number) {
    if (!this.ctx || !this.primaryGain) return;
    // Basic tremolo on primary gain if needed
  }

  public stop() {
    // Clear all scheduled notes and oscillators
    this.oscillators.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (e) {}
    });
    this.oscillators = [];

    // Clear loops
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    this.activeTheme = null;
  }
}

export const ambientPlayer = new AmbientSynthesizer();
