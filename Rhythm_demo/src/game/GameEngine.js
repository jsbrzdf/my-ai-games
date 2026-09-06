import { COLORS } from '../scene/TrackManager.js';
import { TRACKS } from '../audio/SynthMusic.js';

export class GameEngine {
  constructor(audioManager, synthMusic, trackManager, ball) {
    this.audio = audioManager;
    this.music = synthMusic;
    this.track = trackManager;
    this.ball = ball;

    this.currentTrackConfig = TRACKS[0];
    this.bpm = this.currentTrackConfig.bpm;
    this.totalBeats = this.currentTrackConfig.totalBeats;
    this.activeColorCount = 1; // 1 (Single-key) | 2 | 3 | 4

    this.timestamps = []; // Dynamic timestamps in seconds
    this.isPlaying = false;
    this.isPaused = false;
    this.audioStartTime = 0;

    // Game stats
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.totalHits = 0;

    // Timing windows (seconds) - Generous beginner-friendly tolerance
    this.perfectWindow = 0.100; // +/- 100ms
    this.goodWindow = 0.220;    // +/- 220ms

    // Callbacks for UI updates
    this.onScoreUpdate = null;
    this.onJudgement = null;
    this.onGameEnd = null;
    this.onProgressUpdate = null;

    // Pad status tracker
    this.processedPads = new Set();
  }

  get secondsPerBeat() {
    return 60.0 / this.bpm;
  }

  /**
   * Configure track and difficulty
   * @param {object} trackConfig Item from TRACKS
   * @param {number} colorCount 1, 2, 3, or 4
   */
  setStage(trackConfig, colorCount = 1) {
    this.currentTrackConfig = trackConfig || TRACKS[0];
    this.bpm = this.currentTrackConfig.bpm;
    this.totalBeats = this.currentTrackConfig.totalBeats;
    this.activeColorCount = Math.max(1, Math.min(4, colorCount));

    this.music.setTrack(this.currentTrackConfig.id);
    this.music.setBpm(this.bpm);

    const spb = this.secondsPerBeat;
    this.timestamps = Array.from({ length: this.totalBeats }, (_, i) => Math.round(i * spb * 1000) / 1000);

    this.track.setColorCount(this.activeColorCount);
  }

