#!/usr/bin/env node

/**
 * Claude SEO Dungeon - One-click launcher.
 *
 * Builds the optimized production bundle (if needed), starts the bridge
 * server, and serves the game. The user just runs: npm start
 */

const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

console.log('');
console.log('  ⚔  Claude SEO Dungeon  ⚔');
console.log('  ─────────────────────────');
console.log('');

// Build production bundle if dist/ doesn't exist or is empty
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.log('  Building optimized production bundle...');
  try {
    execFileSync('npx', ['vite', 'build'], { cwd: ROOT, stdio: 'inherit', shell: true });
    console.log('  ✓ Build complete');
    console.log('');
  } catch (e) {
    console.error('  ✗ Build failed. Try running: npm run build');
    process.exit(1);
  }
}

// Start bridge server in background
const bridge = spawn('node', [path.join(ROOT, 'server', 'index.js')], {
  cwd: ROOT,
  stdio: 'ignore',
  detached: true
});
bridge.unref();
console.log('  ✓ Bridge server started (port 3001)');

// Serve optimized production build
const serve = spawn('npx', ['serve', 'dist', '-l', '3000', '-s'], {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit'
});

console.log('  ✓ Game server starting (port 3000)');
console.log('');
console.log('  Open http://localhost:3000 in your browser.');
console.log('  Then open Claude Code in another terminal and play!');
console.log('');

// Clean up bridge on exit
process.on('exit', () => {
  try { process.kill(-bridge.pid); } catch (e) {}
});
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
