/**
 * Game Constants & Tetromino Definitions
 */

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;

// Tetromino definitions with shapes and colors
export const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'cyan',
    name: 'I'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'yellow',
    name: 'O'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'purple',
    name: 'T'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'green',
    name: 'S'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'red',
    name: 'Z'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'blue',
    name: 'J'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'orange',
    name: 'L'
  }
};

// Shard particle colors with main RGBA & neon outer glow
export const PARTICLE_COLORS = {
  cyan: {
    main: 'rgba(0, 242, 254, 0.9)',
    glow: 'rgba(0, 242, 254, 0.8)'
  },
  yellow: {
    main: 'rgba(255, 215, 0, 0.95)',
    glow: 'rgba(255, 200, 0, 0.8)'
  },
  purple: {
    main: 'rgba(192, 132, 252, 0.9)',
    glow: 'rgba(168, 85, 247, 0.8)'
  },
  green: {
    main: 'rgba(52, 211, 153, 0.9)',
    glow: 'rgba(16, 185, 129, 0.8)'
  },
  red: {
    main: 'rgba(248, 113, 113, 0.95)',
    glow: 'rgba(239, 68, 68, 0.8)'
  },
  blue: {
    main: 'rgba(96, 165, 250, 0.9)',
    glow: 'rgba(59, 130, 246, 0.8)'
  },
  orange: {
    main: 'rgba(251, 146, 60, 0.95)',
    glow: 'rgba(249, 115, 22, 0.8)'
  }
};

// Standard Line Clear Score Table
export const LINE_POINTS = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

// Fall speed per level in milliseconds
export const LEVEL_SPEEDS = {
  1: 800,
  2: 650,
  3: 500,
  4: 400,
  5: 320,
  6: 240,
  7: 180,
  8: 130,
  9: 90,
  10: 60
};

// DAS (Delayed Auto Shift) & ARR (Auto Repeat Rate) in ms
export const INPUT_TIMING = {
  DAS: 180, // initial delay before repeating key
  ARR: 45   // interval between key repeat events
};

// Standard Wall Kick offsets
export const WALL_KICK_OFFSETS = [
  { x: 0, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: -2, y: 0 },
  { x: 2, y: 0 },
  { x: 0, y: -1 }
];

export const STORAGE_KEY_HIGH_SCORE = 'glass_tetris_high_score';
export const STORAGE_KEY_SOUND_MUTED = 'glass_tetris_sound_muted';
export const STORAGE_KEY_BGM_ENABLED = 'glass_tetris_bgm_enabled';

