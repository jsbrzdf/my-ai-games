/**
 * Input Handler with DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate)
 * and Complete Touch Bindings with Instant Audio Unlock & Tactile Feedback
 */

import { INPUT_TIMING } from './constants.js';
import { soundManager } from './audio.js';

export class InputHandler {
  constructor(game) {
    this.game = game;
    this.keyState = new Set();
    this.repeatTimers = new Map();

    // Global user interaction triggers to synchronously unlock Web Audio on iOS/Android
    const unlockAudio = () => soundManager.unlock();
    ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockAudio, { passive: true });
    });

    this.bindKeyboard();
    this.bindSupHandheldControls();
  }

  startRepeat(actionName, callback) {
    if (this.repeatTimers.has(actionName)) return;

    callback();
    if (navigator.vibrate) navigator.vibrate(8);

    const timeout = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        if (this.game.isRunning && !this.game.isPaused) {
          callback();
          if (navigator.vibrate) navigator.vibrate(5);
        }
      }, INPUT_TIMING.ARR);

      this.repeatTimers.set(actionName, { timeout: null, interval });
    }, INPUT_TIMING.DAS);

    this.repeatTimers.set(actionName, { timeout, interval: null });
  }

  stopRepeat(actionName) {
    const timer = this.repeatTimers.get(actionName);
    if (timer) {
      if (timer.timeout) window.clearTimeout(timer.timeout);
      if (timer.interval) window.clearInterval(timer.interval);
      this.repeatTimers.delete(actionName);
    }
  }

  stopAllRepeats() {
    this.repeatTimers.forEach(timer => {
      if (timer.timeout) window.clearTimeout(timer.timeout);
      if (timer.interval) window.clearInterval(timer.interval);
    });
    this.repeatTimers.clear();
    this.keyState.clear();
  }

  bindKeyboard() {
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      soundManager.unlock();
      const code = e.code;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }

      if (this.keyState.has(code)) return;
      this.keyState.add(code);

      if (code === 'KeyP' || code === 'Escape') {
        soundManager.playButtonClick();
        this.game.togglePause();
        return;
      }
      if (code === 'KeyR') {
        soundManager.playButtonClick();
        this.game.restart();
        return;
      }
      if (code === 'KeyM') {
        soundManager.playButtonClick();
        this.game.toggleMute();
        return;
      }
      if (code === 'KeyB') {
        soundManager.playButtonClick();
        this.game.toggleBgm();
        return;
      }

      if (!this.game.isRunning || this.game.isPaused) return;

      switch (code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.startRepeat('left', () => this.game.moveLeft());
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.startRepeat('right', () => this.game.moveRight());
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.startRepeat('down', () => this.game.softDrop());
          break;

        case 'ArrowUp':
        case 'KeyW':
          this.game.rotate();
          break;

        case 'Space':
          this.game.hardDrop();
          break;

        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.game.holdPiece();
          break;
      }
    });

    window.addEventListener('keyup', e => {
      const code = e.code;
      this.keyState.delete(code);

      switch (code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.stopRepeat('left');
          break;

        case 'ArrowRight':
        case 'KeyD':
          this.stopRepeat('right');
          break;

        case 'ArrowDown':
        case 'KeyS':
          this.stopRepeat('down');
          break;
      }
    });

    window.addEventListener('blur', () => this.stopAllRepeats());
  }

  bindTouchHelper(id, actionName, callback, isRepeatable = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const trigger = e => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('active');

      soundManager.unlock();
      soundManager.playButtonClick();

      if (isRepeatable) {
        this.startRepeat(actionName, callback);
      } else {
        if (navigator.vibrate) navigator.vibrate(12);
        callback();
      }
    };

    const release = e => {
      e.preventDefault();
      el.classList.remove('active');
      if (isRepeatable) {
        this.stopRepeat(actionName);
      }
    };

    el.addEventListener('touchstart', trigger, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });

    el.addEventListener('mousedown', trigger);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
  }

  bindSupHandheldControls() {
    // D-Pad
    this.bindTouchHelper('sup-btn-left', 'sup-left', () => this.game.moveLeft(), true);
    this.bindTouchHelper('sup-btn-right', 'sup-right', () => this.game.moveRight(), true);
    this.bindTouchHelper('sup-btn-down', 'sup-down', () => this.game.softDrop(), true);
    this.bindTouchHelper('sup-btn-up', 'sup-up', () => this.game.rotate(), false);

    // 4-Action Buttons
    this.bindTouchHelper('sup-btn-x', 'sup-slam', () => this.game.hardDrop(), false);
    this.bindTouchHelper('sup-btn-y', 'sup-hold', () => this.game.holdPiece(), false);
    this.bindTouchHelper('sup-btn-a', 'sup-rotate-a', () => this.game.rotate(), false);
    this.bindTouchHelper('sup-btn-b', 'sup-drop-b', () => this.game.softDrop(), true);

    // Function Buttons
    this.bindTouchHelper('sup-btn-select', 'sup-select', () => this.game.holdPiece(), false);
    this.bindTouchHelper('sup-btn-start', 'sup-start', () => this.game.togglePause(), false);
    this.bindTouchHelper('sup-speaker-btn', 'sup-speaker', () => this.game.toggleMute(), false);

    // Fn / Help Hotspots toggle
    const fnBtn = document.getElementById('sup-btn-fn');
    const overlay = document.getElementById('sup-touch-overlay');
    if (fnBtn && overlay) {
      const show = e => {
        e.preventDefault();
        soundManager.unlock();
        soundManager.playButtonClick();
        overlay.classList.add('show-targets');
      };
      const hide = e => {
        e.preventDefault();
        overlay.classList.remove('show-targets');
      };

      fnBtn.addEventListener('touchstart', show, { passive: false });
      fnBtn.addEventListener('touchend', hide, { passive: false });
      fnBtn.addEventListener('mousedown', show);
      fnBtn.addEventListener('mouseup', hide);

      // Flash targets for 2.5s on first load
      overlay.classList.add('show-targets');
      setTimeout(() => {
        overlay.classList.remove('show-targets');
      }, 2500);
    }
  }
}
