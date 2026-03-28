import { COLORS, FONTS } from '../utils/colors.js';

/**
 * Victory scene — epic loot screen after defeating a demon.
 * Shows what was fixed, XP gained, then returns to dungeon hall.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.issue = data.issue;
  }

  create() {
    const cx = 400;
    const W = 800;
    const H = 600;

    this.cameras.main.setBackgroundColor(COLORS.bg);

    // ── Dramatic flash on entry ──────────────────────────────
    const flash = this.add.rectangle(cx, 300, W, H, 0xffffff, 1).setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy()
    });

    // ── Ambient background glow ──────────────────────────────
    this.addBackgroundAmbience(cx);

    // ── Confetti / celebration particles ─────────────────────
    this.addCelebrationParticles(false);

    // ── Knight celebration (drawn first so panels overlay legs) ──
    this.addKnightCelebration(cx);

    // ── "VICTORY" title slam-in ──────────────────────────────
    this.addVictoryTitle(cx);

    // ── Loot panel (treasure chest aesthetic) ────────────────
    this.addLootPanel(cx);

    // ── Progress section ─────────────────────────────────────
    const data = this.game.auditData;
    const remaining = data.issues.filter(i => !i.defeated).length;
    const total = data.issues.length;
    const defeated = total - remaining;
    const allClear = remaining === 0;

    this.addProgressSection(cx, defeated, total, allClear);

    // ── Extra celebration for full clear ─────────────────────
    if (allClear) {
      this.time.delayedCall(800, () => this.addCelebrationParticles(true));
      this.time.delayedCall(1600, () => this.addCelebrationParticles(true));
    }

    // ── Continue / Return buttons ────────────────────────────
    this.addContinueButton(cx, remaining, allClear);
  }

  // ═══════════════════════════════════════════════════════════
  //  BACKGROUND AMBIENCE
  // ═══════════════════════════════════════════════════════════

  addBackgroundAmbience(cx) {
    // Radial warm glow behind the knight
    const glow = this.add.circle(cx, 160, 140, 0xf0c040, 0.06);
    this.tweens.add({
      targets: glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.03,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle floating dust motes
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const mote = this.add.circle(x, y, 1, 0xf0c040, Phaser.Math.FloatBetween(0.1, 0.3));
      this.tweens.add({
        targets: mote,
        y: y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          mote.setPosition(Phaser.Math.Between(50, 750), Phaser.Math.Between(300, 550));
          mote.setAlpha(Phaser.Math.FloatBetween(0.1, 0.3));
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  VICTORY TITLE (slam in with bounce + gold glow)
  // ═══════════════════════════════════════════════════════════

  addVictoryTitle(cx) {
    // Shadow text behind title
    const shadow = this.add.text(cx + 3, 48, 'VICTORY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '48px',
      color: '#000000'
    }).setOrigin(0.5).setAlpha(0).setDepth(9);

    // Main title
    const title = this.add.text(cx, 45, 'VICTORY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '48px',
      color: COLORS.gold
    }).setOrigin(0.5).setScale(3).setAlpha(0).setDepth(10);

    // Gold glow underneath title
    const titleGlow = this.add.text(cx, 45, 'VICTORY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '50px',
      color: '#ffdd66'
    }).setOrigin(0.5).setScale(3).setAlpha(0).setDepth(9);

    // Slam-in animation: start big, bounce to final size
    this.tweens.add({
      targets: [title, shadow, titleGlow],
      scale: 1,
      alpha: { value: 1, duration: 200 },
      duration: 700,
      delay: 200,
      ease: 'Bounce.easeOut'
    });

    // Pulsing gold glow on the title
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.3,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1200,
      delay: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Decorative line separators
    const lineLeft = this.add.rectangle(cx - 180, 75, 120, 2, 0xf0c040, 0).setDepth(10);
    const lineRight = this.add.rectangle(cx + 180, 75, 120, 2, 0xf0c040, 0).setDepth(10);
    this.tweens.add({
      targets: [lineLeft, lineRight],
      alpha: 0.8,
      duration: 500,
      delay: 800
    });

    // Small star decorations beside title
    const starLeft = this.add.text(cx - 155, 40, '\u2726', {
      fontSize: '20px', color: COLORS.gold
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    const starRight = this.add.text(cx + 155, 40, '\u2726', {
      fontSize: '20px', color: COLORS.gold
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    this.tweens.add({
      targets: [starLeft, starRight],
      alpha: 1,
      duration: 400,
      delay: 1000
    });
    this.tweens.add({
      targets: [starLeft, starRight],
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  KNIGHT CELEBRATION
  // ═══════════════════════════════════════════════════════════

  addKnightCelebration(cx) {
    // Knight with glow halo
    const knightGlow = this.add.circle(cx, 150, 50, 0xf0c040, 0.12).setDepth(1);
    this.tweens.add({
      targets: knightGlow,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const knight = this.add.image(cx, 155, 'knight').setScale(2.5).setDepth(2);

    // Sword raised high with golden tint
    const sword = this.add.image(cx + 32, 115, 'sword').setScale(1.8).setAngle(-30).setDepth(3);

    // Sword glint effect
    const glint = this.add.circle(cx + 25, 100, 3, 0xffffff, 0.9).setDepth(4);
    this.tweens.add({
      targets: glint,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 600,
      delay: 500,
      yoyo: true,
      repeat: -1,
      hold: 2000,
      ease: 'Quad.easeOut'
    });

    // Sword pump animation (celebratory raise)
    this.tweens.add({
      targets: sword,
      angle: -40,
      y: 108,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Knight subtle bounce
    this.tweens.add({
      targets: knight,
      y: 152,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Entrance: scale up from nothing
    knight.setScale(0);
    sword.setScale(0);
    this.tweens.add({
      targets: knight,
      scale: 2.5,
      duration: 500,
      delay: 100,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: sword,
      scale: 1.8,
      duration: 500,
      delay: 250,
      ease: 'Back.easeOut'
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  LOOT PANEL (treasure chest aesthetic)
  // ═══════════════════════════════════════════════════════════

  addLootPanel(cx) {
    const panelY = 250;
    const panelW = 540;
    const panelH = 200;

    // Outer stone border
    const outerBorder = this.add.rectangle(cx, panelY + 50, panelW + 8, panelH + 8, 0x3a3a5e).setDepth(5);
    // Inner dark panel
    const innerPanel = this.add.rectangle(cx, panelY + 50, panelW, panelH, 0x12122a, 0.97).setDepth(5);
    innerPanel.setStrokeStyle(2, 0x6a5a30);
    // Top ornamental bar (treasure chest lid feel)
    const topBar = this.add.rectangle(cx, panelY - 48, panelW + 8, 10, 0x6a5a30).setDepth(5);
    // Corner rivets
    const rivetPositions = [
      [cx - panelW / 2 - 1, panelY - 48],
      [cx + panelW / 2 + 1, panelY - 48],
      [cx - panelW / 2 - 1, panelY + 50 + panelH / 2 + 1],
      [cx + panelW / 2 + 1, panelY + 50 + panelH / 2 + 1]
    ];
    rivetPositions.forEach(([rx, ry]) => {
      this.add.circle(rx, ry, 4, 0x8a7a40, 0.8).setDepth(6);
    });

    // Animate panel opening (scale from thin line)
    outerBorder.setScaleY(0);
    innerPanel.setScaleY(0);
    topBar.setAlpha(0);
    this.tweens.add({
      targets: [outerBorder, innerPanel],
      scaleY: 1,
      duration: 400,
      delay: 600,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: topBar,
      alpha: 1,
      duration: 200,
      delay: 600
    });

    // ── Content inside panel (faded in after panel opens) ──

    // "DEMON VANQUISHED" header with swords
    const vanquishedText = this.add.text(cx, panelY - 22, '\u2694  DEMON VANQUISHED  \u2694', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '14px',
      color: '#e04040'
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Issue title
    const issueTitle = this.add.text(cx, panelY + 8, this.issue.title, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: COLORS.white,
      fontStyle: 'bold',
      wordWrap: { width: panelW - 40 }
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Issue description
    const issueDesc = this.add.text(cx, panelY + 32, this.issue.description, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#a0a0b0',
      wordWrap: { width: panelW - 60 }
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Separator line
    const separator = this.add.rectangle(cx, panelY + 54, panelW - 60, 1, 0x4a4a6e, 0).setDepth(7);

    // "Spoils of War" header
    const spoilsHeader = this.add.text(cx, panelY + 68, '\u2500\u2500  Spoils of War  \u2500\u2500', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: COLORS.gold
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // XP calculation
    const xp = this.issue.hp * 10;
    const severityBonus = { critical: 500, high: 300, medium: 200, low: 100, info: 50 };
    const bonus = severityBonus[this.issue.severity] || 100;

    // XP display with count-up
    const xpLabel = this.add.text(cx - 100, panelY + 92, 'EXP:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#40c0c0'
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const xpValue = this.add.text(cx - 40, panelY + 92, '+0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#40c0c0'
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const bonusLabel = this.add.text(cx + 80, panelY + 92, 'Bonus:', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#a050d0'
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const bonusValue = this.add.text(cx + 155, panelY + 92, '+0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#a050d0'
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Severity badge
    const sevColors = {
      critical: '#ff2040', high: '#e06020', medium: '#f0c040', low: '#40c040', info: '#4080e0'
    };
    const sevColor = sevColors[this.issue.severity] || '#808090';
    const sevBadge = this.add.text(cx, panelY + 120, `[ ${(this.issue.severity || 'medium').toUpperCase()} ]`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: sevColor
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Staggered content reveal
    const contentItems = [vanquishedText, issueTitle, issueDesc, separator, spoilsHeader, xpLabel, xpValue, bonusLabel, bonusValue, sevBadge];
    contentItems.forEach((item, idx) => {
      this.tweens.add({
        targets: item,
        alpha: 1,
        duration: 300,
        delay: 1000 + idx * 80,
        ease: 'Quad.easeOut'
      });
    });

    // Count-up animation for XP
    this.time.delayedCall(1400, () => {
      this.countUp(xpValue, 0, xp, 800, '+');
    });

    // Count-up animation for bonus
    this.time.delayedCall(1600, () => {
      this.countUp(bonusValue, 0, bonus, 600, '+');
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  PROGRESS SECTION
  // ═══════════════════════════════════════════════════════════

  addProgressSection(cx, defeated, total, allClear) {
    const progressY = 420;

    // Progress text
    const progText = this.add.text(cx, progressY, `Demons defeated: ${defeated} / ${total}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: allClear ? COLORS.green : COLORS.white
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Progress bar background
    const barW = 340;
    const barH = 16;
    const barBg = this.add.rectangle(cx, progressY + 24, barW + 4, barH + 4, 0x0a0a1a).setDepth(6).setAlpha(0);
    barBg.setStrokeStyle(2, 0x4a4a6e);

    // Progress bar track
    const barTrack = this.add.rectangle(cx, progressY + 24, barW, barH, 0x1a1a2e).setDepth(7).setAlpha(0);

    // Progress bar fill (animated)
    const targetWidth = barW * (defeated / total);
    const barColor = allClear ? 0x40c040 : 0xf0c040;
    const barFill = this.add.rectangle(cx - barW / 2, progressY + 24, 0, barH - 2, barColor).setOrigin(0, 0.5).setDepth(8).setAlpha(0);

    // Shimmer overlay on the progress bar
    const shimmer = this.add.rectangle(cx - barW / 2, progressY + 24, 30, barH - 2, 0xffffff, 0.15).setOrigin(0, 0.5).setDepth(9).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [progText, barBg, barTrack],
      alpha: 1,
      duration: 400,
      delay: 2200
    });

    this.tweens.add({
      targets: barFill,
      alpha: 1,
      duration: 200,
      delay: 2200
    });

    // Fill the bar
    this.tweens.add({
      targets: barFill,
      width: targetWidth,
      duration: 1200,
      delay: 2400,
      ease: 'Quad.easeOut'
    });

    // Shimmer slides across the bar
    this.time.delayedCall(2600, () => {
      shimmer.setAlpha(1);
      this.tweens.add({
        targets: shimmer,
        x: cx - barW / 2 + targetWidth - 30,
        duration: 800,
        delay: 600,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          shimmer.setAlpha(0);
          // Repeat shimmer
          this.time.addEvent({
            delay: 3000,
            loop: true,
            callback: () => {
              shimmer.setPosition(cx - barW / 2, progressY + 24);
              shimmer.setAlpha(1);
              this.tweens.add({
                targets: shimmer,
                x: cx - barW / 2 + targetWidth - 30,
                alpha: 0,
                duration: 1000,
                ease: 'Quad.easeInOut'
              });
            }
          });
        }
      });
    });

    // Percentage text at end of bar
    const pctText = this.add.text(cx + barW / 2 + 20, progressY + 24,
      Math.round((defeated / total) * 100) + '%', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: COLORS.gold
      }).setOrigin(0, 0.5).setAlpha(0).setDepth(7);

    this.tweens.add({
      targets: pctText,
      alpha: 1,
      duration: 400,
      delay: 3200
    });

    // All clear celebration text
    if (allClear) {
      const clearText = this.add.text(cx, progressY + 50, '\u2605 ALL DEMONS VANQUISHED \u2605', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '13px',
        color: COLORS.gold
      }).setOrigin(0.5).setAlpha(0).setDepth(10);

      const clearGlow = this.add.text(cx, progressY + 50, '\u2605 ALL DEMONS VANQUISHED \u2605', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '14px',
        color: '#ffee88'
      }).setOrigin(0.5).setAlpha(0).setDepth(9);

      this.tweens.add({
        targets: clearText,
        alpha: 1,
        duration: 600,
        delay: 3500,
        ease: 'Quad.easeOut'
      });

      // Pulsing glow behind the text
      this.tweens.add({
        targets: clearGlow,
        alpha: 0.4,
        duration: 800,
        delay: 3500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const subClear = this.add.text(cx, progressY + 72, 'DUNGEON CLEARED!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#40c040'
      }).setOrigin(0.5).setAlpha(0).setDepth(10);

      this.tweens.add({
        targets: subClear,
        alpha: 1,
        duration: 400,
        delay: 3800
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CONTINUE / RETURN BUTTONS
  // ═══════════════════════════════════════════════════════════

  addContinueButton(cx, remaining, allClear) {
    const btnY = allClear ? 540 : 500;

    if (allClear) {
      // "Return to the surface" button
      const btnBg = this.add.rectangle(cx, btnY, 380, 40, 0x1a1a2e, 0.95).setDepth(10);
      btnBg.setStrokeStyle(2, 0x6a5a30);
      const btnText = this.add.text(cx, btnY, 'Return to the Surface', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: COLORS.gold
      }).setOrigin(0.5).setDepth(11);

      // Fade in
      btnBg.setAlpha(0);
      btnText.setAlpha(0);
      this.tweens.add({
        targets: [btnBg, btnText],
        alpha: 1,
        duration: 500,
        delay: 4200
      });

      // Pulse invitation
      this.tweens.add({
        targets: btnBg,
        scaleX: 1.03,
        scaleY: 1.05,
        duration: 1000,
        delay: 4700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: btnText,
        alpha: 0.6,
        duration: 1000,
        delay: 4700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      btnBg.setInteractive({ useHandCursor: true });
      btnText.setInteractive({ useHandCursor: true });

      const doReturn = () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.delayedCall(1000, () => {
          this.game.auditData = null;
          this.scene.start('Title');
        });
      };
      btnBg.on('pointerdown', doReturn);
      btnText.on('pointerdown', doReturn);

      // Hover effects
      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a2a3e, 0.95); btnBg.setStrokeStyle(2, 0xf0c040); });
      btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a1a2e, 0.95); btnBg.setStrokeStyle(2, 0x6a5a30); });

    } else {
      // "Continue to dungeon" button
      const btnBg = this.add.rectangle(cx, btnY, 420, 40, 0x1a1a2e, 0.95).setDepth(10);
      btnBg.setStrokeStyle(2, 0x4a4a6e);
      const btnText = this.add.text(cx, btnY - 2, `${remaining} demon${remaining > 1 ? 's' : ''} remain`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: COLORS.gold
      }).setOrigin(0.5).setDepth(11);
      const btnSub = this.add.text(cx, btnY + 13, 'Click to continue', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#808090'
      }).setOrigin(0.5).setDepth(11);

      // Fade in
      btnBg.setAlpha(0);
      btnText.setAlpha(0);
      btnSub.setAlpha(0);
      this.tweens.add({
        targets: [btnBg, btnText, btnSub],
        alpha: 1,
        duration: 500,
        delay: 3200
      });

      // Pulse invitation
      this.tweens.add({
        targets: btnBg,
        scaleX: 1.02,
        scaleY: 1.06,
        duration: 900,
        delay: 3700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: [btnText, btnSub],
        alpha: 0.5,
        duration: 900,
        delay: 3700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      btnBg.setInteractive({ useHandCursor: true });
      btnText.setInteractive({ useHandCursor: true });

      const doContinue = () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('DungeonHall');
        });
      };
      btnBg.on('pointerdown', doContinue);
      btnText.on('pointerdown', doContinue);

      // Hover effects
      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a2a3e, 0.95); btnBg.setStrokeStyle(2, 0xf0c040); });
      btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a1a2e, 0.95); btnBg.setStrokeStyle(2, 0x4a4a6e); });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CELEBRATION PARTICLES (confetti)
  // ═══════════════════════════════════════════════════════════

  addCelebrationParticles(isExtraBurst) {
    const colors = [0xf0c040, 0xe04040, 0x40c040, 0x4080e0, 0xa050d0, 0xffffff, 0xff8020];
    const count = isExtraBurst ? 60 : 50;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, 750);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const size = Phaser.Math.Between(2, 5);

      // Mix of circles and small rectangles for confetti feel
      let particle;
      if (Math.random() > 0.5) {
        particle = this.add.circle(x, -Phaser.Math.Between(5, 30), size, color, 0.9);
      } else {
        const w = Phaser.Math.Between(3, 8);
        const h = Phaser.Math.Between(2, 4);
        particle = this.add.rectangle(x, -Phaser.Math.Between(5, 30), w, h, color, 0.9);
        particle.setAngle(Phaser.Math.Between(0, 360));
      }
      particle.setDepth(20);

      const targetY = Phaser.Math.Between(150, 620);
      const drift = Phaser.Math.Between(-120, 120);
      const duration = Phaser.Math.Between(1800, 4000);
      const delay = isExtraBurst ? Phaser.Math.Between(0, 400) : Phaser.Math.Between(0, 2000);

      // Falling with drift and spin
      this.tweens.add({
        targets: particle,
        y: targetY,
        x: x + drift,
        angle: Phaser.Math.Between(-180, 180),
        alpha: 0,
        duration: duration,
        delay: delay,
        ease: 'Quad.easeIn',
        onComplete: () => particle.destroy()
      });
    }

    // Sparkle bursts from the sides
    if (isExtraBurst) {
      for (let side = 0; side < 2; side++) {
        const baseX = side === 0 ? 80 : 720;
        for (let j = 0; j < 8; j++) {
          const spark = this.add.circle(baseX, 300, 3, 0xf0c040, 1).setDepth(20);
          const angle = (side === 0 ? -1 : 1) * Phaser.Math.Between(20, 70);
          this.tweens.add({
            targets: spark,
            x: baseX + Math.cos(angle * Math.PI / 180) * Phaser.Math.Between(60, 200) * (side === 0 ? -1 : 1),
            y: 300 + Math.sin(angle * Math.PI / 180) * Phaser.Math.Between(-150, 150),
            alpha: 0,
            scaleX: 0.2,
            scaleY: 0.2,
            duration: Phaser.Math.Between(600, 1200),
            delay: Phaser.Math.Between(0, 300),
            ease: 'Quad.easeOut',
            onComplete: () => spark.destroy()
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  COUNT-UP UTILITY
  // ═══════════════════════════════════════════════════════════

  countUp(textObject, from, to, duration, prefix = '') {
    const startTime = this.time.now;
    const timer = this.time.addEvent({
      delay: 16,
      repeat: Math.ceil(duration / 16),
      callback: () => {
        const elapsed = this.time.now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out for satisfying deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + (to - from) * eased);
        textObject.setText(`${prefix}${current}`);
        if (progress >= 1) {
          textObject.setText(`${prefix}${to}`);
          timer.remove();
        }
      }
    });
  }
}
