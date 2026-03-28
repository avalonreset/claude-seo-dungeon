import { COLORS, FONTS } from '../utils/colors.js';

/**
 * Dungeon Hall — shows all SEO demons lined up in a dark corridor.
 * Player can select which demon to fight.
 */
export class DungeonHallScene extends Phaser.Scene {
  constructor() {
    super('DungeonHall');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const data = this.game.auditData;

    // Header
    this.add.text(400, 20, `⚔ THE DUNGEON OF ${data.domain.toUpperCase()} ⚔`, {
      ...FONTS.subtitle, color: COLORS.gold
    }).setOrigin(0.5);

    // Score display
    const scoreColor = data.score >= 70 ? COLORS.green : data.score >= 40 ? COLORS.gold : COLORS.red;
    this.add.text(400, 50, `SEO Score: ${data.score}/100  |  ${data.totalIssues} demons await`, {
      ...FONTS.body, color: scoreColor
    }).setOrigin(0.5);

    // Dungeon corridor background
    this.drawCorridor();

    // Create demon list (scrollable)
    this.demons = data.issues.map((issue, i) => {
      return this.createDemonEntry(issue, i);
    });

    // Knight at the bottom
    this.knight = this.add.image(100, 540, 'knight').setScale(1.8);
    this.add.image(125, 530, 'sword').setScale(1.2).setAngle(-30);
    this.add.image(75, 535, 'shield').setScale(1.2);

    // Instructions
    this.add.text(400, 575, 'Click a demon to engage in battle', {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    // Scrolling support
    this.scrollOffset = 0;
    this.demonContainer = this.add.container(0, 0, this.demonEntries);
    this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
      this.scrollOffset = Phaser.Math.Clamp(
        this.scrollOffset - dy * 0.5,
        Math.min(0, -(data.issues.length * 55 - 420)),
        0
      );
      if (this.demonContainer) {
        this.demonContainer.y = this.scrollOffset;
      }
    });
  }

  drawCorridor() {
    const g = this.add.graphics();

    // Dark stone walls
    g.fillStyle(0x12121e);
    g.fillRect(0, 70, 800, 500);

    // Wall bricks (subtle)
    g.lineStyle(1, 0x1a1a2a);
    for (let y = 70; y < 570; y += 30) {
      g.lineBetween(0, y, 800, y);
    }

    // Torch brackets on sides
    for (let y = 120; y < 550; y += 150) {
      // Left torch
      g.fillStyle(0xf08020);
      g.fillRect(15, y, 8, 12);
      g.fillStyle(0xf0c040, 0.1);
      g.fillCircle(19, y, 30);

      // Right torch
      g.fillStyle(0xf08020);
      g.fillRect(777, y, 8, 12);
      g.fillStyle(0xf0c040, 0.1);
      g.fillCircle(781, y, 30);
    }
  }

  createDemonEntry(issue, index) {
    const y = 90 + index * 55;
    const severitySprite = `demon_${issue.severity}`;
    const severityColors = {
      critical: COLORS.critical,
      high: COLORS.red,
      medium: COLORS.gold,
      low: COLORS.green,
      info: COLORS.blue
    };
    const color = severityColors[issue.severity] || COLORS.white;

    // Row background
    const rowBg = this.add.rectangle(400, y + 20, 700, 48, 0x1a1a2e, 0.8)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Hover effect
    rowBg.on('pointerover', () => {
      rowBg.setFillStyle(0x2a2a4e, 0.9);
    });
    rowBg.on('pointerout', () => {
      rowBg.setFillStyle(0x1a1a2e, 0.8);
    });

    // Click to battle
    rowBg.on('pointerdown', () => {
      this.engageDemon(issue);
    });

    // Demon sprite (small)
    const demon = this.add.image(80, y + 20, severitySprite).setScale(0.8);

    // Idle animation
    this.tweens.add({
      targets: demon,
      y: y + 16,
      duration: 1000 + index * 100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Severity badge
    this.add.text(130, y + 8, issue.severity.toUpperCase(), {
      ...FONTS.small, color, fontSize: '10px', fontStyle: 'bold'
    });

    // Title
    this.add.text(130, y + 22, issue.title, {
      ...FONTS.body, color: COLORS.white
    });

    // Category + HP
    this.add.text(520, y + 8, issue.category, {
      ...FONTS.small, color: COLORS.cyan
    });

    // HP bar
    const hpBarBg = this.add.rectangle(620, y + 28, 100, 8, 0x400000).setOrigin(0, 0.5);
    const hpPct = issue.hp / 100;
    const hpColor = hpPct > 0.6 ? 0xe04040 : hpPct > 0.3 ? 0xf0c040 : 0x40c040;
    this.add.rectangle(620, y + 28, 100 * hpPct, 8, hpColor).setOrigin(0, 0.5);
    this.add.text(730, y + 28, `${issue.hp} HP`, {
      ...FONTS.small, color: COLORS.red, fontSize: '10px'
    }).setOrigin(0, 0.5);

    // Defeated overlay (hidden initially)
    if (issue.defeated) {
      const overlay = this.add.rectangle(400, y + 20, 700, 48, 0x000000, 0.6).setOrigin(0.5);
      this.add.text(400, y + 20, '☠ DEFEATED', {
        ...FONTS.body, color: COLORS.green, fontStyle: 'bold'
      }).setOrigin(0.5);
      rowBg.disableInteractive();
    }

    return { rowBg, demon, issue };
  }

  engageDemon(issue) {
    // Flash effect
    this.cameras.main.flash(300, 255, 50, 50);

    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('Battle', { issue });
      });
    });
  }
}
