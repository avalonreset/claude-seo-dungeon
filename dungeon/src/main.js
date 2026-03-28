import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { SummoningScene } from './scenes/SummoningScene.js';
import { DungeonHallScene } from './scenes/DungeonHallScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, SummoningScene, DungeonHallScene, BattleScene, VictoryScene]
};

const game = new Phaser.Game(config);

// Global state
game.ws = null;
game.auditData = null;

// ── HTML-based Activity Log ──────────────────
game.addLog = function(msg) {
  if (!msg) return;

  let clean = msg.replace(/[\n\r]+/g, ' ').trim();
  if (clean.length === 0) return;

  // Filter out raw JSON
  if (clean.startsWith('{') || clean.startsWith('[') || clean.startsWith('"')) return;
  if (clean.includes('":"') && clean.includes('","')) return;
  if (clean === '[working...]') return;
  if (clean.length < 3) return;

  // Determine CSS class
  let cls = 'text';
  if (clean.startsWith('ERROR')) cls = 'error';
  else if (clean.startsWith('[')) cls = 'tool';
  else if (clean.startsWith('Audit') || clean.startsWith('Fix') || clean.startsWith('Score')) cls = 'status';
  else if (clean.startsWith('System') || clean.startsWith('Waiting') || clean.startsWith('Connected')) cls = 'system';
  else if (clean.includes('Complete') || clean.includes('complete')) cls = 'complete';

  const logContent = document.getElementById('log-content');
  if (!logContent) return;

  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.textContent = clean;
  logContent.appendChild(line);

  // Auto-scroll to bottom
  logContent.scrollTop = logContent.scrollHeight;

  // Limit to 200 lines
  while (logContent.children.length > 200) {
    logContent.removeChild(logContent.firstChild);
  }
};
