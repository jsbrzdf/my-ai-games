/**
 * Glass Shard Particle Explosion Engine
 * High-performance 2D Canvas polygonal physics simulation
 */

import { PARTICLE_COLORS } from './constants.js';

export class ParticleSystem {
  constructor(canvases) {
    this.canvases = Array.isArray(canvases) ? canvases.filter(Boolean) : [canvases].filter(Boolean);
    this.particles = [];
    this.animationId = null;
    this.lastTime = performance.now();

    this.resizeAll();
    window.addEventListener('resize', () => this.resizeAll());
  }

  resizeAll() {
    this.canvases.forEach(canvas => {
      if (!canvas || canvas.offsetParent === null) return; // skip hidden
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    });
  }

  /**
   * Spawn glass shards for cleared lines
   */
  explodeLines(clearedLineIndices, board, boardElement) {
    if (!clearedLineIndices || clearedLineIndices.length === 0 || !boardElement) return;

    this.resizeAll();

    // Calculate cell centers relative to the active particle canvas
    const activeCanvas = this.canvases.find(c => c && c.offsetParent !== null);
    const refRect = activeCanvas ? activeCanvas.getBoundingClientRect() : boardElement.getBoundingClientRect();
    const cells = boardElement.children;
    const newShards = [];

    clearedLineIndices.forEach(row => {
      for (let col = 0; col < 10; col++) {
        const cell = board[row][col];
        if (!cell || !cell.filled) continue;

        const cellIndex = row * 10 + col;
        const cellEl = cells[cellIndex];
        if (!cellEl) continue;

        const cellRect = cellEl.getBoundingClientRect();

        const cellCenterX = (cellRect.left - refRect.left) + cellRect.width / 2;
        const cellCenterY = (cellRect.top - refRect.top) + cellRect.height / 2;

        const colorCfg = PARTICLE_COLORS[cell.color] || {
          main: 'rgba(200, 220, 255, 0.85)',
          glow: 'rgba(255, 255, 255, 0.6)'
        };

        const shardsCount = 10 + Math.floor(Math.random() * 5);

        for (let s = 0; s < shardsCount; s++) {
          const vertexCount = 3 + (Math.random() > 0.6 ? 1 : 0);
          const vertices = [];
          const baseRadius = 2.5 + Math.random() * 5;

          for (let v = 0; v < vertexCount; v++) {
            const angle = (v / vertexCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const r = baseRadius * (0.6 + Math.random() * 0.8);
            vertices.push({
              x: Math.cos(angle) * r,
              y: Math.sin(angle) * r
            });
          }

          const burstAngle = (Math.random() - 0.5) * Math.PI * 1.6;
          const burstSpeed = 3.5 + Math.random() * 7;
          const lateralScatter = (col - 4.5) * 0.8;

          newShards.push({
            x: cellCenterX + (Math.random() - 0.5) * (cellRect.width * 0.6),
            y: cellCenterY + (Math.random() - 0.5) * (cellRect.height * 0.6),
            vx: Math.sin(burstAngle) * burstSpeed + lateralScatter,
            vy: -Math.abs(Math.cos(burstAngle) * burstSpeed) - 3 - Math.random() * 4,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.45,
            color: colorCfg.main,
            glowColor: colorCfg.glow,
            alpha: 1.0,
            fadeRate: 0.015 + Math.random() * 0.008,
            vertices: vertices
          });
        }
      }
    });

    this.particles = [...this.particles, ...newShards].slice(-350);

    if (!this.animationId) {
      this.lastTime = performance.now();
      this.animationId = requestAnimationFrame(time => this.update(time));
    }
  }

  update(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 16.67, 2.0);
    this.lastTime = currentTime;

    // Get visible active canvases
    const activeCanvases = this.canvases.filter(c => c && c.offsetParent !== null);
    if (activeCanvases.length === 0) {
      this.animationId = null;
      return;
    }

    activeCanvases.forEach(canvas => {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, rect.width, rect.height);
    });

    this.particles = this.particles.filter(p => p.alpha > 0.02);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.vy += 0.38 * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotationSpeed * dt;
      p.alpha -= p.fadeRate * dt;

      activeCanvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, p.alpha);

        ctx.shadowBlur = 10;
        ctx.shadowColor = p.glowColor;

        ctx.beginPath();
        ctx.moveTo(p.vertices[0].x, p.vertices[0].y);
        for (let v = 1; v < p.vertices.length; v++) {
          ctx.lineTo(p.vertices[v].x, p.vertices[v].y);
        }
        ctx.closePath();

        ctx.fillStyle = p.color;
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.95})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.restore();
      });
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(time => this.update(time));
    } else {
      this.animationId = null;
      activeCanvases.forEach(canvas => {
        const rect = canvas.getBoundingClientRect();
        canvas.getContext('2d').clearRect(0, 0, rect.width, rect.height);
      });
    }
  }

  clear() {
    this.particles = [];
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.canvases.forEach(canvas => {
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.getContext('2d').clearRect(0, 0, rect.width, rect.height);
      }
    });
  }
}
