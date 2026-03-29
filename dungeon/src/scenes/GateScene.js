import { CHARACTERS } from '../knight-sprite.js';

// Lookup: model ID → character key
const MODEL_TO_CHAR = {};
for (const [charKey, cfg] of Object.entries(CHARACTERS)) {
  MODEL_TO_CHAR[cfg.model] = charKey;
}

/**
 * GateScene — "Choose your path" checkpoint between Boot and Summoning.
 * Checks localStorage for cached audit data and presents continue/restart options.
 * If no cached data exists, auto-transitions to Summoning after a brief pause.
 *
 * Text is rendered as an HTML overlay for native-resolution font quality,
 * matching the Guild Ledger's JetBrains Mono rendering.
 */
export class GateScene extends Phaser.Scene {
  constructor() {
    super('Gate');
  }

  init(data) {
    this.domain = data.domain;
    this.projectPath = data.projectPath;
  }

  create() {
    const W = 800;
    const H = 600;
    const cx = W / 2;

    this.cameras.main.setBackgroundColor(0x05050f);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Check for cached audit data across all three models
    const MODELS = [
      { key: 'claude-opus-4-6', label: 'Opus', color: '#d4af37', charName: 'Warrior' },
      { key: 'claude-sonnet-4-6', label: 'Sonnet', color: '#88bbff', charName: 'Samurai' },
      { key: 'claude-haiku-4-5-20251001', label: 'Haiku', color: '#66ddaa', charName: 'Knight' }
    ];

    this.cachedRuns = [];
    for (const m of MODELS) {
      try {
        const raw = localStorage.getItem(`seo_dungeon_audit_${this.domain}_${m.key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.auditData) {
            this.cachedRuns.push({ ...m, cached: parsed });
          }
        }
      } catch (_) {}
    }

    // Also check legacy cache key (before model split) and migrate it
    try {
      const legacyRaw = localStorage.getItem(`seo_dungeon_audit_${this.domain}`);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && legacy.auditData && !legacy.model) {
          // Migrate to current model's cache slot
          const currentModel = this.game.characterConfig?.model || 'claude-sonnet-4-6';
          localStorage.setItem(`seo_dungeon_audit_${this.domain}_${currentModel}`, JSON.stringify({
            ...legacy, model: currentModel
          }));
          localStorage.removeItem(`seo_dungeon_audit_${this.domain}`);
          const modelInfo = MODELS.find(m => m.key === currentModel);
          if (modelInfo && !this.cachedRuns.find(r => r.key === currentModel)) {
            this.cachedRuns.push({ ...modelInfo, cached: legacy });
          }
        }
      }
    } catch (_) {}

    // No cached data — skip straight to Summoning
    if (this.cachedRuns.length === 0) {
      this._drawBackground(W, H);
      this.time.delayedCall(400, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(400, () => {
          this.scene.start('Summoning', {
            domain: this.domain,
            projectPath: this.projectPath
          });
        });
      });
      return;
    }

    // ── Cached data exists — show choice screen ──────────────────
    this._drawBackground(W, H);
    this._createEmbers(W, H);
    this._createAbandonScroll(W);
    this._drawVignette(W, H);

    // ── Character sprite (idle with periodic attack flourish) ─────
    const cfg = this.game.characterConfig;
    const feetY = cfg.runGroundY || cfg.groundY;
    const originY = feetY / cfg.frameH;
    this.knight = this.add.sprite(cx, H * 0.52, 'char_idle')
      .setOrigin(0.5, originY)
      .setScale(2.5)
      .setDepth(10)
      .play('char_idle_anim');

    // Build pool of available flourish animations for this character
    const flourishAnims = ['char_attack_anim'];
    if (cfg.extraAnims) {
      for (const anim of cfg.extraAnims) {
        flourishAnims.push(anim.key + '_anim');
      }
    }

    // Animation cycle: idle → (maybe flip) → idle hold → flourish → idle → repeat
    let lastAnim = '';
    let busy = false;

    const runCycle = () => {
      if (!this.knight || !this.knight.active) return;
      if (Math.random() > 0.5) {
        this.knight.setFlipX(!this.knight.flipX);
      }
      const idleHold = 1000 + Math.random() * 1000;
      this.time.delayedCall(idleHold, () => {
        if (!this.knight || !this.knight.active) return;
        let pick;
        do {
          pick = flourishAnims[Math.floor(Math.random() * flourishAnims.length)];
        } while (pick === lastAnim && flourishAnims.length > 1);
        lastAnim = pick;
        busy = true;
        this.knight.play(pick);
        this.knight.once('animationcomplete', () => {
          busy = false;
          if (!this.knight || !this.knight.active) return;
          this.knight.play('char_idle_anim');
          const restDelay = 3000 + Math.random() * 3000;
          this.time.delayedCall(restDelay, runCycle);
        });
      });
    };

    this.time.delayedCall(2000 + Math.random() * 2000, runCycle);

    // ── HTML Overlay for text ────────────────────────────────────
    this._createHTMLOverlay();
  }

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  _createHTMLOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'gate-overlay';

    const ALL_MODELS = [
      { key: 'claude-opus-4-6', label: 'Opus', color: '#d4af37', charName: 'Warrior' },
      { key: 'claude-sonnet-4-6', label: 'Sonnet', color: '#88bbff', charName: 'Samurai' },
      { key: 'claude-haiku-4-5-20251001', label: 'Haiku', color: '#66ddaa', charName: 'Knight' }
    ];

    const cachedByKey = {};
    for (const run of this.cachedRuns) {
      cachedByKey[run.key] = run.cached;
    }

    // Build three columns — one per character/model
    // Each column has 1 card (uncached) or 2 cards (cached: continue + re-run)
    let columnsHTML = '';
    for (const m of ALL_MODELS) {
      const cached = cachedByKey[m.key];

      let cardsHTML = '';
      if (cached) {
        // Card 1: Continue Quest (resume cached data)
        const ts = cached.timestamp;
        const dateStr = ts ? new Date(ts).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit'
        }) : 'Unknown';
        const timeAgo = ts ? this._timeAgo(ts) : '';
        const issues = cached.auditData.issues || [];
        const remaining = Array.isArray(issues) ? issues.filter(i => !i.defeated && !i.fixed).length : 0;
        const total = issues.length;
        const defeated = total - remaining;

        cardsHTML += `
          <div class="gate-card gate-card-continue" data-model="${m.key}" data-action="resume" style="--accent: ${m.color};">
            <div class="gate-card-label" style="color: ${m.color};">Continue Quest</div>
            <div class="gate-card-time dim">${timeAgo} &middot; ${dateStr}</div>
            <div class="gate-card-stat">
              <span class="stat-demons">${remaining} demons remain</span>
              ${defeated > 0 ? `<span class="stat-slain">${defeated} of ${total} slain</span>` : ''}
            </div>
          </div>`;

        // Card 2: New Quest (wipe cache, run fresh)
        cardsHTML += `
          <div class="gate-card gate-card-new" data-model="${m.key}" data-action="rerun" style="--accent: ${m.color};">
            <div class="gate-card-label gate-card-label-new">New Quest</div>
            <div class="gate-card-sub dim">Abandon progress. Descend anew.</div>
          </div>`;
      } else {
        // Single card: Begin Quest (no cached data)
        cardsHTML += `
          <div class="gate-card gate-card-begin" data-model="${m.key}" data-action="new" style="--accent: ${m.color};">
            <div class="gate-card-label" style="color: ${m.color};">Begin Quest</div>
            <div class="gate-card-sub dim">Unexplored territory.</div>
          </div>`;
      }

      columnsHTML += `
        <div class="gate-column" style="--accent: ${m.color};">
          <div class="gate-col-header">
            <div class="gate-col-name" style="color: ${m.color};">${m.charName}</div>
            <div class="gate-col-model" style="color: ${m.color}; border-color: ${m.color}40;">${m.label}</div>
          </div>
          <div class="gate-col-cards">${cardsHTML}</div>
        </div>`;
    }

    overlay.innerHTML = `
      <div class="gate-title">THE GATE AWAITS</div>
      <div class="gate-domain">${this.domain}</div>
      <div class="gate-section-label">Choose Your Path</div>
      <div class="gate-columns">${columnsHTML}</div>
      <div class="gate-rune" id="gate-rune" title="Sever the link">&#x2715;</div>
    `;

    const style = document.createElement('style');
    style.id = 'gate-overlay-style';
    style.textContent = `
      #gate-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        font-family: 'JetBrains Mono', monospace;
        z-index: 10;
        padding-top: 4%;
      }
      #gate-overlay > * { pointer-events: auto; }

      .gate-title {
        font-size: 22px;
        font-weight: 600;
        color: #d4af37;
        letter-spacing: 8px;
        text-shadow: 0 0 40px rgba(212, 175, 55, 0.15);
        margin-bottom: 4px;
      }
      .gate-domain {
        font-size: 13px;
        color: #88bbff;
        margin-bottom: 14px;
      }
      .gate-section-label {
        font-size: 11px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: #606078;
        margin-bottom: 16px;
      }

      /* ── Three-column layout ── */
      .gate-columns {
        display: flex;
        gap: 20px;
        margin-top: auto;
        margin-bottom: 8%;
      }
      .gate-column {
        width: 220px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .gate-col-header {
        text-align: center;
        margin-bottom: 4px;
      }
      .gate-col-name {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .gate-col-model {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        border: 1px solid;
        border-radius: 3px;
        padding: 2px 8px;
        display: inline-block;
      }
      .gate-col-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      /* ── Individual cards ── */
      .gate-card {
        width: 100%;
        padding: 14px 16px;
        background: rgba(12, 12, 20, 0.88);
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
      }
      .gate-card:hover {
        transform: translateY(-1px);
      }
      .gate-card:active {
        transform: translateY(0);
      }

      /* Continue Quest card — prominent */
      .gate-card-continue {
        border: 1.5px solid color-mix(in srgb, var(--accent) 30%, transparent);
      }
      .gate-card-continue:hover {
        border-color: var(--accent);
        background: rgba(20, 18, 28, 0.94);
        box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 12%, transparent);
      }

      /* New Quest (re-run) card — subdued */
      .gate-card-new {
        border: 1px solid #2a2030;
      }
      .gate-card-new:hover {
        border-color: #cc4444;
        background: rgba(28, 14, 14, 0.92);
        box-shadow: 0 0 16px rgba(204, 68, 68, 0.06);
      }

      /* Begin Quest (unexplored) card */
      .gate-card-begin {
        border: 1.5px dashed color-mix(in srgb, var(--accent) 22%, transparent);
      }
      .gate-card-begin:hover {
        border-style: solid;
        border-color: var(--accent);
        background: rgba(20, 18, 28, 0.94);
        box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 12%, transparent);
      }

      .gate-card-label {
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      .gate-card-label-new {
        color: #884444;
      }
      .gate-card-sub {
        font-size: 10px;
        line-height: 1.5;
      }
      .gate-card-time {
        font-size: 10px;
        margin-bottom: 4px;
      }
      .gate-card-stat {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .stat-demons { color: #cc4444; font-size: 11px; font-weight: 600; }
      .stat-slain { color: #505068; font-size: 10px; }

      .dim { color: #606078; }

      .gate-rune {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #661111;
        border: 1.5px solid #661111;
        border-radius: 50%;
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s;
        pointer-events: auto;
      }
      .gate-rune:hover {
        color: #dd3333;
        border-color: #aa2222;
      }
    `;

    const container = document.getElementById('game-container');
    container.style.position = 'relative';
    container.appendChild(style);
    container.appendChild(overlay);

    // ── Click handlers ──

    // Resume (continue cached quest)
    overlay.querySelectorAll('[data-action="resume"]').forEach(card => {
      card.addEventListener('click', () => {
        const modelKey = card.dataset.model;
        const cached = cachedByKey[modelKey];
        if (!cached) return;
        this.game.auditData = cached.auditData;
        this._switchCharacterAndGo(modelKey, 'DungeonHall');
      });
    });

    // Re-run (wipe cache, run fresh with same model)
    overlay.querySelectorAll('[data-action="rerun"]').forEach(card => {
      card.addEventListener('click', () => {
        const modelKey = card.dataset.model;
        try { localStorage.removeItem(`seo_dungeon_audit_${this.domain}_${modelKey}`); } catch (_) {}
        this._switchCharacterAndGo(modelKey, 'Summoning');
      });
    });

    // Begin (unexplored model, run fresh)
    overlay.querySelectorAll('[data-action="new"]').forEach(card => {
      card.addEventListener('click', () => {
        const modelKey = card.dataset.model;
        this._switchCharacterAndGo(modelKey, 'Summoning');
      });
    });

    // Abandon (return to title)
    document.getElementById('gate-rune').addEventListener('click', () => {
      if (this.game.addLog) this.game.addLog('The link is severed.');
      this._removeOverlay();
      this.cameras.main.fadeOut(600, 30, 0, 0);
      this.time.delayedCall(600, () => {
        window.returnToTitle();
      });
    });

    this._overlayEl = overlay;
    this._styleEl = style;
  }

  /**
   * Switch to a different character/model and navigate to a destination scene.
   * If the model matches the currently loaded character, go directly.
   * If different, swap the full character config and restart Boot to reload sprites.
   */
  _switchCharacterAndGo(modelKey, destScene, destData = {}) {
    const currentModel = this.game.characterConfig?.model;
    const needsReload = modelKey !== currentModel;

    if (needsReload) {
      // Look up the full character config for this model
      const charKey = MODEL_TO_CHAR[modelKey];
      if (charKey && CHARACTERS[charKey]) {
        this.game.characterConfig = { ...CHARACTERS[charKey] };
      } else {
        // Fallback: just override the model
        this.game.characterConfig.model = modelKey;
      }

      // Set pending destination so Boot knows where to go after reloading sprites
      this.game.pendingDestination = { scene: destScene, data: destData };

      this._removeOverlay();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('Boot');
      });
    } else {
      // Same character — go directly, no reload needed
      this._removeOverlay();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start(destScene, {
          domain: this.domain,
          projectPath: this.projectPath,
          ...destData
        });
      });
    }
  }

  _removeOverlay() {
    if (this._overlayEl) this._overlayEl.remove();
    if (this._styleEl) this._styleEl.remove();
  }

  // Clean up on scene shutdown
  shutdown() {
    this._removeOverlay();
  }

  // ── Dark gradient background ───────────────────────────────────
  _drawBackground(W, H) {
    const bg = this.add.graphics().setDepth(0);
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(5 + t * 8);
      const g = Math.floor(5 + t * 5);
      const b = Math.floor(15 + t * 10);
      const color = (r << 16) | (g << 8) | b;
      const y = (i / steps) * H;
      const h = H / steps + 1;
      bg.fillStyle(color, 1);
      bg.fillRect(0, y, W, h);
    }
  }

  // ── Drifting ember particles ───────────────────────────────────
  _createEmbers(W, H) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0xffaa44, 1);
    gfx.fillCircle(4, 4, 3);
    gfx.fillStyle(0xff6622, 0.6);
    gfx.fillCircle(4, 4, 2);
    gfx.generateTexture('gate_ember', 8, 8);
    gfx.destroy();

    this.embers = [];
    for (let i = 0; i < 30; i++) {
      const ember = this.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, H),
        'gate_ember'
      )
        .setScale(Phaser.Math.FloatBetween(0.15, 0.5))
        .setAlpha(Phaser.Math.FloatBetween(0.1, 0.4))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(5);

      ember._vx = Phaser.Math.FloatBetween(-8, 8);
      ember._vy = Phaser.Math.FloatBetween(-25, -8);
      ember._flickerSpeed = Phaser.Math.FloatBetween(0.002, 0.006);
      ember._baseAlpha = ember.alpha;
      this.embers.push(ember);
    }
  }

  // ── Vignette overlay ───────────────────────────────────────────
  _drawVignette(W, H) {
    const v = this.add.graphics().setDepth(40);
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0);
    v.fillRect(0, 0, W, 80);
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8);
    v.fillRect(0, H - 80, W, 80);
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.5, 0, 0, 0.5);
    v.fillRect(0, 0, 60, H);
    v.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.5, 0.5, 0);
    v.fillRect(W - 60, 0, 60, H);
  }

  // ── Abandon Scroll Rune (Phaser, fallback — not used when HTML overlay active)
  _createAbandonScroll() {
    // Handled by HTML overlay rune instead
  }

  update(time) {
    if (!this.embers) return;
    for (const ember of this.embers) {
      ember.x += ember._vx * 0.016;
      ember.y += ember._vy * 0.016;
      ember.alpha = ember._baseAlpha + Math.sin(time * ember._flickerSpeed) * 0.15;
      if (ember.y < -10) {
        ember.y = 610;
        ember.x = Phaser.Math.Between(0, 800);
      }
      if (ember.x < -10) ember.x = 810;
      if (ember.x > 810) ember.x = -10;
    }
  }
}
