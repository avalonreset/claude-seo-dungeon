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
import { SFX } from './utils/sound-manager.js';

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
  const gameContainer = document.getElementById('game-container');
  gameContainer.style.display = 'none';

  // Reuse the same cinematic transition but with "Ascending..."
  const titleScreen = document.getElementById('title-screen');
  const gameArea = document.getElementById('game-area');
  titleScreen.style.display = 'flex';
  addLog('Recalled by scroll');

  _cinematicTransition('Ascending...', () => {
    location.reload();
  });
}

// Expose for Phaser scenes
window.returnToTitle = returnToTitle;

// ── Bridge Connection ──────────────────────────
function _createDisconnectBanner() {
  if (document.getElementById('bridge-disconnect-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'bridge-disconnect-banner';
  banner.innerHTML = '&#9888; BRIDGE SERVER DISCONNECTED &mdash; Run <code>npm run server</code> in the dungeon/ directory';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: linear-gradient(90deg, #8b0000, #cc2200, #8b0000);
    color: #fff; font-family: 'JetBrains Mono', monospace; font-size: 14px;
    font-weight: bold; text-align: center; padding: 10px 20px;
    letter-spacing: 1px; box-shadow: 0 2px 20px rgba(200, 0, 0, 0.6);
    animation: bannerPulse 2s ease-in-out infinite;
  `;
  if (!document.getElementById('banner-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'banner-pulse-style';
    s.textContent = `
      @keyframes bannerPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.8; } }
      #bridge-disconnect-banner code {
        background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px; font-size: 13px;
      }
    `;
    document.head.appendChild(s);
  }
  document.body.appendChild(banner);
}

function _removeDisconnectBanner() {
  const banner = document.getElementById('bridge-disconnect-banner');
  if (banner) banner.remove();
}

async function connectBridge() {
  const status = document.getElementById('bridge-status');

  // Listen for connection state changes globally
  bridge.onStatusChange((connected) => {
    if (connected) {
      _removeDisconnectBanner();
      // Update title screen status if visible
      if (status) {
        status.textContent = 'Ready.';
        status.className = 'connected';
      }
    } else {
      _createDisconnectBanner();
      addLog('Bridge disconnected!');
      if (status) {
        status.textContent = 'Bridge disconnected — reconnecting...';
        status.className = 'error';
      }
    }
  });

  try {
    await bridge.connect();
    addLog('Ready to kill');
  } catch (err) {
    status.textContent = 'The dungeon is unreachable. Start the server.';
    status.className = 'error';
    addLog('Server offline');
  }
}

// ── Cinematic Transition (shared by descend & ascend) ──
function _cinematicTransition(labelText, onComplete) {
  const titleScreen = document.getElementById('title-screen');
  const gameArea = document.getElementById('game-area');

  // 1. Fade the whole area to black first
  gameArea.style.transition = 'opacity 0.5s ease-in';
  gameArea.style.opacity = '0';

  // 2. Once black, swap content to spinner + label, then fade up
  setTimeout(() => {
    titleScreen.innerHTML = '';
    titleScreen.style.display = 'flex';
    titleScreen.style.alignItems = 'center';
    titleScreen.style.justifyContent = 'center';
    titleScreen.style.flexDirection = 'column';
    titleScreen.style.gap = '16px';

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid #1a1a30;
      border-top-color: #d4af37;
      animation: sealSpin 0.7s linear infinite;
    `;
    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.cssText = `
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: #606078;
      letter-spacing: 2px;
    `;

    if (!document.getElementById('seal-spin-style')) {
      const style = document.createElement('style');
      style.id = 'seal-spin-style';
      style.textContent = '@keyframes sealSpin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    titleScreen.appendChild(spinner);
    titleScreen.appendChild(label);

    // Fade up from black to reveal spinner + label
    gameArea.style.transition = 'opacity 0.5s ease-out';
    gameArea.style.opacity = '1';

    // 3. Hold for a beat, then fade to black again and fire callback
    setTimeout(() => {
      gameArea.style.transition = 'opacity 0.5s ease-in';
      gameArea.style.opacity = '0';

      setTimeout(() => {
        onComplete();
        gameArea.style.transition = 'opacity 0.5s ease-out';
        gameArea.style.opacity = '1';
      }, 550);
    }, 1500);
  }, 550);
}

