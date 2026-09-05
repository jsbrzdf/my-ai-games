/**
 * Procedural Web Audio API Sound Synthesizer & 8-Bit Chiptune Engine
 * Fully procedural: Zero external MP3/WAV assets required.
 * Features:
 *  - Robust mobile gesture auto-unlock for iOS Safari & Android
 *  - Tactile physical button microswitch click feedback
 *  - Enhanced high-fidelity procedural glass & retro SFX
 *  - Authentic 8-bit Korobeiniki (Tetris Type-A Theme) chiptune BGM
 */

// Note frequency map in Hz
const NOTE_FREQS = {
  REST: 0,
  // Bassline notes
  A1: 55.00, B1: 61.74, C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, 'G#2': 103.83, A2: 110.00,
  B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, 'G#3': 207.65, A3: 220.00,
  // Melody notes
  G4: 392.00, 'G#4': 415.30, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99,
  'G#5': 830.61, A5: 880.00, B5: 987.77, C6: 1046.50
};

// Korobeiniki (Tetris Theme A) Melody Sheet: [note, beats] (quarter note = 1 beat)
const THEME_MELODY = [
  // Section A
  ['E5', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['C5', 0.5], ['B4', 0.5],
  ['A4', 1], ['A4', 0.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
  ['C5', 1], ['A4', 1], ['A4', 1], ['REST', 1],

  ['D5', 1], ['F5', 0.5], ['A5', 1], ['G5', 0.5], ['F5', 0.5],
  ['E5', 1.5], ['C5', 0.5], ['E5', 1], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1], ['B4', 0.5], ['C5', 0.5], ['D5', 1], ['E5', 1],
  ['C5', 1], ['A4', 1], ['A4', 1], ['REST', 1],

  // Section B
  ['E5', 2], ['C5', 2],
  ['D5', 2], ['B4', 2],
  ['C5', 2], ['A4', 2],
  ['G#4', 2], ['B4', 2],

  ['E5', 2], ['C5', 2],
  ['D5', 2], ['B4', 2],
  ['C5', 1], ['E5', 1], ['A5', 2],
  ['G#5', 2], ['REST', 2]
];

// Accompanying 8-Bit Bassline Sheet: [note, beats]
const THEME_BASS = [
  // Section A (repeats walking bass pattern)
  ['E2', 0.5], ['E3', 0.5], ['B2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['A3', 0.5], ['C3', 0.5], ['A3', 0.5],
  ['G#2', 0.5], ['E3', 0.5], ['B2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['C3', 0.5],

  ['D2', 0.5], ['D3', 0.5], ['F2', 0.5], ['D3', 0.5],
  ['C2', 0.5], ['C3', 0.5], ['E2', 0.5], ['C3', 0.5],
  ['B1', 0.5], ['E3', 0.5], ['G#2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E2', 0.5],

  ['D2', 0.5], ['D3', 0.5], ['F2', 0.5], ['D3', 0.5],
  ['C2', 0.5], ['C3', 0.5], ['E2', 0.5], ['C3', 0.5],
  ['B1', 0.5], ['E3', 0.5], ['G#2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E2', 0.5],

  // Section B
  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E3', 0.5],
  ['G#2', 0.5], ['E3', 0.5], ['G#2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E3', 0.5],
  ['E2', 0.5], ['B2', 0.5], ['E2', 0.5], ['B2', 0.5],

  ['A2', 0.5], ['E3', 0.5], ['A2', 0.5], ['E3', 0.5],
  ['G#2', 0.5], ['E3', 0.5], ['G#2', 0.5], ['E3', 0.5],
  ['A2', 0.5], ['C3', 0.5], ['D3', 0.5], ['F3', 0.5],
  ['E3', 1], ['E2', 1], ['REST', 2]
];

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isBgmEnabled = true;
    this.isUnlocked = false;

    // Master bus gain nodes
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    // BGM Sequencer state
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmNextNoteTime = 0;
    this.bgmMelodyIndex = 0;
    this.bgmBassIndex = 0;
    this.bgmMelodyNextTime = 0;
    this.bgmBassNextTime = 0;
    this.bpm = 136; // Classic lively Tetris tempo
  }

  // Lazy-initialize audio context and graph
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX bus
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        // BGM bus (calibrated to blend cleanly with SFX)
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.isBgmEnabled ? 0.22 : 0, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Synchronous mobile unlocker on first touch/click
  unlock() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Play a tiny silent buffer to satisfy iOS Safari strict autoplay policy
    if (!this.isUnlocked) {
      try {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.isUnlocked = true;
      } catch (err) {
        // Ignore fallback errors
      }
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(muted ? 0 : 1, t);
    }
  }

  toggleMute() {
    this.unlock();
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  toggleBgm() {
    this.unlock();
    this.isBgmEnabled = !this.isBgmEnabled;
    if (this.bgmGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.bgmGain.gain.cancelScheduledValues(t);
      this.bgmGain.gain.setValueAtTime(this.isBgmEnabled ? 0.22 : 0, t);
    }
    if (this.isBgmEnabled && !this.bgmPlaying) {
      this.startBgm();
    }
    return this.isBgmEnabled;
  }

  // =========================================================================
  // 0. Tactile Button Microswitch Click Feedback (Physical Handheld Feeling)
  // =========================================================================
  playButtonClick() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Crisp mechanical switch snap: quick pitch drop
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.022);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.025);
  }

  // =========================================================================
  // 1. Move Sound: Crisp high-speed retro blip
  // =========================================================================
  playMove() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.035);

    gain.gain.setValueAtTime(0.26, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    // Warm filter for retro 8-bit blip
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.038);
  }

  // =========================================================================
  // 2. Rotate Sound: Ascending crisp chirp
  // =========================================================================
  playRotate() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.065);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // =========================================================================
  // 3. Drop Sound: Soft drop tactile tick
  // =========================================================================
  playDrop() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.055);
  }

  // =========================================================================
  // 4. Hard Drop: Punchy bass slam + glass impact transient
  // =========================================================================
  playHardDrop() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // Sub-bass punch oscillator
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(190, t);
    bassOsc.frequency.exponentialRampToValueAtTime(45, t + 0.16);

    bassGain.gain.setValueAtTime(0.55, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    bassOsc.connect(bassGain);
    bassGain.connect(this.sfxGain);

    bassOsc.start(t);
    bassOsc.stop(t + 0.18);

    // Glass slap transient
    const slapOsc = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();

    slapOsc.type = 'triangle';
    slapOsc.frequency.setValueAtTime(980, t);
    slapOsc.frequency.exponentialRampToValueAtTime(240, t + 0.04);

    slapGain.gain.setValueAtTime(0.38, t);
    slapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    slapOsc.connect(slapGain);
    slapGain.connect(this.sfxGain);

    slapOsc.start(t);
    slapOsc.stop(t + 0.045);
  }

  // =========================================================================
  // 5. Lock Sound: Solid mechanical glass placement click
  // =========================================================================
  playLock() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(75, t + 0.10);

    gain.gain.setValueAtTime(0.34, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // =========================================================================
  // 6. Procedural Glass Shatter & Crystal Chimes (Physical shattering sound)
  // =========================================================================
  playGlassShatter(lineCount = 1) {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const ctx = this.ctx;
    const count = Math.min(Math.max(lineCount, 1), 4);
    const stagger = count === 1 ? 0 : 0.035;

    for (let r = 0; r < count; r++) {
      const delay = r * stagger + (Math.random() * 0.01 - 0.005);
      const t = ctx.currentTime + Math.max(0, delay);

      // Noise buffer for fracturing glass crack
      const bufferSize = Math.floor(ctx.sampleRate * 0.35);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const p = i / bufferSize;
        let s = (Math.random() * 2 - 1) * Math.exp(-4.0 * p) * 0.5 * Math.sin(0.12 * i);
        s += (Math.random() * 2 - 1) * Math.exp(-6.0 * p) * 0.35 * Math.cos(0.08 * i);
        output[i] = s * (1 - Math.exp(-30 * p)) * 0.45;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuffer;

      // Filter chain to shape glass resonance
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(2200, t);

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(5200, t);
      bandpass.Q.setValueAtTime(2.2, t);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, t);
      masterGain.gain.linearRampToValueAtTime(0.48, t + 0.01);
      masterGain.gain.exponentialRampToValueAtTime(0.005, t + 0.32);

      noiseSrc.connect(highpass);
      highpass.connect(bandpass);
      bandpass.connect(masterGain);
      masterGain.connect(this.sfxGain);

      noiseSrc.start(t);

      // Crystal ringing shards
      const shardCount = 6;
      for (let s = 0; s < shardCount; s++) {
        const osc = ctx.createOscillator();
        const shardGain = ctx.createGain();
        const startT = t + Math.random() * 0.12;
        const freq = 2800 + Math.random() * 5500;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startT);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startT + 0.09);

        shardGain.gain.setValueAtTime(0, startT);
        shardGain.gain.linearRampToValueAtTime(0.045, startT + 0.003);
        shardGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.12);

        osc.connect(shardGain);
        shardGain.connect(this.sfxGain);

        osc.start(startT);
        osc.stop(startT + 0.20);
      }
    }

    // Special crystal chime for Multi-line / Tetris clears
    if (count >= 2) {
      setTimeout(() => {
        if (this.isMuted || !this.ctx || !this.sfxGain) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        osc.type = 'sine';
        const chimeFreq = count >= 4 ? 4186 : 3136; // High C or G
        osc.frequency.setValueAtTime(chimeFreq, t);

        chimeGain.gain.setValueAtTime(0, t);
        chimeGain.gain.linearRampToValueAtTime(0.35, t + 0.03);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

        osc.connect(chimeGain);
        chimeGain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 1.1);
      }, 70);
    }
  }

  // =========================================================================
  // 7. Hold Switch Sound
  // =========================================================================
  playHold() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.09);

    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.095);
  }

  // =========================================================================
  // 8. Level Up Fanfare
  // =========================================================================
  playLevelUp() {
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startT = t + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startT);

      // Lowpass filter for warm 8-bit sound
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, startT);

      gain.gain.setValueAtTime(0, startT);
      gain.gain.linearRampToValueAtTime(0.24, startT + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startT);
      osc.stop(startT + 0.30);
    });
  }

  // =========================================================================
  // 9. Game Over: Classic Descending 8-Bit Arpeggio
  // =========================================================================
  playGameOver() {
    this.stopBgm();
    if (this.isMuted) return;
    this.unlock();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = t + i * 0.13;
      const freq = 440 - i * 70;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startT);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, startT + 0.13);

      gain.gain.setValueAtTime(0.25, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startT);
      osc.stop(startT + 0.16);
    }
  }

  // =========================================================================
  // 10. 8-Bit Chiptune BGM Sequencer (Korobeiniki / 俄罗斯方块经典主题曲)
  // Uses Web Audio API precision look-ahead scheduling (Zero audio drift)
  // =========================================================================
  startBgm() {
    this.unlock();
    if (!this.ctx || !this.bgmGain) return;
    if (this.bgmPlaying) return;

    this.bgmPlaying = true;
    this.bgmMelodyIndex = 0;
    this.bgmBassIndex = 0;

    const now = this.ctx.currentTime + 0.05;
    this.bgmMelodyNextTime = now;
    this.bgmBassNextTime = now;

    this.scheduleBgmLoop();
  }

  pauseBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  resumeBgm() {
    if (!this.isBgmEnabled || this.isMuted) return;
    if (!this.bgmPlaying) {
      this.startBgm();
    }
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmMelodyIndex = 0;
    this.bgmBassIndex = 0;
  }

  scheduleBgmLoop() {
    if (!this.bgmPlaying || !this.ctx || !this.bgmGain) return;

    const lookAhead = 0.25; // Look ahead window in seconds
    const beatDuration = 60 / this.bpm; // 1 beat in seconds
    const scheduleUntil = this.ctx.currentTime + lookAhead;

    // 1. Schedule Melody Notes
    while (this.bgmMelodyNextTime < scheduleUntil) {
      const [noteName, beats] = THEME_MELODY[this.bgmMelodyIndex];
      const duration = beats * beatDuration;
      const freq = NOTE_FREQS[noteName] || 0;

      if (freq > 0) {
        this.playMelodyNote(freq, this.bgmMelodyNextTime, duration * 0.88);
      }

      this.bgmMelodyNextTime += duration;
      this.bgmMelodyIndex = (this.bgmMelodyIndex + 1) % THEME_MELODY.length;
    }

    // 2. Schedule Bass Notes
    while (this.bgmBassNextTime < scheduleUntil) {
      const [noteName, beats] = THEME_BASS[this.bgmBassIndex];
      const duration = beats * beatDuration;
      const freq = NOTE_FREQS[noteName] || 0;

      if (freq > 0) {
        this.playBassNote(freq, this.bgmBassNextTime, duration * 0.80);
      }

      this.bgmBassNextTime += duration;
      this.bgmBassIndex = (this.bgmBassIndex + 1) % THEME_BASS.length;
    }

    // Schedule next scheduler tick in 80ms
    this.bgmTimer = setTimeout(() => this.scheduleBgmLoop(), 80);
  }

  playMelodyNote(freq, time, duration) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // 8-bit Famicom-style square wave with gentle lowpass to prevent harshness
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, time);

    // Chiptune ADSR envelope: punchy attack, slight sustain, clean cutoff
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.015);
    gain.gain.setValueAtTime(0.14, time + duration * 0.6);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }

  playBassNote(freq, time, duration) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Classic 8-bit NES triangle bass channel
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.28, time + 0.01);
    gain.gain.setValueAtTime(0.22, time + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + duration + 0.01);
  }
}

export const soundManager = new SoundManager();
