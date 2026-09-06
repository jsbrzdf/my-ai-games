import * as THREE from 'three';
import { COLORS } from './TrackManager.js';

export class Ball {
  constructor(scene) {
    this.scene = scene;
    this.radius = 0.42;
    this.jumpHeight = 2.8;
    this.baseY = 0.52; // Sitting atop pad surface

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.currentColor = COLORS[0];
    this.targetColor = COLORS[0];
    this.initMesh();
    this.initTrail();
  }

  initMesh() {
    // 1. Sleek, high-intensity glowing neon sphere (no artificial outer shell)
    const geom = new THREE.SphereGeometry(this.radius, 32, 24);
    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: this.currentColor.hex,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.15
    });
    this.mesh = new THREE.Mesh(geom, this.material);
    this.group.add(this.mesh);

    // 2. Dynamic point light that illuminates pads and rails
    this.light = new THREE.PointLight(this.currentColor.hex, 2.8, 8.5);
    this.light.position.set(0, 0, 0);
    this.group.add(this.light);
  }

  initTrail() {
    this.trailCount = 20;
    this.trailGeom = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.trailCount * 3);
    this.trailColors = new Float32Array(this.trailCount * 3);
    this.trailSizes = new Float32Array(this.trailCount);

    for (let i = 0; i < this.trailCount; i++) {
      this.trailPositions[i * 3] = 0;
      this.trailPositions[i * 3 + 1] = this.baseY;
      this.trailPositions[i * 3 + 2] = 0;

      this.trailColors[i * 3] = 0;
      this.trailColors[i * 3 + 1] = 1;
      this.trailColors[i * 3 + 2] = 1;

      this.trailSizes[i] = (1.0 - i / this.trailCount) * 0.35;
    }

    this.trailGeom.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailGeom.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));

    const trailMat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.trailMesh = new THREE.Points(this.trailGeom, trailMat);
    this.scene.add(this.trailMesh);
    this.trailHistory = [];
  }

  setColor(colorData) {
    this.targetColor = colorData;
    this.currentColor = colorData;

    this.material.emissive.setHex(colorData.hex);
    this.light.color.setHex(colorData.hex);
  }

  /**
   * Update ball position along parabolic arc between current & next pad
   * @param {number} progress 0.0 to 1.0 within current beat
   * @param {number} startZ Z position of current pad
   * @param {number} targetZ Z position of target pad
   * @param {object} upcomingColor Color data of target pad
   */
  updateArc(progress, startZ, targetZ, upcomingColor, isResting = false) {
    if (isResting) {
      this.group.position.z = startZ;
      this.group.position.x = 0;
      this.group.position.y = this.baseY;
      const breath = Math.sin(Date.now() * 0.006) * 0.03;
      this.mesh.scale.set(1 + breath, 1 - breath * 0.5, 1 + breath);
      this.updateTrail();
      return;
    }

    // Clamp progress
    const p = Math.max(0, Math.min(1, progress));

    // 1. Position Z & X
    const currentZ = THREE.MathUtils.lerp(startZ, targetZ, p);
    this.group.position.z = currentZ;
    this.group.position.x = 0;

    // 2. Parabolic arc for Y: y = 4 * H * p * (1 - p)
    const arc = 4 * this.jumpHeight * p * (1 - p);
    this.group.position.y = this.baseY + arc;

    // 3. Squash and Stretch animation
    // When landing (p -> 0 or p -> 1): squash horizontal, compress vertical
    // When peak (p -> 0.5): stretch vertical, slim horizontal
    if (p < 0.15 || p > 0.85) {
      const landP = p < 0.15 ? (1 - p / 0.15) : ((p - 0.85) / 0.15);
      const squashFactor = landP * 0.35;
      this.mesh.scale.set(1 + squashFactor, 1 - squashFactor * 0.6, 1 + squashFactor);
    } else {
      const midP = 1 - Math.abs(p - 0.5) * 2; // 0 at sides, 1 at peak
      const stretchFactor = midP * 0.25;
      this.mesh.scale.set(1 - stretchFactor * 0.5, 1 + stretchFactor, 1 - stretchFactor * 0.5);
    }

    // 4. Color morphing: shift color right upon takeoff so player has full reaction time!
    if (upcomingColor) {
      const morphP = Math.min(1.0, p / 0.35); // Fully morphed by 35% of flight
      const curCol = new THREE.Color(this.currentColor.hex);
      const targetCol = new THREE.Color(upcomingColor.hex);
      curCol.lerp(targetCol, morphP);

      this.material.emissive.copy(curCol);
      this.light.color.copy(curCol);
    }

    // 5. Update Trail History
    this.updateTrail();
  }

  updateTrail() {
    const pos = this.group.position;
    const col = this.material.emissive;

    const posArray = this.trailGeom.attributes.position.array;
    const colArray = this.trailGeom.attributes.color.array;

    // Shift previous positions & colors backwards in-place (Zero memory allocations)
    for (let i = this.trailCount - 1; i > 0; i--) {
      const curIdx = i * 3;
      const prevIdx = (i - 1) * 3;

      posArray[curIdx] = posArray[prevIdx];
      posArray[curIdx + 1] = posArray[prevIdx + 1];
      posArray[curIdx + 2] = posArray[prevIdx + 2];

      colArray[curIdx] = colArray[prevIdx];
      colArray[curIdx + 1] = colArray[prevIdx + 1];
      colArray[curIdx + 2] = colArray[prevIdx + 2];
    }

    // Lead particle at index 0 takes current ball position & color
    posArray[0] = pos.x;
    posArray[1] = pos.y;
    posArray[2] = pos.z;

    colArray[0] = col.r;
    colArray[1] = col.g;
    colArray[2] = col.b;

    this.trailGeom.attributes.position.needsUpdate = true;
    this.trailGeom.attributes.color.needsUpdate = true;
  }

  reset(startColor = COLORS[0]) {
    this.setColor(startColor);
    this.group.position.set(0, this.baseY, 0);

    // Reset trail buffer in-place
    const posArray = this.trailGeom.attributes.position.array;
    for (let i = 0; i < this.trailCount; i++) {
      posArray[i * 3] = 0;
      posArray[i * 3 + 1] = this.baseY;
      posArray[i * 3 + 2] = 0;
    }
    this.trailGeom.attributes.position.needsUpdate = true;
  }
}