// ── Blood Seal Transition (descend into dungeon) ──
function _sealTransition(onComplete) {
  const titleScreen = document.getElementById('title-screen');

  // 1. Stagger-fade all title screen elements before the cinematic
  const elements = [
    titleScreen.querySelector('.tagline'),
    titleScreen.querySelector('#descend-btn'),
    titleScreen.querySelector('#bridge-status'),
    ...titleScreen.querySelectorAll('.form-group'),
    titleScreen.querySelector('.subtitle'),
    titleScreen.querySelector('h1'),
  ].filter(Boolean);

  const charOptions = titleScreen.querySelectorAll('.char-option');

  elements.forEach((el, i) => {
    el.style.transition = `opacity ${0.25}s ease-in ${i * 0.06}s, transform 0.3s ease-in ${i * 0.06}s`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.95) translateY(8px)';
  });

  charOptions.forEach((el, i) => {
    el.style.transition = `opacity 0.4s ease-in ${0.2 + i * 0.08}s, transform 0.4s ease-in ${0.2 + i * 0.08}s`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
  });

  // After elements fade, run the shared cinematic
  setTimeout(() => {
    _cinematicTransition('Descending...', onComplete);
  }, 700);
}

// ── Launch Game ────────────────────────────────
function launchGame(domain, projectPath) {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  document.getElementById('sfx-control').style.display = 'none';

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

  // ── SFX Volume Control ─────────────────────
  const sfxToggle = document.getElementById('sfx-toggle');
  const sfxVolume = document.getElementById('sfx-volume');
  let sfxMuted = false;
  let sfxPrevVol = SFX.getVolume();

  // Load saved preference
  try {
    const saved = localStorage.getItem('sfx_volume');
    if (saved !== null) {
      const v = parseFloat(saved);
      SFX.setVolume(v);
      sfxVolume.value = Math.round(v * 100);
      if (v === 0) { sfxMuted = true; sfxToggle.classList.add('muted'); sfxToggle.textContent = '\uD83D\uDD07'; }
    }
  } catch (_) {}

  sfxVolume.addEventListener('input', () => {
    const v = parseInt(sfxVolume.value) / 100;
    SFX.setVolume(v);
    sfxMuted = v === 0;
    sfxToggle.classList.toggle('muted', sfxMuted);
    sfxToggle.textContent = sfxMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A';
    sfxPrevVol = v || sfxPrevVol;
    try { localStorage.setItem('sfx_volume', String(v)); } catch (_) {}
  });

  sfxToggle.addEventListener('click', () => {
    sfxMuted = !sfxMuted;
    if (sfxMuted) {
      sfxPrevVol = SFX.getVolume() || sfxPrevVol || 0.35;
      SFX.setVolume(0);
      sfxVolume.value = 0;
      sfxToggle.textContent = '\uD83D\uDD07';
    } else {
      SFX.setVolume(sfxPrevVol);
      sfxVolume.value = Math.round(sfxPrevVol * 100);
      sfxToggle.textContent = '\uD83D\uDD0A';
    }
    sfxToggle.classList.toggle('muted', sfxMuted);
    try { localStorage.setItem('sfx_volume', String(SFX.getVolume())); } catch (_) {}
  });

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
    btn.disabled = !(domainOk && pathOk && bridge.connected);
    // Clear error area when both valid
    if (domainOk && pathOk) {
      errorArea.textContent = bridge.connected ? '' : 'Bridge server not connected';
    }
  }

  // Re-check button state when bridge connection changes
  bridge.onStatusChange(() => updateButtonState());

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
    btn.disabled = true;
    SFX.play('menuConfirm');
    const domain = cleanDomain(domainInput.value);
    const path = pathInput.value.trim();
    _sealTransition(() => launchGame(domain, path));
  };

  btn.addEventListener('click', launch);
  btn.addEventListener('mouseenter', () => { if (!btn.disabled) SFX.play('menuHover'); });
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
      let cached; try { cached = JSON.parse(localStorage.getItem(keys[0])); } catch (_) {}
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
