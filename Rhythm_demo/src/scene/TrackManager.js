import * as THREE from 'three';

export const COLORS = [
  { id: 0, name: 'CYAN', hex: 0x00f0ff, css: '#00f0ff', key: 'D', numKey: '1' },
  { id: 1, name: 'PINK', hex: 0xff007f, css: '#ff007f', key: 'F', numKey: '2' },
  { id: 2, name: 'YELLOW', hex: 0xffdf00, css: '#ffdf00', key: 'J', numKey: '3' },
  { id: 3, name: 'PURPLE', hex: 0xb026ff, css: '#b026ff', key: 'K', numKey: '4' }
];

export class TrackManager {
  constructor(scene, particleSystem) {
    this.scene = scene;
    this.particles = particleSystem;
    this.stepDist = 6.0; // Distance between consecutive pads in 3D units
    this.pads = []; // Active pad meshes & data
    this.padGroup = new THREE.Group();
    this.scene.add(this.padGroup);

    this.activeColorCount = 1; // 1, 2, 3, or 4
    this.initStaticEnvironment();
  }

  setColorCount(count) {
    this.activeColorCount = Math.max(1, Math.min(4, count));
  }

  initStaticEnvironment() {
    // 1. Neon Grid Floor
    const gridHelper = new THREE.GridHelper(200, 50, 0x00f0ff, 0x181a38);
    gridHelper.position.y = -0.05;
    gridHelper.position.z = 50;
    this.scene.add(gridHelper);

    // 2. Dual Side Laser Rails
    const railGeom = new THREE.CylinderGeometry(0.04, 0.04, 300, 8);
    railGeom.rotateX(Math.PI / 2);

    const railMat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const railMat2 = new THREE.MeshBasicMaterial({ color: 0xff007f });

    this.leftRail = new THREE.Mesh(railGeom, railMat1);
    this.leftRail.position.set(-2.6, 0.1, 100);
    this.scene.add(this.leftRail);

    this.rightRail = new THREE.Mesh(railGeom, railMat2);
    this.rightRail.position.set(2.6, 0.1, 100);
    this.scene.add(this.rightRail);
  }

  /**
   * Build pads for a song sequence
   * @param {number} totalBeats
   * @param {number[]} colorSequence Pre-composed color sequence
   * @param {number[]} timestamps Exact beat timestamps
   */
  generateTrack(totalBeats = 64, colorSequence = null, timestamps = null) {
    this.clear();

    const boxGeom = new THREE.BoxGeometry(2.4, 0.22, 1.8);
    const borderGeom = new THREE.BoxGeometry(2.5, 0.05, 1.9);

    let lastColorIdx = -1;
    let currentZ = 0;

    const count = (timestamps && timestamps.length > 0) ? timestamps.length : totalBeats;

    for (let i = 0; i < count; i++) {
      let colorIdx = 0;
      if (colorSequence && colorSequence.length > 0) {
        colorIdx = colorSequence[i % colorSequence.length] % this.activeColorCount;
      } else {
        colorIdx = Math.floor(Math.random() * this.activeColorCount);
        if (colorIdx === lastColorIdx && Math.random() < 0.6) {
          colorIdx = (colorIdx + 1) % this.activeColorCount;
        }
        lastColorIdx = colorIdx;
      }

      const colorData = COLORS[colorIdx];

      // Calculate dynamic Z position based on time delta
      if (i === 0) {
        currentZ = 0;
      } else if (timestamps && timestamps.length > 0) {
        const dt = timestamps[i] - timestamps[i - 1];
        const step = Math.max(3.5, Math.min(9.5, dt * 9.5));
        currentZ += step;
      } else {
        currentZ = i * this.stepDist;
      }

      const zPos = currentZ;
      const padTime = (timestamps && timestamps.length > 0) ? timestamps[i] : null;

      // Group for the pad
      const padMeshGroup = new THREE.Group();
      padMeshGroup.position.set(0, 0, zPos);

      // Dark core surface
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x101324,
        roughness: 0.2,
        metalness: 0.8,
        emissive: colorData.hex,
        emissiveIntensity: 0.28
      });
      const coreMesh = new THREE.Mesh(boxGeom, coreMat);
      coreMesh.position.y = 0.1;
      padMeshGroup.add(coreMesh);

