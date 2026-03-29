import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { SummoningScene } from './scenes/SummoningScene.js';
import { DungeonHallScene } from './scenes/DungeonHallScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';
import { GateScene } from './scenes/GateScene.js';
import { bridge } from './utils/ws.js';
import { initKnightSprite } from './knight-sprite.js';
import { initActivityLog, addLog, showLoadingIndicator, hideLoadingIndicator } from './activity-log.js';

// Minimum 3x render scale ensures crisp text on 4K monitors.
// On a 4K display with 150% scaling (DPR 1.5), the base 800x600 canvas
// would be CSS-upscaled ~4x, making text blurry. At 3x, the canvas is
// 2400x1800, which closely matches the physical pixel count.
window.GAME_DPR = Math.max(window.devicePixelRatio || 1, 3);

let game = null;

// ── Abort & Return to Title ───────────────────
function returnToTitle() {
  bridge.cancelAll();
  if (game) {
    game.destroy(true);
    game = null;
  }
  document.getElementById('game-container').style.display = 'none';
  document.getElementById('title-screen').style.display = 'flex';
  addLog('Recalled by scroll');
}

// Expose for Phaser scenes
window.returnToTitle = returnToTitle;

// ── Bridge Connection ──────────────────────────
async function connectBridge() {
  const status = document.getElementById('bridge-status');
  try {
    await bridge.connect();
    status.textContent = 'Ready.';
    status.className = 'connected';
    addLog('Ready to kill');
  } catch (err) {
    status.textContent = 'The dungeon is unreachable. Start the server.';
    status.className = 'error';
    addLog('Server offline');
  }
}

// ── Launch Game ────────────────────────────────
function launchGame(domain, projectPath) {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';

  addLog(`Hunting: ${domain}`);
  addLog(`Source: ${projectPath}`);
  showLoadingIndicator();

  const dpr = window.GAME_DPR;
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: Math.round(800 * dpr),
    height: Math.round(600 * dpr),
    pixelArt: false,
    roundPixels: false,
    backgroundColor: '#0a0a1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, GateScene, SummoningScene, DungeonHallScene, BattleScene, VictoryScene]
  };

  game = new Phaser.Game(config);
  game.dpr = dpr;
  game.domain = domain;
  game.projectPath = projectPath;
  game.characterConfig = window.selectedCharacter || null;
  game.addLog = addLog;
  game.showLoading = showLoadingIndicator;
  game.hideLoading = hideLoadingIndicator;
}

// ── Title Screen Events ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Init animated systems
  initActivityLog();
  initKnightSprite();

  addLog('Waiting');

  const domainInput = document.getElementById('domain-input');
  const pathInput = document.getElementById('path-input');
  const btn = document.getElementById('descend-btn');
  const errorArea = document.getElementById('validation-errors');

  // ── Validation helpers ──────────────────────
  function cleanDomain(raw) {
    let d = raw.trim();
    d = d.replace(/^https?:\/\//i, '');
    d = d.replace(/\/+$/, '');
    return d;
  }

  function isDomainValid(raw) {
    const d = cleanDomain(raw);
    return d.length > 0 && d.includes('.');
  }

  function isPathValid(raw) {
    return raw.trim().length > 0;
  }

  function updateButtonState() {
    const domainOk = isDomainValid(domainInput.value);
    const pathOk = isPathValid(pathInput.value);
    btn.disabled = !(domainOk && pathOk);
    // Clear error area when both valid
    if (domainOk && pathOk) {
      errorArea.textContent = '';
    }
  }

  // ── Live validation on input ────────────────
  domainInput.addEventListener('input', () => {
    const val = domainInput.value.trim();
    if (val.length === 0) {
      domainInput.classList.remove('valid', 'invalid');
    } else if (isDomainValid(val)) {
      domainInput.classList.add('valid');
      domainInput.classList.remove('invalid');
    } else {
      domainInput.classList.add('invalid');
      domainInput.classList.remove('valid');
    }
    updateButtonState();
  });

  pathInput.addEventListener('input', () => {
    const val = pathInput.value.trim();
    if (val.length === 0) {
      pathInput.classList.remove('valid', 'invalid');
    } else {
      pathInput.classList.add('valid');
      pathInput.classList.remove('invalid');
    }
    updateButtonState();
  });

  // Show red border when user leaves an empty path field
  pathInput.addEventListener('blur', () => {
    if (pathInput.value.trim().length === 0) {
      pathInput.classList.add('invalid');
      pathInput.classList.remove('valid');
    }
  });

  // Show red border when user leaves domain with no dot
  domainInput.addEventListener('blur', () => {
    const val = domainInput.value.trim();
    if (val.length > 0 && !isDomainValid(val)) {
      domainInput.classList.add('invalid');
      domainInput.classList.remove('valid');
    } else if (val.length === 0) {
      domainInput.classList.remove('valid', 'invalid');
    }
  });

  // ── Launch with validation ──────────────────
  const launch = () => {
    const errors = [];
    if (!isDomainValid(domainInput.value)) {
      errors.push('Enter a valid domain');
      domainInput.classList.add('invalid');
      domainInput.classList.remove('valid');
    }
    if (!isPathValid(pathInput.value)) {
      errors.push('Project folder is required');
      pathInput.classList.add('invalid');
      pathInput.classList.remove('valid');
    }
    if (errors.length > 0) {
      errorArea.textContent = errors.join(' · ');
      return;
    }
    errorArea.textContent = '';
    const domain = cleanDomain(domainInput.value);
    const path = pathInput.value.trim();
    launchGame(domain, path);
  };

  btn.addEventListener('click', launch);
  domainInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });
  pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });

  // Set initial validation state from pre-filled values
  updateButtonState();
  if (domainInput.value.trim() && isDomainValid(domainInput.value)) {
    domainInput.classList.add('valid');
  }
  if (pathInput.value.trim()) {
    pathInput.classList.add('valid');
  }

  connectBridge();
  setTimeout(() => domainInput.focus(), 300);

  // ── Dev shortcut: ?battle=1 skips to battle with first cached demon ──
  const params = new URLSearchParams(window.location.search);
  if (params.get('battle')) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('seo_dungeon_audit_'));
    if (keys.length > 0) {
      const cached = JSON.parse(localStorage.getItem(keys[0]));
      if (cached?.auditData?.issues?.length) {
        const issueIdx = parseInt(params.get('issue') || '0', 10);
        const issue = cached.auditData.issues[issueIdx] || cached.auditData.issues[0];
        addLog(`DEV: jumping to battle — ${issue.title}`);
        document.getElementById('title-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        const dpr = window.GAME_DPR;
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: 'game-container',
          width: Math.round(800 * dpr), height: Math.round(600 * dpr),
          pixelArt: false, roundPixels: false,
          backgroundColor: '#0a0a1a',
          scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
          scene: [BootScene, GateScene, SummoningScene, DungeonHallScene, BattleScene, VictoryScene]
        });
        game.dpr = dpr;
        game.domain = cached.domain;
        game.auditData = cached.auditData;
        game.characterConfig = window.selectedCharacter || { model: cached.model };
        game.addLog = addLog;
        game.showLoading = showLoadingIndicator;
        game.hideLoading = hideLoadingIndicator;
        // After boot, jump straight to battle
        game.events.on('ready', () => {
          game.scene.start('Boot');
          // Wait for Boot to finish loading assets, then override to Battle
          game.scene.getScene('Boot').events.on('create', () => {
            game.scene.getScene('Boot').time.delayedCall(500, () => {
              game.scene.start('Battle', { issue });
            });
          });
        });
      }
    }
  }
});
