import { COLORS } from '../utils/colors.js';
import { HALL_MESSAGES } from '../utils/flavor-text.js';

const HEADER_FONT = '"JetBrains Mono", monospace';
const BODY_FONT = 'monospace';

// Row geometry
const ROW_HEIGHT = 70;
const ROW_GAP = 6;
const ROW_TOTAL = ROW_HEIGHT + ROW_GAP;
const LIST_TOP = 94;
const LIST_BOTTOM = 518;
const LIST_VISIBLE = LIST_BOTTOM - LIST_TOP; // 424px

// Demon sprite scales per severity (real 32x32 PNGs scaled up)
const SPRITE_SCALES = {
  critical: 4,
  high: 3.5,
  medium: 3,
  low: 2.5,
  info: 2
};

/**
 * Dungeon Hall -- RPG encounter screen.
 * Demons listed in styled rows; player clicks to engage.
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

    // ---------- HEADER AREA (fixed, top 90px) ----------
    this.drawHeader(data);

    // ---------- MASK for scrollable area ----------
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, LIST_TOP, 800, LIST_VISIBLE);
    const geoMask = maskShape.createGeometryMask();

    // ---------- Container for scrollable demon list ----------
    this.demonContainer = this.add.container(0, 0);
    this.demonContainer.setMask(geoMask);

    // ---------- Reveal demons one by one ----------
    this.revealDemons(data.issues);

    // ---------- FOOTER AREA (fixed) ----------
    this.drawFooter();

    // ---------- MOMENTUM SCROLLING ----------
    this.scrollOffset = 0;
    this.targetScrollOffset = 0;
    this.scrollVelocity = 0;
    this.isDragging = false;
    this.lastPointerY = 0;

    const maxScroll = () => Math.max(0, data.issues.length * ROW_TOTAL - LIST_VISIBLE + 10);

    // Mouse wheel
    this.input.on('wheel', (_pointer, _gameObjects, _dx, dy) => {
      this.scrollVelocity = 0;
      this.targetScrollOffset = Phaser.Math.Clamp(
        this.targetScrollOffset - dy * 1.2, -maxScroll(), 0
      );
    });

    // Touch / click-drag scroll
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y > LIST_TOP && pointer.y < LIST_BOTTOM) {
        this.isDragging = true;
        this.lastPointerY = pointer.y;
        this.scrollVelocity = 0;
      }
    });
    this.input.on('pointermove', (pointer) => {
      if (this.isDragging && pointer.isDown) {
        const dy = pointer.y - this.lastPointerY;
        this.targetScrollOffset = Phaser.Math.Clamp(
          this.targetScrollOffset + dy, -maxScroll(), 0
        );
        this.scrollVelocity = dy;
        this.lastPointerY = pointer.y;
      }
    });
    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Smooth scroll with momentum
    this.events.on('update', () => {
      if (!this.isDragging && Math.abs(this.scrollVelocity) > 0.5) {
        this.targetScrollOffset = Phaser.Math.Clamp(
          this.targetScrollOffset + this.scrollVelocity, -maxScroll(), 0
        );
        this.scrollVelocity *= 0.92; // friction
      } else if (!this.isDragging) {
        this.scrollVelocity = 0;
      }
      this.scrollOffset += (this.targetScrollOffset - this.scrollOffset) * 0.18;
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
        const shade = 0x0d0d18 + (((row * 7 + col * 13) % 5) * 0x010102);
        g.fillStyle(shade);
        g.fillRect(xx + 1, yy + 1, brickW - 2, brickH - 2);
      }
      g.lineStyle(1, 0x08080f, 0.6);
      g.lineBetween(0, yy, 800, yy);
    }

    // Vertical mortar lines
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
      const bracket = this.add.graphics();
      bracket.fillStyle(0x5a4030);
      bracket.fillRect(pos.x - 3, pos.y + 4, 6, 14);
      bracket.fillStyle(0x3a2a1a);
      bracket.fillRect(pos.x - 4, pos.y + 2, 8, 4);

      const flame = this.add.graphics();
      this.drawFlame(flame, pos.x, pos.y, 1.0);

      const glow = this.add.graphics();
      this.drawTorchGlow(glow, pos.x, pos.y, 1.0);

      this.torches.push({ flame, glow, x: pos.x, y: pos.y, phase: Math.random() * Math.PI * 2 });
    });

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
    g.fillStyle(0xf0a020, intensity);
    g.fillEllipse(x, y - 2, 6 * intensity, 10 * intensity);
    g.fillStyle(0xffe060, intensity * 0.9);
    g.fillEllipse(x, y - 5, 3 * intensity, 6 * intensity);
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
    for (let i = 0; i < 120; i++) {
      const a = 0.25 * (1 - i / 120);
      g.fillStyle(0x000000, a);
      g.fillRect(0, i * 2, i, 1);
      g.fillRect(i, 0, 1, i * 2);
      g.fillRect(800 - i, 0, 1, i * 2);
      g.fillRect(0, 600 - i * 2, i, 1);
      g.fillRect(800 - i, 600 - i * 2, i, 1);
    }
  }

  // =====================================================================
  // HEADER (top 90px)
  // =====================================================================
  drawHeader(data) {
    const headerBg = this.add.graphics();
    headerBg.setDepth(100);

    // Solid dark panel
    headerBg.fillStyle(0x08081a, 0.97);
    headerBg.fillRect(0, 0, 800, 90);

    // Ornamental bottom border -- double line with gold
    headerBg.lineStyle(1, 0xf0c040, 0.15);
    headerBg.lineBetween(30, 84, 770, 84);
    headerBg.lineStyle(2, 0xf0c040, 0.5);
    headerBg.lineBetween(30, 88, 770, 88);

    // Corner filigree
    headerBg.lineStyle(1, 0xf0c040, 0.35);
    headerBg.lineBetween(30, 88, 30, 74);
    headerBg.lineBetween(770, 88, 770, 74);
    headerBg.lineBetween(30, 74, 38, 74);
    headerBg.lineBetween(770, 74, 762, 74);

    // "THE DUNGEON OF" subtitle
    this.add.text(400, 14, 'THE DUNGEON OF', {
      fontFamily: HEADER_FONT,
      fontSize: '10px',
      color: '#707090',
      letterSpacing: 6
    }).setOrigin(0.5, 0).setDepth(101);

    // Domain name -- big gold text
    const domainText = this.add.text(400, 32, data.domain.toUpperCase(), {
      fontFamily: HEADER_FONT,
      fontSize: '16px',
      color: COLORS.gold,
      shadow: {
        offsetX: 0, offsetY: 0, color: '#f0c040', blur: 16, fill: true, stroke: true
      }
    }).setOrigin(0.5, 0).setDepth(101);

    // Decorative swords beside domain
    const hw = domainText.width * 0.5;
    this.add.text(400 - hw - 26, 38, '\u2694', {
      fontFamily: BODY_FONT, fontSize: '16px', color: COLORS.gold
    }).setOrigin(0.5).setDepth(101);
    this.add.text(400 + hw + 26, 38, '\u2694', {
      fontFamily: BODY_FONT, fontSize: '16px', color: COLORS.gold
    }).setOrigin(0.5).setDepth(101);

    // --- SEO SCORE (left) ---
    const scoreColor = data.score >= 70 ? COLORS.green : data.score >= 40 ? COLORS.gold : COLORS.red;
    const scoreGlowHex = data.score >= 70 ? '#40c040' : data.score >= 40 ? '#f0c040' : '#e04040';

    this.add.text(160, 60, 'SEO SCORE', {
      fontFamily: HEADER_FONT, fontSize: '10px', color: '#606080'
    }).setOrigin(0.5, 0).setDepth(101);

    const scoreValue = this.add.text(160, 74, `${data.score}/100`, {
      fontFamily: HEADER_FONT,
      fontSize: '14px',
      color: scoreColor,
      shadow: {
        offsetX: 0, offsetY: 0, color: scoreGlowHex, blur: 18, fill: true, stroke: true
      }
    }).setOrigin(0.5, 0).setDepth(101);

    // Pulsing glow on score
    this.tweens.add({
      targets: scoreValue,
      alpha: 0.65,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // --- DEMON COUNT (right) ---
    this.add.text(640, 60, 'DEMONS', {
      fontFamily: HEADER_FONT, fontSize: '10px', color: '#606080'
    }).setOrigin(0.5, 0).setDepth(101);

    this.add.text(640, 74, `${data.totalIssues} AWAIT`, {
      fontFamily: HEADER_FONT,
      fontSize: '14px',
      color: '#e04040',
      shadow: {
        offsetX: 0, offsetY: 0, color: '#e04040', blur: 12, fill: true, stroke: true
      }
    }).setOrigin(0.5, 0).setDepth(101);

    // --- Divider diamonds in center bottom ---
    this.add.text(400, 60, '\u25C6  \u25C6  \u25C6', {
      fontFamily: BODY_FONT, fontSize: '10px', color: '#303050'
    }).setOrigin(0.5, 0).setDepth(101);
  }

  // =====================================================================
  // FOOTER
  // =====================================================================
  drawFooter() {
    const footerBg = this.add.graphics();
    footerBg.setDepth(100);
    footerBg.fillStyle(0x08081a, 0.97);
    footerBg.fillRect(0, LIST_BOTTOM, 800, 82);

    // Top border
    footerBg.lineStyle(2, 0xf0c040, 0.35);
    footerBg.lineBetween(30, LIST_BOTTOM + 1, 770, LIST_BOTTOM + 1);
    footerBg.lineStyle(1, 0xf0c040, 0.15);
    footerBg.lineBetween(30, LIST_BOTTOM + 5, 770, LIST_BOTTOM + 5);

    // Corner filigree
    footerBg.lineStyle(1, 0xf0c040, 0.35);
    footerBg.lineBetween(30, LIST_BOTTOM + 1, 30, LIST_BOTTOM + 14);
    footerBg.lineBetween(770, LIST_BOTTOM + 1, 770, LIST_BOTTOM + 14);

    // Knight (animated warrior idle sprite)
    const knight = this.add.sprite(90, 558, 'warrior_idle').setScale(2).setDepth(101).play('warrior_idle_anim');

    // Knight breathing glow
    const knightGlow = this.add.graphics().setDepth(100);
    knightGlow.fillStyle(0x4080e0, 0.06);
    knightGlow.fillCircle(90, 558, 40);
    this.tweens.add({
      targets: knightGlow,
      alpha: 0.4,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Flavor text that cycles through HALL_MESSAGES
    const randomHall = () => HALL_MESSAGES[Math.floor(Math.random() * HALL_MESSAGES.length)];
    const instruction = this.add.text(460, 555, randomHall(), {
      fontFamily: HEADER_FONT,
      fontSize: '10px',
      color: '#f0c040',
      shadow: {
        offsetX: 0, offsetY: 0, color: '#f0c040', blur: 8, fill: true, stroke: true
      }
    }).setOrigin(0.5).setDepth(101);

    // Cycle flavor text every 4 seconds with fade
    this.time.addEvent({
      delay: 4000,
      loop: true,
      callback: () => {
        this.tweens.add({
          targets: instruction,
          alpha: 0,
          duration: 400,
          onComplete: () => {
            instruction.setText(randomHall());
            this.tweens.add({ targets: instruction, alpha: 1, duration: 400 });
          }
        });
      }
    });

    this.tweens.add({
      targets: instruction,
      alpha: 0.35,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Scroll hint
    this.add.text(460, 576, '\u25B2 SCROLL TO EXPLORE \u25BC', {
      fontFamily: HEADER_FONT, fontSize: '10px', color: '#404060'
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
  // MATERIALIZE A SINGLE DEMON ROW (70px tall)
  // =====================================================================
  materializeDemon(issue, index) {
    const y = LIST_TOP + index * ROW_TOTAL;
    const centerY = y + ROW_HEIGHT * 0.5;
    const severitySprite = `demon_${issue.severity}_real`;

    const sevPalette = {
      critical: { text: '#ff2040', hex: 0xff2040, glow: '#ff2040', bgTint: 0x2a0810, barStart: 0xff2040, barEnd: 0xcc1030 },
      high:     { text: '#e06020', hex: 0xe06020, glow: '#e06020', bgTint: 0x2a1508, barStart: 0xe06020, barEnd: 0xc04010 },
      medium:   { text: '#f0c040', hex: 0xf0c040, glow: '#f0c040', bgTint: 0x2a2208, barStart: 0xf0c040, barEnd: 0xd0a020 },
      low:      { text: '#40c040', hex: 0x40c040, glow: '#40c040', bgTint: 0x082a10, barStart: 0x40c040, barEnd: 0x309030 },
      info:     { text: '#4080e0', hex: 0x4080e0, glow: '#4080e0', bgTint: 0x08102a, barStart: 0x4080e0, barEnd: 0x3060b0 }
    };
    const sev = sevPalette[issue.severity] || sevPalette.info;

    // Layout constants
    const rowX = 46;
    const rowW = 708;
    const spriteX = 86;
    const textLeftX = 128;
    const hpBarX = 560;
    const hpBarW = 155;
    const hpBarH = 12;

    // =========================
    // ROW BACKGROUND
    // =========================
    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x10101e, 0);
    rowBg.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);

    // Interactive hit area
    const hitArea = this.add.rectangle(400, centerY, rowW, ROW_HEIGHT, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Row border (initially invisible, shows on hover as gold)
    const rowBorder = this.add.graphics();

    // Flash overlay for click state
    const clickFlash = this.add.graphics().setAlpha(0).setDepth(5);

    // =========================
    // HOVER / CLICK STATES
    // =========================
    hitArea.on('pointerover', () => {
      rowBg.clear();
      rowBg.fillStyle(sev.bgTint, 0.95);
      rowBg.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
      rowBorder.clear();
      rowBorder.lineStyle(1.5, 0xf0c040, 0.5);
      rowBorder.strokeRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
    });
    hitArea.on('pointerout', () => {
      rowBg.clear();
      rowBg.fillStyle(0x12121e, 0.7);
      rowBg.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
      rowBorder.clear();
      rowBorder.lineStyle(1, 0x1e1e30, 0.3);
      rowBorder.strokeRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
    });
    hitArea.on('pointerdown', () => {
      // Brief white flash before transition
      clickFlash.clear();
      clickFlash.fillStyle(0xffffff, 0.25);
      clickFlash.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
      this.tweens.add({
        targets: clickFlash,
        alpha: { from: 1, to: 0 },
        duration: 200,
        onComplete: () => this.engageDemon(issue)
      });
    });

    // Fade in row background
    this.tweens.add({
      targets: rowBg,
      alpha: { from: 0, to: 1 },
      duration: 600,
      onComplete: () => {
        rowBg.clear();
        rowBg.fillStyle(0x12121e, 0.7);
        rowBg.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
        rowBorder.lineStyle(1, 0x1e1e30, 0.3);
        rowBorder.strokeRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);
      }
    });

    // =========================
    // SHADOW BURST PARTICLES
    // =========================
    this.createShadowBurst(spriteX, centerY);

    // =========================
    // DEMON SPRITE (left side, scaled by severity)
    // =========================
    const spriteScale = SPRITE_SCALES[issue.severity] || 1.0;
    const demon = this.add.image(spriteX, centerY, severitySprite)
      .setScale(0).setAlpha(0);

    this.tweens.add({
      targets: demon,
      scaleX: spriteScale, scaleY: spriteScale, alpha: 1,
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

    // Demon shadow
    const shadow = this.add.ellipse(spriteX, centerY + 18, 22, 6, 0x000000, 0.3);
    this.tweens.add({
      targets: shadow,
      scaleX: 0.8,
      duration: 1200 + index * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 600
    });

    // =========================
    // SEVERITY BADGE (colored pill)
    // =========================
    const sevLabel = issue.severity.toUpperCase();
    const badgePadX = 10;
    const badgeH = 18;
    const badgeY = y + 8;

    // Measure badge width using temporary text
    const badgeMeasure = this.add.text(0, -100, sevLabel, {
      fontFamily: HEADER_FONT, fontSize: '10px'
    });
    const badgeW = badgeMeasure.width + badgePadX * 2;
    badgeMeasure.destroy();

    const badgeBg = this.add.graphics().setAlpha(0);
    badgeBg.fillStyle(sev.hex, 0.2);
    badgeBg.fillRoundedRect(textLeftX, badgeY, badgeW, badgeH, 9);
    badgeBg.lineStyle(1, sev.hex, 0.5);
    badgeBg.strokeRoundedRect(textLeftX, badgeY, badgeW, badgeH, 9);

    const badge = this.add.text(textLeftX + badgeW * 0.5, badgeY + badgeH * 0.5, sevLabel, {
      fontFamily: HEADER_FONT,
      fontSize: '10px',
      color: sev.text,
      shadow: { offsetX: 0, offsetY: 0, color: sev.glow, blur: 6, fill: true, stroke: true }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [badge, badgeBg], alpha: 1, duration: 400, delay: 200 });

    // =========================
    // ISSUE TITLE (14px readable)
    // =========================
    const titleMaxW = hpBarX - textLeftX - badgeW - 20;
    const title = this.add.text(textLeftX + badgeW + 12, y + 10, issue.title, {
      fontFamily: BODY_FONT,
      fontSize: '14px',
      color: '#d8d8e8',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
      wordWrap: { width: titleMaxW, useAdvancedWrap: true }
    }).setAlpha(0);

    // Clamp to single line if it wraps too much
    if (title.height > 22) {
      const truncated = issue.title.length > 32
        ? issue.title.substring(0, 32) + '...'
        : issue.title;
      title.setText(truncated);
    }

    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 300 });

    // =========================
    // DESCRIPTION (smaller gray below title)
    // =========================
    const descText = issue.description || '';
    if (descText) {
      const descMaxLen = 50;
      const truncDesc = descText.length > descMaxLen
        ? descText.substring(0, descMaxLen) + '...'
        : descText;
      const desc = this.add.text(textLeftX + badgeW + 12, y + 30, truncDesc, {
        fontFamily: BODY_FONT,
        fontSize: '11px',
        color: '#606080'
      }).setAlpha(0);
      this.tweens.add({ targets: desc, alpha: 0.8, duration: 400, delay: 350 });
      this.demonContainer.add(desc);
    }

    // =========================
    // CATEGORY TAG (right side, cyan)
    // =========================
    const catText = issue.category || '';
    if (catText) {
      const catLabel = catText.toUpperCase();
      const catTagW = catLabel.length * 7 + 14;
      const catTagX = rowX + rowW - catTagW - 10;
      const catTagY = y + ROW_HEIGHT - 22;

      const catBg = this.add.graphics().setAlpha(0);
      catBg.fillStyle(0x40c0c0, 0.1);
      catBg.fillRoundedRect(catTagX, catTagY, catTagW, 16, 8);
      catBg.lineStyle(1, 0x40c0c0, 0.3);
      catBg.strokeRoundedRect(catTagX, catTagY, catTagW, 16, 8);

      const cat = this.add.text(catTagX + catTagW * 0.5, catTagY + 8, catLabel, {
        fontFamily: BODY_FONT,
        fontSize: '10px',
        color: COLORS.cyan,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: [cat, catBg], alpha: 0.85, duration: 400, delay: 380 });
      this.demonContainer.add([catBg, cat]);
    }

    // =========================
    // HP BAR (150px+ wide, gradient fill, rounded, shimmer)
    // =========================
    const hpBarY = centerY - 6;
    const hpPct = Phaser.Math.Clamp(issue.hp / 100, 0, 1);

    // HP bar background track
    const hpBarBg = this.add.graphics().setAlpha(0);
    hpBarBg.fillStyle(0x0c0408, 1);
    hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 6);
    hpBarBg.lineStyle(1, 0x301818, 0.7);
    hpBarBg.strokeRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 6);

    // HP bar fill (animated grow with gradient simulation)
    const hpFill = this.add.graphics();
    const hpFillW = { value: 0 };

    // HP shimmer overlay
    const hpShimmer = this.add.graphics().setAlpha(0);

    // HP text
    const hpText = this.add.text(hpBarX + hpBarW * 0.5, hpBarY + hpBarH * 0.5, `${issue.hp} HP`, {
      fontFamily: HEADER_FONT,
      fontSize: '10px',
      color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 0, color: '#000000', blur: 4, fill: true, stroke: true }
    }).setOrigin(0.5).setAlpha(0);

    // Animate HP bar
    this.tweens.add({ targets: hpBarBg, alpha: 1, duration: 300, delay: 300 });
    this.tweens.add({
      targets: hpFillW,
      value: (hpBarW - 4) * hpPct,
      duration: 800,
      delay: 500,
      ease: 'Power2',
      onUpdate: () => {
        hpFill.clear();
        if (hpFillW.value > 2) {
          // Gradient simulation: draw two layers
          // Base darker color
          hpFill.fillStyle(sev.barEnd, 0.9);
          hpFill.fillRoundedRect(hpBarX + 2, hpBarY + 2, hpFillW.value, hpBarH - 4, 4);
          // Lighter top half for gradient feel
          hpFill.fillStyle(sev.barStart, 0.7);
          hpFill.fillRoundedRect(hpBarX + 2, hpBarY + 2, hpFillW.value, (hpBarH - 4) * 0.5, { tl: 4, tr: 4, bl: 0, br: 0 });
          // Bright highlight line along top
          hpFill.fillStyle(0xffffff, 0.15);
          hpFill.fillRoundedRect(hpBarX + 4, hpBarY + 3, Math.max(0, hpFillW.value - 4), 2, 1);
        }
      },
      onComplete: () => {
        this.startHpShimmer(hpShimmer, hpBarX + 2, hpBarY + 2, (hpBarW - 4) * hpPct, hpBarH - 4);
      }
    });
    this.tweens.add({ targets: hpText, alpha: 1, duration: 300, delay: 600 });

    // =========================
    // SCREEN SHAKE FOR CRITICAL
    // =========================
    if (issue.severity === 'critical') {
      this.time.delayedCall(250, () => {
        this.cameras.main.shake(300, 0.004);
        this.cameras.main.flash(150, 60, 0, 0);
      });
    }

    // =========================
    // DEFEATED OVERLAY
    // =========================
    if (issue.defeated) {
      this.time.delayedCall(700, () => {
        const defeatOverlay = this.add.graphics();
        defeatOverlay.fillStyle(0x000000, 0.7);
        defeatOverlay.fillRoundedRect(rowX, y, rowW, ROW_HEIGHT, 6);

        const defeatText = this.add.text(400, centerY, 'DEFEATED', {
          fontFamily: HEADER_FONT,
          fontSize: '14px',
          color: COLORS.green,
          shadow: {
            offsetX: 0, offsetY: 0, color: '#40c040', blur: 14, fill: true, stroke: true
          }
        }).setOrigin(0.5);

        // Strikethrough line
        const line = this.add.graphics();
        line.lineStyle(1, 0x40c040, 0.4);
        line.lineBetween(rowX + 20, centerY, rowX + rowW - 20, centerY);

        this.demonContainer.add([defeatOverlay, defeatText, line]);
        hitArea.disableInteractive();
      });
    }

    // Add everything to scroll container
    this.demonContainer.add([
      rowBg, rowBorder, hitArea, clickFlash, shadow, demon,
      badgeBg, badge, title,
      hpBarBg, hpFill, hpShimmer, hpText
    ]);
  }

  // =====================================================================
  // SHADOW BURST PARTICLES (materialization effect)
  // =====================================================================
  createShadowBurst(x, y) {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = 18 + Math.random() * 12;
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
    const flash = this.add.circle(x, y, 10, 0xa070e0, 0.6);
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
    if (w < 6) return;
    const shimmerPos = { value: -0.1 };
    this.tweens.add({
      targets: shimmerPos,
      value: 1.1,
      duration: 2400,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        gfx.clear();
        gfx.setAlpha(0.3);
        const bandW = 10;
        const sx = x + shimmerPos.value * (w + bandW) - bandW;
        const clampedX = Phaser.Math.Clamp(sx, x, x + w - 1);
        const clampedW = Phaser.Math.Clamp(bandW, 0, Math.max(0, x + w - clampedX));
        if (clampedW > 0) {
          gfx.fillStyle(0xffffff, 0.35);
          gfx.fillRect(clampedX, y + 1, clampedW, h - 2);
          // Softer edge glow
          gfx.fillStyle(0xffffff, 0.15);
          gfx.fillRect(clampedX - 3, y + 1, 3, h - 2);
          gfx.fillRect(clampedX + clampedW, y + 1, 3, h - 2);
        }
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
