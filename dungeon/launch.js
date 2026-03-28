#!/usr/bin/env node

/**
 * Claude SEO Dungeon — One-click launcher.
 *
 * Starts the bridge server (hidden) and the game (opens browser).
 * The user just runs: node launch.js
 * Then opens Claude Code in their terminal as usual.
 */

const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;

console.log('');
console.log('  ⚔  Claude SEO Dungeon  ⚔');
console.log('  ─────────────────────────');
console.log('');

// Start bridge server in background (silent)
const bridge = spawn('node', [path.join(ROOT, 'server', 'index.js')], {
  cwd: ROOT,
  stdio: 'ignore',
  detached: true
});
bridge.unref();
console.log('  ✓ Bridge server started (background, port 3001)');

// Start Vite dev server (opens browser)
const vite = spawn('npx', ['vite', '--port', '3000', '--open'], {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit'
});

console.log('  ✓ Game server starting (port 3000)');
console.log('');
console.log('  Open Claude Code in another terminal and play!');
console.log('  The game will connect automatically.');
console.log('');

// Clean up bridge on exit
process.on('exit', () => {
  try { process.kill(-bridge.pid); } catch (e) {}
});
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
