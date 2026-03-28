import { COLORS, FONTS } from '../utils/colors.js';

/**
 * Dungeon Hall — demons materialize one by one from the darkness.
 * Player selects which demon to fight.
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

    // Score
    const scoreColor = data.score >= 70 ? COLORS.green : data.score >= 40 ? COLORS.gold : COLORS.red;
    this.add.text(400, 50, `SEO Score: ${data.score}/100  |  ${data.totalIssues} demons await`, {
      ...FONTS.body, color: scoreColor
    }).setOrigin(0.5);

    // Dungeon corridor
    this.drawCorridor();

    // Container for scrollable demon list
    this.demonContainer = this.add.container(0, 0);

    // Reveal demons one by one
    this.revealDemons(data.issues);

    // Knight at bottom
    const knight = this.add.image(100, 540, 'knight').setScale(1.8);
    this.add.image(125, 530, 'sword').setScale(1.2).setAngle(-30);
    this.add.image(75, 535, 'shield').setScale(1.2);

    // Idle animation
    this.tweens.add({
      targets: knight, y: 536, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Instructions
    this.add.text(400, 575, 'Click a demon to engage in battle', {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    // Scrolling
    this.scrollOffset = 0;
    this.input.on('wheel', (pointer, gameObjects, dx, dy) => {
      const maxScroll = Math.max(0, data.issues.length * 55 - 420);
      this.scrollOffset = Phaser.Math.Clamp(
        this.scrollOffset - dy * 0.5, -maxScroll, 0
      );
      this.demonContainer.y = this.scrollOffset;
    });
  }

  drawCorridor() {
    const g = this.add.graphics();
    g.fillStyle(0x12121e);
    g.fillRect(0, 70, 800, 605);
    g.lineStyle(1, 0x1a1a2a);
    for (let y = 70; y < 570; y += 30) {
      g.lineBetween(0, y, 800, y);
    }
    for (let y = 120; y < 550; y += 150) {
      g.fillStyle(0xf08020);
      g.fillRect(15, y, 8, 12);
      g.fillStyle(0xf0c040, 0.1);
      g.fillCircle(19, y, 30);
      g.fillStyle(0xf08020);
      g.fillRect(777, y, 8, 12);
      g.fillStyle(0xf0c040, 0.1);
      g.fillCircle(781, y, 30);
    }
  }

  revealDemons(issues) {
    issues.forEach((issue, i) => {
      // Stagger reveal — each demon materializes 300ms after the last
      this.time.delayedCall(i * 300, () => {
        this.materializeDemon(issue, i);
      });
    });
  }

  materializeDemon(issue, index) {
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

    // Row background — starts invisible
    const rowBg = this.add.rectangle(400, y + 20, 700, 48, 0x1a1a2e, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Fade in the row
    this.tweens.add({
      targets: rowBg,
      fillAlpha: 0.8,
      duration: 500
    });

    rowBg.on('pointerover', () => rowBg.setFillStyle(0x2a2a4e, 0.9));
    rowBg.on('pointerout', () => rowBg.setFillStyle(0x1a1a2e, 0.8));
    rowBg.on('pointerdown', () => this.engageDemon(issue));

    // Demon sprite — materializes from nothing
    const demon = this.add.image(80, y + 20, severitySprite).setScale(0).setAlpha(0);
    this.tweens.add({
      targets: demon,
      scaleX: 0.8, scaleY: 0.8, alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Idle hover
    this.tweens.add({
      targets: demon,
      y: y + 16, duration: 1000 + index * 100,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: 500
    });

    // Severity badge — fades in
    const badge = this.add.text(130, y + 8, issue.severity.toUpperCase(), {
      ...FONTS.small, color, fontSize: '10px', fontStyle: 'bold'
    }).setAlpha(0);
    this.tweens.add({ targets: badge, alpha: 1, duration: 300, delay: 200 });

    // Title
    const title = this.add.text(130, y + 22, issue.title, {
      ...FONTS.body, color: COLORS.white
    }).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 300, delay: 300 });

    // Category
    const cat = this.add.text(520, y + 8, issue.category, {
      ...FONTS.small, color: COLORS.cyan
    }).setAlpha(0);
    this.tweens.add({ targets: cat, alpha: 1, duration: 300, delay: 200 });

    // HP bar
    const hpBarBg = this.add.rectangle(620, y + 28, 100, 8, 0x400000).setOrigin(0, 0.5).setAlpha(0);
    const hpPct = issue.hp / 100;
    const hpColor = hpPct > 0.6 ? 0xe04040 : hpPct > 0.3 ? 0xf0c040 : 0x40c040;
    const hpBar = this.add.rectangle(620, y + 28, 0, 8, hpColor).setOrigin(0, 0.5);
    const hpText = this.add.text(730, y + 28, `${issue.hp} HP`, {
      ...FONTS.small, color: COLORS.red, fontSize: '10px'
    }).setOrigin(0, 0.5).setAlpha(0);

    // Animate HP bar filling
    this.tweens.add({ targets: hpBarBg, alpha: 1, duration: 200, delay: 300 });
    this.tweens.add({ targets: hpBar, width: 100 * hpPct, duration: 600, delay: 400, ease: 'Power2' });
    this.tweens.add({ targets: hpText, alpha: 1, duration: 300, delay: 500 });

    // Small screen shake on critical/high demons
    if (issue.severity === 'critical') {
      this.time.delayedCall(200, () => {
        this.cameras.main.shake(200, 0.005);
      });
    }

    // Defeated overlay
    if (issue.defeated) {
      this.time.delayedCall(600, () => {
        this.add.rectangle(400, y + 20, 700, 48, 0x000000, 0.6).setOrigin(0.5);
        this.add.text(400, y + 20, 'DEFEATED', {
          ...FONTS.body, color: COLORS.green, fontStyle: 'bold'
        }).setOrigin(0.5);
        rowBg.disableInteractive();
      });
    }

    // Add to container for scrolling
    this.demonContainer.add([rowBg, demon, badge, title, cat, hpBarBg, hpBar, hpText]);
  }

  engageDemon(issue) {
    this.cameras.main.flash(300, 255, 50, 50);
    this.time.delayedCall(400, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('Battle', { issue });
      });
    });
  }
}
