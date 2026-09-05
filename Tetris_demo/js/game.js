/**
 * Glass Tetris Main Game Controller & Multi-Theme DOM Renderer
 * Supports: SUP Retro Red Handheld (Default), Clear GameBoy, and Desktop Arcade
 */

import {
  BOARD_COLS,
  BOARD_ROWS,
  TETROMINOES,
  LINE_POINTS,
  LEVEL_SPEEDS
} from './constants.js';
import { Board } from './board.js';
import { ParticleSystem } from './particles.js';
import { soundManager } from './audio.js';
import { Storage } from './storage.js';
import { InputHandler } from './input.js';

class TetrisGame {
  constructor() {
    this.board = new Board();
    this.storage = Storage;

    // View Mode: 'sup' | 'gb' | 'desktop'
    this.viewMode = 'sup';

    // 1. SUP Retro Red Handheld DOM Elements
    this.supBoardEl = document.getElementById('sup-tetris-board');
    this.supScreenEl = document.getElementById('sup-screen-housing');
    this.supParticleCanvas = document.getElementById('sup-particle-canvas');
    this.supNextBoxEl = document.getElementById('sup-next-box');
    this.supHoldBoxEl = document.getElementById('sup-hold-box');
    this.supScoreEl = document.getElementById('sup-score');
    this.supLevelEl = document.getElementById('sup-level');
    this.supLinesEl = document.getElementById('sup-lines');
    this.supPauseModal = document.getElementById('sup-pause-modal');
    this.supGameoverModal = document.getElementById('sup-gameover-modal');
    this.supFinalScoreEl = document.getElementById('sup-final-score');
    this.supResumeBtn = document.getElementById('sup-resume-btn');
    this.supRetryBtn = document.getElementById('sup-retry-btn');
    this.supPauseBgmBtn = document.getElementById('sup-pause-bgm-btn');

    // 2. Desktop Arcade DOM Elements
    this.dtBoardEl = document.getElementById('dt-tetris-board');
    this.dtScreenEl = document.getElementById('dt-game-frame');
    this.dtParticleCanvas = document.getElementById('dt-particle-canvas');
    this.dtNextBoxEl = document.getElementById('dt-next-box');
    this.dtHoldBoxEl = document.getElementById('dt-hold-box');
    this.dtScoreEl = document.getElementById('dt-score-display');
    this.dtHighEl = document.getElementById('dt-high-score-display');
    this.dtLinesEl = document.getElementById('dt-lines-display');
    this.dtLevelEl = document.getElementById('dt-level-display');
    this.dtPauseModal = document.getElementById('dt-pause-modal');
    this.dtGameoverModal = document.getElementById('dt-gameover-modal');
    this.dtFinalScoreEl = document.getElementById('dt-final-score');
    this.dtResumeBtn = document.getElementById('dt-resume-btn');
    this.dtRetryBtn = document.getElementById('dt-retry-btn');
    this.dtPauseBgmBtn = document.getElementById('dt-pause-bgm-btn');

    // Top Navigation
    this.viewModeBtn = document.getElementById('view-mode-btn');
    this.modeText = document.getElementById('mode-text');
    this.soundBtn = document.getElementById('sound-btn');
    this.soundIconOn = document.getElementById('sound-icon-on');
    this.soundIconOff = document.getElementById('sound-icon-off');
    this.pauseBtn = document.getElementById('pause-btn');
    this.pauseIcon = document.getElementById('pause-icon');
    this.playIcon = document.getElementById('play-icon');
    this.restartBtn = document.getElementById('restart-btn');

    // Systems
    this.particles = new ParticleSystem([
      this.supParticleCanvas,
      this.dtParticleCanvas
    ]);
    this.input = new InputHandler(this);

    // Game state
    this.bag = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.heldPiece = null;
    this.canHold = true;

    this.score = 0;
    this.highScore = this.storage.getHighScore();
    this.level = 1;
    this.lines = 0;

    this.isRunning = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.clearingLines = [];

    this.dropTimer = null;

    this.initAudioState();
    this.buildGridDoms();
    this.bindUiEvents();
    this.updateThemeClass();
    this.calculateDynamicCellSizes();
    this.start();
  }

  initAudioState() {
    const isMuted = this.storage.getSoundMuted();
    soundManager.setMuted(isMuted);
    this.updateSoundIcons(isMuted);

    const isBgmEnabled = this.storage.getBgmEnabled();
    soundManager.isBgmEnabled = isBgmEnabled;
    this.updateBgmButtons(isBgmEnabled);
  }