      // Glowing border frame
      const borderMat = new THREE.MeshBasicMaterial({
        color: colorData.hex,
        wireframe: false
      });
      const borderMesh = new THREE.Mesh(borderGeom, borderMat);
      borderMesh.position.y = 0.21;
      padMeshGroup.add(borderMesh);

      // Holographic glowing center circle
      const discGeom = new THREE.CircleGeometry(0.55, 24);
      discGeom.rotateX(-Math.PI / 2);
      const discMat = new THREE.MeshBasicMaterial({
        color: colorData.hex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending
      });
      const discMesh = new THREE.Mesh(discGeom, discMat);
      discMesh.position.y = 0.22;
      padMeshGroup.add(discMesh);

      this.padGroup.add(padMeshGroup);

      this.pads.push({
        index: i,
        z: zPos,
        timestamp: padTime,
        colorIndex: colorIdx,
        color: colorData,
        group: padMeshGroup,
        coreMat,
        borderMat,
        discMesh,
        hitStatus: null // 'perfect', 'good', 'miss'
      });
    }
  }

  getPad(index) {
    return this.pads[index] || null;
  }

  onPadHit(index, status) {
    const pad = this.getPad(index);
    if (!pad) return;

    pad.hitStatus = status;

    if (status === 'perfect' || status === 'good') {
      // Bright flash
      pad.coreMat.emissiveIntensity = 2.0;
      pad.discMesh.material.opacity = 1.0;
      pad.group.scale.set(1.15, 0.8, 1.15);

      // Particle shockwave & sparks
      this.particles.spawnShockwave(pad.group.position, pad.color.hex, 3.5);
      this.particles.spawnHitSparks(pad.group.position, pad.color.hex, status === 'perfect' ? 32 : 18);
    } else {
      // Miss: dim red/dark grey
      pad.coreMat.emissive.setHex(0x550011);
      pad.coreMat.emissiveIntensity = 0.5;
      pad.borderMat.color.setHex(0x661122);
      pad.discMesh.material.color.setHex(0x440011);
      pad.discMesh.material.opacity = 0.3;
    }
  }

  update(delta, currentZ) {
    for (let i = 0; i < this.pads.length; i++) {
      const pad = this.pads[i];
      const distFromBall = pad.z - currentZ;

      // Restitution scale animation
      if (pad.group.scale.x > 1.0) {
        pad.group.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 8.0);
      }

      // Emissive cooldown
      if (pad.coreMat.emissiveIntensity > 0.3 && pad.hitStatus) {
        pad.coreMat.emissiveIntensity = THREE.MathUtils.lerp(pad.coreMat.emissiveIntensity, 0.28, delta * 5.0);
      }

      // Pulse upcoming target pads (anticipate next 2 pads ahead)
      if (!pad.hitStatus && distFromBall > -1 && distFromBall < this.stepDist * 2.5) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.012) * 0.5;
        const isNextTarget = distFromBall < this.stepDist * 1.2;
        pad.discMesh.scale.set(1 + pulse * (isNextTarget ? 0.35 : 0.15), 1 + pulse * (isNextTarget ? 0.35 : 0.15), 1);
        pad.coreMat.emissiveIntensity = isNextTarget ? (0.8 + pulse * 0.8) : (0.4 + pulse * 0.3);
      }
    }

    // Move rails along to stay aligned with camera
    if (this.leftRail && this.rightRail) {
      this.leftRail.position.z = currentZ + 100;
      this.rightRail.position.z = currentZ + 100;
    }
  }

  clear() {
    while (this.padGroup.children.length > 0) {
      const child = this.padGroup.children[0];
      this.padGroup.remove(child);
      child.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) node.material.forEach(m => m.dispose());
          else node.material.dispose();
        }
      });
    }
    this.pads = [];
  }
}
