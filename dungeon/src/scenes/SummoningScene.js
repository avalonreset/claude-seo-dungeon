import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Summoning scene — knight marches down a torchlit dungeon corridor while audit runs.
 * AAA indie pixel art aesthetic: scrolling stone walls, flickering torches, rising embers.
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

    // ── Scrolling Stone Brick Wall Background ───────────────────
    this._generateWallTexture(W);
    this.wallTile = this.add.tileSprite(0, 0, W, H, 'stonewall_tile')
      .setOrigin(0, 0)
      .setDepth(0);
    this.scrollSpeed = 40; // pixels per second

    // ── Corridor Darkness Gradient (depth illusion) ──────────────
    this._drawCorridorDepth(cx, W, H);

    // ── Torch Brackets & Flames (fixed screen positions) ─────────
    this._createTorches(W, H);

    // ── Floating Embers (30 orange/red rising from bottom) ───────
    this._createEmbers(W, H);

    // ── Dust Motes (15 gray dots, gentle drift) ─────────────────
    this._createDustMotes(W, H);

    // ── Title Text ───────────────────────────────────────────────
    const titleText = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: '600',
      fontSize: '20px',
      color: '#d4af37',
      letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0).setDepth(55);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      duration: 1500,
      ease: 'Sine.easeIn'
    });

    // Subtle gold glow underneath title
    const titleGlow = this.add.text(cx, 38, 'DESCENDING INTO THE DUNGEON', {
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: '600',
      fontSize: '20px',
      color: '#ff9900',
      letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(54);

    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0, to: 0.25 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Domain Name Display ──────────────────────────────────────
    const domainText = this.add.text(cx, 70, this.domain, {
      fontFamily: 'JetBrains Mono, monospace',
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

    // ── Knight Character (centered, animated warrior sprite) ────────
    this.knight = this.add.sprite(400, 300, 'warrior_run').setScale(2.5).setDepth(10).play('warrior_run_anim');

    // Warm glow circle underneath the knight
    this.knightGlow = this.add.circle(400, 320, 70, 0xff8833, 0.08).setDepth(9);
    this.knightGlowInner = this.add.circle(400, 320, 35, 0xffaa44, 0.12).setDepth(9);

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
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      color: '#66cccc',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(55);

    this.messageGlow = this.add.text(cx, 430, 'Summoning the audit spirits...', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '14px',
      color: '#44aaaa',
      letterSpacing: 1
    }).setOrigin(0.5).setDepth(54).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);

    // ── Stream / Activity Text ───────────────────────────────────
    this.streamText = this.add.text(cx, 458, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#7766aa',
      wordWrap: { width: 650 }
    }).setOrigin(0.5).setDepth(55).setAlpha(0.8);

    // ── Demon Counter ────────────────────────────────────────────
    this.demonCounter = this.add.text(cx, 482, '', {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '12px',
      color: '#cc4444'
    }).setOrigin(0.5).setDepth(55);

    // ── Log area ─────────────────────────────────────────────────
    this.logTexts = [];
    this.logY = 510;

    // ── Progress Bar ─────────────────────────────────────────────
    this._createProgressBar(cx);

    // ── Vignette Overlay (darkened edges all 4 sides) ────────────
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

    // ── Torch Flame Flicker Timer (redraw every 100ms) ───────────
    this.time.addEvent({
      delay: 100,
      callback: () => this._flickerTorchFlames(),
      loop: true
    });

    // Start audit
    this.runAudit();
  }

  // ═══════════════════════════════════════════════════════════════
  // VISUAL CONSTRUCTION HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Generate a tileable stone wall texture with color-varied bricks
   * and thin dark mortar lines. Uses dark blue palette.
   */
  _generateWallTexture(W) {
    const TILE_H = 300;
    const g = this.make.graphics({ add: false });

    // Base dark fill
    g.fillStyle(0x0e0e1c, 1);
    g.fillRect(0, 0, W, TILE_H);

    // Draw stone bricks
    const brickW = 64;
    const brickH = 32;
    const rows = Math.ceil(TILE_H / brickH) + 1;
    const cols = Math.ceil(W / brickW) + 1;

    // Seeded pseudo-random for consistent tile
    const seededRand = (seed) => {
      let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };

    // Brick base colors (dark blues)
    const brickColors = [0x0e0e1c, 0x121228, 0x161630];

    for (let row = 0; row < rows; row++) {
      const offset = (row % 2) * (brickW / 2);
      for (let col = -1; col < cols; col++) {
        const bx = col * brickW + offset;
        const by = row * brickH;
        if (by >= TILE_H) continue;

        const seed = row * 100 + col;
        const baseColor = brickColors[Math.floor(seededRand(seed) * 3)];

        // Extract RGB and add slight per-brick variation
        const br = ((baseColor >> 16) & 0xff) + Math.floor((seededRand(seed + 1) - 0.5) * 6);
        const bg = ((baseColor >> 8) & 0xff) + Math.floor((seededRand(seed + 2) - 0.5) * 6);
        const bb = (baseColor & 0xff) + Math.floor((seededRand(seed + 3) - 0.5) * 8);
        const finalColor = (Math.max(0, br) << 16) | (Math.max(0, bg) << 8) | Math.max(0, bb);

        // Brick face
        g.fillStyle(finalColor, 0.95);
        g.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);

        // Thin dark mortar lines
        g.fillStyle(0x060610, 0.9);
        g.fillRect(bx, by, brickW, 1);       // horizontal mortar
        g.fillRect(bx, by, 1, brickH);       // vertical mortar

        // Subtle highlight on top-left edge of each brick
        g.fillStyle(0x1e1e38, 0.35);
        g.fillRect(bx + 2, by + 2, brickW - 4, 1);
        g.fillRect(bx + 2, by + 2, 1, brickH - 4);

        // Random surface imperfections
        if (seededRand(seed + 10) < 0.15) {
          g.fillStyle(0x08080e, 0.5);
          const dx = 4 + Math.floor(seededRand(seed + 11) * (brickW - 14));
          const dy = 4 + Math.floor(seededRand(seed + 12) * (brickH - 14));
          const dw = 3 + Math.floor(seededRand(seed + 13) * 6);
          const dh = 2 + Math.floor(seededRand(seed + 14) * 3);
          g.fillRect(bx + dx, by + dy, dw, dh);
        }
      }
    }

    g.generateTexture('stonewall_tile', W, TILE_H);
    g.destroy();
  }

  _drawCorridorDepth(cx, W, H) {
    const g = this.add.graphics().setDepth(1);

    // Central corridor lighter area
    const corridorW = 320;
    g.fillStyle(0x14142a, 0.25);
    g.fillRect(cx - corridorW / 2, 0, corridorW, H);

    // Gradient darkening on sides (left wall)
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000008, 0.06);
      g.fillRect(0, 0, 100 + i * 20, H);
    }
    // Right wall
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000008, 0.06);
      g.fillRect(W - 100 - i * 20, 0, 100 + i * 20, H);
    }

    // Floor gradient at bottom
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x000005, 0.08);
      g.fillRect(0, H - 120 + i * 20, W, 20);
    }
  }

  /**
   * Create torch brackets at fixed screen positions (2 left, 2 right)
   * with warm glow circles and animated flame graphics.
   */
  _createTorches(W, H) {
    const cx = W / 2;

    // 4 torch positions: 2 on left wall, 2 on right wall
    this.torchData = [
      { x: cx - 200, y: 150 },  // left top
      { x: cx - 200, y: 380 },  // left bottom
      { x: cx + 200, y: 220 },  // right top
      { x: cx + 200, y: 450 },  // right bottom
    ];

    this.torchData.forEach((pos, idx) => {
      // Iron bracket graphic
      const bracket = this.add.graphics().setDepth(5);
      bracket.fillStyle(0x3a3028, 1);
      bracket.fillRect(pos.x - 5, pos.y + 8, 10, 18);
      bracket.fillStyle(0x2a2018, 1);
      bracket.fillRect(pos.x - 4, pos.y + 9, 8, 16);
      // Mounting bolts
      bracket.fillStyle(0x505040, 1);
      bracket.fillRect(pos.x - 3, pos.y + 11, 2, 2);
      bracket.fillRect(pos.x + 1, pos.y + 11, 2, 2);

      // Warm glow circles (layered semi-transparent orange)
      const glowOuter = this.add.circle(pos.x, pos.y - 4, 90, 0xff6622, 0.03).setDepth(2);
      const glowMid = this.add.circle(pos.x, pos.y - 4, 55, 0xff8833, 0.05).setDepth(2);
      const glowInner = this.add.circle(pos.x, pos.y - 4, 30, 0xffaa44, 0.08).setDepth(2);

      // Glow breathing animation
      [glowOuter, glowMid, glowInner].forEach((glow, gi) => {
        this.tweens.add({
          targets: glow,
          alpha: glow.alpha * 1.6,
          scaleX: { from: 0.9, to: 1.15 },
          scaleY: { from: 0.9, to: 1.15 },
          duration: 400 + idx * 80 + gi * 60,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });

      // Store flame graphics object for redrawing in flicker
      pos.flameGfx = this.add.graphics().setDepth(7);
    });
  }

  /**
   * Called every 100ms to redraw torch flames with slight random variation.
   * Orange/yellow ellipses that shift position and size each frame.
   */
  _flickerTorchFlames() {
    if (!this.torchData) return;

    this.torchData.forEach((pos) => {
      const g = pos.flameGfx;
      g.clear();

      const fx = pos.x;
      const fy = pos.y;

      // Random offsets for flicker
      const ox = Phaser.Math.FloatBetween(-1.5, 1.5);
      const oy = Phaser.Math.FloatBetween(-1, 1);
      const sizeVar = Phaser.Math.FloatBetween(0.85, 1.15);

      // Outer flame glow (deep orange)
      g.fillStyle(0xff4400, 0.12);
      g.fillEllipse(fx + ox, fy - 6 + oy, 20 * sizeVar, 24 * sizeVar);

      // Mid flame (orange)
      g.fillStyle(0xff8822, 0.28);
      g.fillEllipse(fx + ox * 0.7, fy - 8 + oy * 0.8, 12 * sizeVar, 16 * sizeVar);

      // Inner bright core (yellow)
      g.fillStyle(0xffcc44, 0.5);
      g.fillEllipse(fx + ox * 0.4, fy - 6 + oy * 0.5, 7 * sizeVar, 10 * sizeVar);

      // Tip (bright yellow-white)
      g.fillStyle(0xffee88, 0.4);
      g.fillEllipse(fx + ox * 0.5, fy - 14 + oy, 4 * sizeVar, 7 * sizeVar);
    });
  }

  /**
   * 30 embers rising from bottom — orange/red circles, 2-3px, drift upward and sideways.
   */
  _createEmbers(W, H) {
    for (let i = 0; i < 30; i++) {
      const startX = Phaser.Math.Between(60, W - 60);
      const startY = Phaser.Math.Between(H + 10, H + 100);
      const size = Phaser.Math.FloatBetween(1, 1.5);
      const isRed = Phaser.Math.Between(0, 2) === 0;
      const color = isRed ? 0xff3322 : 0xf08020;
      const ember = this.add.circle(startX, startY, size, color, 0.7).setDepth(15);

      this.tweens.add({
        targets: ember,
        y: Phaser.Math.Between(-30, H * 0.15),
        x: startX + Phaser.Math.Between(-80, 80),
        alpha: 0,
        scaleX: { from: 1, to: 0.3 },
        scaleY: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 5000),
        ease: 'Sine.easeOut',
        onRepeat: (tween, target) => {
          target.x = Phaser.Math.Between(60, W - 60);
          target.y = Phaser.Math.Between(H + 10, H + 100);
          target.alpha = 0.7;
        }
      });
    }
  }

  /**
   * 15 dust motes — 1px gray dots, slow gentle drift.
   */
  _createDustMotes(W, H) {
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const mote = this.add.circle(x, y, 0.5, 0x888888, 0.15).setDepth(12);

      this.tweens.add({
        targets: mote,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-30, 30),
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
   * Progress bar at bottom (y: 550), 600px wide, centered.
   * Dark track with subtle border. Blue-to-gold gradient fill. Shimmer streak.
   */
  _createProgressBar(cx) {
    const barY = 550;
    const barW = 600;
    const barH = 18;
    const barX = cx - barW / 2;

    // Outer border (subtle stone frame)
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
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '13px',
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
      const g = Math.floor(0x33 + (0xaf - 0x33) * t);
      const b = Math.floor(0x88 + (0x37 - 0x88) * t);
      const col = (r << 16) | (g << 8) | b;
      this.progressGfx.fillStyle(col, 1);
      const sx = x + i * 4;
      const sw = Math.min(4, fillW - i * 4);
      this.progressGfx.fillRect(sx, y - h / 2 + 1, sw, h - 2);
    }

    // Bright top highlight
    this.progressGfx.fillStyle(0xffffff, 0.12);
    this.progressGfx.fillRect(x, y - h / 2 + 1, fillW, 3);

    // Animated shimmer streak sweeping across filled area
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
   * Subtle vignette darkening at all 4 edges.
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

    // Corner vignettes (extra darkening)
    const vignetteSize = 180;
    // Top-left
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(0, 0, vignetteSize - i * 18, 0, 0, vignetteSize - i * 18);
    }
    // Top-right
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(W, 0, W - vignetteSize + i * 18, 0, W, vignetteSize - i * 18);
    }
    // Bottom-left
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(0, H, vignetteSize - i * 18, H, 0, H - vignetteSize + i * 18);
    }
    // Bottom-right
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.03);
      g.fillTriangle(W, H, W - vignetteSize + i * 18, H, W, H - vignetteSize + i * 18);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UPDATE LOOP — scroll background + animate shimmer
  // ═══════════════════════════════════════════════════════════════

  update(time, delta) {
    // Scroll the stone wall upward continuously (~40px/sec)
    if (this.wallTile) {
      this.wallTile.tilePositionY += (this.scrollSpeed * delta) / 1000;
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
  // LOGIC (preserved from original)
  // ═══════════════════════════════════════════════════════════════

  addLog(msg) {
    this.logTexts.forEach(t => t.y -= 18);
    if (this.logTexts.length > 2) {
      const old = this.logTexts.shift();
      old.destroy();
    }
    const text = this.add.text(300, this.logY, `> ${msg}`, {
      fontFamily: 'JetBrains Mono, monospace',
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
