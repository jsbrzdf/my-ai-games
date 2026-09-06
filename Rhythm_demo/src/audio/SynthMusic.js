/**
 * SynthMusic - 100% Procedural Web Audio Electronic Music Generator
 * Synthesizes complete multi-track EDM soundtracks with millisecond-exact audio-visual synchrony.
 * Color 0 (Cyan): Heavy Kick Drum ("咚")
 * Color 1 (Pink): Crisp Snare Drum ("啪")
 * Color 2 (Yellow): Open Hi-Hat / Splash ("嚓")
 * Color 3 (Purple): High Crystal Synth Lead ("叮")
 */

export const TRACKS = [
  {
    id: 'stage1',
    stageNum: '01',
    name: 'Neon Breeze',
    cnName: '霓虹慢步',
    genre: 'Chillwave / Lo-Fi',
    bpm: 80,
    totalBeats: 64,
    difficulty: 1,
    stars: '★☆☆☆',
    colorHex: '#00f0ff',
    tag: '新手首选',
    desc: '舒适松弛的复古慢摇 · 宽容判定 · 单键 Space 随性踩点',
    bassNotes: [65.41, 73.42, 87.31, 98.00], // C2, D2, F2, G2
    leadScale: [523.25, 587.33, 659.25, 783.99, 880.00] // C5, D5, E5, G5, A5
  },
  {
    id: 'stage2',
    stageNum: '02',
    name: 'Cyber Pulse',
    cnName: '赛博脉冲',
    genre: 'Electro House',
    bpm: 112,
    totalBeats: 96,
    difficulty: 2,
    stars: '★★☆☆',
    colorHex: '#ff007f',
    tag: '律动满分',
    desc: '四四拍经典重低音 · 连击爽快 · 沉浸式赛博蹦迪',
    bassNotes: [73.42, 82.41, 87.31, 110.00], // D2, E2, F2, A2
    leadScale: [587.33, 659.25, 698.46, 880.00, 1046.50] // D5, E5, F5, A5, C6
  },
  {
    id: 'stage3',
    stageNum: '03',
    name: 'Starlight Leap',
    cnName: '星芒跳跃',
    genre: 'Future Bass',
    bpm: 136,
    totalBeats: 112,
    difficulty: 3,
    stars: '★★★☆',
    colorHex: '#ffdf00',
    tag: '进阶挑战',
    desc: '晶莹切分琶音 · 旋律与节拍共鸣 · 手速与技巧进阶',
    bassNotes: [87.31, 98.00, 110.00, 130.81], // F2, G2, A2, C3
    leadScale: [698.46, 783.99, 880.00, 1046.50, 1174.66] // F5, G5, A5, C6, D6
  },
  {
    id: 'stage4',
    stageNum: '04',
    name: 'Overdrive Rush',
    cnName: '极速过载',
    genre: 'Cyber Speedcore',
    bpm: 160,
    totalBeats: 128,
    difficulty: 4,
    stars: '★★★★',
    colorHex: '#b026ff',
    tag: '极限BOSS',
    desc: '极速狂飙 · 强劲失真音头 · 考验极限反应力，冲击 S+ 评级',
    bassNotes: [65.41, 69.30, 73.42, 82.41], // C2, Db2, D2, Eb2
    leadScale: [587.33, 622.25, 783.99, 830.61, 1174.66] // D5, Eb5, G5, Ab5, D6
  }
];

export class SynthMusic {
  constructor(audioManager) {
    this.audio = audioManager;
    this.currentTrack = TRACKS[0];
    this.bpm = this.currentTrack.bpm;
    this.isPlaying = false;
    this.nextBeatTime = 0;
    this.currentBeat = 0;
    this.totalBeats = this.currentTrack.totalBeats;
    this.scheduleTimer = null;
    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.2; // seconds
    this.onBeatCallback = null;

    // Active color sequence for current run
    this.activeColorSequence = [];

    // Preview state
    this.isPreviewPlaying = false;
    this.previewTimer = null;
    this.previewGain = null;
    this.previewStopCallback = null;
  }

  setTrack(trackId) {
    const track = TRACKS.find(t => t.id === trackId) || TRACKS[0];
    this.currentTrack = track;
    this.bpm = track.bpm;
    this.totalBeats = track.totalBeats;
  }

  get secondsPerBeat() {
    return 60.0 / this.bpm;
  }

  setBpm(newBpm) {
    this.bpm = Math.max(60, Math.min(220, newBpm));
  }

