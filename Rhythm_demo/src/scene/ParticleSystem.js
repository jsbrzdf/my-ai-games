import * as THREE from 'three';

/**
 * ParticleSystem - Shockwaves, hit sparks, and warp stars
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.shockwaves = [];
    this.sparkEmitters = [];
    
    // Background starfield / space dust
    this.initStarfield();
  }

  initStarfield() {
    const starCount = 300;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const baseColor = new THREE.Color(0x5588ff);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;

      const c = baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.2, 0, 0);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  /**
   * Spawn expanding shockwave ring on a tile
   */
  spawnShockwave(position, colorHex, maxRadius = 3.2) {
    const geom = new THREE.RingGeometry(0.2, 0.4, 32);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(position);
    mesh.position.y += 0.04;
    this.scene.add(mesh);

    this.shockwaves.push({
      mesh,
      scale: 1,
      maxRadius,
      opacity: 0.9,
      life: 1.0,
      decay: 3.5
    });
  }

  /**
   * Spawn 3D spark explosion at landing position
   */
  spawnHitSparks(position, colorHex, count = 24) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y + 0.1;
      positions[i * 3 + 2] = position.z;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.0;
      const vY = 2.0 + Math.random() * 4.5;
      velocities.push({
        x: Math.cos(angle) * speed,
        y: vY,
        z: Math.sin(angle) * speed
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.28,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.sparkEmitters.push({
      points,
      velocities,
      positions,
      life: 1.0,
      decay: 2.2
    });
  }

  update(delta, cameraZ = 0) {
    // 1. Update starfield wrap (only re-upload buffer to GPU if a star wrapped)
    if (this.starfield) {
      let wrapped = false;
      const positions = this.starfield.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        if (positions[i + 2] < cameraZ - 20) {
          positions[i + 2] += 150;
          wrapped = true;
        }
      }
      if (wrapped) {
        this.starfield.geometry.attributes.position.needsUpdate = true;
      }
    }

    // 2. Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= delta * sw.decay;
      sw.scale += delta * 8.0;
      sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);
      sw.mesh.material.opacity = Math.max(0, sw.life * 0.9);

      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update sparks
    for (let i = this.sparkEmitters.length - 1; i >= 0; i--) {
      const sp = this.sparkEmitters[i];
      sp.life -= delta * sp.decay;
      const positions = sp.positions;

      for (let j = 0; j < sp.velocities.length; j++) {
        const vel = sp.velocities[j];
        vel.y -= 9.8 * delta; // Gravity

        positions[j * 3] += vel.x * delta;
        positions[j * 3 + 1] += vel.y * delta;
        positions[j * 3 + 2] += vel.z * delta;
      }

      sp.points.geometry.attributes.position.needsUpdate = true;
      sp.points.material.opacity = Math.max(0, sp.life);

      if (sp.life <= 0) {
        this.scene.remove(sp.points);
        sp.points.geometry.dispose();
        sp.points.material.dispose();
        this.sparkEmitters.splice(i, 1);
      }
    }
  }

  clear() {
    for (const sw of this.shockwaves) {
      this.scene.remove(sw.mesh);
    }
    this.shockwaves = [];

    for (const sp of this.sparkEmitters) {
      this.scene.remove(sp.points);
    }
    this.sparkEmitters = [];
  }
}