  updateSoundIcons(isMuted) {
    if (isMuted) {
      this.soundIconOn.classList.add('hidden');
      this.soundIconOff.classList.remove('hidden');
    } else {
      this.soundIconOn.classList.remove('hidden');
      this.soundIconOff.classList.add('hidden');
    }
  }

  toggleMute() {
    const muted = soundManager.toggleMute();
    this.storage.saveSoundMuted(muted);
    this.updateSoundIcons(muted);
  }

  toggleBgm() {
    const enabled = soundManager.toggleBgm();
    this.storage.saveBgmEnabled(enabled);
    this.updateBgmButtons(enabled);
  }

  updateBgmButtons(enabled) {
    const text = enabled ? '🎵 背景音乐: 开' : '🔇 背景音乐: 关';
    if (this.supPauseBgmBtn) this.supPauseBgmBtn.textContent = text;
    if (this.dtPauseBgmBtn) this.dtPauseBgmBtn.textContent = text;
  }

  cycleViewMode() {
    if (this.viewMode === 'sup') {
      this.viewMode = 'desktop';
      this.modeText.textContent = '🖥️ 街机模式';
    } else {
      this.viewMode = 'sup';
      this.modeText.textContent = '🔴 SUP 掌机';
    }

    this.updateThemeClass();
    this.calculateDynamicCellSizes();
    this.render();

    // Render previews across all boxes
    this.renderPreview(this.supNextBoxEl, this.nextPiece);
    this.renderPreview(this.supHoldBoxEl, this.heldPiece);
    this.renderPreview(this.dtNextBoxEl, this.nextPiece);
    this.renderPreview(this.dtHoldBoxEl, this.heldPiece);
  }

  updateThemeClass() {
    document.body.classList.remove('mode-sup', 'mode-desktop');
    document.body.classList.add(`mode-${this.viewMode}`);
  }

  calculateDynamicCellSizes() {
    // SUP Handheld Board Size
    const supMatrix = document.querySelector('.sup-matrix-center');
    if (supMatrix) {
      const h = supMatrix.clientHeight;
      const w = supMatrix.clientWidth;
      if (h > 0) {
        const sizeFromH = Math.floor((h - 8) / 20);
        const sizeFromW = w > 0 ? Math.floor((w - 8) / 10) : sizeFromH;
        const size = Math.max(11, Math.min(sizeFromH, sizeFromW));
        document.documentElement.style.setProperty('--sup-cell-size', `${size}px`);
      }
    }

    this.particles.resizeAll();
  }

  buildGridDoms() {
    this.supGridCells = [];
    this.dtGridCells = [];

    const setupBoard = (boardEl, cellMatrix) => {
      if (!boardEl) return;
      boardEl.innerHTML = '';
      for (let r = 0; r < BOARD_ROWS; r++) {
        cellMatrix[r] = [];
        for (let c = 0; c < BOARD_COLS; c++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          boardEl.appendChild(cell);
          cellMatrix[r][c] = cell;
        }
      }
    };

    setupBoard(this.supBoardEl, this.supGridCells);
    setupBoard(this.dtBoardEl, this.dtGridCells);
  }

