import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Battle scene — Final Fantasy style turn-based combat.
 * Knight vs SEO Demon. Selecting ATTACK triggers Claude to fix the issue.
 * High-quality 16-bit retro RPG battle screen with dramatic animations.
 */
export class BattleScene extends Phaser.Scene {
  constructor() {
    super('Battle');
  }

  init(data) {
    this.issue = data.issue;
    this.demonHp = data.issue.hp;
    this.demonMaxHp = data.issue.hp;
    this.knightHp = 100;
    this.isPlayerTurn = true;
    this.battleOver = false;
    this.selectedMenuItem = 0;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x000000);

    // ── Dark dungeon background ──────────────────────
    this.drawDungeonBackground();

    // ── Dramatic entrance ────────────────────────────
    this.cameras.main.fadeIn(800, 0, 0, 0);

    // ── Battle arena floor ───────────────────────────
    this.drawBattleFloor();

    // ── Demon side (right) ───────────────────────────
    this.createDemon();

    // ── Knight side (left) ───────────────────────────
    this.createKnight();

    // ── UI Layer ─────────────────────────────────────
    this.createHPDisplays();
    this.createBattleLog();
    this.createCommandMenu();
    this.createIssueDetails();
    this.createStreamText();

    // ── Dramatic entrance animation ──────────────────
    this.playEntranceAnimation();

