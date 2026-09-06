/**
 * Build Script: Unified Game Hub & Cloudflare Pages Distribution
 * 
 * Aggregates:
 * 1. Root Game Hub Portal (index.html, hub.css) -> dist/
 * 2. Tetris_demo (Vanilla HTML/CSS/JS) -> dist/tetris/
 * 3. Rhythm_demo (Vite + Three.js Build Output) -> dist/rhythm/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TETRIS_DIR = path.join(ROOT_DIR, 'Tetris_demo');
const RHYTHM_DIR = path.join(ROOT_DIR, 'Rhythm_demo');

console.log('🚀 [1/4] Starting Unified Arcade Hub Build...');

// 1. Build Rhythm_demo (Vite)
console.log('⚡ [2/4] Building Rhythm_demo with Vite...');
const rhythmModules = path.join(RHYTHM_DIR, 'node_modules');
if (!fs.existsSync(rhythmModules)) {
  console.log('📦 Installing Rhythm_demo dependencies first...');
  execSync('npm install', { cwd: RHYTHM_DIR, stdio: 'inherit' });
}

execSync('npm run build', { cwd: RHYTHM_DIR, stdio: 'inherit' });

const rhythmDist = path.join(RHYTHM_DIR, 'dist');
if (!fs.existsSync(rhythmDist)) {
  console.error('❌ Error: Rhythm_demo/dist was not generated!');
  process.exit(1);
}

// 2. Clean & recreate root dist/
console.log('🧹 [3/4] Preparing unified dist directory...');
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper: copy directory recursively
function copyDirRecursive(src, dest, ignoreList = []) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoreList.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, ignoreList);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 3. Assemble Dist
console.log('📦 [4/4] Assembling games and portal...');

// Copy Hub Portal files to dist/
fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
fs.copyFileSync(path.join(ROOT_DIR, 'hub.css'), path.join(DIST_DIR, 'hub.css'));
if (fs.existsSync(path.join(ROOT_DIR, 'LICENSE'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'LICENSE'), path.join(DIST_DIR, 'LICENSE'));
}

// Copy Tetris_demo -> dist/tetris/
const distTetris = path.join(DIST_DIR, 'tetris');
copyDirRecursive(TETRIS_DIR, distTetris, ['node_modules', 'server.js', 'package.json', 'package-lock.json', '.git', '.DS_Store', 'Thumbs.db']);

// Copy Rhythm_demo/dist -> dist/rhythm/
const distRhythm = path.join(DIST_DIR, 'rhythm');
copyDirRecursive(rhythmDist, distRhythm);

console.log('\n✨ Build Complete! Unified distribution ready in ./dist:');
console.log('   ├── dist/index.html        (Game Hub Portal)');
console.log('   ├── dist/hub.css           (Hub Stylesheet)');
console.log('   ├── dist/tetris/index.html (Glass Tetris)');
console.log('   └── dist/rhythm/index.html (Neon Beat Leap)');
