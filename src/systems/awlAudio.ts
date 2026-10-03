// ─── HARVEST MOON: A WONDERFUL LIFE 3D - PROCEDURAL AUDIO SYNTHESIZER ───

class AWLAudioManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmIntervalId: number | null = null;
  private currentTrack: string | null = null;
  private cooldowns: Map<string, number> = new Map();

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
        this.bgmGain.connect(this.ctx.destination);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopBGM();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private midiToFreq(midi: number): number {
    return 440.0 * Math.pow(2.0, (midi - 69.0) / 12.0);
  }

  // ─── BGM COMPOSER (Acoustic Guitar, Harp, & Flute Melodies of Forget-Me-Not Valley) ───
  public playTrack(trackId: string) {
    if (!this.enabled) return;
    if (this.currentTrack === trackId && this.bgmIntervalId !== null) return;

    this.stopBGM();
    this.currentTrack = trackId;
    this.init();

    const loopSec = 16.0;

    const playPhrase = () => {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;

      if (trackId === 'bar') {
        // Late Night Blue Bar Jazz (Dm9 -> G13 -> Cmaj7)
        this.playSoftChord([50, 57, 60, 64], t + 0.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(76), t + 1.0, 1.8, 0.04);
        this.playLeadNote(this.midiToFreq(79), t + 2.5, 1.2, 0.04);

        this.playSoftChord([43, 53, 59, 64], t + 4.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(81), t + 5.0, 1.8, 0.04);
        this.playLeadNote(this.midiToFreq(77), t + 6.8, 1.0, 0.04);

        this.playSoftChord([48, 55, 59, 64], t + 8.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(79), t + 9.0, 2.5, 0.04);
        this.playLeadNote(this.midiToFreq(72), t + 12.0, 3.0, 0.04);
      } else if (trackId === 'autumn') {
        // Quiet Autumn Melancholy (Am9 -> Fmaj7 -> Em7 -> Am)
        this.playSoftChord([45, 52, 59, 60], t + 0.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(76), t + 1.2, 2.0, 0.035);

        this.playSoftChord([41, 48, 57, 64], t + 4.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(77), t + 5.2, 2.0, 0.035);

        this.playSoftChord([40, 47, 55, 62], t + 8.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(74), t + 9.5, 2.0, 0.035);

        this.playSoftChord([45, 52, 57, 60], t + 12.0, 4.0, 0.06);
        this.playLeadNote(this.midiToFreq(69), t + 13.0, 2.5, 0.035);
      } else if (trackId === 'winter') {
        // Soft Starlight Winter (Cmaj7 -> G/B -> Am7 -> C)
        this.playSoftChord([48, 55, 59, 64], t + 0.0, 8.0, 0.05);
        this.playLeadNote(this.midiToFreq(84), t + 2.0, 3.0, 0.03);
        this.playLeadNote(this.midiToFreq(83), t + 5.5, 2.5, 0.03);

        this.playSoftChord([45, 52, 57, 60], t + 8.0, 8.0, 0.05);
        this.playLeadNote(this.midiToFreq(81), t + 10.0, 3.0, 0.03);
        this.playLeadNote(this.midiToFreq(79), t + 13.5, 2.5, 0.03);
      } else {
        // Breeze of Spring / Forget-Me-Not Valley Pastoral Theme (G -> C -> D -> G)
        this.playSoftChord([43, 50, 55, 59], t + 0.0, 4.0, 0.07);
        this.playLeadNote(this.midiToFreq(83), t + 0.5, 1.4, 0.045);
        this.playLeadNote(this.midiToFreq(86), t + 2.0, 1.4, 0.045);

        this.playSoftChord([48, 55, 60, 64], t + 4.0, 4.0, 0.07);
        this.playLeadNote(this.midiToFreq(84), t + 4.5, 1.4, 0.045);
        this.playLeadNote(this.midiToFreq(88), t + 6.0, 1.4, 0.045);

        this.playSoftChord([50, 57, 62, 66], t + 8.0, 4.0, 0.07);
        this.playLeadNote(this.midiToFreq(86), t + 8.5, 1.4, 0.045);
        this.playLeadNote(this.midiToFreq(81), t + 10.0, 1.4, 0.045);

        this.playSoftChord([43, 50, 55, 59], t + 12.0, 4.0, 0.07);
        this.playLeadNote(this.midiToFreq(83), t + 12.5, 1.4, 0.045);
        this.playLeadNote(this.midiToFreq(79), t + 14.0, 1.8, 0.045);
      }
    };

    playPhrase();
    this.bgmIntervalId = window.setInterval(playPhrase, loopSec * 1000);
  }

  private playSoftChord(midiNotes: number[], startT: number, durSec: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;
    const perVol = vol / Math.max(1, midiNotes.length);

    midiNotes.forEach((midi) => {
      if (!this.ctx || !this.bgmGain) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(this.midiToFreq(midi), startT);

        gain.gain.setValueAtTime(0.0001, startT);
        gain.gain.linearRampToValueAtTime(perVol, startT + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + durSec);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(startT);
        osc.stop(startT + durSec);
      } catch {}
    });
  }

  private playLeadNote(freq: number, startT: number, durSec: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.0001, startT);
      gain.gain.linearRampToValueAtTime(vol, startT + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + durSec);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startT);
      osc.stop(startT + durSec);
    } catch {}
  }

  public stopBGM() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentTrack = null;
  }

  // ─── HARVEST MOON: AWL ANIMAL SOUNDS ───

  public playCowMoo() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const durSec = 0.85;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(135, t);
      osc.frequency.linearRampToValueAtTime(120, t + 0.2);
      osc.frequency.linearRampToValueAtTime(102, t + durSec);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.2, t);
      lfoGain.gain.setValueAtTime(5, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520, t);
      filter.Q.setValueAtTime(3.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {}
  }

  public playSheepBaa() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const durSec = 0.65;

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(210, t);
      osc.frequency.linearRampToValueAtTime(190, t + durSec);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(6.8, t);
      lfoGain.gain.setValueAtTime(12, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.26, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {}
  }

  public playChickenCluck() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      [0, 0.08, 0.18].forEach((offset, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const startT = t + offset;
        const dur = 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560 + i * 80, startT);
        osc.frequency.exponentialRampToValueAtTime(320, startT + dur);

        gain.gain.setValueAtTime(0.20, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startT);
        osc.stop(startT + dur);
      });
    } catch {}
  }

  public playHorseWhinny() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const durSec = 0.75;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.linearRampToValueAtTime(750, t + 0.25);
      osc.frequency.linearRampToValueAtTime(380, t + durSec);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(12, t);
      lfoGain.gain.setValueAtTime(40, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {}
  }

  public playDogBark() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      [0, 0.14].forEach((offset) => {
        if (!this.ctx || !this.sfxGain) return;
        const st = t + offset;
        const dur = 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, st);
        osc.frequency.exponentialRampToValueAtTime(180, st + dur);

        gain.gain.setValueAtTime(0.25, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + dur);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(st);
        osc.stop(st + dur);
      });
    } catch {}
  }

  // ─── TOOL SOUND EFFECTS ───

  public playHoe() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playWater() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.18);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playHarvest() {
    this.playChimes([523, 659, 784, 1046], 0.28);
  }

  public playMilk() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.12);

      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playShear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(300, t + 0.08);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  public playChimes(notes: number[], vol = 0.25) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const st = t + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);

        gain.gain.setValueAtTime(0.001, st);
        gain.gain.linearRampToValueAtTime(vol, st + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, st + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(st);
        osc.stop(st + 0.28);
      });
    } catch {}
  }

  public playClick() {
    this.playChimes([580, 880], 0.15);
  }

  public playHeartChime() {
    this.playChimes([440, 554, 659, 880], 0.26);
  }

  public playPastureBell() {
    this.playChimes([1046, 1318], 0.35);
  }

  // ─── AUTHENTIC AWL WHISTLE (Two-finger crisp whistle to call horse / dog) ───
  public playWhistle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.linearRampToValueAtTime(2600, t + 0.12);
      osc.frequency.linearRampToValueAtTime(2200, t + 0.22);
      osc.frequency.linearRampToValueAtTime(3100, t + 0.35);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  // ─── FOOTSTEP SOUND ───
  public playFootstep(surface: 'grass' | 'wood' | 'dirt' = 'grass') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (surface === 'wood') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(surface === 'dirt' ? 120 : 90, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);
      }

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  // ─── ANIMAL WASH SOUND (Warm water spray & soapy scrub) ───
  public playWashAnimal() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(850, t + 0.15);
      osc.frequency.linearRampToValueAtTime(500, t + 0.3);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  // ─── ICONIC HARVEST MOON ITEM FANFARE (Holding item above head!) ───
  public playItemAcquired() {
    this.playChimes([523.25, 659.25, 783.99, 1046.5], 0.32);
  }

  // ─── TARTAN TALKING SOUND ───
  public playTartanGrunt() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.08);
      osc.frequency.linearRampToValueAtTime(140, t + 0.18);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }
}

export const awlAudio = new AWLAudioManager();
