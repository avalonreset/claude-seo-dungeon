import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Summoning scene — knight descends into a torchlit dungeon corridor while audit runs.
 * Atmospheric loading screen with particle effects, animated torches, and glowing progress bar.
 * Transitions to DungeonHall once audit completes.
 */
export class SummoningScene extends Phaser.Scene {
  constructor() {
    super('Summoning');
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
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // ── Stone Brick Wall Background ──────────────────────────────
    this._drawStoneWalls(W, H);

    // ── Corridor Darkness Gradient (depth illusion) ──────────────
    this._drawCorridorDepth(cx, W, H);

    // ── Torch Flames (left and right walls) ──────────────────────
    this.torchesLeft = [];
    this.torchesRight = [];
    this._createTorches(cx, H);

    // ── Floating Embers (rising from below) ──────────────────────
    this._createEmbers(W, H);

    // ── Dust Motes (slow ambient drift) ──────────────────────────
    this._createDustMotes(W, H);

    // ── Magical Sparkles (around knight path) ────────────────────
    this._createSparkles(cx);

    // ── Title Text ───────────────────────────────────────────────
    const titleText = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ffcc44',
      letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0);

    // Title glow (underneath)
    const titleGlow = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#ff8800',
      letterSpacing: 2
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: [titleText],
      alpha: 1,
      duration: 1500,
      ease: 'Sine.easeIn'
    });
    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0, to: 0.35 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Decorative swords flanking title
    const swordLeft = this.add.text(cx - 210, 38, '\u2694', {
      fontSize: '18px', color: '#aa8844'
    }).setOrigin(0.5).setAlpha(0.7);
    const swordRight = this.add.text(cx + 210, 38, '\u2694', {
      fontSize: '18px', color: '#aa8844'
    }).setOrigin(0.5).setAlpha(0.7).setFlipX(true);

    // ── Domain Name Display ──────────────────────────────────────
    // Domain glow layer
    this.add.text(cx, 66, this.domain, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#4488ff',
    }).setOrigin(0.5).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);

    const domainText = this.add.text(cx, 66, this.domain, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#88bbff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: domainText,
      alpha: { from: 0.7, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // ── Knight Character ─────────────────────────────────────────
    this.knight = this.add.image(cx, 140, 'knight').setScale(2.5).setDepth(10);

    // Knight ambient glow (lantern light)
    this.knightGlow = this.add.circle(cx, 160, 60, 0xff8833, 0.08).setDepth(9);
    this.knightGlowInner = this.add.circle(cx, 160, 30, 0xffaa44, 0.12).setDepth(9);

    // Knight descending tween
    this.tweens.add({
      targets: this.knight,
      y: 360,
      duration: 10000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    this.tweens.add({
      targets: [this.knightGlow, this.knightGlowInner],
      y: '+=220',
      duration: 10000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Knight glow breathing
    this.tweens.add({
      targets: this.knightGlow,
      scaleX: 1.4, scaleY: 1.4, alpha: 0.04,
      duration: 1800, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: this.knightGlowInner,
      scaleX: 1.3, scaleY: 1.3, alpha: 0.06,
      duration: 1200, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Atmospheric Status Message ───────────────────────────────
    this.messageText = this.add.text(cx, 430, 'Summoning the audit spirits...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#66cccc',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(20);

    // Message glow
    this.messageGlow = this.add.text(cx, 430, 'Summoning the audit spirits...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#44aaaa',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(19).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);

    // ── Stream / Activity Text ───────────────────────────────────
    this.streamText = this.add.text(cx, 458, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#7766aa',
      wordWrap: { width: 650 }
    }).setOrigin(0.5).setDepth(20).setAlpha(0.8);

    // ── Demon Counter ────────────────────────────────────────────
    this.demonCounter = this.add.text(cx, 482, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: '#cc4444'
    }).setOrigin(0.5).setDepth(20);

    // ── Log area ─────────────────────────────────────────────────
    this.logTexts = [];
    this.logY = 510;

    // ── Progress Bar ─────────────────────────────────────────────
    this._createProgressBar(cx);

    // ── Vignette Overlay (darkened corners) ──────────────────────
    this._drawVignette(W, H);

    // ── Atmospheric Messages ─────────────────────────────────────
    this.flavorMessages = [
      'Scanning the dark corridors...',
      'Detecting hostile entities...',
      'Mapping the dungeon layout...',
      'Analyzing threat levels...',
      'Identifying demon weaknesses...',
      'Forging battle strategy...',
      'The spirits speak of many foes...',
      'Preparing your arsenal...',
      'Darkness reveals its secrets...',
      'Almost there, brave knight...'
    ];
    this.messageIndex = 0;

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        this.messageIndex = (this.messageIndex + 1) % this.flavorMessages.length;
        const msg = this.flavorMessages[this.messageIndex];
        this.messageText.setText(msg);
        this.messageGlow.setText(msg);
        // Fade-in effect on message change
        this.messageText.setAlpha(0);
        this.messageGlow.setAlpha(0);
        this.tweens.add({
          targets: this.messageText,
          alpha: 1,
          duration: 800,
          ease: 'Sine.easeIn'
        });
        this.tweens.add({
          targets: this.messageGlow,
          alpha: 0.3,
          duration: 800,
          ease: 'Sine.easeIn'
        });
      },
      loop: true
    });

    // Track stream activity
    this.streamChunks = 0;

    // Ambient screen pulse (very subtle)
    this._ambientPulse();

    // Start audit
    this.runAudit();
  }

  // ═══════════════════════════════════════════════════════════════
  // VISUAL CONSTRUCTION HELPERS
  // ═══════════════════════════════════════════════════════════════

  _drawStoneWalls(W, H) {
    const g = this.add.graphics().setDepth(0);

    // Base dark fill
    g.fillStyle(0x111122, 1);
    g.fillRect(0, 0, W, H);

    // Draw stone bricks
    const brickW = 64;
    const brickH = 32;
    const rows = Math.ceil(H / brickH) + 1;
    const cols = Math.ceil(W / brickW) + 1;

    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (brickW / 2); // offset every other row
      for (let col = -1; col < cols; col++) {
        const bx = col * brickW + offset;
        const by = row * brickH;

        // Brick face - subtle color variation
        const shade = 0x14 + Phaser.Math.Between(-2, 3);
        const r = shade + Phaser.Math.Between(0, 2);
        const gb = shade + Phaser.Math.Between(-1, 1);
        const brickColor = (r << 16) | (gb << 8) | (gb - 2);
        g.fillStyle(brickColor, 0.9);
        g.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);

        // Mortar lines (dark gaps)
        g.fillStyle(0x080810, 0.8);
        g.fillRect(bx, by, brickW, 1); // top mortar
        g.fillRect(bx, by, 1, brickH); // left mortar

        // Subtle highlight on top-left of each brick
        g.fillStyle(0x222238, 0.4);
        g.fillRect(bx + 2, by + 2, brickW - 4, 1);
        g.fillRect(bx + 2, by + 2, 1, brickH - 4);

        // Random imperfections
        if (Math.random() < 0.15) {
          g.fillStyle(0x0a0a16, 0.5);
          const dx = Phaser.Math.Between(4, brickW - 10);
          const dy = Phaser.Math.Between(4, brickH - 10);
          g.fillRect(bx + dx, by + dy, Phaser.Math.Between(3, 8), Phaser.Math.Between(2, 4));
        }
      }
    }
  }

  _drawCorridorDepth(cx, W, H) {
    const g = this.add.graphics().setDepth(1);

    // Central corridor lighter area (distant light from above)
    const corridorW = 300;
    g.fillStyle(0x1a1a30, 0.3);
    g.fillRect(cx - corridorW / 2, 0, corridorW, H);

    // Gradient darkening on sides (left)
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000008, 0.06);
      g.fillRect(0, 0, 100 + i * 20, H);
    }
    // Right side
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000008, 0.06);
      g.fillRect(W - 100 - i * 20, 0, 100 + i * 20, H);
    }

    // Floor gradient at bottom (darker = further)
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x000005, 0.08);
      g.fillRect(0, H - 120 + i * 20, W, 20);
    }
  }

  _createTorches(cx, H) {
    const torchPositions = [
      { x: cx - 180, y: 160 },
      { x: cx + 180, y: 160 },
      { x: cx - 200, y: 320 },
      { x: cx + 200, y: 320 },
    ];

    torchPositions.forEach((pos, idx) => {
      // Torch bracket (small dark rectangle)
      const bracket = this.add.graphics().setDepth(5);
      bracket.fillStyle(0x3a3028, 1);
      bracket.fillRect(pos.x - 4, pos.y + 8, 8, 14);
      bracket.fillStyle(0x2a2018, 1);
      bracket.fillRect(pos.x - 3, pos.y + 8, 6, 12);

      // Wall glow from torch
      const wallGlow = this.add.circle(pos.x, pos.y, 80, 0xff6622, 0.04).setDepth(2);
      this.tweens.add({
        targets: wallGlow,
        alpha: { from: 0.03, to: 0.07 },
        scaleX: { from: 0.9, to: 1.1 },
        scaleY: { from: 0.9, to: 1.1 },
        duration: 500 + idx * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Flame core layers
      this._createFlame(pos.x, pos.y, idx);
    });
  }

  _createFlame(x, y, seed) {
    // Outer flame glow
    const outerGlow = this.add.circle(x, y - 4, 18, 0xff4400, 0.12).setDepth(6);
    // Middle flame
    const midFlame = this.add.circle(x, y - 6, 10, 0xff8822, 0.25).setDepth(7);
    // Inner bright core
    const core = this.add.circle(x, y - 4, 5, 0xffcc44, 0.5).setDepth(8);
    // Tip
    const tip = this.add.circle(x, y - 12, 3, 0xffee88, 0.4).setDepth(8);

    const baseDelay = seed * 137; // offset each flame

    this.tweens.add({
      targets: outerGlow,
      alpha: { from: 0.08, to: 0.16 },
      scaleX: { from: 0.85, to: 1.15 },
      scaleY: { from: 0.9, to: 1.2 },
      y: y - 6,
      duration: 300 + (seed * 50),
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: baseDelay
    });
    this.tweens.add({
      targets: midFlame,
      alpha: { from: 0.2, to: 0.35 },
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.85, to: 1.3 },
      y: y - 8,
      duration: 250 + (seed * 40),
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: baseDelay + 50
    });
    this.tweens.add({
      targets: core,
      alpha: { from: 0.4, to: 0.65 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.15 },
      duration: 200 + (seed * 30),
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: baseDelay + 80
    });
    this.tweens.add({
      targets: tip,
      alpha: { from: 0.2, to: 0.5 },
      y: y - 16,
      x: x + Phaser.Math.Between(-2, 2),
      scaleY: { from: 0.7, to: 1.4 },
      duration: 200 + (seed * 25),
      yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
      delay: baseDelay + 100
    });
  }

  _createEmbers(W, H) {
    for (let i = 0; i < 40; i++) {
      const startX = Phaser.Math.Between(50, W - 50);
      const startY = Phaser.Math.Between(H + 10, H + 100);
      const size = Phaser.Math.FloatBetween(1, 2.5);
      const orangeShade = Phaser.Math.Between(0, 1) === 0 ? 0xf08020 : 0xff6633;
      const ember = this.add.circle(startX, startY, size, orangeShade, 0.7).setDepth(15);

      this.tweens.add({
        targets: ember,
        y: Phaser.Math.Between(-20, H * 0.3),
        x: startX + Phaser.Math.Between(-80, 80),
        alpha: 0,
        scaleX: { from: 1, to: 0.3 },
        scaleY: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        ease: 'Sine.easeOut',
        onRepeat: (tween, target) => {
          target.x = Phaser.Math.Between(50, W - 50);
          target.y = Phaser.Math.Between(H + 10, H + 100);
          target.alpha = 0.7;
        }
      });
    }
  }

  _createDustMotes(W, H) {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const mote = this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), 0x887766, 0.15).setDepth(12);

      this.tweens.add({
        targets: mote,
        x: x + Phaser.Math.Between(-60, 60),
        y: y + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.05, to: 0.2 },
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        ease: 'Sine.easeInOut'
      });
    }
  }

  _createSparkles(cx) {
    for (let i = 0; i < 12; i++) {
      const x = cx + Phaser.Math.Between(-60, 60);
      const y = Phaser.Math.Between(120, 380);
      const sparkle = this.add.circle(x, y, Phaser.Math.FloatBetween(0.8, 1.5), 0x88aaff, 0).setDepth(14);

      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0, to: 0.6 },
        scaleX: { from: 0.5, to: 1.5 },
        scaleY: { from: 0.5, to: 1.5 },
        duration: Phaser.Math.Between(800, 1500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 6000),
        hold: 200,
        repeatDelay: Phaser.Math.Between(2000, 5000),
        ease: 'Sine.easeInOut'
      });
    }
  }

  _createProgressBar(cx) {
    const barY = 555;
    const barW = 420;
    const barH = 16;
    const barX = cx - barW / 2;

    // Outer border (stone-like frame)
    const frame = this.add.graphics().setDepth(20);
    frame.fillStyle(0x2a2a3a, 1);
    frame.fillRoundedRect(barX - 4, barY - barH / 2 - 4, barW + 8, barH + 8, 4);
    frame.fillStyle(0x1a1a28, 1);
    frame.fillRoundedRect(barX - 2, barY - barH / 2 - 2, barW + 4, barH + 4, 3);

    // Inner track (dark recessed area)
    frame.fillStyle(0x0a0a14, 1);
    frame.fillRoundedRect(barX, barY - barH / 2, barW, barH, 2);

    // Progress fill — we use a graphics object so we can redraw
    this.progressGfx = this.add.graphics().setDepth(21);
    this.progressBarConfig = { x: barX, y: barY, w: barW, h: barH };
    this.progressValue = 0;

    // Shimmer overlay (animated bright streak)
    this.shimmerX = 0;

    // Progress percentage text
    this.progressPctText = this.add.text(cx, barY, '0%', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(23).setAlpha(0.8);
  }

  _drawProgressFill(pct) {
    const { x, y, w, h } = this.progressBarConfig;
    const fillW = Math.max(0, w * Math.min(pct, 1));

    this.progressGfx.clear();

    if (fillW <= 0) return;

    // Main gradient fill (deep blue to gold)
    const steps = Math.ceil(fillW / 4);
    for (let i = 0; i < steps; i++) {
      const t = i / Math.max(steps - 1, 1);
      // Blend from deep blue (0x1a3388) to gold (0xddaa22)
      const r = Math.floor(0x1a + (0xdd - 0x1a) * t);
      const g = Math.floor(0x33 + (0xaa - 0x33) * t);
      const b = Math.floor(0x88 + (0x22 - 0x88) * t);
      const col = (r << 16) | (g << 8) | b;
      this.progressGfx.fillStyle(col, 1);
      const sx = x + i * 4;
      const sw = Math.min(4, fillW - i * 4);
      this.progressGfx.fillRect(sx, y - h / 2 + 1, sw, h - 2);
    }

    // Bright top highlight
    this.progressGfx.fillStyle(0xffffff, 0.12);
    this.progressGfx.fillRect(x, y - h / 2 + 1, fillW, 3);

    // Shimmer streak (moving bright spot)
    const shimmerPos = x + (this.shimmerX % (w + 60)) - 30;
    if (shimmerPos < x + fillW) {
      for (let s = 0; s < 40; s++) {
        const sx = shimmerPos + s;
        if (sx >= x && sx < x + fillW) {
          const intensity = 1 - Math.abs(s - 20) / 20;
          this.progressGfx.fillStyle(0xffffff, intensity * 0.25);
          this.progressGfx.fillRect(sx, y - h / 2 + 1, 1, h - 2);
        }
      }
    }

    // Bottom shadow
    this.progressGfx.fillStyle(0x000000, 0.2);
    this.progressGfx.fillRect(x, y + h / 2 - 3, fillW, 2);
  }

  _drawVignette(W, H) {
    const g = this.add.graphics().setDepth(50);

    // Corner vignettes
    const vignetteSize = 200;
    // Top-left
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillTriangle(0, 0, vignetteSize - i * 15, 0, 0, vignetteSize - i * 15);
    }
    // Top-right
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillTriangle(W, 0, W - vignetteSize + i * 15, 0, W, vignetteSize - i * 15);
    }
    // Bottom-left
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillTriangle(0, H, vignetteSize - i * 15, H, 0, H - vignetteSize + i * 15);
    }
    // Bottom-right
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillTriangle(W, H, W - vignetteSize + i * 15, H, W, H - vignetteSize + i * 15);
    }

    // Top and bottom edge darkening
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0x000000, 0.06);
      g.fillRect(0, 0, W, 8 - i);
      g.fillRect(0, H - 8 + i, W, 8 - i);
    }
  }

  _ambientPulse() {
    // Very subtle ambient brightness pulse on the whole scene
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x1122aa, 0).setDepth(48);
    this.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: 0.02 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE LOOP — animate shimmer
  // ═══════════════════════════════════════════════════════════════

  update(time, delta) {
    // Animate shimmer across progress bar
    this.shimmerX = (this.shimmerX || 0) + delta * 0.08;
    this._drawProgressFill(this.progressValue);
  }

  // ═══════════════════════════════════════════════════════════════
  // LOGIC (preserved from original)
  // ═══════════════════════════════════════════════════════════════

  addLog(msg) {
    this.logTexts.forEach(t => t.y -= 18);
    if (this.logTexts.length > 2) {
      const old = this.logTexts.shift();
      old.destroy();
    }
    const text = this.add.text(300, this.logY, `> ${msg}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#667788'
    }).setOrigin(0.5).setDepth(20).setAlpha(0.7);
    this.logTexts.push(text);
  }

  setProgress(pct) {
    const clamped = Math.min(pct, 1);
    this.progressValue = clamped;
    this.progressPctText.setText(Math.floor(clamped * 100) + '%');
  }

  async runAudit() {
    let progress = 0;
    const progressTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        progress = Math.min(progress + 0.008, 0.9);
        this.setProgress(progress);
      },
      loop: true
    });

    try {
      const result = await bridge.audit(this.domain, this.projectPath, (streamData) => {
        this.streamChunks++;
        const clean = streamData.replace(/[\n\r]+/g, ' ').trim();
        if (clean.length > 0) {
          this.streamText.setText(clean.substring(0, 60));
          if (this.game.addLog) this.game.addLog(clean);
        }
        this.demonCounter.setText(`Claude is working... (${this.streamChunks} signals received)`);
      });

      progressTimer.remove();
      this.setProgress(1);

      const auditData = result.data || result;
      if (auditData && auditData.issues && auditData.issues.length > 0) {
        this.game.auditData = auditData;
        const revealMsg = 'The dungeon reveals itself...';
        this.messageText.setText(revealMsg);
        this.messageText.setColor('#f0c040');
        this.messageGlow.setText(revealMsg);
        this.messageGlow.setColor('#cc8800');
        this.streamText.setText('');
        this.demonCounter.setText(`${auditData.issues.length} demons detected! Score: ${auditData.score}/100`);
        this.demonCounter.setColor('#f0c040');

        // Dramatic pause before transition
        this.cameras.main.flash(300, 200, 50, 50);
        this.time.delayedCall(2000, () => {
          this.cameras.main.fadeOut(1000, 0, 0, 0);
          this.time.delayedCall(1000, () => {
            this.scene.start('DungeonHall');
          });
        });
      } else {
        this.addLog('Audit returned no issues \u2014 entering demo mode');
        await this.simulateAudit();
      }

    } catch (err) {
      progressTimer.remove();
      console.error('Audit error:', err);
      if (this.game.addLog) this.game.addLog('ERROR: ' + err.message);
      this.addLog('Bridge error \u2014 entering demo mode');
      await this.simulateAudit();
    }
  }

  async simulateAudit() {
    const demoIssues = [
      { id: 1, severity: 'critical', title: 'Missing SSL Certificate', description: 'Site not served over HTTPS', category: 'Security', hp: 100 },
      { id: 2, severity: 'critical', title: 'Blocked by robots.txt', description: 'Critical pages blocked from crawling', category: 'Crawlability', hp: 90 },
      { id: 3, severity: 'high', title: 'Missing Meta Descriptions', description: '12 pages missing meta descriptions', category: 'On-Page', hp: 70 },
      { id: 4, severity: 'high', title: 'Broken Internal Links', description: '8 broken links found across the site', category: 'Links', hp: 65 },
      { id: 5, severity: 'high', title: 'No Schema Markup', description: 'Missing structured data on all pages', category: 'Schema', hp: 60 },
      { id: 6, severity: 'medium', title: 'Slow Page Speed', description: 'LCP exceeds 4s on mobile', category: 'Performance', hp: 50 },
      { id: 7, severity: 'medium', title: 'Missing Alt Text', description: '23 images missing alt attributes', category: 'Accessibility', hp: 45 },
      { id: 8, severity: 'medium', title: 'Duplicate Title Tags', description: '5 pages share identical titles', category: 'On-Page', hp: 40 },
      { id: 9, severity: 'low', title: 'Missing Open Graph Tags', description: 'Social sharing metadata absent', category: 'Social', hp: 30 },
      { id: 10, severity: 'low', title: 'No XML Sitemap', description: 'Sitemap.xml not found', category: 'Crawlability', hp: 25 },
      { id: 11, severity: 'info', title: 'HTTP/2 Not Enabled', description: 'Server using HTTP/1.1', category: 'Performance', hp: 20 },
      { id: 12, severity: 'info', title: 'No Canonical Tags', description: 'Potential duplicate content issues', category: 'On-Page', hp: 20 }
    ];

    for (let i = 0; i <= 10; i++) {
      await this.delay(400);
      this.setProgress(i / 10);
      if (i % 2 === 0 && i < 10) {
        this.addLog(this.flavorMessages[Math.floor(i / 2)]);
      }
    }

    this.game.auditData = {
      domain: this.domain,
      issues: demoIssues,
      score: 35,
      totalIssues: demoIssues.length
    };

    const revealMsg = 'The dungeon reveals itself...';
    this.messageText.setText(revealMsg);
    this.messageText.setColor('#f0c040');
    this.messageGlow.setText(revealMsg);
    this.messageGlow.setColor('#cc8800');
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.scene.start('DungeonHall');
      });
    });
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
