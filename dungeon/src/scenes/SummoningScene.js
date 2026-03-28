import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';
import { DESCENT_MESSAGES } from '../utils/flavor-text.js';

/**
 * Summoning scene — Castlevania-style side-scroller.
 * Knight runs RIGHT through a torchlit stone corridor while the audit runs.
 * Parallax scrolling: far wall, main wall with torch brackets, cobblestone floor.
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

    // Scroll speeds (pixels per second) — leftward
    this.farWallSpeed = 30;
    this.mainWallSpeed = 60;
    this.floorSpeed = 80;

    // ── Far Wall (darkest, slowest parallax layer) ─────────────
    this._generateFarWallTexture();
    this.farWallTile = this.add.tileSprite(0, 0, W, 440, 'farwall_tile')
      .setOrigin(0, 0)
      .setDepth(0);

    // ── Main Wall with Torch Brackets ──────────────────────────
    this._generateMainWallTexture();
    this.mainWallTile = this.add.tileSprite(0, 0, W, 440, 'mainwall_tile')
      .setOrigin(0, 0)
      .setDepth(1);

    // ── Stone Floor (fastest scroll, cobblestone) ──────────────
    this._generateFloorTexture();
    this.floorTile = this.add.tileSprite(0, 440, W, 160, 'floor_tile')
      .setOrigin(0, 0)
      .setDepth(2);

    // Floor top edge — dark line separating wall from floor
    const floorEdge = this.add.graphics().setDepth(3);
    floorEdge.fillStyle(0x000000, 0.7);
    floorEdge.fillRect(0, 438, W, 4);
    floorEdge.fillStyle(0x1a1a0e, 0.5);
    floorEdge.fillRect(0, 436, W, 2);

    // Torch glows removed — torches are baked into the wall tile

    // ── Embers drifting LEFT and UP ────────────────────────────
    this._createEmbers(W, H);

    // ── Dust Motes ─────────────────────────────────────────────
    this._createDustMotes(W, H);

    // ── Knight (centered, faces right, running) ────────────────
    this.knight = this.add.sprite(300, 380, 'warrior_run')
      .setScale(2.5)
      .setDepth(10)
      .play('warrior_run_anim');

    // Warm glow underneath the knight
    this.knightGlow = this.add.circle(300, 400, 70, 0xff8833, 0.08).setDepth(9);
    this.knightGlowInner = this.add.circle(300, 400, 35, 0xffaa44, 0.12).setDepth(9);

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

    // ── Title Text ─────────────────────────────────────────────
    const titleText = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: '"JetBrains Mono", monospace',
      fontStyle: '600',
      fontSize: '22px',
      color: '#d4af37',
      letterSpacing: 6
    }).setOrigin(0.5).setAlpha(0).setDepth(55);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      duration: 1500,
      ease: 'Sine.easeIn'
    });

    // Subtle gold glow underneath title
    const titleGlow = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: '"JetBrains Mono", monospace',
      fontStyle: '600',
      fontSize: '22px',
      color: '#ff9900',
      letterSpacing: 6
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(54);

    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0, to: 0.25 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Domain Name Display ────────────────────────────────────
    const domainText = this.add.text(cx, 70, this.domain, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '16px',
      color: '#88bbff',
    }).setOrigin(0.5).setDepth(55);

    this.tweens.add({
      targets: domainText,
      alpha: { from: 0.7, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // ── Status Message ─────────────────────────────────────────
    this.messageText = this.add.text(cx, 470, DESCENT_MESSAGES[0], {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      color: '#66cccc',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(55);

    this.messageGlow = this.add.text(cx, 470, DESCENT_MESSAGES[0], {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '15px',
      color: '#44aaaa',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(54).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);

    // ── Stream / Activity Text ─────────────────────────────────
    this.streamText = this.add.text(cx, 495, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#7766aa',
      wordWrap: { width: 650 }
    }).setOrigin(0.5).setDepth(55).setAlpha(0.8);

    // ── Demon Counter ──────────────────────────────────────────
    this.demonCounter = this.add.text(cx, 516, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#cc4444'
    }).setOrigin(0.5).setDepth(55);

    // ── Log area ───────────────────────────────────────────────
    this.logTexts = [];
    this.logY = 535;

    // ── Progress Bar ───────────────────────────────────────────
    this._createProgressBar(cx);

    // ── Vignette Overlay ───────────────────────────────────────
    this._drawVignette(W, H);

    // ── Atmospheric Messages ───────────────────────────────────
    this.flavorMessages = DESCENT_MESSAGES;
    this.messageIndex = 0;

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        this.messageIndex = (this.messageIndex + 1) % this.flavorMessages.length;
        const msg = this.flavorMessages[this.messageIndex];
        this.messageText.setText(msg);
        this.messageGlow.setText(msg);
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

    // Start audit
    this.runAudit();
  }

  // ═══════════════════════════════════════════════════════════════
  // TEXTURE GENERATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Seeded pseudo-random for consistent tile generation.
   */
  _seededRand(seed) {
    let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  /**
   * Far wall — very dark, subtle bricks, no detail. Provides depth behind main wall.
   */
  _generateFarWallTexture() {
    const TW = 400;
    const TH = 440;
    const g = this.make.graphics({ add: false });

    // Very dark base
    g.fillStyle(0x08081a, 1);
    g.fillRect(0, 0, TW, TH);

    const brickW = 48;
    const brickH = 24;
    const rows = Math.ceil(TH / brickH) + 1;
    const cols = Math.ceil(TW / brickW) + 1;

    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < cols; col++) {
        const bx = col * brickW + offset;
        const by = row * brickH;
        if (by >= TH) continue;

        const seed = row * 100 + col;
        const variation = Math.floor((this._seededRand(seed) - 0.5) * 4);
        const base = 0x0a + variation;
        const finalColor = (Math.max(4, base) << 16) | (Math.max(4, base) << 8) | Math.max(8, base + 6);

        g.fillStyle(finalColor, 0.6);
        g.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);

        // Mortar
        g.fillStyle(0x040410, 0.5);
        g.fillRect(bx, by, brickW, 1);
        g.fillRect(bx, by, 1, brickH);
      }
    }

    g.generateTexture('farwall_tile', TW, TH);
    g.destroy();
  }

  /**
   * Main wall — stone bricks with torch brackets baked in every ~180px.
   * 400px wide tile, torches at x=90 and x=270 (so every 180px when tiled).
   */
  _generateMainWallTexture() {
    const TW = 400;
    const TH = 440;
    const g = this.make.graphics({ add: false });

    // Base dark fill
    g.fillStyle(0x0e0e1c, 1);
    g.fillRect(0, 0, TW, TH);

    // Draw stone bricks
    const brickW = 64;
    const brickH = 32;
    const rows = Math.ceil(TH / brickH) + 1;
    const cols = Math.ceil(TW / brickW) + 1;

    const brickColors = [0x0e0e1c, 0x121228, 0x161630];

    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < cols; col++) {
        const bx = col * brickW + offset;
        const by = row * brickH;
        if (by >= TH) continue;

        const seed = row * 100 + col;
        const baseColor = brickColors[Math.floor(this._seededRand(seed) * 3)];

        const br = ((baseColor >> 16) & 0xff) + Math.floor((this._seededRand(seed + 1) - 0.5) * 6);
        const bg = ((baseColor >> 8) & 0xff) + Math.floor((this._seededRand(seed + 2) - 0.5) * 6);
        const bb = (baseColor & 0xff) + Math.floor((this._seededRand(seed + 3) - 0.5) * 8);
        const finalColor = (Math.max(0, br) << 16) | (Math.max(0, bg) << 8) | Math.max(0, bb);

        g.fillStyle(finalColor, 0.95);
        g.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);

        // Mortar
        g.fillStyle(0x060610, 0.9);
        g.fillRect(bx, by, brickW, 1);
        g.fillRect(bx, by, 1, brickH);

        // Highlight
        g.fillStyle(0x1e1e38, 0.35);
        g.fillRect(bx + 2, by + 2, brickW - 4, 1);
        g.fillRect(bx + 2, by + 2, 1, brickH - 4);

        // Random imperfections
        if (this._seededRand(seed + 10) < 0.15) {
          g.fillStyle(0x08080e, 0.5);
          const dx = 4 + Math.floor(this._seededRand(seed + 11) * (brickW - 14));
          const dy = 4 + Math.floor(this._seededRand(seed + 12) * (brickH - 14));
          const dw = 3 + Math.floor(this._seededRand(seed + 13) * 6);
          const dh = 2 + Math.floor(this._seededRand(seed + 14) * 3);
          g.fillRect(bx + dx, by + dy, dw, dh);
        }
      }
    }

    // Bake torch brackets into the wall at x=90 and x=270 (every ~180px)
    const torchXPositions = [90, 270];
    const torchY = 240; // wall-height for brackets

    torchXPositions.forEach((tx) => {
      // Iron mounting plate
      g.fillStyle(0x2a2018, 1);
      g.fillRect(tx - 6, torchY + 10, 12, 22);
      g.fillStyle(0x3a3028, 1);
      g.fillRect(tx - 5, torchY + 11, 10, 20);

      // Bracket arm extending outward
      g.fillStyle(0x3a3028, 1);
      g.fillRect(tx - 3, torchY + 6, 6, 6);

      // Cup/holder at top
      g.fillStyle(0x4a3828, 1);
      g.fillRect(tx - 7, torchY + 2, 14, 6);
      g.fillStyle(0x3a2818, 1);
      g.fillRect(tx - 6, torchY + 3, 12, 4);

      // Mounting bolts
      g.fillStyle(0x606050, 1);
      g.fillRect(tx - 4, torchY + 14, 2, 2);
      g.fillRect(tx + 2, torchY + 14, 2, 2);

      // Flame shape baked into tile (orange/yellow)
      // Outer flame glow
      g.fillStyle(0xff4400, 0.15);
      g.fillEllipse(tx, torchY - 8, 18, 22);

      // Mid flame
      g.fillStyle(0xff8822, 0.3);
      g.fillEllipse(tx, torchY - 10, 11, 15);

      // Inner bright core
      g.fillStyle(0xffcc44, 0.5);
      g.fillEllipse(tx, torchY - 8, 6, 9);

      // Tip
      g.fillStyle(0xffee88, 0.4);
      g.fillEllipse(tx, torchY - 16, 3, 6);

      // Warm light cast on nearby wall bricks
      g.fillStyle(0xff6622, 0.04);
      g.fillCircle(tx, torchY - 4, 60);
      g.fillStyle(0xff8833, 0.03);
      g.fillCircle(tx, torchY - 4, 40);
    });

    g.generateTexture('mainwall_tile', TW, TH);
    g.destroy();
  }

  /**
   * Floor texture — dark cobblestone, horizontally tileable.
   */
  _generateFloorTexture() {
    const TW = 400;
    const TH = 160;
    const g = this.make.graphics({ add: false });

    // Dark base
    g.fillStyle(0x0c0c0a, 1);
    g.fillRect(0, 0, TW, TH);

    // Cobblestones — irregular rounded rectangles
    const stoneW = 40;
    const stoneH = 36;
    const rows = Math.ceil(TH / stoneH) + 1;
    const cols = Math.ceil(TW / stoneW) + 1;

    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (stoneW / 2);
      for (let col = -1; col < cols; col++) {
        const seed = row * 50 + col + 7777;
        const bx = col * stoneW + offset + Math.floor((this._seededRand(seed + 5) - 0.5) * 6);
        const by = row * stoneH + Math.floor((this._seededRand(seed + 6) - 0.5) * 4);
        if (by >= TH) continue;

        const variation = Math.floor(this._seededRand(seed) * 6);
        const base = 0x10 + variation;
        const finalColor = (base << 16) | (base << 8) | (base - 2);

        // Stone face
        g.fillStyle(finalColor, 0.9);
        g.fillRect(bx + 2, by + 2, stoneW - 4, stoneH - 4);

        // Dark gap between stones
        g.fillStyle(0x060604, 0.8);
        g.fillRect(bx, by, stoneW, 2);
        g.fillRect(bx, by, 2, stoneH);

        // Subtle top highlight
        g.fillStyle(0x1e1e1a, 0.25);
        g.fillRect(bx + 3, by + 3, stoneW - 6, 1);

        // Wear marks
        if (this._seededRand(seed + 20) < 0.2) {
          g.fillStyle(0x080806, 0.4);
          const dx = 5 + Math.floor(this._seededRand(seed + 21) * (stoneW - 12));
          const dy = 5 + Math.floor(this._seededRand(seed + 22) * (stoneH - 12));
          g.fillRect(bx + dx, by + dy, 4, 2);
        }
      }
    }

    // Top edge of floor — slightly lighter line for definition
    g.fillStyle(0x1a1a14, 0.6);
    g.fillRect(0, 0, TW, 2);

    g.generateTexture('floor_tile', TW, TH);
    g.destroy();
  }

  // ═══════════════════════════════════════════════════════════════
  // VISUAL HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Torch glow circles at fixed screen positions that pulse.
   * Placed at wall-height (y: ~250), spaced across the screen.
   * Since the wall scrolls behind them, it creates the illusion of passing torches.
   */
  _createTorchGlows(W) {
    const glowPositions = [
      { x: 160, y: 250 },
      { x: 450, y: 250 },
      { x: 740, y: 250 },
    ];

    glowPositions.forEach((pos, idx) => {
      const glowOuter = this.add.circle(pos.x, pos.y, 90, 0xff6622, 0.04).setDepth(4);
      const glowMid = this.add.circle(pos.x, pos.y, 55, 0xff8833, 0.06).setDepth(4);
      const glowInner = this.add.circle(pos.x, pos.y, 28, 0xffaa44, 0.1).setDepth(4);

      [glowOuter, glowMid, glowInner].forEach((glow, gi) => {
        this.tweens.add({
          targets: glow,
          alpha: glow.alpha * 1.8,
          scaleX: { from: 0.85, to: 1.2 },
          scaleY: { from: 0.85, to: 1.2 },
          duration: 350 + idx * 90 + gi * 70,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    });
  }

  /**
   * Embers drift LEFT and UP — matching the side-scroll direction.
   */
  _createEmbers(W, H) {
    for (let i = 0; i < 30; i++) {
      const startX = Phaser.Math.Between(0, W + 100);
      const startY = Phaser.Math.Between(200, H - 50);
      const size = Phaser.Math.FloatBetween(1, 1.5);
      const isRed = Phaser.Math.Between(0, 2) === 0;
      const color = isRed ? 0xff3322 : 0xf08020;
      const ember = this.add.circle(startX, startY, size, color, 0.7).setDepth(15);

      this.tweens.add({
        targets: ember,
        x: startX - Phaser.Math.Between(200, 500),
        y: startY - Phaser.Math.Between(60, 200),
        alpha: 0,
        scaleX: { from: 1, to: 0.3 },
        scaleY: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(2500, 5500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        ease: 'Sine.easeOut',
        onRepeat: (tween, target) => {
          target.x = Phaser.Math.Between(W, W + 200);
          target.y = Phaser.Math.Between(200, H - 50);
          target.alpha = 0.7;
        }
      });
    }
  }

  /**
   * Dust motes — slow gentle drift.
   */
  _createDustMotes(W, H) {
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(80, 420);
      const mote = this.add.circle(x, y, 0.5, 0x888888, 0.15).setDepth(12);

      this.tweens.add({
        targets: mote,
        x: x + Phaser.Math.Between(-80, -20),
        y: y + Phaser.Math.Between(-25, 25),
        alpha: { from: 0.05, to: 0.2 },
        duration: Phaser.Math.Between(5000, 9000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        ease: 'Sine.easeInOut'
      });
    }
  }

  /**
   * Progress bar at bottom — dark track, blue-to-gold gradient fill, shimmer, centered percentage.
   */
  _createProgressBar(cx) {
    const barY = 570;
    const barW = 600;
    const barH = 18;
    const barX = cx - barW / 2;

    // Outer border
    const frame = this.add.graphics().setDepth(55);
    frame.fillStyle(0x2a2a3a, 1);
    frame.fillRoundedRect(barX - 4, barY - barH / 2 - 4, barW + 8, barH + 8, 4);
    frame.lineStyle(1, 0x3a3a50, 0.6);
    frame.strokeRoundedRect(barX - 4, barY - barH / 2 - 4, barW + 8, barH + 8, 4);

    // Inner track (dark recessed)
    frame.fillStyle(0x0a0a14, 1);
    frame.fillRoundedRect(barX, barY - barH / 2, barW, barH, 2);

    // Progress fill graphics
    this.progressGfx = this.add.graphics().setDepth(56);
    this.progressBarConfig = { x: barX, y: barY, w: barW, h: barH };
    this.progressValue = 0;

    // Shimmer position tracker
    this.shimmerX = 0;

    // Percentage text centered on bar
    this.progressPctText = this.add.text(cx, barY, '0%', {
      fontFamily: '"JetBrains Mono", monospace',
      fontStyle: 'bold',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(58).setAlpha(0.9);
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
      const r = Math.floor(0x1a + (0xd4 - 0x1a) * t);
      const gv = Math.floor(0x33 + (0xaf - 0x33) * t);
      const b = Math.floor(0x88 + (0x37 - 0x88) * t);
      const col = (r << 16) | (gv << 8) | b;
      this.progressGfx.fillStyle(col, 1);
      const sx = x + i * 4;
      const sw = Math.min(4, fillW - i * 4);
      this.progressGfx.fillRect(sx, y - h / 2 + 1, sw, h - 2);
    }

    // Bright top highlight
    this.progressGfx.fillStyle(0xffffff, 0.12);
    this.progressGfx.fillRect(x, y - h / 2 + 1, fillW, 3);

    // Animated shimmer streak
    const shimmerPos = x + (this.shimmerX % (w + 80)) - 40;
    if (shimmerPos < x + fillW) {
      for (let s = 0; s < 50; s++) {
        const sx = shimmerPos + s;
        if (sx >= x && sx < x + fillW) {
          const intensity = 1 - Math.abs(s - 25) / 25;
          this.progressGfx.fillStyle(0xffffff, intensity * 0.3);
          this.progressGfx.fillRect(sx, y - h / 2 + 1, 1, h - 2);
        }
      }
    }

    // Bottom shadow
    this.progressGfx.fillStyle(0x000000, 0.2);
    this.progressGfx.fillRect(x, y + h / 2 - 3, fillW, 2);
  }

  /**
   * Vignette darkening at all 4 edges.
   */
  _drawVignette(W, H) {
    const g = this.add.graphics().setDepth(50);

    // Top edge
    for (let i = 0; i < 12; i++) {
      g.fillStyle(0x000000, 0.05);
      g.fillRect(0, 0, W, 40 - i * 3);
    }
    // Bottom edge
    for (let i = 0; i < 12; i++) {
      g.fillStyle(0x000000, 0.05);
      g.fillRect(0, H - 40 + i * 3, W, 40 - i * 3);
    }
    // Left edge
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillRect(0, 0, 50 - i * 4, H);
    }
    // Right edge
    for (let i = 0; i < 10; i++) {
      g.fillStyle(0x000000, 0.04);
      g.fillRect(W - 50 + i * 4, 0, 50 - i * 4, H);
    }

    // Corner vignettes
    const vignetteSize = 180;
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(0, 0, vignetteSize - i * 18, 0, 0, vignetteSize - i * 18);
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(W, 0, W - vignetteSize + i * 18, 0, W, vignetteSize - i * 18);
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(0, H, vignetteSize - i * 18, H, 0, H - vignetteSize + i * 18);
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(W, H, W - vignetteSize + i * 18, H, W, H - vignetteSize + i * 18);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE LOOP — scroll all parallax layers LEFT + animate shimmer
  // ═══════════════════════════════════════════════════════════════

  update(time, delta) {
    const dt = delta / 1000;

    // Scroll far wall LEFT (slowest)
    if (this.farWallTile) {
      this.farWallTile.tilePositionX += this.farWallSpeed * dt;
    }

    // Scroll main wall LEFT (medium)
    if (this.mainWallTile) {
      this.mainWallTile.tilePositionX += this.mainWallSpeed * dt;
    }

    // Scroll floor LEFT (fastest)
    if (this.floorTile) {
      this.floorTile.tilePositionX += this.floorSpeed * dt;
    }

    // Keep knight glow following the knight
    if (this.knight && this.knightGlow) {
      this.knightGlow.x = this.knight.x;
      this.knightGlow.y = this.knight.y + 20;
      this.knightGlowInner.x = this.knight.x;
      this.knightGlowInner.y = this.knight.y + 20;
    }

    // Animate shimmer across progress bar
    this.shimmerX = (this.shimmerX || 0) + delta * 0.08;
    this._drawProgressFill(this.progressValue);
  }

  // ═══════════════════════════════════════════════════════════════
  // AUDIT LOGIC (preserved from original)
  // ═══════════════════════════════════════════════════════════════

  addLog(msg) {
    this.logTexts.forEach(t => t.y -= 18);
    if (this.logTexts.length > 2) {
      const old = this.logTexts.shift();
      old.destroy();
    }
    const text = this.add.text(400, this.logY, `> ${msg}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      color: '#667788'
    }).setOrigin(0.5).setDepth(55).setAlpha(0.7);
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
