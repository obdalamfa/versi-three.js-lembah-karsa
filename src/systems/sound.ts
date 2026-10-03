// Procedural Web Audio Sound Synthesizer & Scene BGM Generator for Lembah Karsa 3D
// Direct 1:1 translation of /game/sound.py (Ursina pygame.mixer procedural synthesis)

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentSceneBgm: string | null = null;
  private bgmIntervalId: number | null = null;
  private cooldowns: Map<string, number> = new Map();
  private animalCooldowns: Map<string, number> = new Map();
  private lastGlobalAnimalSoundTime: number = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
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

  // Frequency from MIDI note number
  private midiToFreq(midi: number): number {
    return 440.0 * Math.pow(2.0, (midi - 69.0) / 12.0);
  }

  // Play wave (matching _wave in sound.py)
  public playWave(freq: number, durMs: number, vol = 0.35, shape: 'sine' | 'square' | 'noise' | 'triangle' | 'sawtooth' = 'sine') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const durSec = durMs / 1000;
      const t = this.ctx.currentTime;

      if (shape === 'noise') {
        const bufferSize = Math.floor(this.ctx.sampleRate * durSec);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let prev = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const raw = Math.random() * 2 - 1;
          prev = 0.5 * prev + 0.5 * raw;
          const env = i < bufferSize * 0.15 ? i / (bufferSize * 0.15) : (bufferSize - i) / (bufferSize * 0.85);
          data[i] = prev * env * vol;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + durSec);
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = shape;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol, t + durSec * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + durSec);
      }
    } catch {
      // Audio context silenced
    }
  }

  // Play frequency sweep (matching _sweep in sound.py)
  public playSweep(f0: number, f1: number, durMs: number, vol = 0.3, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const durSec = durMs / 1000;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.linearRampToValueAtTime(f1, t + durSec);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + durSec * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + durSec);
    } catch {
      // Audio context silenced
    }
  }

  // Play chord (matching _chord in sound.py)
  public playChord(freqs: number[], durMs: number, vol = 0.3, type: OscillatorType = 'sine') {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const durSec = durMs / 1000;
      const t = this.ctx.currentTime;
      const perNoteVol = vol / Math.max(1, freqs.length);

      freqs.forEach((f) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(perNoteVol, t + durSec * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + durSec);
      });
    } catch {
      // Audio context silenced
    }
  }

  // 1:1 Sound Effect Presets from sound.py
  public play(name: string) {
    if (!this.enabled) return;

    const now = Date.now();
    const cd = name.startsWith('step_') ? 280 : 0;
    if (cd && now < (this.cooldowns.get(name) || 0)) return;
    if (cd) this.cooldowns.set(name, now + cd);

    switch (name) {
      case 'step_grass':
        this.playWave(190, 42, 0.08, 'noise');
        break;
      case 'step_dirt':
        this.playWave(140, 52, 0.11, 'noise');
        break;
      case 'step_path':
        this.playWave(360, 38, 0.09, 'noise');
        break;
      case 'step_floor':
        this.playWave(480, 35, 0.08, 'noise');
        break;
      case 'hoe':
        this.playWave(105, 95, 0.32, 'square');
        break;
      case 'water':
        this.playSweep(720, 240, 170, 0.24);
        break;
      case 'plant':
        this.playWave(440, 65, 0.20, 'sine');
        break;
      case 'harvest':
        this.playChord([523, 659, 784], 230, 0.28, 'triangle');
        break;
      case 'axe':
        this.playWave(88, 115, 0.35, 'square');
        break;
      case 'sword':
        this.playSweep(800, 300, 100, 0.28, 'sawtooth');
        break;
      case 'gift':
        this.playChord([440, 554, 659], 210, 0.25, 'sine');
        break;
      case 'dialog':
        this.playWave(860, 32, 0.10, 'sine');
        break;
      case 'notif':
        this.playChord([523, 784], 165, 0.20, 'triangle');
        break;
      case 'quest':
        this.playChord([392, 494, 587, 784], 440, 0.32, 'triangle');
        break;
      case 'blocked':
        this.playWave(175, 95, 0.15, 'square');
        break;
      case 'menu_move':
        this.playWave(630, 26, 0.08, 'sine');
        break;
      case 'menu_select':
        this.playChord([440, 550], 85, 0.15, 'sine');
        break;
      case 'buy':
        this.playSweep(370, 590, 105, 0.24);
        break;
      case 'sell':
        this.playChord([660, 880], 160, 0.24, 'triangle');
        break;
      case 'sleep':
        this.playSweep(450, 215, 560, 0.24);
        break;
      case 'morning':
        this.playChord([261, 329, 392, 523], 580, 0.28, 'triangle');
        break;
      case 'fish_bite':
        this.playSweep(275, 740, 330, 0.32);
        break;
      case 'heal':
        this.playSweep(330, 560, 210, 0.20);
        break;
      default:
        this.playWave(440, 50, 0.1);
        break;
    }
  }

  // Aliases matching UI callers
  public playClick() { this.play('menu_select'); }
  public playHoe() { this.play('hoe'); }
  public playWater() { this.play('water'); }
  public playHarvest() { this.play('harvest'); }
  public playSwordSwing() { this.play('sword'); }
  public playHit() { this.play('axe'); }
  public playLevelUp() { this.play('quest'); }
  public playFishBite() { this.play('fish_bite'); }
  public playAnimalSound() { this.playCowMoo(); }

  // ─── PROCEDURAL ANIMAL AMBIENT SOUND SYSTEM (Farm Life Synthesis) ───

  /**
   * Sapi (Cow) - Deep warm bovine moo with formant resonance and vibrato
   */
  public playCowMoo(variation = Math.floor(Math.random() * 3), vol = 0.30) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const durSec = 0.8 + (variation % 3) * 0.1;
      const baseFreq = 120 + ((variation * 17) % 24);

      // Main vocal oscillator (Triangle wave for body warmth)
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.08, t);
      osc.frequency.linearRampToValueAtTime(baseFreq, t + 0.18);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.86, t + durSec);

      // Second harmonic oscillator (Subtle fifth for rich bovine chest resonance)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc2.frequency.linearRampToValueAtTime(baseFreq * 1.3, t + durSec);

      // Vibrato LFO (giving gentle life to vocal cords)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(4.2, t);
      lfoGain.gain.setValueAtTime(4.5, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfoGain.connect(osc2.frequency);

      // Formant Bandpass filter (mouth cavity resonance creating "Moo" shape)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(540, t);
      filter.frequency.linearRampToValueAtTime(430, t + durSec);
      filter.Q.setValueAtTime(3.2, t);

      // Gain Envelope
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, t);
      gainNode.gain.linearRampToValueAtTime(vol, t + 0.14);
      gainNode.gain.setValueAtTime(vol * 0.9, t + durSec * 0.65);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.sfxGain);

      osc.start(t);
      osc2.start(t);
      lfo.start(t);

      osc.stop(t + durSec);
      osc2.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {
      // Audio context silenced
    }
  }

  /**
   * Ayam (Chicken) - Staccato percussive clucks / chirp sweeps "Bok-bok-bawk!"
   */
  public playChickenCluck(variation = Math.floor(Math.random() * 3), vol = 0.22) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const isTriple = variation % 2 === 1;
      const numClucks = isTriple ? 3 : 2;
      const cluckDelays = [0, 0.085, 0.19];
      const cluckFreqs = [
        [560, 310],
        [620, 340],
        [760, 390],
      ];

      for (let i = 0; i < numClucks; i++) {
        const startT = t + cluckDelays[i];
        const durSec = i === numClucks - 1 && isTriple ? 0.11 : 0.065;
        const [startF, endF] = cluckFreqs[i % cluckFreqs.length];

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startF, startT);
        osc.frequency.exponentialRampToValueAtTime(endF, startT + durSec);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, startT);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, startT);
        gain.gain.linearRampToValueAtTime(vol * (i === numClucks - 1 ? 1.0 : 0.75), startT + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + durSec);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startT);
        osc.stop(startT + durSec);
      }
    } catch {
      // Silence
    }
  }

  /**
   * Bebek (Duck) - Nasal harmonic quacks "Kwek-kwek!"
   */
  public playDuckQuack(variation = Math.floor(Math.random() * 3), vol = 0.24) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const quackOffsets = [0, 0.13];
      const quackVols = [vol, vol * 0.72];

      for (let i = 0; i < 2; i++) {
        const startT = t + quackOffsets[i];
        const durSec = i === 0 ? 0.13 : 0.105;
        const baseF = (340 - i * 35) + ((variation * 13) % 25);

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseF * 1.15, startT);
        osc.frequency.linearRampToValueAtTime(baseF * 0.85, startT + durSec);

        // Nasal bandpass filter (creates duck beak acoustic resonance)
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(880 - i * 60, startT);
        filter.Q.setValueAtTime(4.2, startT);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, startT);
        gain.gain.linearRampToValueAtTime(quackVols[i], startT + 0.02);
        gain.gain.setValueAtTime(quackVols[i] * 0.85, startT + durSec * 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + durSec);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startT);
        osc.stop(startT + durSec);
      }
    } catch {
      // Silence
    }
  }

  /**
   * Kambing (Goat) - Signature wobbly rapid vibrato bleat "Mbee-e-e-e!"
   */
  public playGoatBleat(variation = Math.floor(Math.random() * 3), vol = 0.26) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const durSec = 0.52 + (variation % 3) * 0.06;
      const baseFreq = 245 + ((variation * 18) % 35);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq * 1.05, t);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.95, t + durSec);

      // Rapid 14.5Hz Vibrato LFO for signature goat vocal jitter
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(14.5, t);
      lfoGain.gain.setValueAtTime(26, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(740, t);
      filter.Q.setValueAtTime(2.8, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.08);
      gain.gain.setValueAtTime(vol * 0.8, t + durSec * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {
      // Silence
    }
  }

  /**
   * Domba (Sheep) - Soft, fluffy gentle baa with warm low vibrato "Baa-a-a-ah!"
   */
  public playSheepBaa(variation = Math.floor(Math.random() * 3), vol = 0.25) {
    if (!this.enabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    try {
      const t = this.ctx.currentTime;
      const durSec = 0.65 + (variation % 3) * 0.08;
      const baseFreq = 195 + ((variation * 15) % 28);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.06, t);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.92, t + durSec);

      // Gentle 6.8Hz Vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(6.8, t);
      lfoGain.gain.setValueAtTime(11, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(680, t);
      filter.Q.setValueAtTime(2.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.12);
      gain.gain.setValueAtTime(vol * 0.85, t + durSec * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + durSec);
      lfo.stop(t + durSec);
    } catch {
      // Silence
    }
  }

  /**
   * Play appropriate procedural ambient sound for any farm animal species
   */
  public playAnimalAmbient(type: string, options?: { volume?: number; variation?: number }) {
    const variation = options?.variation ?? Math.floor(Math.random() * 5);
    const vol = options?.volume ?? 0.28;

    switch (type.toLowerCase()) {
      case 'sapi':
      case 'cow':
        this.playCowMoo(variation, vol);
        break;
      case 'ayam':
      case 'chicken':
      case 'hen':
        this.playChickenCluck(variation, vol * 0.9);
        break;
      case 'bebek':
      case 'duck':
        this.playDuckQuack(variation, vol * 0.95);
        break;
      case 'kambing':
      case 'goat':
        this.playGoatBleat(variation, vol);
        break;
      case 'domba':
      case 'sheep':
        this.playSheepBaa(variation, vol);
        break;
      default:
        this.playCowMoo(variation, vol * 0.8);
        break;
    }
  }

  /**
   * Play animal ambient sound with per-animal and global cooldown guard.
   * Returns true if sound was successfully emitted.
   */
  public playAnimalAmbientWithCooldown(animalId: string, type: string, minIntervalMs = 7000): boolean {
    if (!this.enabled) return false;
    const now = Date.now();

    // Prevent audio overlap (global cooldown of 1.8s between any animal sounds)
    if (now - this.lastGlobalAnimalSoundTime < 1800) {
      return false;
    }

    // Check specific animal cooldown
    const lastTime = this.animalCooldowns.get(animalId) || 0;
    if (now - lastTime < minIntervalMs) {
      return false;
    }

    this.animalCooldowns.set(animalId, now);
    this.lastGlobalAnimalSoundTime = now;
    this.playAnimalAmbient(type);
    return true;
  }

  /**
   * Helper to get sound text and icon for speech/toast feedback
   */
  public getAnimalSoundQuote(type: string): { text: string; icon: string } {
    switch (type.toLowerCase()) {
      case 'sapi':
      case 'cow':
        return { text: 'Moo-o-o~', icon: '🐮' };
      case 'ayam':
      case 'chicken':
      case 'hen':
        return { text: 'Bok-bok-bawk!', icon: '🐔' };
      case 'bebek':
      case 'duck':
        return { text: 'Kwek-kwek!', icon: '🦆' };
      case 'kambing':
      case 'goat':
        return { text: 'Mbee-e-e~!', icon: '🐐' };
      case 'domba':
      case 'sheep':
        return { text: 'Baa-a-a~!', icon: '🐑' };
      default:
        return { text: 'Suara ternak ramah', icon: '🐾' };
    }
  }
  public playGift() { this.play('gift'); }
  public playEat() { this.playChord([300, 360], 120, 0.16); }

  // ─── AMBIENT BGM HARMONY GENERATOR (from sound.py _ambient_loop) ───
  public playSceneBGM(sceneId: string) {
    if (!this.enabled) return;
    if (this.currentSceneBgm === sceneId && this.bgmIntervalId !== null) return;

    this.stopBGM();
    this.currentSceneBgm = sceneId;

    let category = 'outdoor';
    if (['house', 'shop', 'smith', 'clinic', 'studio'].includes(sceneId)) category = 'indoor';
    else if (['mountain', 'lake', 'greenhouse'].includes(sceneId)) category = 'forest';
    else if (['dungeon', 'naga_cave', 'cemetery'].includes(sceneId)) category = 'cave';

    const loopLengthSec = 16.0;

    const playPhrase = () => {
      if (!this.enabled || !this.ctx || !this.bgmGain) return;

      const t = this.ctx.currentTime;
      if (category === 'outdoor') {
        // G -> C -> D -> G progression (cozy major feel)
        this.scheduleSineChord([43, 50, 55, 59], t + 0.0, 4.0, 0.07);
        this.scheduleSineNote(this.midiToFreq(83), t + 0.5, 1.5, 0.035);
        this.scheduleSineNote(this.midiToFreq(86), t + 2.0, 1.5, 0.035);

        this.scheduleSineChord([48, 55, 60, 64], t + 4.0, 4.0, 0.07);
        this.scheduleSineNote(this.midiToFreq(84), t + 4.5, 1.5, 0.035);
        this.scheduleSineNote(this.midiToFreq(88), t + 6.0, 1.5, 0.035);

        this.scheduleSineChord([50, 57, 62, 66], t + 8.0, 4.0, 0.07);
        this.scheduleSineNote(this.midiToFreq(81), t + 8.5, 1.5, 0.035);
        this.scheduleSineNote(this.midiToFreq(86), t + 10.0, 1.5, 0.035);

        this.scheduleSineChord([43, 50, 55, 59], t + 12.0, 4.0, 0.07);
        this.scheduleSineNote(this.midiToFreq(83), t + 12.5, 1.5, 0.035);
        this.scheduleSineNote(this.midiToFreq(79), t + 14.0, 1.5, 0.035);
      } else if (category === 'forest') {
        // Am9 -> Dm9 ancient mystic forest feel
        this.scheduleSineChord([45, 52, 59, 60, 67], t + 0.0, 8.0, 0.06);
        this.scheduleSineNote(this.midiToFreq(88), t + 2.0, 3.0, 0.025);
        this.scheduleSineNote(this.midiToFreq(95), t + 5.5, 3.0, 0.025);

        this.scheduleSineChord([38, 57, 64, 65, 72], t + 8.0, 8.0, 0.06);
        this.scheduleSineNote(this.midiToFreq(96), t + 10.0, 3.0, 0.025);
        this.scheduleSineNote(this.midiToFreq(93), t + 13.5, 3.0, 0.025);
      } else if (category === 'cave') {
        // Deep fifths & crystal droplets
        this.scheduleSineChord([28, 40, 47], t + 0.0, 8.0, 0.08);
        this.scheduleSineNote(this.midiToFreq(91), t + 3.0, 2.5, 0.02);

        this.scheduleSineChord([33, 45, 52], t + 8.0, 8.0, 0.08);
        this.scheduleSineNote(this.midiToFreq(95), t + 11.0, 2.5, 0.02);
      } else {
        // Indoor cozy wood and tea warmth (Cmaj7 -> Fmaj7)
        this.scheduleSineChord([48, 55, 59, 64], t + 0.0, 8.0, 0.06);
        this.scheduleSineNote(this.midiToFreq(76), t + 2.0, 2.5, 0.02);
        this.scheduleSineNote(this.midiToFreq(79), t + 5.0, 2.5, 0.02);

        this.scheduleSineChord([41, 48, 57, 60], t + 8.0, 8.0, 0.06);
        this.scheduleSineNote(this.midiToFreq(77), t + 10.0, 2.5, 0.02);
        this.scheduleSineNote(this.midiToFreq(72), t + 13.0, 2.5, 0.02);
      }
    };

    this.initContext();
    playPhrase();
    this.bgmIntervalId = window.setInterval(playPhrase, loopLengthSec * 1000);
  }

  private scheduleSineNote(freq: number, startT: number, durSec: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.0001, startT);
      gain.gain.linearRampToValueAtTime(vol, startT + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + durSec);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startT);
      osc.stop(startT + durSec);
    } catch {
      // Silence
    }
  }

  private scheduleSineChord(midiNotes: number[], startT: number, durSec: number, vol: number) {
    const perVol = vol / Math.max(1, midiNotes.length);
    midiNotes.forEach((n) => {
      this.scheduleSineNote(this.midiToFreq(n), startT, durSec, perVol);
    });
  }

  public stopBGM() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentSceneBgm = null;
  }

  // Classic PS2 Golden Era Ambient Chime (Nostalgic console boot harmonic)
  public playPS2Chime() {
    if (!this.enabled) return;
    this.playWave(110.0, 1800, 0.28, 'sine'); // Deep A2 fundamental
    this.playWave(220.0, 1500, 0.22, 'sine'); // A3
    this.playWave(329.63, 1300, 0.18, 'sine'); // E4
    this.playWave(554.37, 1100, 0.14, 'sine'); // C#5
    this.playWave(880.0, 900, 0.08, 'sine');  // Crystal A5
  }

  // PS2 Memory Card Save Written Confirmation
  public playPS2Save() {
    if (!this.enabled) return;
    this.playWave(523.25, 120, 0.25, 'triangle');
    setTimeout(() => this.playWave(659.25, 120, 0.28, 'triangle'), 80);
    setTimeout(() => this.playWave(783.99, 140, 0.30, 'triangle'), 160);
    setTimeout(() => this.playWave(1046.50, 450, 0.32, 'sine'), 240);
  }
}

export const sound = new SoundManager();