  start() {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.goodCount = 0;
    this.missCount = 0;
    this.totalHits = 0;
    this.processedPads.clear();

    const spb = this.secondsPerBeat;
    this.timestamps = Array.from({ length: this.totalBeats }, (_, i) => Math.round(i * spb * 1000) / 1000);
    const colorSequence = this.music.getColorPattern(this.totalBeats, this.activeColorCount);

    // Setup 3D track with timestamps & color sequence
    this.track.generateTrack(this.totalBeats, colorSequence, this.timestamps);

    // Initial ball placement at pad 0
    const pad0 = this.track.getPad(0);
    this.ball.reset(pad0 ? pad0.color : COLORS[0]);

    // Start Audio
    this.audioStartTime = this.music.start(0, this.totalBeats, colorSequence);

    this.isPlaying = true;
    this.isPaused = false;

    // Pad 0 is the starting platform
    this.processedPads.add(0);

    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        score: this.score,
        combo: this.combo,
        maxCombo: this.maxCombo,
        accuracy: 100
      });
    }
  }

  stop() {
    this.isPlaying = false;
    this.music.stop();
  }

  /**
   * Handle player input - locates closest unprocessed timestamp
   */
  handleInput(colorIndex) {
    if (!this.isPlaying || this.isPaused || !this.timestamps || this.timestamps.length === 0) return;

    const gameTime = this.audio.currentTime - this.audioStartTime;

    // Find closest upcoming or just-missed pad
    let targetIndex = -1;
    let minDelta = Infinity;

    for (let i = 1; i < this.timestamps.length; i++) {
      if (!this.processedPads.has(i)) {
        const targetTime = this.timestamps[i];
        const dt = Math.abs(gameTime - targetTime);

        if (dt < minDelta) {
          minDelta = dt;
          targetIndex = i;
        }

        // Optimization: if checking way into future, stop
        if (targetTime - gameTime > this.goodWindow * 1.6) break;
      }
    }

    if (targetIndex === -1) return;

    const pad = this.track.getPad(targetIndex);
    if (!pad) return;

    if (minDelta <= this.goodWindow) {
      this.processedPads.add(targetIndex);

      // In 1-key mode, all inputs match color unconditionally!
      const isColorMatch = this.activeColorCount === 1 || colorIndex === pad.colorIndex;

      if (isColorMatch) {
        if (minDelta <= this.perfectWindow) {
          this.recordHit('perfect', pad, targetIndex);
        } else {
          this.recordHit('good', pad, targetIndex);
        }
      } else {
        this.recordHit('miss', pad, targetIndex, 'WRONG COLOR');
      }
    }
  }

  recordHit(type, pad, index, customMsg = null) {
    this.totalHits++;

    let pts = 0;
    let multiplier = 1.0;
    if (this.combo >= 50) multiplier = 2.0;
    else if (this.combo >= 25) multiplier = 1.5;
    else if (this.combo >= 10) multiplier = 1.2;

    const isSingle = this.activeColorCount === 1;

    if (type === 'perfect') {
      this.combo++;
      this.perfectCount++;
      pts = Math.round(1000 * multiplier);
      this.score += pts;
      this.audio.playInstrumentHit('perfect', pad.colorIndex, this.currentTrackConfig, index, isSingle);
      this.track.onPadHit(index, 'perfect');
    } else if (type === 'good') {
      this.combo++;
      this.goodCount++;
      pts = Math.round(600 * multiplier);
      this.score += pts;
      this.audio.playInstrumentHit('good', pad.colorIndex, this.currentTrackConfig, index, isSingle);
      this.track.onPadHit(index, 'good');
    } else {
      this.combo = 0;
      this.missCount++;
      this.audio.playInstrumentHit('miss', pad.colorIndex, this.currentTrackConfig, index, isSingle);
      this.track.onPadHit(index, 'miss');
    }

    // Check celebratory combo milestone chimes
    if (type !== 'miss' && (this.combo === 10 || this.combo === 25 || this.combo === 50 || this.combo === 100 || (this.combo > 100 && this.combo % 50 === 0))) {
      this.audio.playComboMilestone(this.combo);
    }

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    const accuracy = this.calculateAccuracy();

    if (this.onJudgement) {
      this.onJudgement({
        type,
        points: pts,
        combo: this.combo,
        customMsg: customMsg || (type === 'perfect' ? 'PERFECT!' : (type === 'good' ? 'GOOD' : 'MISS')),
        color: pad.color
      });
    }

    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        score: this.score,
        combo: this.combo,
        maxCombo: this.maxCombo,
        accuracy
      });
    }
  }

  calculateAccuracy() {
    if (this.totalHits === 0) return 100.0;
    const weighted = (this.perfectCount * 1.0 + this.goodCount * 0.6) / this.totalHits;
    return Math.round(weighted * 1000) / 10;
  }

  /**
   * Main game loop update - uses dynamic timestamp interpolation
   */
  update(delta) {
    if (!this.isPlaying || this.isPaused || !this.timestamps || this.timestamps.length < 2) return;

    const gameTime = this.audio.currentTime - this.audioStartTime;
    const lastTimestamp = this.timestamps[this.timestamps.length - 1];

    // Finish game when reaching end of track
    if (gameTime >= lastTimestamp + 1.0) {
      this.finishGame();
      return;
    }

    // Locate current timestamp interval [curIndex, curIndex + 1]
    let curIndex = 0;
    while (curIndex < this.timestamps.length - 1 && this.timestamps[curIndex + 1] <= gameTime) {
      curIndex++;
    }

    const tCurrent = this.timestamps[curIndex];
    const nextIndex = Math.min(this.timestamps.length - 1, curIndex + 1);
    const tNext = this.timestamps[nextIndex];
    const interval = Math.max(0.01, tNext - tCurrent);

    let progress = 0;
    if (gameTime < this.timestamps[0]) {
      progress = Math.max(0, gameTime / Math.max(0.1, this.timestamps[0]));
    } else {
      progress = Math.max(0, Math.min(1.0, (gameTime - tCurrent) / interval));
    }

    const fromPad = this.track.getPad(curIndex);
    const toPad = this.track.getPad(nextIndex);

    const startZ = fromPad ? fromPad.z : 0;
    const targetZ = toPad ? toPad.z : (startZ + this.track.stepDist);

    // Update ball parabolic arc across the dynamic distance
    this.ball.updateArc(progress, startZ, targetZ, toPad ? toPad.color : null);

    // Auto-miss detection for any passed timestamps
    for (let i = 1; i <= curIndex; i++) {
      if (!this.processedPads.has(i) && i < this.timestamps.length) {
        const landingTime = this.timestamps[i];
        if (gameTime > landingTime + this.goodWindow) {
          this.processedPads.add(i);
          const pad = this.track.getPad(i);
          if (pad) {
            this.recordHit('miss', pad, i, 'MISSED');
          }
        }
      }
    }

    if (this.onProgressUpdate) {
      const totalDuration = lastTimestamp + 0.5;
      const p = Math.min(1.0, gameTime / totalDuration);
      this.onProgressUpdate(p, gameTime, totalDuration);
    }
  }

  finishGame() {
    this.stop();
    const finalAccuracy = this.calculateAccuracy();

    let rank = 'C';
    if (finalAccuracy >= 98 && this.missCount === 0) rank = 'S+';
    else if (finalAccuracy >= 95) rank = 'S';
    else if (finalAccuracy >= 90) rank = 'A';
    else if (finalAccuracy >= 80) rank = 'B';

    // Play triumphant stage clear fanfare
    this.audio.playStageClearFanfare(rank);

    if (this.onGameEnd) {
      this.onGameEnd({
        score: this.score,
        maxCombo: this.maxCombo,
        perfectCount: this.perfectCount,
        goodCount: this.goodCount,
        missCount: this.missCount,
        accuracy: finalAccuracy,
        rank,
        stage: this.currentTrackConfig
      });
    }
  }
}
