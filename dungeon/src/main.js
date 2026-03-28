import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { SummoningScene } from './scenes/SummoningScene.js';
import { DungeonHallScene } from './scenes/DungeonHallScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { bridge } from './utils/ws.js';
import { initKnightSprite } from './knight-sprite.js';
import { initActivityLog, addLog, showLoadingIndicator, hideLoadingIndicator } from './activity-log.js';

let game = null;

// ── Bridge Connection ──────────────────────────
async function connectBridge() {
  const status = document.getElementById('bridge-status');
  try {
    await bridge.connect();
    status.textContent = 'Blood will be spilled tonight.';
    status.className = 'connected';
    addLog('Something stirs in the dark');
  } catch (err) {
    status.textContent = 'The dungeon is unreachable. Start the server.';
    status.className = 'error';
    addLog('The darkness does not answer');
  }
}

// ── Launch Game ────────────────────────────────
function launchGame(domain, projectPath) {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  addLog(`Hunting: ${domain}`);
  addLog(`Source: ${projectPath}`);
  showLoadingIndicator();

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
    scene: [BootScene, SummoningScene, DungeonHallScene, BattleScene, VictoryScene]
  };

  game = new Phaser.Game(config);
  game.domain = domain;
  game.projectPath = projectPath;
  game.addLog = addLog;
  game.showLoading = showLoadingIndicator;
  game.hideLoading = hideLoadingIndicator;
}

// ── Title Screen Events ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Init animated systems
  initActivityLog();
  initKnightSprite();

  addLog('Torches flicker in the deep');

  const domainInput = document.getElementById('domain-input');
  const pathInput = document.getElementById('path-input');
  const btn = document.getElementById('descend-btn');

  const launch = () => {
    const domain = domainInput.value.trim();
    const path = pathInput.value.trim();
    if (domain && path) launchGame(domain, path);
  };

  btn.addEventListener('click', launch);
  domainInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });
  pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });

  connectBridge();
  setTimeout(() => domainInput.focus(), 300);
});
