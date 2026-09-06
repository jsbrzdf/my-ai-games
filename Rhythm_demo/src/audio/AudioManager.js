/**
 * AudioManager - Web Audio API Clock, Procedural Instrument Keysounds & Secondary SFX
 * Features 100% real-time synthesized instrument sounds (Keysounds), soft muted miss feedback,
 * celebratory combo milestone chimes, stage clear fanfares, and tactile UI micro-clicks.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.noiseBuffer = null;
    this.isInitialized = false;
    this.masterVolume = 0.85;
    this.musicVolume = 0.70; // Balanced so player hits sit clearly on top
    this.sfxVolume = 0.90;
  }

  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Pre-render 1 second of high-grade white noise for snares & cymbals
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.isInitialized = true;
  }

  get currentTime() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  // =========================================================================
  // 1. DYNAMIC INSTRUMENT HIT SOUNDS (KEYSOUNDS)
  // =========================================================================

  /**
   * Main entry point for hit sound effects
   * @param {'perfect' | 'good' | 'miss'} type
   * @param {number} colorIndex Pad color index (0: Cyan, 1: Pink, 2: Yellow, 3: Purple)
   * @param {object} stage Current track configuration
   * @param {number} beatIndex Sequential beat number
   * @param {boolean} isSingleKey Whether in 1-Key Spacebar pure rhythm mode
   */
  playInstrumentHit(type, colorIndex = 0, stage = null, beatIndex = 0, isSingleKey = false) {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    if (type === 'miss') {
      this.playMissSound();
      return;
    }

    const isPerfect = type === 'perfect';
    const now = this.ctx.currentTime;

    if (isSingleKey) {
      // ---------------------------------------------------------------------
      // 1-KEY MODE: LIVE MELODY & BEAT PERFORMANCE
      // Every hit triggers a punchy acoustic kick + tuned melodic Rhodes/Marimba note
      // ---------------------------------------------------------------------
      const leadScale = (stage && stage.leadScale) || [523.25, 587.33, 659.25, 783.99, 880.00];
      const melodyFreq = leadScale[beatIndex % leadScale.length];

      // 1. Punchy Rhythmic Kick Thump
      this.synthAcousticKick(now, isPerfect ? 0.75 : 0.55);

      // 2. Harmonic Tuned Melody Pluck (Rhodes / Crystal Marimba)
      this.synthMelodicPluck(now, melodyFreq, isPerfect);

    } else {
      // ---------------------------------------------------------------------
      // MULTI-KEY MODE: COLOR-SPECIFIC AUTHENTIC INSTRUMENTS
      // ---------------------------------------------------------------------
      switch (colorIndex % 4) {
        case 0: {
          // Cyan (D / Key 0): Punchy 808 Sub-Bass Kick ("咚")
          const bassScale = (stage && stage.bassNotes) || [65.41, 73.42, 87.31, 98.00];
          const bassFreq = bassScale[Math.floor((beatIndex % 16) / 4) % bassScale.length];
          this.synth808Kick(now, isPerfect, bassFreq);
          break;
        }
        case 1: {
          // Pink (F / Key 1): Crisp Acoustic / Studio Snare ("啪")
          const leadScale = (stage && stage.leadScale) || [587.33, 698.46, 880.00, 1046.50];
          const leadFreq = leadScale[beatIndex % leadScale.length];
          this.synthCrispSnare(now, isPerfect, leadFreq);
          break;
        }
        case 2:
          // Yellow (J / Key 2): Shimmering Sizzle Open Hi-Hat ("嚓")
          this.synthSizzleHat(now, isPerfect);
          break;
        case 3: {
          // Purple (K / Key 3): Soaring Crystal Bell Synth ("叮")
          const leadScale = (stage && stage.leadScale) || [587.33, 698.46, 880.00, 1046.50];
          const freq = leadScale[beatIndex % leadScale.length];
          this.synthCrystalLead(now, freq, isPerfect);
          break;
        }
      }
    }
  }

  /**
   * Compatibility wrapper for existing callers
   */
  playHitSound(type, colorIndex = 0) {
    this.playInstrumentHit(type, colorIndex, null, 0, false);
  }

  // -------------------------------------------------------------------------
  // INSTRUMENT SYNTHESIZERS
  // -------------------------------------------------------------------------

  /**
   * Acoustic Kick for 1-Key rhythmic groove
   */
  synthAcousticKick(time, gainLevel = 0.6) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.17);
  }

  /**
   * Melodic Keysound (Fender Rhodes / Resonant Marimba tone)
   */
  synthMelodicPluck(time, freq, isPerfect = false) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Fundamental sine
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Warm harmonic overtone (slightly detuned for natural chorus)
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.004, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isPerfect ? 4200 : 2600, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.28);

    const baseVol = isPerfect ? 0.70 : 0.50;
    gain.gain.setValueAtTime(baseVol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isPerfect ? 0.35 : 0.24));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.36);
    osc2.stop(time + 0.36);

    // Extra sparkling chime shimmer for PERFECT hits
    if (isPerfect) {
      const sparkle = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(freq * 3, time);
      sparkle.frequency.exponentialRampToValueAtTime(freq * 4, time + 0.12);

      sGain.gain.setValueAtTime(0.25, time);
      sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      sparkle.connect(sGain);
      sGain.connect(this.sfxGain);
      sparkle.start(time);
      sparkle.stop(time + 0.15);
    }
  }

  /**
   * Color 0 (Cyan): Heavy 808 Sub-Bass Kick
   */
  synth808Kick(time, isPerfect = false, bassFreq = null) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Punchy downward sweep
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);

    const vol = isPerfect ? 0.95 : 0.75;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.27);

    // Beater click transient
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'triangle';
    click.frequency.setValueAtTime(450, time);
    click.frequency.exponentialRampToValueAtTime(80, time + 0.02);

    clickGain.gain.setValueAtTime(0.4, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start(time);
    click.stop(time + 0.03);

    // Warm musical sub-chord layer if bassFreq is provided
    if (bassFreq) {
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(bassFreq, time);
      subGain.gain.setValueAtTime(isPerfect ? 0.32 : 0.20, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(time);
      sub.stop(time + 0.25);
    }
  }

  /**
   * Color 1 (Pink): Studio Snare with Crisp Wire Sizzle
   */
  synthCrispSnare(time, isPerfect = false, leadFreq = null) {
    // 1. Snare Shell Body Tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(115, time + 0.07);

    oscGain.gain.setValueAtTime(isPerfect ? 0.65 : 0.45, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(time);
    osc.stop(time + 0.13);

    // 2. Snare Wire Noise Snap
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isPerfect ? 3600 : 3000, time);
      filter.Q.setValueAtTime(1.5, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(isPerfect ? 0.55 : 0.40, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + (isPerfect ? 0.18 : 0.14));

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(time);
      noise.stop(time + 0.19);
    }

    // 3. Melodic rimshot sparkle if leadFreq is provided
    if (leadFreq) {
      const rim = this.ctx.createOscillator();
      const rimGain = this.ctx.createGain();
      rim.type = 'triangle';
      rim.frequency.setValueAtTime(leadFreq, time);
      rimGain.gain.setValueAtTime(isPerfect ? 0.28 : 0.16, time);
      rimGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);
      rim.connect(rimGain);
      rimGain.connect(this.sfxGain);
      rim.start(time);
      rim.stop(time + 0.17);
    }
  }

  /**
   * Color 2 (Yellow): Shimmering Sizzle Open Hi-Hat
   */
  synthSizzleHat(time, isPerfect = false) {
    if (!this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isPerfect ? 7500 : 6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isPerfect ? 0.50 : 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isPerfect ? 0.22 : 0.15));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.23);
  }

  /**
   * Color 3 (Purple): High Resonant Crystal Bell Synth
   */
  synthCrystalLead(time, freq, isPerfect = false) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isPerfect ? 4500 : 3000, time);
    filter.frequency.exponentialRampToValueAtTime(900, time + 0.3);

    const vol = isPerfect ? 0.70 : 0.50;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isPerfect ? 0.38 : 0.26));

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.39);
    osc2.stop(time + 0.39);
  }

  // =========================================================================
  // 2. SECONDARY POLISHED SFX
  // =========================================================================

  /**
   * Soft Muted Wood Tap / Vinyl Knock for Miss
   * Replaces harsh 130Hz sawtooth buzzer with an organic, non-fatiguing thud
   */
  playMissSound() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    // Organic soft low knock
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.08);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.10);

    // Muted hollow tap transient
    const tap = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    const tapFilter = this.ctx.createBiquadFilter();

    tap.type = 'square';
    tap.frequency.setValueAtTime(140, now);

    tapFilter.type = 'lowpass';
    tapFilter.frequency.setValueAtTime(320, now);

    tapGain.gain.setValueAtTime(0.16, now);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    tap.connect(tapFilter);
    tapFilter.connect(tapGain);
    tapGain.connect(this.sfxGain);

    tap.start(now);
    tap.stop(now + 0.06);
  }

  /**
   * Ascending Celebratory Chime for Combo Milestones (10, 25, 50, 100)
   */
  playComboMilestone(combo) {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    let notes = [523.25, 659.25]; // 10 Combo: C5, E5
    let step = 0.07;

    if (combo >= 100) {
      notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      step = 0.055;
    } else if (combo >= 50) {
      notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      step = 0.06;
    } else if (combo >= 25) {
      notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      step = 0.065;
    }

    notes.forEach((freq, idx) => {
      const t = now + idx * step;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.29);
    });
  }

  /**
   * Triumphant Stage Clear Fanfare on Result Screen
   */
  playStageClearFanfare(rank = 'A') {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const isHighRank = rank === 'S+' || rank === 'S' || rank === 'A';
    // Major chord arpeggios
    const chordNotes = isHighRank
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C Major fanfare flourish
      : [440.00, 554.37, 659.25, 880.00]; // A Major finish

    chordNotes.forEach((freq, idx) => {
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);

      const decay = idx === chordNotes.length - 1 ? 1.4 : 0.45;
      gain.gain.setValueAtTime(0.30, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + decay + 0.05);
    });
  }

  /**
   * Tactile Micro-Click for UI Buttons and Stage Selection
   */
  playUiClick() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.012);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.016);
  }

  setVolume(master, music, sfx) {
    if (master !== undefined) {
      this.masterVolume = master;
      if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(master, this.ctx.currentTime);
    }
    if (music !== undefined) {
      this.musicVolume = music;
      if (this.musicGain && this.ctx) this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
    }
    if (sfx !== undefined) {
      this.sfxVolume = sfx;
      if (this.sfxGain && this.ctx) this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
    }
  }
}
