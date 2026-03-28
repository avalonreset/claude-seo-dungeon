import { COLORS } from '../utils/colors.js';

const HEADER_FONT = '"Press Start 2P", monospace';
const BODY_FONT = 'monospace';

/**
 * Dungeon Hall — demons materialize one by one from the darkness.
 * Player selects which demon to fight.
 */
export class DungeonHallScene extends Phaser.Scene {
  constructor() {
    super('DungeonHall');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x05050e);
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    const data = this.game.auditData;

    // ---------- STONE WALL BACKGROUND ----------
    this.drawStoneWalls();

    // ---------- TORCH LIGHTING ----------
    this.torches = [];
    this.drawTorches();

    // ---------- Ambient vignette overlay ----------
    this.drawVignette();

    // ---------- HEADER AREA (fixed, above scroll) ----------
    this.drawHeader(data);

    // ---------- MASK for scrollable area ----------
    // We create a graphics mask so demons don't overflow into header/footer
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 88, 800, 430);
    const geoMask = maskShape.createGeometryMask();

    // ---------- Container for scrollable demon list ----------
    this.demonContainer = this.add.container(0, 0);
    this.demonContainer.setMask(geoMask);

    // ---------- Reveal demons one by one ----------
    this.revealDemons(data.issues);

    // ---------- FOOTER AREA (fixed, below scroll) ----------
    this.drawFooter();

    // ---------- SCROLLING ----------
    this.scrollOffset = 0;
    this.targetScrollOffset = 0;
    const rowHeight = 62;
    this.input.on('wheel', (_pointer, _gameObjects, _dx, dy) => {
      const maxScroll = Math.max(0, data.issues.length * rowHeight - 410);
      this.targetScrollOffset = Phaser.Math.Clamp(
        this.targetScrollOffset - dy * 0.8, -maxScroll, 0
      );
    });

    // Smooth scroll update
    this.events.on('update', () => {
      this.scrollOffset += (this.targetScrollOffset - this.scrollOffset) * 0.15;
      this.demonContainer.y = this.scrollOffset;
    });
  }

  // =====================================================================
  // STONE WALL BACKGROUND
  // =====================================================================
  drawStoneWalls() {
    const g = this.add.graphics();

    // Base dark stone fill
    g.fillStyle(0x0e0e1c);
    g.fillRect(0, 0, 800, 600);

    // Stone brick pattern
    const brickH = 24;
    const brickW = 50;
    for (let row = 0; row < 26; row++) {
      const yy = row * brickH;
      const offset = (row % 2 === 0) ? 0 : brickW * 0.5;
      for (let col = -1; col < 18; col++) {
        const xx = col * brickW + offset;
        // Subtle brightness variation per brick
        const shade = 0x0d0d18 + (((row * 7 + col * 13) % 5) * 0x010102);
        g.fillStyle(shade);
        g.fillRect(xx + 1, yy + 1, brickW - 2, brickH - 2);
      }
      // Horizontal mortar line
      g.lineStyle(1, 0x08080f, 0.6);
      g.lineBetween(0, yy, 800, yy);
    }

    // Vertical mortar lines (offset per row)
    for (let row = 0; row < 26; row++) {
      const yy = row * brickH;
      const offset = (row % 2 === 0) ? 0 : brickW * 0.5;
      g.lineStyle(1, 0x08080f, 0.5);
      for (let col = 0; col < 18; col++) {
        const xx = col * brickW + offset;
        g.lineBetween(xx, yy, xx, yy + brickH);
      }
    }

    // Dark gradient overlay at top and bottom for depth
    for (let i = 0; i < 40; i++) {
      const a = 0.6 * (1 - i / 40);
      g.fillStyle(0x000000, a);
      g.fillRect(0, i, 800, 1);
      g.fillRect(0, 600 - i, 800, 1);
    }

    // Side shadows for corridor depth
    for (let i = 0; i < 60; i++) {
      const a = 0.5 * (1 - i / 60);
      g.fillStyle(0x000000, a);
      g.fillRect(i, 0, 1, 600);
      g.fillRect(800 - i, 0, 1, 600);
    }
  }

  // =====================================================================
  // TORCH LIGHTING
  // =====================================================================
  drawTorches() {
    const torchPositions = [
      { x: 22, y: 150 }, { x: 778, y: 150 },
      { x: 22, y: 320 }, { x: 778, y: 320 },
      { x: 22, y: 490 }, { x: 778, y: 490 }
    ];

    torchPositions.forEach((pos) => {
      // Torch bracket (small rectangle)
      const bracket = this.add.graphics();
      bracket.fillStyle(0x5a4030);
      bracket.fillRect(pos.x - 3, pos.y + 4, 6, 14);
      bracket.fillStyle(0x3a2a1a);
      bracket.fillRect(pos.x - 4, pos.y + 2, 8, 4);

      // Flame core (small bright shape)
      const flame = this.add.graphics();
      this.drawFlame(flame, pos.x, pos.y, 1.0);

      // Warm light glow — layered circles for realistic falloff
      const glow = this.add.graphics();
      this.drawTorchGlow(glow, pos.x, pos.y, 1.0);

      this.torches.push({ flame, glow, x: pos.x, y: pos.y, phase: Math.random() * Math.PI * 2 });
    });

    // Animate torch flicker
    this.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        this.torches.forEach((t) => {
          t.phase += 0.3 + Math.random() * 0.2;
          const intensity = 0.7 + 0.3 * Math.sin(t.phase);
          t.flame.clear();
          this.drawFlame(t.flame, t.x, t.y, intensity);
          t.glow.clear();
          this.drawTorchGlow(t.glow, t.x, t.y, intensity);
        });
      }
    });
  }

  drawFlame(g, x, y, intensity) {
    // Flame body
    g.fillStyle(0xf0a020, intensity);
    g.fillEllipse(x, y - 2, 6 * intensity, 10 * intensity);
    // Flame tip (brighter)
    g.fillStyle(0xffe060, intensity * 0.9);
    g.fillEllipse(x, y - 5, 3 * intensity, 6 * intensity);
    // White-hot core
    g.fillStyle(0xffffff, intensity * 0.5);
    g.fillEllipse(x, y, 2, 3);
  }

  drawTorchGlow(g, x, y, intensity) {
    const layers = [
      { radius: 90, color: 0xf09020, alpha: 0.04 * intensity },
      { radius: 60, color: 0xf0a030, alpha: 0.06 * intensity },
      { radius: 35, color: 0xf0b040, alpha: 0.08 * intensity },
      { radius: 18, color: 0xf0c050, alpha: 0.12 * intensity }
    ];
    layers.forEach((l) => {
      g.fillStyle(l.color, l.alpha);
      g.fillCircle(x, y, l.radius);
    });
  }

  // =====================================================================
  // VIGNETTE
  // =====================================================================
  drawVignette() {
    const g = this.add.graphics();
    g.setDepth(1000);
    // Corner darkening
    for (let i = 0; i < 120; i++) {
      const a = 0.25 * (1 - i / 120);
      g.fillStyle(0x000000, a);
      // top-left arc
      g.fillRect(0, i * 2, i, 1);
      g.fillRect(i, 0, 1, i * 2);
      // top-right
      g.fillRect(800 - i, 0, 1, i * 2);
      // bottom-left
      g.fillRect(0, 600 - i * 2, i, 1);
      // bottom-right
      g.fillRect(800 - i, 600 - i * 2, i, 1);
    }
  }

  // =====================================================================
  // HEADER
  // =====================================================================
  drawHeader(data) {
    // Header panel background
    const headerBg = this.add.graphics();
    headerBg.setDepth(100);
    headerBg.fillStyle(0x0a0a16, 0.95);
    headerBg.fillRect(0, 0, 800, 88);
    // Bottom border with gold accent
    headerBg.lineStyle(2, 0xf0c040, 0.4);
    headerBg.lineBetween(40, 87, 760, 87);
    // Decorative corner pieces
    headerBg.lineStyle(1, 0xf0c040, 0.3);
    headerBg.lineBetween(40, 87, 40, 78);
    headerBg.lineBetween(760, 87, 760, 78);

    // Title with gold styling
    const title = this.add.text(400, 18, `THE DUNGEON OF`, {
      fontFamily: HEADER_FONT,
      fontSize: '11px',
      color: '#a0a0b0',
      letterSpacing: 4
    }).setOrigin(0.5).setDepth(101);

    const domainText = this.add.text(400, 38, data.domain.toUpperCase(), {
      fontFamily: HEADER_FONT,
      fontSize: '14px',
      color: COLORS.gold,
      shadow: {
        offsetX: 0, offsetY: 0, color: '#f0c040', blur: 12, fill: true, stroke: true
      }
    }).setOrigin(0.5).setDepth(101);

    // Decorative swords beside title
    const swordL = this.add.text(domainText.x - domainText.width * 0.5 - 28, 38, '\u2694', {
      fontFamily: BODY_FONT, fontSize: '16px', color: COLORS.gold
    }).setOrigin(0.5).setDepth(101);
    const swordR = this.add.text(domainText.x + domainText.width * 0.5 + 28, 38, '\u2694', {
      fontFamily: BODY_FONT, fontSize: '16px', color: COLORS.gold
    }).setOrigin(0.5).setDepth(101);

    // Score display — prominent with color glow
    const scoreColor = data.score >= 70 ? COLORS.green : data.score >= 40 ? COLORS.gold : COLORS.red;
    const scoreGlowHex = data.score >= 70 ? '#40c040' : data.score >= 40 ? '#f0c040' : '#e04040';

    const scoreLabel = this.add.text(200, 66, 'SEO SCORE', {
      fontFamily: HEADER_FONT, fontSize: '8px', color: '#808090'
    }).setOrigin(0.5).setDepth(101);

    const scoreValue = this.add.text(200, 78, `${data.score}/100`, {
      fontFamily: HEADER_FONT,
      fontSize: '12px',
      color: scoreColor,
      shadow: {
        offsetX: 0, offsetY: 0, color: scoreGlowHex, blur: 16, fill: true, stroke: true
      }
    }).setOrigin(0.5).setDepth(101);

    // Pulsing glow on score
    this.tweens.add({
      targets: scoreValue,
      alpha: 0.7,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Demon count
    const demonLabel = this.add.text(600, 66, 'DEMONS', {
      fontFamily: HEADER_FONT, fontSize: '8px', color: '#808090'
    }).setOrigin(0.5).setDepth(101);

    const demonCount = this.add.text(600, 78, `${data.totalIssues} AWAIT`, {
      fontFamily: HEADER_FONT,
      fontSize: '12px',
      color: '#e04040',
      shadow: {
        offsetX: 0, offsetY: 0, color: '#e04040', blur: 10, fill: true, stroke: true
      }
    }).setOrigin(0.5).setDepth(101);
  }

  // =====================================================================
  // FOOTER
  // =====================================================================
  drawFooter() {
    const footerBg = this.add.graphics();
    footerBg.setDepth(100);
    footerBg.fillStyle(0x0a0a16, 0.95);
    footerBg.fillRect(0, 518, 800, 82);
    // Top border
    footerBg.lineStyle(2, 0xf0c040, 0.3);
    footerBg.lineBetween(40, 519, 760, 519);

    // Knight
    const knight = this.add.image(90, 560, 'knight').setScale(2.0).setDepth(101);
    const sword = this.add.image(118, 548, 'sword').setScale(1.3).setAngle(-30).setDepth(101);
    const shield = this.add.image(62, 553, 'shield').setScale(1.3).setDepth(101);

    // Knight idle bob
    this.tweens.add({
      targets: knight,
      y: 556,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Sword sway
    this.tweens.add({
      targets: sword,
      angle: -25,
      y: 544,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Shield sway
    this.tweens.add({
      targets: shield,
      y: 549,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Knight breathing glow
    const knightGlow = this.add.graphics().setDepth(100);
    knightGlow.fillStyle(0x4080e0, 0.06);
    knightGlow.fillCircle(90, 560, 40);
    this.tweens.add({
      targets: knightGlow,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Instruction text — pulsing
    const instruction = this.add.text(460, 560, 'Click a demon to engage', {
      fontFamily: HEADER_FONT,
      fontSize: '9px',
      color: '#f0c040',
      shadow: {
        offsetX: 0, offsetY: 0, color: '#f0c040', blur: 8, fill: true, stroke: true
      }
    }).setOrigin(0.5).setDepth(101);

    this.tweens.add({
      targets: instruction,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Decorative dots
    const dots = this.add.text(460, 580, '\u25C6  \u25C6  \u25C6', {
      fontFamily: BODY_FONT, fontSize: '6px', color: '#404060'
    }).setOrigin(0.5).setDepth(101);
  }

  // =====================================================================
  // REVEAL DEMONS
  // =====================================================================
  revealDemons(issues) {
    issues.forEach((issue, i) => {
      this.time.delayedCall(i * 350, () => {
        this.materializeDemon(issue, i);
      });
    });
  }

  // =====================================================================
  // MATERIALIZE A SINGLE DEMON ROW
  // =====================================================================
  materializeDemon(issue, index) {
    const rowHeight = 62;
    const y = 96 + index * rowHeight;
    const centerY = y + rowHeight * 0.5;
    const severitySprite = `demon_${issue.severity}`;

    const severityColors = {
      critical: { text: '#ff2040', hex: 0xff2040, glow: '#ff2040', bgTint: 0x2a0810 },
      high:     { text: '#e06020', hex: 0xe06020, glow: '#e06020', bgTint: 0x2a1508 },
      medium:   { text: '#f0c040', hex: 0xf0c040, glow: '#f0c040', bgTint: 0x2a2208 },
      low:      { text: '#40c040', hex: 0x40c040, glow: '#40c040', bgTint: 0x082a10 },
      info:     { text: '#4080e0', hex: 0x4080e0, glow: '#4080e0', bgTint: 0x08102a }
    };
    const sev = severityColors[issue.severity] || severityColors.info;

    // --- ROW BACKGROUND ---
    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x10101e, 0);
    rowBg.fillRoundedRect(50, y, 700, rowHeight - 4, 4);

    // Interactive hit area
    const hitArea = this.add.rectangle(400, centerY - 1, 700, rowHeight - 4, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Row border (initially invisible)
    const rowBorder = this.add.graphics();

    // Hover effects
    hitArea.on('pointerover', () => {
      rowBg.clear();
      rowBg.fillStyle(sev.bgTint, 0.9);
      rowBg.fillRoundedRect(50, y, 700, rowHeight - 4, 4);
      rowBorder.clear();
      rowBorder.lineStyle(1, sev.hex, 0.6);
      rowBorder.strokeRoundedRect(50, y, 700, rowHeight - 4, 4);
    });
    hitArea.on('pointerout', () => {
      rowBg.clear();
      rowBg.fillStyle(0x12121e, 0.7);
      rowBg.fillRoundedRect(50, y, 700, rowHeight - 4, 4);
      rowBorder.clear();
      rowBorder.lineStyle(1, 0x1e1e30, 0.3);
      rowBorder.strokeRoundedRect(50, y, 700, rowHeight - 4, 4);
    });
    hitArea.on('pointerdown', () => this.engageDemon(issue));

    // Fade in background
    this.tweens.add({
      targets: rowBg,
      alpha: { from: 0, to: 1 },
      duration: 600,
      onComplete: () => {
        rowBg.clear();
        rowBg.fillStyle(0x12121e, 0.7);
        rowBg.fillRoundedRect(50, y, 700, rowHeight - 4, 4);
        rowBorder.lineStyle(1, 0x1e1e30, 0.3);
        rowBorder.strokeRoundedRect(50, y, 700, rowHeight - 4, 4);
      }
    });

    // --- SHADOW BURST PARTICLES ---
    this.createShadowBurst(80, centerY);

    // --- DEMON SPRITE ---
    const demon = this.add.image(80, centerY, severitySprite).setScale(0).setAlpha(0);
    this.tweens.add({
      targets: demon,
      scaleX: 0.9, scaleY: 0.9, alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
      delay: 100
    });

    // Demon idle hover
    this.tweens.add({
      targets: demon,
      y: centerY - 3,
      duration: 1200 + index * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600
    });

    // Demon shadow underneath
    const shadow = this.add.ellipse(80, centerY + 14, 20, 6, 0x000000, 0.3);
    this.tweens.add({
      targets: shadow,
      scaleX: 0.85,
      duration: 1200 + index * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600
    });

    // --- SEVERITY BADGE ---
    const badgeW = issue.severity.length * 8 + 12;
    const badgeBg = this.add.graphics().setAlpha(0);
    badgeBg.fillStyle(sev.hex, 0.15);
    badgeBg.fillRoundedRect(130, y + 6, badgeW, 16, 3);
    badgeBg.lineStyle(1, sev.hex, 0.4);
    badgeBg.strokeRoundedRect(130, y + 6, badgeW, 16, 3);

    const badge = this.add.text(130 + badgeW * 0.5, y + 14, issue.severity.toUpperCase(), {
      fontFamily: HEADER_FONT,
      fontSize: '7px',
      color: sev.text,
      shadow: { offsetX: 0, offsetY: 0, color: sev.glow, blur: 6, fill: true, stroke: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [badge, badgeBg], alpha: 1, duration: 400, delay: 200 });

    // --- TITLE ---
    const title = this.add.text(135, y + 28, issue.title, {
      fontFamily: BODY_FONT,
      fontSize: '13px',
      color: '#d8d8e8',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
    }).setAlpha(0);
    // Truncate if too long
    if (title.width > 360) {
      title.setStyle({ fontSize: '11px' });
    }
    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 300 });

    // --- CATEGORY TAG ---
    const catText = issue.category || '';
    const cat = this.add.text(135, y + 44, catText, {
      fontFamily: BODY_FONT,
      fontSize: '9px',
      color: '#40c0c0',
      fontStyle: 'italic'
    }).setAlpha(0);
    this.tweens.add({ targets: cat, alpha: 0.7, duration: 400, delay: 350 });

    // --- HP BAR ---
    const hpBarX = 570;
    const hpBarY = centerY - 4;
    const hpBarW = 120;
    const hpBarH = 10;
    const hpPct = Phaser.Math.Clamp(issue.hp / 100, 0, 1);

    // HP bar background
    const hpBarBg = this.add.graphics().setAlpha(0);
    hpBarBg.fillStyle(0x1a0808, 1);
    hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 2);
    hpBarBg.lineStyle(1, 0x400808, 0.6);
    hpBarBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 2);

    // HP bar fill (animated)
    const hpColor = hpPct > 0.6 ? 0xe04040 : hpPct > 0.3 ? 0xf0c040 : 0x40c040;
    const hpFill = this.add.graphics();
    const hpFillW = { value: 0 };

    // HP shimmer overlay
    const hpShimmer = this.add.graphics().setAlpha(0);

    // HP text
    const hpText = this.add.text(hpBarX + hpBarW + 8, hpBarY + hpBarH * 0.5, `${issue.hp} HP`, {
      fontFamily: HEADER_FONT,
      fontSize: '7px',
      color: '#e04040',
      shadow: { offsetX: 0, offsetY: 0, color: '#e04040', blur: 4, fill: true, stroke: true }
    }).setOrigin(0, 0.5).setAlpha(0);

    // Animate HP bar
    this.tweens.add({ targets: hpBarBg, alpha: 1, duration: 300, delay: 300 });
    this.tweens.add({
      targets: hpFillW,
      value: hpBarW * hpPct,
      duration: 700,
      delay: 450,
      ease: 'Power2',
      onUpdate: () => {
        hpFill.clear();
        if (hpFillW.value > 0) {
          hpFill.fillStyle(hpColor, 0.9);
          hpFill.fillRoundedRect(hpBarX + 1, hpBarY + 1, hpFillW.value - 2, hpBarH - 2, 2);
        }
      },
      onComplete: () => {
        // Start shimmer animation
        this.startHpShimmer(hpShimmer, hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
      }
    });
    this.tweens.add({ targets: hpText, alpha: 1, duration: 300, delay: 550 });

    // --- SCREEN SHAKE FOR CRITICAL ---
    if (issue.severity === 'critical') {
      this.time.delayedCall(250, () => {
        this.cameras.main.shake(300, 0.004);
        // Red flash on critical
        this.cameras.main.flash(150, 60, 0, 0);
      });
    }

    // --- DEFEATED OVERLAY ---
    if (issue.defeated) {
      this.time.delayedCall(700, () => {
        const defeatOverlay = this.add.graphics();
        defeatOverlay.fillStyle(0x000000, 0.65);
        defeatOverlay.fillRoundedRect(50, y, 700, rowHeight - 4, 4);

        const defeatText = this.add.text(400, centerY, 'DEFEATED', {
          fontFamily: HEADER_FONT,
          fontSize: '12px',
          color: COLORS.green,
          shadow: {
            offsetX: 0, offsetY: 0, color: '#40c040', blur: 12, fill: true, stroke: true
          }
        }).setOrigin(0.5);

        // Strikethrough line
        const line = this.add.graphics();
        line.lineStyle(1, 0x40c040, 0.4);
        line.lineBetween(80, centerY, 720, centerY);

        this.demonContainer.add([defeatOverlay, defeatText, line]);
        hitArea.disableInteractive();
      });
    }

    // Add everything to scroll container
    this.demonContainer.add([
      rowBg, rowBorder, hitArea, shadow, demon,
      badgeBg, badge, title, cat,
      hpBarBg, hpFill, hpShimmer, hpText
    ]);
  }

  // =====================================================================
  // SHADOW BURST PARTICLES (materialization effect)
  // =====================================================================
  createShadowBurst(x, y) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 15 + Math.random() * 10;
      const p = this.add.circle(x, y, 2 + Math.random() * 2, 0x6040a0, 0.8);
      this.demonContainer.add(p);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }

    // Central flash
    const flash = this.add.circle(x, y, 8, 0xa070e0, 0.6);
    this.demonContainer.add(flash);
    this.tweens.add({
      targets: flash,
      scaleX: 2.5, scaleY: 2.5,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => flash.destroy()
    });
  }

  // =====================================================================
  // HP BAR SHIMMER
  // =====================================================================
  startHpShimmer(gfx, x, y, w, h) {
    if (w < 4) return;
    const shimmerPos = { value: 0 };
    this.tweens.add({
      targets: shimmerPos,
      value: 1,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        gfx.clear();
        gfx.setAlpha(0.25);
        const sx = x + shimmerPos.value * (w + 10) - 10;
        // Small bright band that sweeps across the bar
        gfx.fillStyle(0xffffff, 0.4);
        gfx.fillRect(
          Phaser.Math.Clamp(sx, x + 1, x + w - 1),
          y + 2,
          Phaser.Math.Clamp(6, 0, Math.max(0, x + w - sx)),
          h - 4
        );
      }
    });
  }

  // =====================================================================
  // ENGAGE DEMON (transition to battle)
  // =====================================================================
  engageDemon(issue) {
    // Dramatic flash and screen shake
    this.cameras.main.flash(400, 255, 50, 50);
    this.cameras.main.shake(200, 0.006);

    // Brief dramatic pause before transition
    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(600, () => {
        this.scene.start('Battle', { issue });
      });
    });
  }
}