  /**
   * Generate a musically rhythmic sequence matching activeKeyCount
   * @param {number} totalBeats
   * @param {number} activeKeyCount 1, 2, 3, or 4
   * @returns {number[]} Array of color indices (0..activeKeyCount - 1)
   */
  getColorPattern(totalBeats, activeKeyCount = 4) {
    const sequence = [];

    // 1-Key: pure single key (Space)
    if (activeKeyCount === 1) {
      for (let i = 0; i < totalBeats; i++) {
        sequence.push(0);
      }
      return sequence;
    }

    // 2-Key (Cyan Kick = 0, Pink Snare = 1) Tailored for each stage genre & BPM
    const stageId = this.currentTrack ? this.currentTrack.id : 'stage1';
    let phrase2 = [
      0, 1, 0, 1,  0, 0, 1, 1,
      0, 1, 0, 1,  0, 1, 1, 0
    ];

    if (stageId === 'stage2') {
      // 112 BPM Electro House - Four-on-the-floor heavy kick & syncopated snares
      phrase2 = [
        0, 0, 1, 0,  0, 1, 0, 1,
        0, 0, 1, 0,  0, 1, 1, 0
      ];
    } else if (stageId === 'stage3') {
      // 136 BPM Future Bass - Syncopated bounce
      phrase2 = [
        0, 0, 1, 0,  1, 0, 0, 1,
        0, 1, 0, 0,  1, 0, 1, 1
      ];
    } else if (stageId === 'stage4') {
      // 160 BPM Speedcore - High energy alternating rolls
      phrase2 = [
        0, 1, 0, 1,  0, 1, 1, 0,
        0, 0, 1, 1,  0, 1, 0, 1
      ];
    }

    // 3-Key (Cyan Kick = 0, Pink Snare = 1, Yellow Hat = 2)
    const phrase3 = [
      0, 1, 2, 1,  0, 2, 1, 2,
      0, 1, 2, 1,  0, 0, 2, 1
    ];

    // 4-Key (Cyan Kick = 0, Pink Snare = 1, Yellow Hat = 2, Purple Lead = 3)
    const phrase4 = [
      0, 1, 2, 1,  0, 3, 1, 3,
      0, 1, 2, 3,  0, 2, 3, 1
    ];

    let basePhrase = phrase4;
    if (activeKeyCount === 2) basePhrase = phrase2;
    else if (activeKeyCount === 3) basePhrase = phrase3;

    for (let i = 0; i < totalBeats; i++) {
      // First 4 beats: gentle intro build
      if (i < 4) {
        sequence.push(i % 2 === 0 ? 0 : (activeKeyCount > 1 ? 1 : 0));
      } else {
        sequence.push(basePhrase[(i - 4) % basePhrase.length] % activeKeyCount);
      }
    }

    return sequence;
  }

  start(startTimeOffset = 0, totalBeats = 128, colorSequence = null) {
    this.audio.init();
    this.stopPreview();

    this.isPlaying = true;
    this.currentBeat = 0;
    this.totalBeats = totalBeats;

    if (colorSequence && colorSequence.length > 0) {
      this.activeColorSequence = colorSequence;
    } else {
      this.activeColorSequence = this.getColorPattern(totalBeats, 4);
    }
    this.isSingleKeyGroove = this.activeColorSequence.every(c => c === 0);

    const startTime = this.audio.currentTime + 0.12;
    this.nextBeatTime = startTime;

    this.scheduler();
    return startTime;
  }

  stop() {
    this.isPlaying = false;
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    this.stopPreview();
  }

  scheduler = () => {
    if (!this.isPlaying) return;

    const ctx = this.audio.ctx;
    while (this.nextBeatTime < ctx.currentTime + this.scheduleAheadTime && this.currentBeat < this.totalBeats) {
      this.scheduleBeat(this.currentBeat, this.nextBeatTime);
      this.nextBeat();
    }

    if (this.currentBeat < this.totalBeats) {
      this.scheduleTimer = setTimeout(this.scheduler, this.lookahead);
    } else {
      this.isPlaying = false;
    }
  };

  nextBeat() {
    this.nextBeatTime += this.secondsPerBeat;
    this.currentBeat++;
  }

  /**
   * Schedule the sound of the beat, strictly corresponding to color
   */
  scheduleBeat(beatIndex, time) {
    const ctx = this.audio.ctx;
    const dest = this.audio.musicGain;

    const activeColor = this.activeColorSequence[beatIndex] !== undefined
      ? this.activeColorSequence[beatIndex]
      : 0;

    const bassScale = this.currentTrack.bassNotes || [73.42, 87.31, 98.00, 110.00];
    const leadScale = this.currentTrack.leadScale || [587.33, 659.25, 783.99, 880.00];

    // 1. Target Color Accent Sound
    if (activeColor === 0) {
      // Color 0 (CYAN): Heavy Bass Kick Drum ("咚")
      this.playDeepKick(ctx, dest, time);
      if (this.isSingleKeyGroove && beatIndex % 2 === 1) {
        this.playCrispSnare(ctx, dest, time);
      }
    } else if (activeColor === 1) {
      // Color 1 (PINK): Crisp Snare Snap ("啪")
      this.playCrispSnare(ctx, dest, time);
    } else if (activeColor === 2) {
      // Color 2 (YELLOW): Bright Open Hi-Hat / Splash ("嚓")
      this.playOpenHiHat(ctx, dest, time);
    } else if (activeColor === 3) {
      // Color 3 (PURPLE): Soaring Crystal Synth Pluck ("叮")
      const pitch = leadScale[beatIndex % leadScale.length];
      this.playCrystalLead(ctx, dest, time, pitch);
    }

    // 2. Ambient Supporting Rhythm (Bass & Groove)
    const bassRoot = bassScale[Math.floor((beatIndex % 16) / 4)];
    this.playSubtleBass(ctx, dest, time + this.secondsPerBeat * 0.5, bassRoot);
    this.playSoftHat(ctx, dest, time + this.secondsPerBeat * 0.5);

    // Warm Chord Pad every 4 beats
    if (beatIndex % 4 === 0) {
      this.playWarmPad(ctx, dest, time, bassRoot * 2);
    }

    if (this.onBeatCallback) {
      this.onBeatCallback(beatIndex, time, activeColor);
    }
  }

