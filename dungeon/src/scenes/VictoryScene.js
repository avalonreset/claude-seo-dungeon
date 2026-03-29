import { COLORS, FONTS } from '../utils/colors.js';
import { VICTORY_MESSAGES } from '../utils/flavor-text.js';
import { SFX } from '../utils/sound-manager.js';

/**
 * Victory scene — epic loot screen after defeating a demon.
 * Shows what was fixed, XP gained, then returns to dungeon hall.
 */
export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('Victory');
  }

  init(data) {
    this.issue = data?.issue || { title: 'Unknown', description: '', severity: 'medium', hp: 10 };
  }

  create() {
    const dpr = this.game.dpr || window.GAME_DPR;
    this.cameras.main.setZoom(dpr);
    this.cameras.main.scrollX = 400 * (1 - dpr);
    this.cameras.main.scrollY = 300 * (1 - dpr);

    const cx = 400;
    const W = 800;
    const H = 600;

    this.cameras.main.setBackgroundColor(COLORS.bg);

    // ── Fade in from the battle fadeOut ──────────────────────
    this.cameras.main.fadeIn(600, 0, 0, 0);

    // ── Sound effects on entry ──────────────────────────────
    SFX.play('demonDeath');
    SFX.play('victory');

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
    const data = this.game.auditData || { issues: [] };
    const remaining = data.issues.filter(i => !i.defeated).length;
    const total = data.issues.length;
    const defeated = total - remaining;
    const allClear = remaining === 0 && total > 0;

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
    const glow = this.add.circle(cx, 160, 140, 0xd4af37, 0.08);
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

    // Secondary warm ring for depth
    const glow2 = this.add.circle(cx, 200, 220, 0xd4af37, 0.03);
    this.tweens.add({
      targets: glow2,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.01,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle floating dust motes
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(50, 750);
      const y = Phaser.Math.Between(50, 550);
      const mote = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xd4af37, Phaser.Math.FloatBetween(0.1, 0.35));
      this.tweens.add({
        targets: mote,
        y: y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: () => {
          mote.setPosition(Phaser.Math.Between(50, 750), Phaser.Math.Between(300, 550));
          mote.setAlpha(Phaser.Math.FloatBetween(0.1, 0.35));
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  VICTORY TITLE (slam in with bounce + gold glow)
  // ═══════════════════════════════════════════════════════════

  addVictoryTitle(cx) {
    // Deep shadow for depth
    const shadow = this.add.text(cx + 3, 50, 'VICTORY', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '48px',
      color: '#000000',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(8);

    // Warm outer glow layer (large, soft)
    const outerGlow = this.add.text(cx, 48, 'VICTORY', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '52px',
      color: '#d4af37',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setScale(3).setAlpha(0).setDepth(8);

    // Inner bright glow layer
    const titleGlow = this.add.text(cx, 48, 'VICTORY', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '50px',
      color: '#ffe680',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setScale(3).setAlpha(0).setDepth(9);

    // Main title
    const title = this.add.text(cx, 48, 'VICTORY', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '48px',
      color: '#d4af37',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setScale(3).setAlpha(0).setDepth(10);

    // Slam-in animation: start big, bounce to final size
    this.tweens.add({
      targets: [title, shadow, titleGlow, outerGlow],
      scale: 1,
      alpha: { value: 1, duration: 200 },
      duration: 700,
      delay: 200,
      ease: 'Bounce.easeOut'
    });

    // Pulsing outer glow on the title
    this.tweens.add({
      targets: outerGlow,
      alpha: 0.15,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1500,
      delay: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Pulsing inner glow
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.35,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1200,
      delay: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Decorative line separators (gold)
    const lineLeft = this.add.rectangle(cx - 190, 80, 130, 2, 0xd4af37, 0).setDepth(10);
    const lineRight = this.add.rectangle(cx + 190, 80, 130, 2, 0xd4af37, 0).setDepth(10);
    this.tweens.add({
      targets: [lineLeft, lineRight],
      alpha: 0.8,
      duration: 500,
      delay: 800
    });

    // Small star decorations beside title
    const starLeft = this.add.text(cx - 165, 43, '\u2726', {
      fontSize: '22px', color: '#d4af37', resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
    const starRight = this.add.text(cx + 165, 43, '\u2726', {
      fontSize: '22px', color: '#d4af37', resolution: window.GAME_DPR
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
    const knightGlow = this.add.circle(cx, 150, 50, 0xd4af37, 0.12).setDepth(1);
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
    const panelW = 560;
    const panelH = 210;

    // Outer gold border glow
    const outerGlow = this.add.rectangle(cx, panelY + 50, panelW + 14, panelH + 14, 0xd4af37, 0.15).setDepth(4);
    // Outer stone border
    const outerBorder = this.add.rectangle(cx, panelY + 50, panelW + 8, panelH + 8, 0x3a3a5e).setDepth(5);
    // Inner dark panel
    const innerPanel = this.add.rectangle(cx, panelY + 50, panelW, panelH, 0x0e0e20, 0.97).setDepth(5);
    innerPanel.setStrokeStyle(2, 0xd4af37);
    // Top ornamental bar (treasure chest lid feel)
    const topBar = this.add.rectangle(cx, panelY - 53, panelW + 8, 10, 0xd4af37).setDepth(5);
    // Corner rivets
    const rivetPositions = [
      [cx - panelW / 2 - 1, panelY - 53],
      [cx + panelW / 2 + 1, panelY - 53],
      [cx - panelW / 2 - 1, panelY + 50 + panelH / 2 + 1],
      [cx + panelW / 2 + 1, panelY + 50 + panelH / 2 + 1]
    ];
    rivetPositions.forEach(([rx, ry]) => {
      this.add.circle(rx, ry, 5, 0xd4af37, 0.7).setDepth(6);
    });

    // Animate panel opening (scale from thin line)
    outerGlow.setScaleY(0);
    outerBorder.setScaleY(0);
    innerPanel.setScaleY(0);
    topBar.setAlpha(0);
    this.tweens.add({
      targets: [outerGlow, outerBorder, innerPanel],
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
    const vanquishedText = this.add.text(cx, panelY - 25, '\u2694  DEMON VANQUISHED  \u2694', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      color: '#e04040',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Flavor subtitle from VICTORY_MESSAGES
    const flavorText = this.add.text(cx, panelY - 8, VICTORY_MESSAGES[Math.floor(Math.random() * VICTORY_MESSAGES.length)], {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#a08060',
      fontStyle: 'italic',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Issue title
    const issueTitle = this.add.text(cx, panelY + 6, this.issue.title, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: panelW - 40 },
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Issue description
    const issueDesc = this.add.text(cx, panelY + 32, this.issue.description, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#b0b0c0',
      wordWrap: { width: panelW - 60 },
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Separator line (gold themed)
    const separator = this.add.rectangle(cx, panelY + 56, panelW - 60, 1, 0xd4af37, 0).setDepth(7);

    // "Spoils of War" header
    const spoilsHeader = this.add.text(cx, panelY + 72, '\u2500\u2500  Spoils of War  \u2500\u2500', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      color: '#d4af37',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // XP calculation
    const xp = this.issue.hp * 10;
    const severityBonus = { critical: 500, high: 300, medium: 200, low: 100, info: 50 };
    const bonus = severityBonus[this.issue.severity] || 100;

    // XP display with count-up
    const xpLabel = this.add.text(cx - 110, panelY + 98, 'EXP:', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#40c0c0',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const xpValue = this.add.text(cx - 45, panelY + 98, '+0', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#40c0c0',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const bonusLabel = this.add.text(cx + 65, panelY + 98, 'Bonus:', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#e88020',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    const bonusValue = this.add.text(cx + 150, panelY + 98, '+0', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '13px',
      color: '#e88020',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Severity badge
    const sevColors = {
      critical: '#ff2040', high: '#e06020', medium: '#d4af37', low: '#40c040', info: '#4080e0'
    };
    const sevColor = sevColors[this.issue.severity] || '#808090';
    const sevBadge = this.add.text(cx, panelY + 126, `[ ${(this.issue.severity || 'medium').toUpperCase()} ]`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '11px',
      color: sevColor,
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Staggered content reveal
    const contentItems = [vanquishedText, flavorText, issueTitle, issueDesc, separator, spoilsHeader, xpLabel, xpValue, bonusLabel, bonusValue, sevBadge];
    contentItems.forEach((item, idx) => {
      this.tweens.add({
        targets: item,
        alpha: 1,
        duration: 300,
        delay: 1000 + idx * 80,
        ease: 'Quad.easeOut'
      });
    });

    // Loot drop sound when spoils section appears
    this.time.delayedCall(1000 + 5 * 80, () => {
      SFX.play('lootDrop');
    });

    // Count-up animation for XP
    this.time.delayedCall(1400, () => {
      SFX.play('xpGain');
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
    const progressY = 430;

    // Progress text
    const progText = this.add.text(cx, progressY, `Demons defeated: ${defeated} / ${total}`, {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      color: allClear ? '#d4af37' : '#e8e8e8',
      resolution: window.GAME_DPR
    }).setOrigin(0.5).setAlpha(0).setDepth(7);

    // Progress bar background
    const barW = 340;
    const barH = 18;
    const barBg = this.add.rectangle(cx, progressY + 26, barW + 4, barH + 4, 0x0a0a1a).setDepth(6).setAlpha(0);
    barBg.setStrokeStyle(2, 0x4a4a6e);

    // Progress bar track
    const barTrack = this.add.rectangle(cx, progressY + 26, barW, barH, 0x1a1a2e).setDepth(7).setAlpha(0);

    // Progress bar fill (animated)
    const targetWidth = barW * (defeated / total);
    const barColor = allClear ? 0xd4af37 : 0xd4af37;
    const barFill = this.add.rectangle(cx - barW / 2, progressY + 26, 0, barH - 2, barColor).setOrigin(0, 0.5).setDepth(8).setAlpha(0);

    // Shimmer overlay on the progress bar
    const shimmer = this.add.rectangle(cx - barW / 2, progressY + 26, 30, barH - 2, 0xffffff, 0.2).setOrigin(0, 0.5).setDepth(9).setAlpha(0);

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
              shimmer.setPosition(cx - barW / 2, progressY + 26);
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
    const pctText = this.add.text(cx + barW / 2 + 20, progressY + 26,
      Math.round((defeated / total) * 100) + '%', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: '#d4af37',
        resolution: window.GAME_DPR
      }).setOrigin(0, 0.5).setAlpha(0).setDepth(7);

    this.tweens.add({
      targets: pctText,
      alpha: 1,
      duration: 400,
      delay: 3200
    });

    // All clear celebration text
    if (allClear) {
      // Big gold "DUNGEON CLEARED" as the hero text
      const clearShadow = this.add.text(cx + 2, progressY + 58, '\u2605  DUNGEON CLEARED  \u2605', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '18px',
        color: '#000000',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setAlpha(0).setDepth(9);

      const clearText = this.add.text(cx, progressY + 56, '\u2605  DUNGEON CLEARED  \u2605', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '18px',
        color: '#d4af37',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setAlpha(0).setDepth(10);

      const clearGlow = this.add.text(cx, progressY + 56, '\u2605  DUNGEON CLEARED  \u2605', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '20px',
        color: '#ffe680',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setAlpha(0).setDepth(9);

      // Slam in with bounce like the victory title
      clearShadow.setScale(2);
      clearText.setScale(2);
      clearGlow.setScale(2);

      this.tweens.add({
        targets: [clearText, clearShadow],
        scale: 1,
        alpha: 1,
        duration: 600,
        delay: 3500,
        ease: 'Bounce.easeOut'
      });

      // Pulsing glow behind the text
      this.tweens.add({
        targets: clearGlow,
        scale: 1,
        alpha: 0.4,
        duration: 800,
        delay: 3500,
        ease: 'Bounce.easeOut'
      });

      this.tweens.add({
        targets: clearGlow,
        alpha: 0.15,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 900,
        delay: 4100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const subClear = this.add.text(cx, progressY + 82, 'ALL DEMONS VANQUISHED', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        color: '#40c040',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setAlpha(0).setDepth(10);

      this.tweens.add({
        targets: subClear,
        alpha: 1,
        duration: 400,
        delay: 3900
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CONTINUE / RETURN BUTTONS
  // ═══════════════════════════════════════════════════════════

  addContinueButton(cx, remaining, allClear) {
    const btnY = allClear ? 548 : 510;

    if (allClear) {
      // "Return to the surface" button
      const btnGlow = this.add.rectangle(cx, btnY, 390, 46, 0xd4af37, 0.1).setDepth(9);
      const btnBg = this.add.rectangle(cx, btnY, 380, 42, 0x1a1a2e, 0.95).setDepth(10);
      btnBg.setStrokeStyle(2, 0xd4af37);
      const btnText = this.add.text(cx, btnY, 'Return to the Surface', {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        color: '#d4af37',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setDepth(11);

      // Fade in
      btnGlow.setAlpha(0);
      btnBg.setAlpha(0);
      btnText.setAlpha(0);
      this.tweens.add({
        targets: [btnGlow, btnBg, btnText],
        alpha: 1,
        duration: 500,
        delay: 4200
      });

      // Pulse invitation
      this.tweens.add({
        targets: [btnBg, btnGlow],
        scaleX: 1.04,
        scaleY: 1.08,
        duration: 900,
        delay: 4700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.tweens.add({
        targets: btnText,
        alpha: 0.55,
        duration: 900,
        delay: 4700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      btnBg.setInteractive({ useHandCursor: true });
      btnText.setInteractive({ useHandCursor: true });

      const doReturn = () => {
        SFX.play('menuConfirm');
        SFX.play('sceneTransition');
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.delayedCall(1000, () => {
          this.game.auditData = null;
          this.scene.start('Title');
        });
      };
      btnBg.on('pointerdown', doReturn);
      btnText.on('pointerdown', doReturn);

      // Hover effects
      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a2a3e, 0.95); btnBg.setStrokeStyle(2, 0xffe680); });
      btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a1a2e, 0.95); btnBg.setStrokeStyle(2, 0xd4af37); });

    } else {
      // "Continue to dungeon" button
      const btnGlow = this.add.rectangle(cx, btnY, 430, 46, 0xd4af37, 0.08).setDepth(9);
      const btnBg = this.add.rectangle(cx, btnY, 420, 42, 0x1a1a2e, 0.95).setDepth(10);
      btnBg.setStrokeStyle(2, 0xd4af37);
      const btnText = this.add.text(cx, btnY - 2, `${remaining} demon${remaining > 1 ? 's' : ''} remain`, {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        color: '#d4af37',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setDepth(11);
      const btnSub = this.add.text(cx, btnY + 14, 'Click to continue', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#a0a0b0',
        resolution: window.GAME_DPR
      }).setOrigin(0.5).setDepth(11);

      // Fade in
      btnGlow.setAlpha(0);
      btnBg.setAlpha(0);
      btnText.setAlpha(0);
      btnSub.setAlpha(0);
      this.tweens.add({
        targets: [btnGlow, btnBg, btnText, btnSub],
        alpha: 1,
        duration: 500,
        delay: 3200
      });

      // Pulse invitation
      this.tweens.add({
        targets: [btnBg, btnGlow],
        scaleX: 1.03,
        scaleY: 1.07,
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
        SFX.play('menuConfirm');
        SFX.play('sceneTransition');
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('DungeonHall');
        });
      };
      btnBg.on('pointerdown', doContinue);
      btnText.on('pointerdown', doContinue);

      // Hover effects
      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a2a3e, 0.95); btnBg.setStrokeStyle(2, 0xffe680); });
      btnBg.on('pointerout', () => { btnBg.setFillStyle(0x1a1a2e, 0.95); btnBg.setStrokeStyle(2, 0xd4af37); });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CELEBRATION PARTICLES (confetti)
  // ═══════════════════════════════════════════════════════════

  addCelebrationParticles(isExtraBurst) {
    const colors = [0xd4af37, 0xe04040, 0x40c040, 0x4080e0, 0xa050d0, 0xffffff, 0xe88020, 0xffe680];
    const count = isExtraBurst ? 70 : 55;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(50, 750);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const size = Phaser.Math.Between(2, 6);

      // Mix of circles and small rectangles for confetti feel
      let particle;
      if (Math.random() > 0.5) {
        particle = this.add.circle(x, -Phaser.Math.Between(5, 30), size, color, 0.9);
      } else {
        const w = Phaser.Math.Between(3, 9);
        const h = Phaser.Math.Between(2, 5);
        particle = this.add.rectangle(x, -Phaser.Math.Between(5, 30), w, h, color, 0.9);
        particle.setAngle(Phaser.Math.Between(0, 360));
      }
      particle.setDepth(20);

      const targetY = Phaser.Math.Between(150, 620);
      const drift = Phaser.Math.Between(-140, 140);
      const duration = Phaser.Math.Between(1800, 4200);
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
        for (let j = 0; j < 12; j++) {
          const spark = this.add.circle(baseX, 300, 3, 0xd4af37, 1).setDepth(20);
          const angle = (side === 0 ? -1 : 1) * Phaser.Math.Between(20, 70);
          this.tweens.add({
            targets: spark,
            x: baseX + Math.cos(angle * Math.PI / 180) * Phaser.Math.Between(60, 220) * (side === 0 ? -1 : 1),
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
