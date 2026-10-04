// apps/web/src/audio/AudioEngine.ts

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private typingBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private uiBus: GainNode | null = null;

  // Engine synth nodes
  private isEngineRunning = false;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Settings state
  private engineEnabled = true;
  private typingEnabled = true;
  private fxEnabled = true;

  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext })?.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.engineBus = this.ctx.createGain();
        this.engineBus.gain.setValueAtTime(this.engineEnabled ? 0.55 : 0, this.ctx.currentTime);
        this.engineBus.connect(this.masterGain);

        this.typingBus = this.ctx.createGain();
        this.typingBus.gain.setValueAtTime(this.typingEnabled ? 0.45 : 0, this.ctx.currentTime);
        this.typingBus.connect(this.masterGain);

        this.fxBus = this.ctx.createGain();
        this.fxBus.gain.setValueAtTime(this.fxEnabled ? 0.6 : 0, this.ctx.currentTime);
        this.fxBus.connect(this.masterGain);

        this.uiBus = this.ctx.createGain();
        this.uiBus.gain.setValueAtTime(this.fxEnabled ? 0.35 : 0, this.ctx.currentTime);
        this.uiBus.connect(this.masterGain);

        if (this.ctx.state === 'suspended') {
          await this.ctx.resume();
        }
      } catch (err) {
        console.warn('AudioContext initialization deferred until user interaction', err);
      }
    })();

    return this.initPromise;
  }

  public updateSettings(engine: boolean, typing: boolean, fx: boolean): void {
    this.engineEnabled = engine;
    this.typingEnabled = typing;
    this.fxEnabled = fx;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineBus) {
      this.engineBus.gain.setTargetAtTime(engine ? 0.55 : 0, now, 0.05);
    }
    if (this.typingBus) {
      this.typingBus.gain.setTargetAtTime(typing ? 0.45 : 0, now, 0.05);
    }
    if (this.fxBus) {
      this.fxBus.gain.setTargetAtTime(fx ? 0.6 : 0, now, 0.05);
    }
    if (this.uiBus) {
      this.uiBus.gain.setTargetAtTime(fx ? 0.35 : 0, now, 0.05);
    }
  }

  // --- ENGINE PROCEDURAL SYNTHESIZER ---

  public startEngine(): void {
    if (this.isEngineRunning || !this.ctx || !this.engineBus) return;
    this.init();

    const now = this.ctx.currentTime;

    // Oscillator 1: Sawtooth (base engine harmonic)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(55, now);

    // Oscillator 2: Triangle (sub body)
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(27.5, now);

    // Resonant lowpass filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.Q.setValueAtTime(2.5, now);
    this.engineFilter.frequency.setValueAtTime(350, now);

    // Engine volume gain
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.4, now);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.engineBus);

    this.engineOsc1.start(now);
    this.engineOsc2.start(now);
    this.isEngineRunning = true;
  }

  public updateEngineRpm(kmh: number, isAccelerating: boolean): void {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const alpha = Math.min(1.0, Math.max(0.0, (kmh - 20) / (300 - 20)));
    const targetFreq = 55 + 285 * Math.pow(alpha, 1.2);
    const filterCutoff = 250 + 1800 * alpha + (isAccelerating ? 300 : 0);

    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.04);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);
  }

  public triggerMistakeBogDown(): void {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc1 || !this.engineFilter) return;

    const now = this.ctx.currentTime;
    // Sudden RPM pitch drop and filter muffling
    const currentFreq = this.engineOsc1.frequency.value;
    this.engineOsc1.frequency.setTargetAtTime(currentFreq * 0.65, now, 0.02);
    this.engineFilter.frequency.setTargetAtTime(280, now, 0.03);

    this.playMistakeSound();
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
      this.engineFilter?.disconnect();
      this.engineGain?.disconnect();
    } catch {}
    this.isEngineRunning = false;
  }

  // --- MECHANICAL KEYSTROKE CLICK ---

  public playKeystroke(isSpace = false): void {
    if (!this.typingEnabled || !this.ctx || !this.typingBus) return;
    const now = this.ctx.currentTime;

    // 1. Noise burst for switch click transient
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.012);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(isSpace ? 2200 : 3400, now);

    // 2. Low-frequency tactile key bottom-out clack
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    const pitch = isSpace ? 320 : 420 + (Math.random() * 40 - 20);
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.025);

    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    noise.connect(noiseFilter);
    noiseFilter.connect(this.typingBus);
    osc.connect(oscGain);
    oscGain.connect(this.typingBus);

    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // --- RACE FX & FANFARE ---

  public playMistakeSound(): void {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    // Low-pitch stumble tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.fxBus);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playStreakMilestone(streak: number): void {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    // Harmonic powerup chime (higher pitch as streak increases)
    const baseFreq = streak >= 30 ? 1046.5 : 880; // C6 or A5
    const highFreq = streak >= 30 ? 1567.98 : 1318.51; // G6 or E6

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(highFreq, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.fxBus);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playCountdownBeep(isGo = false): void {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    if (!isGo) {
      // 3, 2, 1: 440 Hz short beep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.fxBus);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // GO!: 880 Hz + 1320 Hz chord
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.fxBus);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    }
  }

  public playVictoryFanfare(): void {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    // Ascending celebratory major arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.fxBus) return;
      const noteTime = now + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.fxBus);
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  public playLossSound(): void {
    if (!this.fxEnabled || !this.ctx || !this.fxBus) return;
    const now = this.ctx.currentTime;

    // Gentle descending tones: A4 (440Hz) -> F4 (349Hz) -> D4 (293Hz)
    const notes = [440, 349.23, 293.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.fxBus) return;
      const noteTime = now + idx * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.fxBus);
      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  public playUiClick(): void {
    if (!this.fxEnabled || !this.ctx || !this.uiBus) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.025);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.uiBus);
    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const audioEngine = new AudioEngine();
