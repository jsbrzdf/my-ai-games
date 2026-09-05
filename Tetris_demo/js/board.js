/**
 * Tetris Board Matrix & Spatial Collision Engine
 */

import { BOARD_COLS, BOARD_ROWS, WALL_KICK_OFFSETS } from './constants.js';

export class Board {
  constructor() {
    this.cols = BOARD_COLS;
    this.rows = BOARD_ROWS;
    this.grid = this.createEmptyGrid();
  }

  createEmptyGrid() {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        filled: false,
        color: ''
      }))
    );
  }

  reset() {
    this.grid = this.createEmptyGrid();
  }

  /**
   * Check if a piece at given coordinates is valid (no collisions, inside bounds)
   */
  isValidMove(piece, offsetX = 0, offsetY = 0, testShape = null) {
    const shape = testShape || piece.shape;
    const targetX = piece.x + offsetX;
    const targetY = piece.y + offsetY;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          // Check left & right boundary
          if (boardX < 0 || boardX >= this.cols) {
            return false;
          }
          // Check floor boundary
          if (boardY >= this.rows) {
            return false;
          }
          // Check collision with already locked cells (if inside board)
          if (boardY >= 0 && this.grid[boardY][boardX].filled) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Attempt clockwise rotation with Wall Kick resolution
   */
  rotatePiece(piece) {
    // Transpose and reverse rows for 90deg clockwise rotation
    const originalShape = piece.shape;
    const newShape = originalShape[0].map((_, i) =>
      originalShape.map(row => row[i]).reverse()
    );

    // Try standard wall kicks
    for (const offset of WALL_KICK_OFFSETS) {
      if (this.isValidMove(piece, offset.x, offset.y, newShape)) {
        piece.shape = newShape;
        piece.x += offset.x;
        piece.y += offset.y;
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate landing ghost projection row Y
   */
  getGhostY(piece) {
    if (!piece) return 0;
    let ghostY = piece.y;
    while (this.isValidMove(piece, 0, ghostY + 1 - piece.y)) {
      ghostY++;
    }
    return ghostY;
  }

  /**
   * Lock current piece into board matrix
   */
  lockPiece(piece) {
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const boardY = piece.y + r;
          const boardX = piece.x + c;
          if (boardY >= 0 && boardY < this.rows && boardX >= 0 && boardX < this.cols) {
            this.grid[boardY][boardX] = {
              filled: true,
              color: piece.color
            };
          }
        }
      }
    }
  }

  /**
   * Scan for completed rows
   * @returns {Array<number>} array of row indices
   */
  getCompletedLines() {
    const completed = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r].every(cell => cell.filled)) {
        completed.push(r);
      }
    }
    return completed;
  }

  /**
   * Clear lines and collapse rows downwards
   */
  removeLines(lineIndices) {
    if (!lineIndices || lineIndices.length === 0) return;

    // Remove from bottom to top
    const sorted = [...lineIndices].sort((a, b) => b - a);
    for (const row of sorted) {
      this.grid.splice(row, 1);
    }

    // Add empty rows at top
    for (let i = 0; i < lineIndices.length; i++) {
      this.grid.unshift(
        Array.from({ length: this.cols }, () => ({
          filled: false,
          color: ''
        }))
      );
    }
  }

  /**
   * Check if spawn area is blocked (Game Over condition)
   */
  isSpawnBlocked(piece) {
    return !this.isValidMove(piece, 0, 0);
  }
}
