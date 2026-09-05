/**
 * LocalStorage wrapper for High Score and Game Preferences
 */

import { STORAGE_KEY_HIGH_SCORE, STORAGE_KEY_SOUND_MUTED, STORAGE_KEY_BGM_ENABLED } from './constants.js';

export class Storage {
  static getHighScore() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      return val ? parseInt(val, 10) : 0;
    } catch (e) {
      console.warn('Unable to access localStorage for high score:', e);
      return 0;
    }
  }

  static saveHighScore(score) {
    try {
      const current = this.getHighScore();
      if (score > current) {
        localStorage.setItem(STORAGE_KEY_HIGH_SCORE, score.toString());
        return score;
      }
      return current;
    } catch (e) {
      console.warn('Unable to save high score to localStorage:', e);
      return score;
    }
  }

  static getSoundMuted() {
    try {
      return localStorage.getItem(STORAGE_KEY_SOUND_MUTED) === 'true';
    } catch (e) {
      return false;
    }
  }

  static saveSoundMuted(muted) {
    try {
      localStorage.setItem(STORAGE_KEY_SOUND_MUTED, muted ? 'true' : 'false');
    } catch (e) {
      console.warn('Unable to save sound settings:', e);
    }
  }

  static getBgmEnabled() {
    try {
      const val = localStorage.getItem(STORAGE_KEY_BGM_ENABLED);
      return val === null ? true : val === 'true';
    } catch (e) {
      return true;
    }
  }

  static saveBgmEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY_BGM_ENABLED, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Unable to save BGM settings:', e);
    }
  }
}

