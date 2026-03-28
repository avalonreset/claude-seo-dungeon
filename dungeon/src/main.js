import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { SummoningScene } from './scenes/SummoningScene.js';
import { DungeonHallScene } from './scenes/DungeonHallScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { bridge } from './utils/ws.js';
import { initKnightSprite } from './knight-sprite.js';

let game = null;

// ── Activity Log (HTML-based) ──────────────────
function addLog(msg) {
  if (!msg) return;
  let clean = msg.replace(/[\n\r]+/g, ' ').trim();
  if (!clean || clean.length < 3) return;
  if (clean === '[working...]') return;

  // Filter raw JSON blobs but keep tool call lines like [WebFetch]
  if (clean.startsWith('{') || clean.startsWith('"')) return;
  if (clean.includes('":"') && clean.includes('","')) return;

  let cls = 'text';
  if (clean.startsWith('ERROR')) cls = 'error';
  else if (clean.startsWith('[')) cls = 'tool';
  else if (/^(Audit|Fix|Score|Found)/.test(clean)) cls = 'status';
  else if (/^(System|Waiting|Connected|Bridge)/.test(clean)) cls = 'system';
  else if (clean.includes('omplete')) cls = 'complete';

  const el = document.getElementById('log-content');
  if (!el) return;
  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.textContent = clean;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  while (el.children.length > 200) el.removeChild(el.firstChild);
}

// ── Bridge Connection ──────────────────────────
async function connectBridge() {
  const status = document.getElementById('bridge-status');
  try {
    await bridge.connect();
    status.textContent = 'Bridge connected — ready for battle';
    status.className = 'connected';
    addLog('Bridge connected');
  } catch (err) {
    status.textContent = 'Bridge offline — start the server first';
    status.className = 'error';
    addLog('ERROR: Bridge connection failed');
  }
}

// ── Launch Game ────────────────────────────────
function launchGame(domain, projectPath) {
  // Hide title, show game canvas
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  addLog(`Audit: ${domain}`);
  addLog(`Project: ${projectPath}`);

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

  // Pass initial data to the first real scene (Summoning)
  game.events.once('ready', () => {
    // BootScene will auto-transition to Summoning with this data
  });
}

// ── Title Screen Events ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domain-input');
  const pathInput = document.getElementById('path-input');
  const btn = document.getElementById('descend-btn');

  const launch = () => {
    const domain = domainInput.value.trim();
    const path = pathInput.value.trim();
    if (domain && path) {
      launchGame(domain, path);
    }
  };

  btn.addEventListener('click', launch);
  domainInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });
  pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });

  // Init animated knight sprite
  initKnightSprite();

  // Connect to bridge
  connectBridge();

  // Focus
  setTimeout(() => domainInput.focus(), 300);
});
