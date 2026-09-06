import * as THREE from 'three';
import { AudioManager } from './audio/AudioManager.js';
import { SynthMusic, TRACKS } from './audio/SynthMusic.js';
import { World } from './scene/World.js';
import { ParticleSystem } from './scene/ParticleSystem.js';
import { TrackManager } from './scene/TrackManager.js';
import { Ball } from './scene/Ball.js';
import { GameEngine } from './game/GameEngine.js';
import { InputHandler } from './game/InputHandler.js';

class App {
  constructor() {
    this.selectedKeys = 2; // Default to 2-Key (★ 推荐黄金律动 Kick & Snare)
    this.selectedTrack = TRACKS[0]; // Default to STAGE 01: Neon Breeze (80 BPM)
    this.activePreviewTrackId = null;

    this.initDOM();
    this.initThreeAndAudio();
    this.bindEvents();

    this.clock = new THREE.Clock();
    this.animate();
  }

  initDOM() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.progressBar = document.getElementById('progress-bar');
    this.scoreDisplay = document.getElementById('score-display');
    this.accuracyDisplay = document.getElementById('accuracy-display');
    this.comboContainer = document.getElementById('combo-container');
    this.comboCount = document.getElementById('combo-count');
    this.judgementText = document.getElementById('judgement-text');
    this.judgementSub = document.getElementById('judgement-sub');
    this.btnPause = document.getElementById('btn-pause');
    this.nextCueBadge = document.getElementById('next-cue-badge');

    // Controls
    this.controlsContainer = document.getElementById('controls-container');
    this.padButtons = [
      document.getElementById('pad-btn-0'),
      document.getElementById('pad-btn-1'),
      document.getElementById('pad-btn-2'),
      document.getElementById('pad-btn-3')
    ];

    // Modals
    this.startModal = document.getElementById('start-modal');
    this.resultModal = document.getElementById('result-modal');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    // Stage Selector DOM
    this.stageCards = document.querySelectorAll('.stage-card');
    this.btnPreviews = document.querySelectorAll('.btn-preview-track');

    // Result fields
    this.resStageName = document.getElementById('result-stage-name');
    this.resRank = document.getElementById('result-rank');
    this.resScore = document.getElementById('res-score');
    this.resMaxCombo = document.getElementById('res-max-combo');
    this.resAccuracy = document.getElementById('res-accuracy');
    this.resPerfect = document.getElementById('res-perfect');
    this.resGood = document.getElementById('res-good');
    this.resMiss = document.getElementById('res-miss');
    this.btnResultHome = document.getElementById('btn-result-home');

