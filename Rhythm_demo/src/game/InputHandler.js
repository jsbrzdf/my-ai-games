export class InputHandler {
  constructor(onInputTrigger) {
    this.onInputTrigger = onInputTrigger;
    this.isSingleKeyMode = false;
    this.activeKeyCount = 2; // Default to 2-Key golden rhythm mode

    // 4-Key / Standard mapping
    this.keyMap = {
      // D F J K
      'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3,
      // 1 2 3 4
      'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
      'Numpad1': 0, 'Numpad2': 1, 'Numpad3': 2, 'Numpad4': 3,
      // Arrow keys alternative
      'ArrowLeft': 0, 'ArrowDown': 1, 'ArrowUp': 2, 'ArrowRight': 3
    };

    // 2-Key ergonomic multi-layout mapping:
    // Supports:
    // 1. Single Left-hand (D=Kick, F=Snare)
    // 2. Single Right-hand (J=Kick, K=Snare)
    // 3. Two-hands (Left D=Kick, Right K/Space=Snare)
    // 4. Taiko alternating rolls (D/J=Kick, F/K=Snare)
    // 5. Arrow keys (Left=Kick, Right=Snare)
    this.twoKeyMap = {
      'KeyD': 0, 'KeyA': 0, 'KeyS': 0, 'ArrowLeft': 0, 'Digit1': 0,
      'KeyJ': 0, // Right-hand Kick / Alternating Kick roll
      'KeyF': 1, // Left-hand Snare
      'KeyK': 1, 'KeyL': 1, 'ArrowRight': 1, 'Digit2': 1, 'Space': 1, 'Enter': 1 // Right-hand Snare / Space Snare
    };

    this.activeKeys = new Set();
    this.buttonElements = [];
    this.initKeyboard();
  }

  setKeyCount(count) {
    this.activeKeyCount = count;
    this.isSingleKeyMode = (count === 1);
  }

  setSingleKeyMode(isSingle) {
    this.isSingleKeyMode = !!isSingle;
    if (isSingle) {
      this.activeKeyCount = 1;
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      // Prevent page scrolling on space
      if (e.code === 'Space') {
        e.preventDefault();
      }

      // 1-Key mode: any key triggers hit
      if (this.isSingleKeyMode) {
        if (!['F5', 'F12', 'Escape', 'Tab'].includes(e.code)) {
          this.trigger(0);
          this.highlightButton(0, true);
          return;
        }
      }

      // 2-Key mode: ergonomic dual-hand & single-hand mapping
      if (this.activeKeyCount === 2) {
        const code = e.code;
        if (code in this.twoKeyMap) {
          const colorIdx = this.twoKeyMap[code];
          this.trigger(colorIdx);
          this.highlightButton(colorIdx, true);
          return;
        }
      }

      // 3-Key and 4-Key standard mapping
      const code = e.code;
      if (code in this.keyMap) {
        const colorIdx = this.keyMap[code];
        if (colorIdx < this.activeKeyCount) {
          this.trigger(colorIdx);
          this.highlightButton(colorIdx, true);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isSingleKeyMode) {
        this.highlightButton(0, false);
        return;
      }

      const code = e.code;
      if (this.activeKeyCount === 2) {
        if (code in this.twoKeyMap) {
          const colorIdx = this.twoKeyMap[code];
          this.highlightButton(colorIdx, false);
          return;
        }
      }

      if (code in this.keyMap) {
        const colorIdx = this.keyMap[code];
        this.highlightButton(colorIdx, false);
      }
    });
  }

  bindOnScreenButtons(buttonElements) {
    this.buttonElements = buttonElements;
    buttonElements.forEach((btn, idx) => {
      const handlePress = (e) => {
        e.preventDefault();
        this.trigger(idx);
        this.highlightButton(idx, true);
        setTimeout(() => this.highlightButton(idx, false), 120);
      };

      btn.addEventListener('pointerdown', handlePress);
    });
  }

  trigger(colorIdx) {
    if (this.onInputTrigger) {
      this.onInputTrigger(colorIdx);
    }
  }

  highlightButton(colorIdx, isActive) {
    const btn = this.buttonElements[colorIdx];
    if (btn) {
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }
}