  bindUiEvents() {
    this.viewModeBtn.addEventListener('click', () => this.cycleViewMode());
    this.soundBtn.addEventListener('click', () => this.toggleMute());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.restartBtn.addEventListener('click', () => this.restart());

    // Resume buttons
    this.supResumeBtn?.addEventListener('click', () => this.togglePause());
    this.dtResumeBtn?.addEventListener('click', () => this.togglePause());

    // Pause restart buttons
    document.getElementById('sup-pause-restart-btn')?.addEventListener('click', () => {
      this.togglePause();
      this.restart();
    });
    document.getElementById('dt-pause-restart-btn')?.addEventListener('click', () => {
      this.togglePause();
      this.restart();
    });

    // Pause BGM toggle buttons
    this.supPauseBgmBtn?.addEventListener('click', () => this.toggleBgm());
    this.dtPauseBgmBtn?.addEventListener('click', () => this.toggleBgm());

    // Retry buttons
    this.supRetryBtn?.addEventListener('click', () => this.restart());
    this.dtRetryBtn?.addEventListener('click', () => this.restart());

    window.addEventListener('resize', () => {
      this.calculateDynamicCellSizes();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.calculateDynamicCellSizes(), 150);
    });

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        this.calculateDynamicCellSizes();
      });
      const supMatrix = document.querySelector('.sup-matrix-center');
      if (supMatrix) ro.observe(supMatrix);
    }
  }

  getNextPieceFromBag() {
    if (this.bag.length === 0) {
      const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      this.bag = pieces;
    }

    const type = this.bag.pop();
    const template = TETROMINOES[type];
    const shape = template.shape.map(row => [...row]);

    return {
      type,
      name: template.name,
      color: template.color,
      shape,
      x: Math.floor((BOARD_COLS - shape[0].length) / 2),
      y: 0
    };
  }

  start() {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = this.storage.getHighScore();
    this.isGameOver = false;
    this.isPaused = false;
    this.isRunning = true;
    this.clearingLines = [];
    this.heldPiece = null;
    this.canHold = true;
    this.bag = [];

    // Hide all modals
    this.supPauseModal?.classList.add('hidden');
    this.dtPauseModal?.classList.add('hidden');

    this.supGameoverModal?.classList.add('hidden');
    this.dtGameoverModal?.classList.add('hidden');

    this.pauseIcon.classList.remove('hidden');
    this.playIcon.classList.add('hidden');

    this.currentPiece = this.getNextPieceFromBag();
    this.nextPiece = this.getNextPieceFromBag();

    this.calculateDynamicCellSizes();
    this.updateStatsDisplay();

    // Render previews
    this.renderPreview(this.supNextBoxEl, this.nextPiece);
    this.renderPreview(this.supHoldBoxEl, null);
    this.renderPreview(this.dtNextBoxEl, this.nextPiece);
    this.renderPreview(this.dtHoldBoxEl, null);

    this.render();
    this.resetDropTimer();
    soundManager.startBgm();
  }

  resetDropTimer() {
    if (this.dropTimer) clearInterval(this.dropTimer);
    if (!this.isRunning || this.isPaused || this.isGameOver) return;

    const speed = LEVEL_SPEEDS[this.level] || 100;
    this.dropTimer = setInterval(() => {
      if (this.clearingLines.length === 0) {
        this.tick();
      }
    }, speed);
  }

  tick() {
    if (!this.currentPiece) return;

    if (this.board.isValidMove(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.render();
    } else {
      this.commitPiece();
    }
  }

  moveLeft() {
    if (!this.canMove()) return;
    if (this.board.isValidMove(this.currentPiece, -1, 0)) {
      this.currentPiece.x--;
      soundManager.playMove();
      this.render();
    }
  }

  moveRight() {
    if (!this.canMove()) return;
    if (this.board.isValidMove(this.currentPiece, 1, 0)) {
      this.currentPiece.x++;
      soundManager.playMove();
      this.render();
    }
  }

  rotate() {
    if (!this.canMove()) return;
    if (this.board.rotatePiece(this.currentPiece)) {
      soundManager.playRotate();
      this.render();
    }
  }

  softDrop() {
    if (!this.canMove()) return;
    if (this.board.isValidMove(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score += 1;
      this.updateStatsDisplay();
      soundManager.playDrop();
      this.render();
    } else {
      this.commitPiece();
    }
  }

  hardDrop() {
    if (!this.canMove()) return;
    const ghostY = this.board.getGhostY(this.currentPiece);
    const dropDistance = ghostY - this.currentPiece.y;
    this.currentPiece.y = ghostY;
    this.score += dropDistance * 2;
    this.updateStatsDisplay();
    soundManager.playHardDrop();
    this.render();
    this.commitPiece(true);
  }

  holdPiece() {
    if (!this.canMove() || !this.canHold) return;

    soundManager.playHold();
    this.canHold = false;

    if (!this.heldPiece) {
      this.heldPiece = {
        type: this.currentPiece.type,
        name: this.currentPiece.name,
        color: this.currentPiece.color
      };
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.getNextPieceFromBag();
    } else {
      const temp = this.heldPiece;
      this.heldPiece = {
        type: this.currentPiece.type,
        name: this.currentPiece.name,
        color: this.currentPiece.color
      };
      const template = TETROMINOES[temp.type];
      this.currentPiece = {
        type: temp.type,
        name: template.name,
        color: template.color,
        shape: template.shape.map(r => [...r]),
        x: Math.floor((BOARD_COLS - template.shape[0].length) / 2),
        y: 0
      };
    }

    this.renderPreview(this.supHoldBoxEl, this.heldPiece);
    this.renderPreview(this.supNextBoxEl, this.nextPiece);
    this.renderPreview(this.dtHoldBoxEl, this.heldPiece);
    this.renderPreview(this.dtNextBoxEl, this.nextPiece);
    this.render();
  }

  canMove() {
    return this.isRunning && !this.isPaused && !this.isGameOver && this.clearingLines.length === 0;
  }

  getActiveScreenElement() {
    if (this.viewMode === 'sup') return this.supScreenEl;
    return this.dtScreenEl;
  }

  getActiveBoardElement() {
    if (this.viewMode === 'sup') return this.supBoardEl;
    return this.dtBoardEl;
  }

  commitPiece(fromHardDrop = false) {
    if (!fromHardDrop) {
      soundManager.playLock();
    }
    this.board.lockPiece(this.currentPiece);
    this.canHold = true;

    const completed = this.board.getCompletedLines();

    if (completed.length > 0) {
      this.clearingLines = completed;
      this.render();

      // Shake & flash active frame
      const activeScreen = this.getActiveScreenElement();
      if (activeScreen) {
        activeScreen.classList.remove('screen-shake', 'screen-flash');
        void activeScreen.offsetWidth;
        activeScreen.classList.add('screen-shake', 'screen-flash');
      }

      // Explode glass shards
      const activeBoard = this.getActiveBoardElement();
      this.particles.explodeLines(completed, this.board.grid, activeBoard);
      soundManager.playGlassShatter(completed.length);

      // Scoring
      const points = (LINE_POINTS[completed.length] || 100) * (this.level + 1);
      this.score += points;
      this.lines += completed.length;

      const newLevel = Math.min(10, Math.floor(this.lines / 10) + 1);
      if (newLevel > this.level) {
        this.level = newLevel;
        soundManager.playLevelUp();
        this.resetDropTimer();
      }

      this.updateStatsDisplay();

      setTimeout(() => {
        this.board.removeLines(this.clearingLines);
        this.clearingLines = [];
        this.spawnNext();
      }, 300);
    } else {
      this.spawnNext();
    }
  }

  spawnNext() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.getNextPieceFromBag();

    this.renderPreview(this.supNextBoxEl, this.nextPiece);
    this.renderPreview(this.dtNextBoxEl, this.nextPiece);

    if (this.board.isSpawnBlocked(this.currentPiece)) {
      this.gameOver();
      return;
    }

    this.render();
  }

  gameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    if (this.dropTimer) clearInterval(this.dropTimer);

    soundManager.stopBgm();
    soundManager.playGameOver();

    const finalHigh = this.storage.saveHighScore(this.score);
    this.highScore = finalHigh;

    const scoreStr = this.score.toLocaleString();
    const highStr = this.highScore.toLocaleString();
    const supScoreStr = String(this.score).padStart(6, '0');
    const supHighStr = String(this.highScore).padStart(6, '0');

    if (this.supFinalScoreEl) this.supFinalScoreEl.textContent = supScoreStr;
    if (this.supFinalHighScoreEl) this.supFinalHighScoreEl.textContent = supHighStr;
    if (this.dtFinalScoreEl) this.dtFinalScoreEl.textContent = scoreStr;
    if (this.dtFinalHighScoreEl) this.dtFinalHighScoreEl.textContent = highStr;

    if (this.viewMode === 'sup') {
      this.supGameoverModal?.classList.remove('hidden');
    } else {
      this.dtGameoverModal?.classList.remove('hidden');
    }
  }

  togglePause() {
    if (!this.isRunning || this.isGameOver) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.dropTimer) clearInterval(this.dropTimer);
      soundManager.pauseBgm();
      if (this.viewMode === 'sup') {
        this.supPauseModal?.classList.remove('hidden');
      } else {
        this.dtPauseModal?.classList.remove('hidden');
      }
      this.pauseIcon.classList.add('hidden');
      this.playIcon.classList.remove('hidden');
    } else {
      this.supPauseModal?.classList.add('hidden');
      this.dtPauseModal?.classList.add('hidden');
      this.pauseIcon.classList.remove('hidden');
      this.playIcon.classList.add('hidden');
      soundManager.resumeBgm();
      this.resetDropTimer();
    }
  }

  restart() {
    if (this.dropTimer) clearInterval(this.dropTimer);
    soundManager.stopBgm();
    this.particles.clear();
    this.start();
  }

  updateStatsDisplay() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.storage.saveHighScore(this.score);
    }

    // 1. SUP Handheld Retro Digital Formatting (Matching Reference Image)
    if (this.supScoreEl) this.supScoreEl.textContent = String(this.score).padStart(6, '0');
    if (this.supLevelEl) this.supLevelEl.textContent = String(this.level).padStart(2, '0');
    if (this.supLinesEl) this.supLinesEl.textContent = String(this.lines).padStart(3, '0');

    // 2. Desktop Formatting
    const scoreStr = this.score.toLocaleString();
    const highStr = this.highScore.toLocaleString();
    const linesStr = this.lines.toString();
    const levelStr = this.level.toString();

    if (this.dtScoreEl) this.dtScoreEl.textContent = scoreStr;
    if (this.dtHighEl) this.dtHighEl.textContent = highStr;
    if (this.dtLinesEl) this.dtLinesEl.textContent = linesStr;
    if (this.dtLevelEl) this.dtLevelEl.textContent = levelStr;
  }

  renderPreview(containerEl, piece) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    if (!piece) return;

    const template = TETROMINOES[piece.type];
    const shape = template.shape;
    const color = template.color;

    const offsetRow = Math.floor((4 - shape.length) / 2);
    const offsetCol = Math.floor((4 - shape[0].length) / 2);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';

        const shapeR = r - offsetRow;
        const shapeC = c - offsetCol;

        if (
          shapeR >= 0 &&
          shapeR < shape.length &&
          shapeC >= 0 &&
          shapeC < shape[shapeR].length &&
          shape[shapeR][shapeC]
        ) {
          const block = document.createElement('div');
          block.className = `glass-block glass-${color}`;
          cell.appendChild(block);
        }

        containerEl.appendChild(cell);
      }
    }
  }

  render() {
    const ghostY = this.currentPiece ? this.board.getGhostY(this.currentPiece) : 0;
    const grid = this.board.grid;

    const targetGrids = [
      { boardEl: this.supBoardEl, cells: this.supGridCells },
      { boardEl: this.dtBoardEl, cells: this.dtGridCells }
    ];

    for (const { boardEl, cells } of targetGrids) {
      if (!boardEl || !cells || cells.length === 0) continue;

      for (let r = 0; r < BOARD_ROWS; r++) {
        const isLineClearing = this.clearingLines.includes(r);

        for (let c = 0; c < BOARD_COLS; c++) {
          const cellEl = cells[r][c];
          if (!cellEl) continue;
          cellEl.innerHTML = '';

          let blockType = null;
          let blockColor = null;

          // 1. Locked blocks
          if (grid[r][c].filled) {
            blockType = isLineClearing ? 'clearing' : 'locked';
            blockColor = grid[r][c].color;
          }

          // 2. Ghost piece
          if (
            !blockType &&
            this.currentPiece &&
            ghostY !== this.currentPiece.y
          ) {
            const pR = r - ghostY;
            const pC = c - this.currentPiece.x;
            if (
              pR >= 0 &&
              pR < this.currentPiece.shape.length &&
              pC >= 0 &&
              pC < this.currentPiece.shape[pR].length &&
              this.currentPiece.shape[pR][pC]
            ) {
              blockType = 'ghost';
              blockColor = this.currentPiece.color;
            }
          }

          // 3. Active piece (with intense neon outer bloom)
          if (this.currentPiece) {
            const pR = r - this.currentPiece.y;
            const pC = c - this.currentPiece.x;
            if (
              pR >= 0 &&
              pR < this.currentPiece.shape.length &&
              pC >= 0 &&
              pC < this.currentPiece.shape[pR].length &&
              this.currentPiece.shape[pR][pC]
            ) {
              blockType = 'active';
              blockColor = this.currentPiece.color;
            }
          }

          if (blockType) {
            const block = document.createElement('div');
            if (blockType === 'ghost') {
              block.className = `glass-block glass-ghost glass-${blockColor}`;
            } else if (blockType === 'clearing') {
              block.className = `glass-block glass-${blockColor} glass-clearing`;
            } else if (blockType === 'active') {
              block.className = `glass-block glass-${blockColor} glass-active`;
            } else {
              block.className = `glass-block glass-${blockColor}`;
            }
            cellEl.appendChild(block);
          }
        }
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tetrisGame = new TetrisGame();
});