    // Pause Modal DOM
    this.pauseModal = document.getElementById('pause-modal');
    this.pauseStageName = document.getElementById('pause-stage-name');
    this.pauseStatScore = document.getElementById('pause-stat-score');
    this.pauseStatCombo = document.getElementById('pause-stat-combo');
    this.pauseStatAccuracy = document.getElementById('pause-stat-accuracy');
    this.btnResumeGame = document.getElementById('btn-resume-game');
    this.btnPauseRestart = document.getElementById('btn-pause-restart');
    this.btnPauseHome = document.getElementById('btn-pause-home');
  }

  initThreeAndAudio() {
    this.audioManager = new AudioManager();
    this.synthMusic = new SynthMusic(this.audioManager);

    this.world = new World(this.canvasContainer);
    this.particles = new ParticleSystem(this.world.scene);
    this.track = new TrackManager(this.world.scene, this.particles);
    this.ball = new Ball(this.world.scene);

    this.engine = new GameEngine(this.audioManager, this.synthMusic, this.track, this.ball);

    this.input = new InputHandler((colorIdx) => {
      this.engine.handleInput(colorIdx);
    });
    this.input.bindOnScreenButtons(this.padButtons);

    // Initial track setup preview with selected stage
    this.engine.setStage(this.selectedTrack, this.selectedKeys);
    this.track.setColorCount(this.selectedKeys);
    const initialPattern = this.synthMusic.getColorPattern(64, this.selectedKeys);
    this.track.generateTrack(64, initialPattern);
    this.ball.reset();
    this.updatePadsLayout(this.selectedKeys);
  }

  bindEvents() {
    // 1. Stage Card Selection
    this.stageCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        // If clicked preview button inside card, don't re-select
        if (e.target.closest('.btn-preview-track')) return;

        this.audioManager.init();
        this.audioManager.playUiClick();

        this.stageCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        const trackId = card.dataset.track;
        if (this.activePreviewTrackId && this.activePreviewTrackId !== trackId) {
          this.stopPreview();
        }
        this.selectedTrack = TRACKS.find(t => t.id === trackId) || TRACKS[0];

        // Update preview in 3D scene
        if (!this.engine.isPlaying) {
          this.engine.setStage(this.selectedTrack, this.selectedKeys);
          const p = this.synthMusic.getColorPattern(64, this.selectedKeys);
          this.track.generateTrack(64, p);
          this.ball.reset();
        }
      });
    });

    // 2. Track Preview Audio Buttons
    this.btnPreviews.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.audioManager.init();
        this.audioManager.playUiClick();
        const trackId = btn.dataset.track;

        if (this.activePreviewTrackId === trackId) {
          // Stop current preview
          this.stopPreview();
        } else {
          // Play preview for this track (instantly stop any previous preview)
          this.stopPreview();
          this.activePreviewTrackId = trackId;
          btn.classList.add('playing');
          const icon = btn.querySelector('.preview-icon');
          const text = btn.querySelector('.preview-text');
          if (icon) icon.textContent = '⏹';
          if (text) text.textContent = '停止';

          this.synthMusic.startPreview(trackId, () => {
            btn.classList.remove('playing');
            const i = btn.querySelector('.preview-icon');
            const t = btn.querySelector('.preview-text');
            if (i) i.textContent = '▶';
            if (t) t.textContent = '试听';
            if (this.activePreviewTrackId === trackId) {
              this.activePreviewTrackId = null;
            }
          });
        }
      });
    });

    // 3. Difficulty selector buttons (Keys)
    const diffButtons = document.querySelectorAll('#diff-selector .option-btn');
    diffButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audioManager.init();
        this.audioManager.playUiClick();

        diffButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedKeys = parseInt(btn.dataset.keys, 10);
        this.updatePadsLayout(this.selectedKeys);

        if (!this.engine.isPlaying) {
          this.engine.setStage(this.selectedTrack, this.selectedKeys);
          const p = this.synthMusic.getColorPattern(64, this.selectedKeys);
          this.track.generateTrack(64, p);
          this.ball.reset();
        }
      });
    });

    // 4. Start & Restart buttons
    this.btnStartGame.addEventListener('click', () => {
      this.audioManager.init();
      this.audioManager.playUiClick();
      this.startGame();
    });
    this.btnRestartGame.addEventListener('click', () => {
      this.audioManager.init();
      this.audioManager.playUiClick();
      this.resultModal.classList.add('hidden');
      this.startGame();
    });

    // 5. Pause controls & modals
    this.btnPause.addEventListener('click', () => this.togglePause());

    if (this.btnResumeGame) {
      this.btnResumeGame.addEventListener('click', () => {
        this.audioManager.init();
        this.audioManager.playUiClick();
        this.resumeGame();
      });
    }

    if (this.btnPauseRestart) {
      this.btnPauseRestart.addEventListener('click', () => {
        this.audioManager.init();
        this.audioManager.playUiClick();
        this.pauseModal.classList.add('hidden');
        this.startGame();
      });
    }

    if (this.btnPauseHome) {
      this.btnPauseHome.addEventListener('click', () => {
        this.audioManager.init();
        this.audioManager.playUiClick();
        this.returnToHome();
      });
    }

    if (this.btnResultHome) {
      this.btnResultHome.addEventListener('click', () => {
        this.audioManager.init();
        this.audioManager.playUiClick();
        this.returnToHome();
      });
    }

    // Keyboard shortcuts: Escape or P to toggle pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.engine.isPlaying) {
          e.preventDefault();
          this.togglePause();
        }
      }
    });

    // 6. Engine Callbacks
    this.engine.onScoreUpdate = (stats) => this.onScoreUpdate(stats);
    this.engine.onJudgement = (data) => this.onJudgement(data);
    this.engine.onProgressUpdate = (progress) => {
      this.progressBar.style.width = `${(progress * 100).toFixed(1)}%`;
    };
    this.engine.onGameEnd = (results) => this.onGameEnd(results);
  }

  togglePause() {
    if (!this.engine.isPlaying) return;
    this.audioManager.init();
    this.audioManager.playUiClick();

    if (this.engine.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    if (!this.engine.isPlaying || this.engine.isPaused) return;
    this.engine.isPaused = true;
    if (this.audioManager.ctx) {
      this.audioManager.ctx.suspend();
    }
    this.btnPause.classList.add('paused');

    // Populate pause stats
    if (this.pauseStageName && this.selectedTrack) {
      this.pauseStageName.textContent = `STAGE ${this.selectedTrack.stageNum} · ${this.selectedTrack.name} (${this.selectedTrack.cnName})`;
    }
    if (this.pauseStatScore) this.pauseStatScore.textContent = this.scoreDisplay.textContent;
    if (this.pauseStatCombo) this.pauseStatCombo.textContent = this.engine.combo;
    if (this.pauseStatAccuracy) this.pauseStatAccuracy.textContent = this.accuracyDisplay.textContent;

    if (this.pauseModal) {
      this.pauseModal.classList.remove('hidden');
    }
  }

  resumeGame() {
    if (!this.engine.isPlaying || !this.engine.isPaused) return;
    if (this.pauseModal) {
      this.pauseModal.classList.add('hidden');
    }
    if (this.audioManager.ctx) {
      this.audioManager.ctx.resume();
    }
    this.engine.isPaused = false;
    this.btnPause.classList.remove('paused');
  }

  returnToHome() {
    if (this.pauseModal) this.pauseModal.classList.add('hidden');
    if (this.resultModal) this.resultModal.classList.add('hidden');
    this.btnPause.classList.remove('paused');

    this.engine.stop();
    this.stopPreview();

    // Reset 3D track preview and ball to initial starting state
    this.engine.setStage(this.selectedTrack, this.selectedKeys);
    const p = this.synthMusic.getColorPattern(64, this.selectedKeys);
    this.track.generateTrack(64, p);
    this.ball.reset();

    // Reset HUD
    this.scoreDisplay.textContent = '000000';
    this.accuracyDisplay.textContent = '100.0%';
    this.comboContainer.classList.add('combo-hidden');
    this.progressBar.style.width = '0%';

    // Open Start Modal (Home Menu)
    this.startModal.classList.remove('hidden');
  }

  stopPreview() {
    this.synthMusic.stopPreview();
    this.btnPreviews.forEach((b) => {
      b.classList.remove('playing');
      const icon = b.querySelector('.preview-icon');
      const text = b.querySelector('.preview-text');
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = '试听';
    });
    this.activePreviewTrackId = null;
  }

  updatePadsLayout(keys) {
    this.input.setKeyCount(keys);

    if (keys === 1) {
      this.controlsContainer.classList.add('mode-single');
      this.padButtons[0].style.display = 'flex';
      this.padButtons[0].classList.add('mode-single-btn');
      this.padButtons[0].querySelector('.pad-key-hint').textContent = 'SPACE';
      this.padButtons[0].querySelector('.pad-color-name').textContent = 'TAP TO THE BEAT · 任意键踩点';
      for (let i = 1; i < 4; i++) {
        this.padButtons[i].style.display = 'none';
      }
    } else if (keys === 2) {
      this.controlsContainer.classList.remove('mode-single');
      this.padButtons[0].classList.remove('mode-single-btn');
      this.controlsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';

      // Pad 0: Cyan Kick (supports Left hand D/S, Right hand J, or ArrowLeft)
      this.padButtons[0].style.display = 'flex';
      this.padButtons[0].querySelector('.pad-key-hint').textContent = 'D / J (←)';
      this.padButtons[0].querySelector('.pad-color-name').textContent = 'KICK · 咚';

      // Pad 1: Pink Snare (supports Left hand F, Right hand K/Space, or ArrowRight)
      this.padButtons[1].style.display = 'flex';
      this.padButtons[1].querySelector('.pad-key-hint').textContent = 'F / K / 空格 (→)';
      this.padButtons[1].querySelector('.pad-color-name').textContent = 'SNARE · 啪';

      this.padButtons[2].style.display = 'none';
      this.padButtons[3].style.display = 'none';
    } else {
      this.controlsContainer.classList.remove('mode-single');
      this.padButtons[0].classList.remove('mode-single-btn');
      this.padButtons[0].querySelector('.pad-key-hint').textContent = 'D';
      this.padButtons[0].querySelector('.pad-color-name').textContent = 'CYAN';
      this.padButtons[1].querySelector('.pad-key-hint').textContent = 'F';
      this.padButtons[1].querySelector('.pad-color-name').textContent = 'PINK';
      this.controlsContainer.style.gridTemplateColumns = `repeat(${keys}, 1fr)`;
      this.padButtons.forEach((btn, idx) => {
        btn.style.display = idx < keys ? 'flex' : 'none';
      });
    }
  }

  startGame() {
    this.stopPreview();
    if (this.pauseModal) this.pauseModal.classList.add('hidden');
    if (this.resultModal) this.resultModal.classList.add('hidden');
    this.startModal.classList.add('hidden');
    this.btnPause.classList.remove('paused');

    this.engine.setStage(this.selectedTrack, this.selectedKeys);
    this.updatePadsLayout(this.selectedKeys);
    this.engine.start();
  }

  onScoreUpdate(stats) {
    this.scoreDisplay.textContent = stats.score.toString().padStart(6, '0');
    this.accuracyDisplay.textContent = `${stats.accuracy.toFixed(1)}%`;

    if (stats.combo > 1) {
      this.comboContainer.classList.remove('combo-hidden');
      this.comboCount.textContent = stats.combo;
      this.comboContainer.style.transform = 'scale(1.2)';
      setTimeout(() => {
        if (this.comboContainer && !this.comboContainer.classList.contains('combo-hidden')) {
          this.comboContainer.style.transform = 'scale(1.0)';
        }
      }, 100);
    } else {
      this.comboContainer.classList.add('combo-hidden');
      this.comboContainer.style.transform = '';
    }
  }

  onJudgement(data) {
    this.judgementText.className = 'judgement-popup';
    void this.judgementText.offsetWidth;

    this.judgementText.textContent = data.customMsg;
    this.judgementText.classList.add(`animate-${data.type}`);

    if (data.type !== 'miss') {
      this.judgementSub.textContent = `+${data.points}`;
      this.judgementSub.style.color = data.color.css;
    } else {
      this.judgementSub.textContent = '';
    }
  }

  onGameEnd(res) {
    if (this.resStageName && res.stage) {
      this.resStageName.textContent = `STAGE ${res.stage.stageNum} · ${res.stage.name} (${res.stage.cnName})`;
    }

    this.resRank.textContent = res.rank;
    this.resScore.textContent = res.score.toLocaleString();
    this.resMaxCombo.textContent = res.maxCombo;
    this.resAccuracy.textContent = `${res.accuracy.toFixed(1)}%`;
    this.resPerfect.textContent = res.perfectCount;
    this.resGood.textContent = res.goodCount;
    this.resMiss.textContent = res.missCount;

    this.resultModal.classList.remove('hidden');
  }

  animate = () => {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.engine.update(delta);

    // Live update Next Cue HUD indicator
    if (this.engine.isPlaying && this.nextCueBadge) {
      if (this.selectedKeys === 1) {
        this.nextCueBadge.textContent = 'SPACE · 踩点';
        this.nextCueBadge.style.color = 'var(--color-cyan)';
        this.nextCueBadge.style.borderColor = 'var(--color-cyan)';
        this.nextCueBadge.style.boxShadow = '0 0 14px var(--color-cyan)';
      } else {
        const gameTime = this.audioManager.currentTime - this.engine.audioStartTime;
        let curIdx = 0;
        const ts = this.engine.timestamps;
        if (ts && ts.length > 0) {
          while (curIdx < ts.length - 1 && ts[curIdx + 1] <= gameTime) {
            curIdx++;
          }
          const nextPad = this.track.getPad(curIdx + 1);
          if (nextPad) {
            if (this.selectedKeys === 2) {
              const cueText = nextPad.colorIndex === 0 ? 'D · KICK (咚)' : 'F · SNARE (啪)';
              this.nextCueBadge.textContent = cueText;
            } else {
              this.nextCueBadge.textContent = `${nextPad.color.key} · ${nextPad.color.name}`;
            }
            this.nextCueBadge.style.color = nextPad.color.css;
            this.nextCueBadge.style.borderColor = nextPad.color.css;
            this.nextCueBadge.style.boxShadow = `0 0 12px ${nextPad.color.css}`;
          }
        }
      }
    }

    const ballZ = this.ball.group.position.z;
    this.track.update(delta, ballZ);
    this.particles.update(delta, ballZ);
    this.world.updateCamera(ballZ, delta);

    this.world.render();
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
