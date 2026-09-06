import * as THREE from 'three';

export class World {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.scene = new THREE.Scene();

    // Deep space cyberpunk fog
    this.scene.fog = new THREE.FogExp2(0x070913, 0.016);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 4.2, -6.5);
    this.camera.lookAt(0, 1.8, 8.0);

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 640);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    this.renderer.setClearColor(0x070913);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);

    this.initLights();
    this.initHorizon();

    window.addEventListener('resize', this.onResize);
  }

  initLights() {
    // Soft ambient
    const ambientLight = new THREE.AmbientLight(0x223355, 0.8);
    this.scene.add(ambientLight);

    // Directional rim light
    const dirLight = new THREE.DirectionalLight(0x88bbff, 1.2);
    dirLight.position.set(10, 20, -10);
    this.scene.add(dirLight);

    // Distant horizon glow light
    this.horizonLight = new THREE.PointLight(0xff007f, 1.8, 120);
    this.horizonLight.position.set(0, 8, 80);
    this.scene.add(this.horizonLight);
  }

  initHorizon() {
    // Retro synthwave wireframe sun in distant horizon
    const sunGeom = new THREE.CircleGeometry(16, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.sunMesh.position.set(0, 10, 110);
    this.scene.add(this.sunMesh);

    // Wireframe ring around sun
    const ringGeom = new THREE.RingGeometry(16.5, 17.5, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    this.sunRing = new THREE.Mesh(ringGeom, ringMat);
    this.sunRing.position.set(0, 10, 110);
    this.scene.add(this.sunRing);
  }

  updateCamera(ballZ, delta) {
    // Smooth camera tracking
    const targetCamZ = ballZ - 6.5;
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, delta * 12.0);
    
    // Slight look-ahead target
    const lookAtZ = this.camera.position.z + 14.5;
    this.camera.lookAt(0, 1.8, lookAtZ);

    // Distant sun tracks along Z
    if (this.sunMesh && this.sunRing) {
      this.sunMesh.position.z = ballZ + 110;
      this.sunRing.position.z = ballZ + 110;
      this.horizonLight.position.z = ballZ + 80;
    }
  }

  onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