  // --- Track Audio Preview Loop ---

  startPreview(trackId, onStop = null) {
    this.stop();
    this.stopPreview();

    this.audio.init();
    const track = TRACKS.find(t => t.id === trackId) || TRACKS[0];
    this.isPreviewPlaying = true;
    this.previewStopCallback = onStop;

    const ctx = this.audio.ctx;
    if (!ctx) return;

    // Create a dedicated isolated audio node exclusively for this preview
    this.previewGain = ctx.createGain();
    this.previewGain.gain.setValueAtTime(0.85, ctx.currentTime);
    this.previewGain.connect(this.audio.musicGain);

    const dest = this.previewGain;
    const spb = 60.0 / track.bpm;
    const previewStartTime = ctx.currentTime + 0.05;

    // Play 16 beats (2 full measures) of rich preview loop
    for (let i = 0; i < 16; i++) {
      const t = previewStartTime + i * spb;
      // Kick on 1 and 3, Snare on 2 and 4
      if (i % 2 === 0) {
        this.playDeepKick(ctx, dest, t);
      } else {
        this.playCrispSnare(ctx, dest, t);
      }
      // Hats on upbeat
      this.playSoftHat(ctx, dest, t + spb * 0.5);
      if (i % 4 === 2) {
        this.playOpenHiHat(ctx, dest, t);
      }
      // Melody note
      const note = track.leadScale[i % track.leadScale.length];
      this.playCrystalLead(ctx, dest, t, note);
      // Bass note
      const bass = track.bassNotes[Math.floor(i / 4)];
      this.playSubtleBass(ctx, dest, t, bass);
    }

    const totalDuration = 16 * spb;
    this.previewTimer = setTimeout(() => {
      this.stopPreview();
    }, totalDuration * 1000);
  }

  stopPreview() {
    this.isPreviewPlaying = false;
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }

    // Immediately silence & disconnect the preview sub-graph
    if (this.previewGain) {
      try {
        const ctx = this.audio.ctx;
        if (ctx) {
          this.previewGain.gain.cancelScheduledValues(ctx.currentTime);
          this.previewGain.gain.setValueAtTime(this.previewGain.gain.value, ctx.currentTime);
          this.previewGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
        }
        const g = this.previewGain;
        setTimeout(() => {
          try {
            g.disconnect();
          } catch (e) {}
        }, 30);
      } catch (e) {
        try {
          this.previewGain.disconnect();
        } catch (e2) {}
      }
      this.previewGain = null;
    }

    // Notify caller that preview stopped
    if (this.previewStopCallback) {
      const cb = this.previewStopCallback;
      this.previewStopCallback = null;
      try {
        cb();
      } catch (e) {}
    }
  }

  // --- Specialized Instruments Matching Colors ---

  /** Color 0 (Cyan): Heavy Kick ("咚") */
  playDeepKick(ctx, dest, time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(175, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.14);

    gain.gain.setValueAtTime(0.95, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.29);
  }

  /** Color 1 (Pink): Snappy Snare ("啪") */
  playCrispSnare(ctx, dest, time) {
    // Body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.08);

    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(oscGain);
    oscGain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.15);

    // Noise snap
    const sizzle = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const sizzleGain = ctx.createGain();

    sizzle.type = 'sawtooth';
    sizzle.frequency.setValueAtTime(3600, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, time);
    filter.Q.setValueAtTime(1.2, time);

    sizzleGain.gain.setValueAtTime(0.38, time);
    sizzleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    sizzle.connect(filter);
    filter.connect(sizzleGain);
    sizzleGain.connect(dest);

    sizzle.start(time);
    sizzle.stop(time + 0.17);
  }

  /** Color 2 (Yellow): Open Hi-Hat / Sizzle ("嚓") */
  playOpenHiHat(ctx, dest, time) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8500, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(6500, time);
    filter.Q.setValueAtTime(0.8, time);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.23);
  }

  /** Color 3 (Purple): High Crystal Synth Lead ("叮") */
  playCrystalLead(ctx, dest, time, freq) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + 0.3);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.33);
    osc2.stop(time + 0.33);
  }

  /** Background Rolling Bass */
  playSubtleBass(ctx, dest, time, freq) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.21);
  }

  /** Background Soft Closed Hat */
  playSoftHat(ctx, dest, time) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(9000, time);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.045);
  }

  /** Warm Ambient Chord Pad */
  playWarmPad(ctx, dest, time, freq) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 1.85);
  }
}
