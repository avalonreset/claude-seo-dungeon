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
  document.getElementById('game-container').style.display = 'none';
  _fullBlackTransition('Ascending...', () => location.reload());
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

// ── Full Black Transition ──────────────────────────────
// True black overlay → label on black → fade out to next state.
// No blue tint, no jump cuts, fully opaque black between states.
function _fullBlackTransition(labelText, onComplete) {
  // Create a true black overlay that covers everything
  let overlay = document.getElementById('transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'transition-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 100000;
      background: #000; display: flex; align-items: center;
      justify-content: center; flex-direction: column; gap: 16px;
      opacity: 0; pointer-events: all;
      transition: opacity 0.6s ease-in-out;
    `;
    document.body.appendChild(overlay);
  }

  if (!document.getElementById('seal-spin-style')) {
    const s = document.createElement('style');
    s.id = 'seal-spin-style';
    s.textContent = '@keyframes sealSpin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  // Phase 1: Fade overlay to black
  overlay.innerHTML = '';
  overlay.style.opacity = '0';
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  // Phase 2: Once fully black, show label + spinner
  setTimeout(() => {
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      border: 2px solid #1a1a30; border-top-color: #d4af37;
      animation: sealSpin 0.7s linear infinite;
    `;
    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.cssText = `
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; color: #606078; letter-spacing: 2px;
      opacity: 0; transition: opacity 0.4s ease-out;
    `;
    overlay.appendChild(spinner);
    overlay.appendChild(label);

    // Fade label in gently
    requestAnimationFrame(() => { label.style.opacity = '1'; });

    // Phase 3: Hold, then fire callback behind the black overlay
    setTimeout(() => {
      onComplete();

      // Phase 4: Fade overlay away to reveal new content
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 650);
      }, 300);
    }, 1400);
  }, 650);
}

// ── Seal Your Fate Transition (descend into dungeon) ──
function _sealTransition(onComplete) {
  const titleScreen = document.getElementById('title-screen');

  // 1. Stagger-fade all title screen elements
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
    el.style.transition = `opacity 0.25s ease-in ${i * 0.06}s, transform 0.3s ease-in ${i * 0.06}s`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.95) translateY(8px)';
  });

  charOptions.forEach((el, i) => {
    el.style.transition = `opacity 0.4s ease-in ${0.2 + i * 0.08}s, transform 0.4s ease-in ${0.2 + i * 0.08}s`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.8)';
  });

  // 2. After elements fade, do the full black transition
  setTimeout(() => {
    _fullBlackTransition('Descending...', onComplete);
  }, 700);
}

// ── Launch Game ────────────────────────────────
function launchGame(domain, projectPath) {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game-container').style.display = 'block';
  document.getElementById('sfx-control').style.display = 'none';

  addLog(`Hunting: ${domain}`);
  addLog(`Source: ${projectPath}`);

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

  // ── Ledger Terminal ─────────────────────────
  const logInput = document.getElementById('log-input');
  const logInputBar = document.getElementById('log-input-bar');
  const logCancel = document.getElementById('log-cancel');
  let ledgerRequestId = null;
  let lastEscTime = 0;

  const sendLedgerCommand = async (text) => {
    if (!text.trim() || !bridge.connected) return;
    logInput.value = '';
    logInputBar.classList.add('running');
    showLoadingIndicator();
    addLog('> ' + text);

    try {
      const projectPath = document.getElementById('path-input')?.value?.trim() || '.';
      const model = window.selectedCharacter?.model || 'claude-sonnet-4-6';

      ledgerRequestId = bridge.requestId + 1;
      const result = await bridge.send(text, {
        onStream: (chunk) => {
          const clean = chunk.replace(/[\n\r]+/g, ' ').trim();
          if (clean.length > 0) addLog(clean);
        }
      });

      // Show result if there's a summary
      if (result?.data?.summary) {
        addLog(result.data.summary);
      }
    } catch (err) {
      if (err.message !== 'Cancelled by user') {
        addLog('Error: ' + (err.message || 'unknown'));
      }
    } finally {
      ledgerRequestId = null;
      logInputBar.classList.remove('running');
      hideLoadingIndicator();
    }
  };

  logInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && logInput.value.trim()) {
      e.preventDefault();
      sendLedgerCommand(logInput.value);
    }
    if (e.key === 'Escape') {
      const now = Date.now();
      if (now - lastEscTime < 500 && ledgerRequestId) {
        // Double-tap Escape = cancel
        bridge.cancel(ledgerRequestId);
        addLog('Cancelled.');
        logInputBar.classList.remove('running');
      }
      lastEscTime = now;
    }
  });

  // Global Escape handler for cancel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const now = Date.now();
      if (now - lastEscTime < 500 && ledgerRequestId) {
        bridge.cancel(ledgerRequestId);
        addLog('Cancelled.');
        logInputBar.classList.remove('running');
        ledgerRequestId = null;
      }
      lastEscTime = now;
    }
  });

  logCancel.addEventListener('click', () => {
    if (ledgerRequestId) {
      bridge.cancel(ledgerRequestId);
      addLog('Cancelled.');
      logInputBar.classList.remove('running');
      ledgerRequestId = null;
    }
  });

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