    // ── Keyboard support ─────────────────────────────
    this.setupKeyboard();
  }

  // ═══════════════════════════════════════════════════
  //  BACKGROUND & ENVIRONMENT
  // ═══════════════════════════════════════════════════

  drawDungeonBackground() {
    // Dark stone wall gradient
    const bgGfx = this.add.graphics();

    // Stone wall base
    bgGfx.fillStyle(0x12101a, 1);
    bgGfx.fillRect(0, 0, 800, 360);

    // Stone brick pattern
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 16; col++) {
        const offset = (row % 2 === 0) ? 0 : 25;
        const x = col * 50 + offset;
        const y = row * 40;
        const shade = 0x18 + Phaser.Math.Between(-3, 3);
        const color = Phaser.Display.Color.GetColor(shade, shade - 2, shade + 6);
        bgGfx.fillStyle(color, 1);
        bgGfx.fillRect(x + 1, y + 1, 48, 38);
      }
    }

    // Mortar lines (subtle)
    bgGfx.lineStyle(1, 0x0a0a12, 0.6);
    for (let row = 0; row <= 9; row++) {
      bgGfx.lineBetween(0, row * 40, 800, row * 40);
    }
    for (let row = 0; row < 9; row++) {
      const offset = (row % 2 === 0) ? 0 : 25;
      for (let col = 0; col <= 16; col++) {
        const x = col * 50 + offset;
        bgGfx.lineBetween(x, row * 40, x, (row + 1) * 40);
      }
    }

    // Vignette overlay - darker edges
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.4);
    vignette.fillRect(0, 0, 80, 360);
    vignette.fillRect(720, 0, 80, 360);
    vignette.fillStyle(0x000000, 0.3);
    vignette.fillRect(0, 0, 800, 30);

    // Torch glow areas (left and right)
    this.createTorchGlow(100, 80);
    this.createTorchGlow(700, 80);
    this.createTorchGlow(400, 50);
  }

  createTorchGlow(x, y) {
    const glow = this.add.graphics();
    glow.fillStyle(0xff6600, 0.04);
    glow.fillCircle(x, y, 120);
    glow.fillStyle(0xff8800, 0.03);
    glow.fillCircle(x, y, 80);
    glow.fillStyle(0xffaa00, 0.02);
    glow.fillCircle(x, y, 50);

    // Animated torch flicker
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.6, to: 1.0 },
      duration: Phaser.Math.Between(300, 600),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Torch flame particles
    this.time.addEvent({
      delay: 180,
      repeat: -1,
      callback: () => {
        const flame = this.add.circle(
          x + Phaser.Math.Between(-4, 4),
          y,
          Phaser.Math.Between(2, 4),
          Phaser.Utils.Array.GetRandom([0xff6600, 0xff8800, 0xffaa00, 0xffcc44]),
          0.6
        );
        this.tweens.add({
          targets: flame,
          y: y - Phaser.Math.Between(15, 35),
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: Phaser.Math.Between(300, 600),
          ease: 'Power1',
          onComplete: () => flame.destroy()
        });
      }
    });
  }

  drawBattleFloor() {
    const floor = this.add.graphics();
    // Dark floor with perspective lines
    floor.fillStyle(0x0e0c16, 1);
    floor.fillRect(0, 300, 800, 120);

    // Floor tile pattern
    for (let i = 0; i < 20; i++) {
      const alpha = 0.05 + (i % 2) * 0.03;
      floor.fillStyle(0x1a1828, alpha);
      floor.fillRect(i * 42, 300, 40, 120);
    }

    // Floor highlight line
    floor.lineStyle(1, 0x2a2a3e, 0.5);
    floor.lineBetween(0, 300, 800, 300);
    floor.lineStyle(1, 0x1a1a2e, 0.3);
    floor.lineBetween(0, 340, 800, 340);
    floor.lineBetween(0, 380, 800, 380);
  }

  // ═══════════════════════════════════════════════════
  //  CHARACTER CREATION
  // ═══════════════════════════════════════════════════

  createDemon() {
    const demonKey = `demon_${this.issue.severity}_real`;
    const demonScales = { critical: 4, high: 3.5, medium: 3, low: 2.5, info: 2 };
    const demonScale = demonScales[this.issue.severity] || 3;
    const sevColor = this.getSeverityHexColor();

    // Pulsing shadow beneath demon
    this.demonShadow = this.add.ellipse(580, 350, 100, 24, 0x000000, 0.5);

    // Menacing aura / glow
    this.demonAuraOuter = this.add.ellipse(580, 240, 130, 140, sevColor, 0.06);
    this.demonAuraInner = this.add.ellipse(580, 240, 90, 100, sevColor, 0.1);

    this.tweens.add({
      targets: this.demonAuraOuter,
      scaleX: 1.3,
      scaleY: 1.2,
      alpha: 0.02,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.tweens.add({
      targets: this.demonAuraInner,
      scaleX: 1.15,
      scaleY: 1.1,
      alpha: 0.15,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 200
    });

    // Demon sprite (real pixel art, scaled by severity)
    this.demon = this.add.image(580, 240, demonKey).setScale(demonScale);
    this.demon.setAlpha(0); // for entrance anim

    // Demon idle hover
    this.tweens.add({
      targets: this.demon,
      y: 228,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Shadow breathe sync
    this.tweens.add({
      targets: this.demonShadow,
      scaleX: 0.85,
      alpha: 0.35,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createKnight() {
    // Knight shadow
    this.knightShadow = this.add.ellipse(180, 380, 80, 18, 0x000000, 0.4);

    // Knight (animated warrior sprite)
    this.knight = this.add.sprite(180, 320, 'warrior_idle').setScale(2.5).setAlpha(0).play('warrior_idle_anim');
    this.sword = this.add.image(215, 310, 'sword').setScale(1.5).setAngle(-30).setAlpha(0);
    this.shield = this.add.image(145, 325, 'shield').setScale(1.5).setAlpha(0);

    // Knight idle breathing (subtle)
    this.tweens.add({
      targets: [this.knight, this.sword, this.shield],
      y: '+=4',
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Shadow breathe
    this.tweens.add({
      targets: this.knightShadow,
      scaleX: 0.9,
      alpha: 0.3,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ═══════════════════════════════════════════════════
  //  ENTRANCE ANIMATION
  // ═══════════════════════════════════════════════════

  playEntranceAnimation() {
    // Knight slides in from left
    this.knight.setX(-60);
    this.sword.setX(-25);
    this.shield.setX(-95);

    this.tweens.add({
      targets: this.knight,
      x: 180,
      alpha: 1,
      duration: 700,
      ease: 'Back.easeOut',
      delay: 300
    });
    this.tweens.add({
      targets: this.sword,
      x: 215,
      alpha: 1,
      duration: 700,
      ease: 'Back.easeOut',
      delay: 350
    });
    this.tweens.add({
      targets: this.shield,
      x: 145,
      alpha: 1,
      duration: 700,
      ease: 'Back.easeOut',
      delay: 400
    });

    // Demon materializes with flash (scale to severity-based size)
    const finalDemonScale = this.demon.scaleX;
    this.demon.setScale(0.5);
    this.time.delayedCall(600, () => {
      this.cameras.main.flash(200, 80, 20, 20);
      this.tweens.add({
        targets: this.demon,
        alpha: 1,
        scaleX: finalDemonScale,
        scaleY: finalDemonScale,
        duration: 500,
        ease: 'Back.easeOut'
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  HP DISPLAYS
  // ═══════════════════════════════════════════════════

  createHPDisplays() {
    // ── Demon HP (top right area) ──────────────
    const demonPanelX = 440;
    const demonPanelY = 100;

    // Demon name plate
    const namePanel = this.add.graphics();
    namePanel.fillStyle(0x0a0a18, 0.85);
    namePanel.fillRoundedRect(demonPanelX, demonPanelY, 280, 78, 4);
    namePanel.lineStyle(2, this.getSeverityHexColor(), 0.8);
    namePanel.strokeRoundedRect(demonPanelX, demonPanelY, 280, 78, 4);

    // Inner highlight line
    namePanel.lineStyle(1, 0x2a2a4a, 0.3);
    namePanel.strokeRoundedRect(demonPanelX + 2, demonPanelY + 2, 276, 74, 3);

    this.add.text(demonPanelX + 10, demonPanelY + 6, this.issue.title, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.white,
      wordWrap: { width: 260 }
    });

    const sevColor = COLORS[this.issue.severity] || COLORS.red;
    this.add.text(demonPanelX + 10, demonPanelY + 24, this.issue.severity.toUpperCase(), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: sevColor
    });

    // HP bar background
    const barX = demonPanelX + 10;
    const barY = demonPanelY + 44;
    const barW = 220;
    const barH = 16;

    this.add.text(barX, barY + 1, 'HP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.gray
    });

    const barStartX = barX + 28;
    const actualBarW = barW - 28;

    // Bar frame
    const barFrame = this.add.graphics();
    barFrame.fillStyle(0x200808, 1);
    barFrame.fillRoundedRect(barStartX, barY, actualBarW, barH, 2);
    barFrame.lineStyle(1, 0x4a2020, 1);
    barFrame.strokeRoundedRect(barStartX, barY, actualBarW, barH, 2);

    // HP bar fill
    this.demonHpBar = this.add.graphics();
    this.demonHpBarWidth = actualBarW - 4;
    this.demonHpBarX = barStartX + 2;
    this.demonHpBarY = barY + 2;
    this.demonHpBarH = barH - 4;
    this.drawDemonHpBar(1.0);

    // HP shimmer overlay
    this.demonHpShimmer = this.add.graphics();
    this.drawBarShimmer(this.demonHpShimmer, this.demonHpBarX, this.demonHpBarY, this.demonHpBarWidth, this.demonHpBarH);

    // HP text
    this.demonHpText = this.add.text(barStartX + actualBarW + 8, barY + 1, `${this.demonHp}/${this.demonMaxHp}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.red
    });

    // ── Knight HP (bottom left area) ──────────
    const knightPanelX = 30;
    const knightPanelY = 388;

    const kPanel = this.add.graphics();
    kPanel.fillStyle(0x0a0a18, 0.85);
    kPanel.fillRoundedRect(knightPanelX, knightPanelY, 250, 48, 4);
    kPanel.lineStyle(2, 0x40c0c0, 0.6);
    kPanel.strokeRoundedRect(knightPanelX, knightPanelY, 250, 48, 4);
    kPanel.lineStyle(1, 0x2a2a4a, 0.3);
    kPanel.strokeRoundedRect(knightPanelX + 2, knightPanelY + 2, 246, 44, 3);

    this.add.text(knightPanelX + 10, knightPanelY + 5, 'SEO KNIGHT', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: COLORS.cyan
    });

    const kBarX = knightPanelX + 10;
    const kBarY = knightPanelY + 24;
    const kBarW = 190;
    const kBarH = 16;

    this.add.text(kBarX, kBarY + 1, 'HP', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.gray
    });

    const kBarStartX = kBarX + 28;
    const kActualBarW = kBarW - 28;

    const kBarFrame = this.add.graphics();
    kBarFrame.fillStyle(0x082008, 1);
    kBarFrame.fillRoundedRect(kBarStartX, kBarY, kActualBarW, kBarH, 2);
    kBarFrame.lineStyle(1, 0x204a20, 1);
    kBarFrame.strokeRoundedRect(kBarStartX, kBarY, kActualBarW, kBarH, 2);

    this.knightHpBar = this.add.graphics();
    this.knightHpBarWidth = kActualBarW - 4;
    this.knightHpBarX = kBarStartX + 2;
    this.knightHpBarY = kBarY + 2;
    this.knightHpBarH = kBarH - 4;
    this.drawKnightHpBar(1.0);

    // Knight HP shimmer
    this.knightHpShimmer = this.add.graphics();
    this.drawBarShimmer(this.knightHpShimmer, this.knightHpBarX, this.knightHpBarY, this.knightHpBarWidth, this.knightHpBarH);

    this.knightHpText = this.add.text(kBarStartX + kActualBarW + 8, kBarY + 1, `${this.knightHp}/100`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.green
    });
  }

  drawDemonHpBar(pct) {
    this.demonHpBar.clear();
    if (pct <= 0) return;
    const w = this.demonHpBarWidth * pct;
    // Gradient effect: darker at bottom
    this.demonHpBar.fillStyle(0xe04040, 1);
    this.demonHpBar.fillRoundedRect(this.demonHpBarX, this.demonHpBarY, w, this.demonHpBarH, 1);
    // Lighter highlight on top half
    this.demonHpBar.fillStyle(0xff6060, 0.4);
    this.demonHpBar.fillRect(this.demonHpBarX, this.demonHpBarY, w, this.demonHpBarH / 2);
  }

  drawKnightHpBar(pct) {
    this.knightHpBar.clear();
    if (pct <= 0) return;
    const w = this.knightHpBarWidth * pct;
    this.knightHpBar.fillStyle(0x40c040, 1);
    this.knightHpBar.fillRoundedRect(this.knightHpBarX, this.knightHpBarY, w, this.knightHpBarH, 1);
    this.knightHpBar.fillStyle(0x70e070, 0.4);
    this.knightHpBar.fillRect(this.knightHpBarX, this.knightHpBarY, w, this.knightHpBarH / 2);
  }

  drawBarShimmer(gfx, x, y, w, h) {
    // Animated shimmer that sweeps across
    gfx.clear();
    gfx.fillStyle(0xffffff, 0.08);
    gfx.fillRect(x, y, w, 2);

    // Animate shimmer sweep
    const shimmerRect = this.add.rectangle(x - 20, y + h / 2, 20, h, 0xffffff, 0.15);
    shimmerRect.setOrigin(0, 0.5);
    this.tweens.add({
      targets: shimmerRect,
      x: x + w,
      duration: 2500,
      repeat: -1,
      delay: Phaser.Math.Between(0, 1000),
      ease: 'Linear',
      onUpdate: () => {
        if (shimmerRect.x < x || shimmerRect.x > x + w) {
          shimmerRect.setAlpha(0);
        } else {
          shimmerRect.setAlpha(0.15);
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  BATTLE LOG (FF-style, bottom-left)
  // ═══════════════════════════════════════════════════

  createBattleLog() {
    const logX = 16;
    const logY = 440;
    const logW = 520;
    const logH = 104;

    // Log panel with FF-style double border
    const logGfx = this.add.graphics();

    // Outer border
    logGfx.lineStyle(3, 0xb8b8d8, 1);
    logGfx.strokeRoundedRect(logX, logY, logW, logH, 6);

    // Inner fill
    logGfx.fillStyle(0x0a0a24, 0.95);
    logGfx.fillRoundedRect(logX + 2, logY + 2, logW - 4, logH - 4, 5);

    // Inner border highlight
    logGfx.lineStyle(1, 0x3a3a6e, 0.6);
    logGfx.strokeRoundedRect(logX + 4, logY + 4, logW - 8, logH - 8, 4);

    // Corner accents
    logGfx.fillStyle(0xb8b8d8, 0.5);
    logGfx.fillRect(logX + 6, logY + 6, 3, 3);
    logGfx.fillRect(logX + logW - 9, logY + 6, 3, 3);
    logGfx.fillRect(logX + 6, logY + logH - 9, 3, 3);
    logGfx.fillRect(logX + logW - 9, logY + logH - 9, 3, 3);

    this.battleLog = this.add.text(logX + 14, logY + 12, 'A wild SEO demon appears!', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: COLORS.white,
      lineSpacing: 6,
      wordWrap: { width: logW - 32 }
    });

    // Blinking indicator
    this.logIndicator = this.add.text(logX + logW - 22, logY + logH - 20, '\u25BC', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.gold
    });
    this.tweens.add({
      targets: this.logIndicator,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }

  // ═══════════════════════════════════════════════════
  //  COMMAND MENU (FF-style, bottom-right)
  // ═══════════════════════════════════════════════════

  createCommandMenu() {
    const menuX = 548;
    const menuY = 440;
    const menuW = 236;
    const menuH = 104;

    // Menu panel with double border (FF style)
    const menuGfx = this.add.graphics();

    // Outer border
    menuGfx.lineStyle(3, 0xb8b8d8, 1);
    menuGfx.strokeRoundedRect(menuX, menuY, menuW, menuH, 6);

    // Inner fill
    menuGfx.fillStyle(0x0a0a24, 0.95);
    menuGfx.fillRoundedRect(menuX + 2, menuY + 2, menuW - 4, menuH - 4, 5);

    // Inner border highlight
    menuGfx.lineStyle(1, 0x3a3a6e, 0.6);
    menuGfx.strokeRoundedRect(menuX + 4, menuY + 4, menuW - 8, menuH - 8, 4);

    // Corner accents (gold)
    menuGfx.fillStyle(0xf0c040, 0.8);
    menuGfx.fillRect(menuX + 6, menuY + 6, 4, 4);
    menuGfx.fillRect(menuX + menuW - 10, menuY + 6, 4, 4);
    menuGfx.fillRect(menuX + 6, menuY + menuH - 10, 4, 4);
    menuGfx.fillRect(menuX + menuW - 10, menuY + menuH - 10, 4, 4);

    const commands = [
      { label: 'ATTACK', icon: '\u2694', action: () => this.doAttack() },
      { label: 'DEFEND', icon: '\u26E8', action: () => this.doDefend() },
      { label: 'INSPECT', icon: '\u25C9', action: () => this.doInspect() },
      { label: 'FLEE', icon: '\u21B6', action: () => this.doFlee() }
    ];

    this.menuItems = commands.map((cmd, i) => {
      const itemY = menuY + 14 + i * 22;
      const text = this.add.text(menuX + 40, itemY, cmd.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: COLORS.white
      }).setInteractive({ useHandCursor: true });

      // Icon
      this.add.text(menuX + 24, itemY, cmd.icon, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: COLORS.gray
      });

      // Hover highlight zone (full row)
      const hitZone = this.add.rectangle(menuX + menuW / 2, itemY + 7, menuW - 16, 20, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        if (this.isPlayerTurn && !this.battleOver) {
          this.selectMenuItem(i);
        }
      });

      hitZone.on('pointerdown', () => {
        if (this.isPlayerTurn && !this.battleOver) {
          this.selectMenuItem(i);
          cmd.action();
        }
      });

      text.on('pointerover', () => {
        if (this.isPlayerTurn && !this.battleOver) {
          this.selectMenuItem(i);
        }
      });

      text.on('pointerdown', () => {
        if (this.isPlayerTurn && !this.battleOver) {
          this.selectMenuItem(i);
          cmd.action();
        }
      });

      text._cmdAction = cmd.action;
      return text;
    });

    // Bouncing arrow cursor
    this.cursor = this.add.text(menuX + 10, menuY + 14, '\u25B6', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.gold
    });

    this.tweens.add({
      targets: this.cursor,
      x: menuX + 16,
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.selectMenuItem(0);
  }

  selectMenuItem(index) {
    this.selectedMenuItem = index;
    this.menuItems.forEach((item, i) => {
      if (i === index) {
        item.setColor(COLORS.gold);
        item.setScale(1.05);
      } else {
        item.setColor(COLORS.white);
        item.setScale(1.0);
      }
    });
    // Move cursor
    const targetY = this.menuItems[index].y;
    this.cursor.y = targetY;
  }

  setupKeyboard() {
    this.input.keyboard.on('keydown-UP', () => {
      if (!this.isPlayerTurn || this.battleOver) return;
      this.selectMenuItem((this.selectedMenuItem - 1 + 4) % 4);
    });
    this.input.keyboard.on('keydown-DOWN', () => {
      if (!this.isPlayerTurn || this.battleOver) return;
      this.selectMenuItem((this.selectedMenuItem + 1) % 4);
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if (!this.isPlayerTurn || this.battleOver) return;
      this.menuItems[this.selectedMenuItem]._cmdAction();
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isPlayerTurn || this.battleOver) return;
      this.menuItems[this.selectedMenuItem]._cmdAction();
    });
  }

  // ═══════════════════════════════════════════════════
  //  ISSUE DETAILS (very bottom strip)
  // ═══════════════════════════════════════════════════

  createIssueDetails() {
    const detX = 16;
    const detY = 550;
    const detW = 768;
    const detH = 44;

    const detGfx = this.add.graphics();
    detGfx.fillStyle(0x0e0c1a, 0.92);
    detGfx.fillRoundedRect(detX, detY, detW, detH, 3);
    detGfx.lineStyle(1, 0x2a2a4e, 0.6);
    detGfx.strokeRoundedRect(detX, detY, detW, detH, 3);

    // Category badge
    const catText = this.add.text(detX + 10, detY + 4, this.issue.category, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.cyan
    });

    // Separator
    this.add.text(catText.x + catText.width + 8, detY + 4, '|', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#3a3a5e'
    });

    // Description
    this.add.text(detX + 10, detY + 22, this.issue.description, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: COLORS.gray,
      wordWrap: { width: detW - 24 }
    });
  }

  createStreamText() {
    this.streamText = this.add.text(24, 556, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: COLORS.purple,
      wordWrap: { width: 740 }
    }).setDepth(10);
  }

  // ═══════════════════════════════════════════════════
  //  BATTLE LOG HELPER
  // ═══════════════════════════════════════════════════

  setLog(msg) {
    this.battleLog.setText(msg);
    // Quick text pop effect
    this.battleLog.setScale(1.02);
    this.tweens.add({
      targets: this.battleLog,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: 'Back.easeOut'
    });
  }

  // ═══════════════════════════════════════════════════
  //  ATTACK
  // ═══════════════════════════════════════════════════

  async doAttack() {
    if (!this.isPlayerTurn || this.battleOver) return;
    this.isPlayerTurn = false;

    this.setLog('Knight channels the power of Claude...');

    // Sword slash animation
    await this.slashAnimation();

    // Try real fix via bridge, fall back to demo
    try {
      const result = await bridge.fix(this.issue, this.game.projectPath, (stream) => {
        const clean = stream.replace(/[\n\r]+/g, ' ').trim();
        if (clean.length > 0) {
          this.streamText.setText(clean.substring(0, 90) + '...');
          if (this.game.addLog) this.game.addLog(clean);
        }
      });
      this.streamText.setText('');
      const fixData = result.data || result;
      if (fixData && fixData.fixed) {
        this.dealDamage(this.demonMaxHp); // One-shot if fix succeeds
        this.setLog(`Claude vanquished the demon! ${fixData.summary || 'Fixed: ' + this.issue.title}`);
      } else {
        // Partial fix
        const damage = Phaser.Math.Between(40, 70);
        this.dealDamage(damage);
        this.setLog(`Claude strikes for ${damage} damage! ${fixData.summary || ''}`);
      }
    } catch (err) {
      // Demo mode -- deal partial damage
      this.streamText.setText('');
      const damage = Phaser.Math.Between(25, 50);
      this.dealDamage(damage);
      this.setLog(`Knight strikes for ${damage} damage!`);
    }

    // Check if demon is dead
    if (this.demonHp <= 0) {
      this.demonDefeated();
      return;
    }

    // Demon turn
    this.time.delayedCall(1200, () => this.demonTurn());
  }

  async slashAnimation() {
    return new Promise(resolve => {
      // Play attack animation
      this.knight.play('warrior_attack_anim');

      // Knight lunges forward dramatically
      this.tweens.add({
        targets: [this.knight, this.sword, this.shield],
        x: '+=120',
        duration: 180,
        ease: 'Power3',
        onComplete: () => {
          // Screen flash
          this.cameras.main.flash(150, 255, 255, 255, true);

          // Multiple slash lines
          this.createSlashEffect(580, 240, 0);
          this.time.delayedCall(60, () => this.createSlashEffect(580, 240, -30));
          this.time.delayedCall(120, () => this.createSlashEffect(580, 240, 30));

          // Hit particles
          this.createHitParticles(580, 240, 0xffffff);
          this.createHitParticles(580, 240, this.getSeverityHexColor());

          // Demon knockback + red flash
          this.demon.setTint(0xff0000);
          this.cameras.main.shake(200, 0.015);

          this.tweens.add({
            targets: this.demon,
            x: 620,
            duration: 80,
            yoyo: true,
            ease: 'Power2',
            onComplete: () => {
              this.time.delayedCall(100, () => this.demon.clearTint());
            }
          });

          // Knight returns
          this.time.delayedCall(200, () => {
            this.tweens.add({
              targets: [this.knight, this.sword, this.shield],
              x: '-=120',
              duration: 300,
              ease: 'Power2',
              onComplete: () => {
                this.knight.play('warrior_idle_anim');
                resolve();
              }
            });
          });
        }
      });
    });
  }

  createSlashEffect(x, y, angleOffset) {
    const slash = this.add.graphics();
    slash.lineStyle(3, 0xffffff, 0.9);

    const startAngle = (-45 + angleOffset) * Math.PI / 180;
    const endAngle = (45 + angleOffset) * Math.PI / 180;
    const radius = 50;

    slash.beginPath();
    slash.moveTo(
      x + Math.cos(startAngle) * radius,
      y + Math.sin(startAngle) * radius
    );

    // Draw arc-like slash
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + (endAngle - startAngle) * t;
      const r = radius + Math.sin(t * Math.PI) * 20;
      slash.lineTo(
        x + Math.cos(angle) * r,
        y + Math.sin(angle) * r
      );
    }
    slash.strokePath();

    // Glow line
    slash.lineStyle(6, 0xffffff, 0.3);
    slash.beginPath();
    slash.moveTo(
      x + Math.cos(startAngle) * radius,
      y + Math.sin(startAngle) * radius
    );
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const angle = startAngle + (endAngle - startAngle) * t;
      const r = radius + Math.sin(t * Math.PI) * 20;
      slash.lineTo(
        x + Math.cos(angle) * r,
        y + Math.sin(angle) * r
      );
    }
    slash.strokePath();

    // Fade and destroy
    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 250,
      onComplete: () => slash.destroy()
    });
  }

  createHitParticles(x, y, color) {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.Between(60, 180);
      const size = Phaser.Math.Between(2, 6);

      const particle = this.add.rectangle(
        x + Phaser.Math.Between(-10, 10),
        y + Phaser.Math.Between(-10, 10),
        size, size, color, 1
      );

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: Phaser.Math.Between(300, 600),
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  DAMAGE DEALING
  // ═══════════════════════════════════════════════════

  dealDamage(amount) {
    this.demonHp = Math.max(0, this.demonHp - amount);
    const pct = this.demonHp / this.demonMaxHp;

    // Animate HP bar smoothly
    this.tweens.addCounter({
      from: (this.demonHp + amount) / this.demonMaxHp,
      to: pct,
      duration: 600,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.drawDemonHpBar(tween.getValue());
      }
    });

    // Damage number - dramatic float with scale
    const dmgText = this.add.text(580, 200, `-${amount}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#ff4040',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScale(0.3);

    // Scale up, then float up and fade
    this.tweens.add({
      targets: dmgText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: dmgText,
          y: 140,
          scaleX: 1.0,
          scaleY: 1.0,
          alpha: 0,
          duration: 900,
          ease: 'Power1',
          onComplete: () => dmgText.destroy()
        });
      }
    });

    this.demonHpText.setText(`${this.demonHp}/${this.demonMaxHp}`);

    // Demon red flash
    this.demon.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      this.demon.setTint(0xff4444);
      this.time.delayedCall(100, () => this.demon.clearTint());
    });

    // Screen shake on hit
    this.cameras.main.shake(150, 0.01);

    // Red flash overlay
    const redFlash = this.add.rectangle(580, 240, 120, 120, 0xff0000, 0.3);
    this.tweens.add({
      targets: redFlash,
      alpha: 0,
      duration: 200,
      onComplete: () => redFlash.destroy()
    });

    // Hit particles
    this.createHitParticles(580, 240, 0xff4040);
  }

  // ═══════════════════════════════════════════════════
  //  DEMON TURN
  // ═══════════════════════════════════════════════════

  demonTurn() {
    if (this.battleOver) return;

    this.setLog('The demon retaliates!');

    // Demon lunge attack
    this.tweens.add({
      targets: this.demon,
      x: 380,
      duration: 250,
      ease: 'Power3',
      onComplete: () => {
        const damage = Phaser.Math.Between(5, 15);
        this.knightHp = Math.max(0, this.knightHp - damage);
        const pct = this.knightHp / 100;

        // Screen flash
        this.cameras.main.flash(80, 100, 20, 20);

        // Knight knockback
        this.tweens.add({
          targets: [this.knight, this.sword, this.shield],
          x: '-=20',
          duration: 80,
          yoyo: true,
          ease: 'Power2'
        });

        // Knight hit animation then return to idle
        this.knight.play('warrior_hit_anim');
        this.knight.once('animationcomplete', () => {
          this.knight.play('warrior_idle_anim');
        });

        // Knight red flash
        this.knight.setTint(0xff4444);
        this.time.delayedCall(200, () => this.knight.clearTint());

        // Update HP bar smoothly
        this.tweens.addCounter({
          from: (this.knightHp + damage) / 100,
          to: pct,
          duration: 400,
          ease: 'Power2',
          onUpdate: (tween) => {
            this.drawKnightHpBar(tween.getValue());
          }
        });

        this.knightHpText.setText(`${this.knightHp}/100`);

        // Damage popup on knight
        const dmgText = this.add.text(180, 280, `-${damage}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '18px',
          color: '#ff8040',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setScale(0.3);

        this.tweens.add({
          targets: dmgText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 120,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: dmgText,
              y: 240,
              scaleX: 0.8,
              scaleY: 0.8,
              alpha: 0,
              duration: 700,
              onComplete: () => dmgText.destroy()
            });
          }
        });

        // Hit particles on knight
        this.createHitParticles(180, 320, 0xff8040);

        // Demon returns
        this.tweens.add({
          targets: this.demon,
          x: 580,
          duration: 400,
          ease: 'Power2',
          delay: 150,
          onComplete: () => {
            this.setLog(`Demon deals ${damage} damage! Your turn, knight.`);
            this.isPlayerTurn = true;
          }
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  DEFEND
  // ═══════════════════════════════════════════════════

  doDefend() {
    if (!this.isPlayerTurn || this.battleOver) return;
    this.isPlayerTurn = false;

    this.setLog('Knight raises shield! Defense increased.');

    // Shield glow effect
    this.shield.setTint(0x40c0f0);

    // Shield pulse
    this.tweens.add({
      targets: this.shield,
      scaleX: 2.0,
      scaleY: 2.0,
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.shield.setScale(1.5);
        this.time.delayedCall(300, () => this.shield.clearTint());
      }
    });

    // Shield barrier ring
    const barrier = this.add.graphics();
    barrier.lineStyle(3, 0x40c0f0, 0.6);
    barrier.strokeCircle(180, 320, 50);
    barrier.lineStyle(1, 0x80e0ff, 0.3);
    barrier.strokeCircle(180, 320, 55);
    this.tweens.add({
      targets: barrier,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 600,
      ease: 'Power1',
      onComplete: () => barrier.destroy()
    });

    // Green heal particles rising upward
    for (let i = 0; i < 12; i++) {
      const p = this.add.rectangle(
        180 + Phaser.Math.Between(-35, 35),
        380,
        4, 4,
        Phaser.Utils.Array.GetRandom([0x40e0a0, 0x60ff80, 0x80ffc0]),
        0.8
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 100),
        x: p.x + Phaser.Math.Between(-10, 10),
        alpha: 0,
        duration: 900,
        delay: i * 60,
        ease: 'Power1',
        onComplete: () => p.destroy()
      });
    }

    // Heal a bit
    this.knightHp = Math.min(100, this.knightHp + 10);
    const pct = this.knightHp / 100;

    this.tweens.addCounter({
      from: (this.knightHp - 10) / 100,
      to: pct,
      duration: 400,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.drawKnightHpBar(tween.getValue());
      }
    });

    this.knightHpText.setText(`${this.knightHp}/100`);

    // +10 heal text
    const healText = this.add.text(180, 300, '+10', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#40e080',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: healText,
      y: 260,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => healText.destroy()
    });

    this.time.delayedCall(1000, () => {
      this.demonTurn();
    });
  }

  // ═══════════════════════════════════════════════════
  //  INSPECT
  // ═══════════════════════════════════════════════════

  doInspect() {
    if (!this.isPlayerTurn || this.battleOver) return;

    this.setLog(`[${this.issue.category}] ${this.issue.description} | Severity: ${this.issue.severity} | HP: ${this.demonHp}/${this.demonMaxHp}`);

    // Flash demon with info color
    this.demon.setTint(0x4080e0);
    this.time.delayedCall(400, () => this.demon.clearTint());

    // Inspect scanning ring
    const scanRing = this.add.graphics();
    scanRing.lineStyle(2, 0x4080e0, 0.7);
    scanRing.strokeCircle(580, 240, 30);
    this.tweens.add({
      targets: scanRing,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 700,
      ease: 'Power1',
      onComplete: () => scanRing.destroy()
    });

    // Inspect eye particles
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(
        580 + Phaser.Math.Between(-40, 40),
        240 + Phaser.Math.Between(-40, 40),
        3, 0x4080e0, 0.7
      );
      this.tweens.add({
        targets: p,
        alpha: 0,
        scaleX: 3,
        scaleY: 3,
        duration: 600,
        delay: i * 60,
        onComplete: () => p.destroy()
      });
    }
  }

  // ═══════════════════════════════════════════════════
  //  FLEE
  // ═══════════════════════════════════════════════════

  doFlee() {
    if (!this.isPlayerTurn || this.battleOver) return;

    this.setLog('You retreat from battle...');

    // Knight runs off screen left
    this.tweens.add({
      targets: [this.knight, this.sword, this.shield],
      x: '-=300',
      alpha: 0,
      duration: 600,
      ease: 'Power2'
    });

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('DungeonHall');
    });
  }

  // ═══════════════════════════════════════════════════
  //  DEMON DEFEATED
  // ═══════════════════════════════════════════════════

  demonDefeated() {
    this.battleOver = true;

    // Mark issue as defeated in game data
    this.issue.defeated = true;

    this.setLog(`${this.issue.title} has been vanquished!`);

    // Big screen flash
    this.cameras.main.flash(600, 255, 220, 80);
    this.cameras.main.shake(400, 0.025);

    // Explosion particles burst (3 waves)
    const colors = [0xffffff, 0xff4040, 0xf0c040, 0xff8040, this.getSeverityHexColor()];
    for (let wave = 0; wave < 3; wave++) {
      this.time.delayedCall(wave * 150, () => {
        for (let i = 0; i < 24; i++) {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const speed = Phaser.Math.Between(80, 260);
          const color = Phaser.Utils.Array.GetRandom(colors);
          const size = Phaser.Math.Between(2, 8);

          const p = this.add.rectangle(
            580 + Phaser.Math.Between(-15, 15),
            240 + Phaser.Math.Between(-15, 15),
            size, size, color, 1
          ).setDepth(20);

          this.tweens.add({
            targets: p,
            x: p.x + Math.cos(angle) * speed,
            y: p.y + Math.sin(angle) * speed - 30,
            alpha: 0,
            scaleX: 0.1,
            scaleY: 0.1,
            duration: Phaser.Math.Between(400, 900),
            ease: 'Power2',
            onComplete: () => p.destroy()
          });
        }
      });
    }

    // Expanding white ring explosion
    for (let r = 0; r < 3; r++) {
      this.time.delayedCall(r * 120, () => {
        const ring = this.add.graphics().setDepth(19);
        ring.lineStyle(3 - r, 0xffffff, 0.7 - r * 0.2);
        ring.strokeCircle(580, 240, 20);
        this.tweens.add({
          targets: ring,
          scaleX: 4 + r,
          scaleY: 4 + r,
          alpha: 0,
          duration: 600,
          ease: 'Power1',
          onComplete: () => ring.destroy()
        });
      });
    }

    // Demon dissolve - flicker then shrink
    this.tweens.add({
      targets: this.demon,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        // Final dissolve
        this.tweens.add({
          targets: this.demon,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 4,
          y: 300,
          duration: 800,
          ease: 'Power3'
        });
      }
    });

    // Aura dissolve
    this.tweens.add({
      targets: [this.demonAuraOuter, this.demonAuraInner, this.demonShadow],
      alpha: 0,
      duration: 800,
      delay: 500
    });

    // Second screen flash for extra drama
    this.time.delayedCall(600, () => {
      this.cameras.main.flash(200, 255, 200, 100);
    });

    // Victory flash
    this.time.delayedCall(1500, () => {
      this.cameras.main.flash(300, 255, 255, 200);

      // Victory text
      const victoryText = this.add.text(400, 200, 'VICTORY!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '32px',
        color: COLORS.gold,
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setScale(0.1).setDepth(30);

      this.tweens.add({
        targets: victoryText,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 400,
        ease: 'Back.easeOut'
      });

      // Sparkle particles around victory text
      for (let i = 0; i < 10; i++) {
        this.time.delayedCall(i * 80, () => {
          const spark = this.add.rectangle(
            400 + Phaser.Math.Between(-120, 120),
            200 + Phaser.Math.Between(-30, 30),
            3, 3, 0xf0c040, 1
          ).setDepth(31);
          this.tweens.add({
            targets: spark,
            alpha: 0,
            scaleX: 0.1,
            scaleY: 0.1,
            y: spark.y - Phaser.Math.Between(20, 50),
            duration: 500,
            onComplete: () => spark.destroy()
          });
        });
      }
    });

    // Transition to victory
    this.time.delayedCall(2500, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(800, () => {
        this.scene.start('Victory', { issue: this.issue });
      });
    });
  }

  // ═══════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════

  getSeverityHexColor() {
    const map = {
      critical: 0xff2040,
      high: 0xe06020,
      medium: 0xf0c040,
      low: 0x40c040,
      info: 0x4080e0
    };
    return map[this.issue.severity] || 0xe04040;
  }
}
