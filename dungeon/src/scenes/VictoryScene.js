import { COLORS, FONTS } from '../utils/colors.js';

/**
 * Victory scene — loot screen after defeating a demon.
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
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(800, 0, 0, 0);

    const cx = 400;

    // Victory banner
    this.add.text(cx, 60, 'V I C T O R Y', {
      ...FONTS.title, fontSize: '42px', color: COLORS.gold
    }).setOrigin(0.5).setAlpha(0);

    // Animate in the title
    const title = this.children.list[this.children.list.length - 1];
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: 50,
      duration: 1000,
      ease: 'Bounce.easeOut'
    });

    // Knight celebration
    this.knight = this.add.image(cx, 170, 'knight').setScale(2.5);
    this.sword = this.add.image(cx + 35, 145, 'sword').setScale(1.5).setAngle(30);

    // Sword raised animation
    this.tweens.add({
      targets: this.sword,
      angle: 20,
      y: 135,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Loot panel
    const panelY = 280;
    this.add.rectangle(cx, panelY + 60, 500, 180, COLORS.panelBg, 0.95)
      .setStrokeStyle(2, COLORS.hGold);

    this.add.text(cx, panelY, '⚔ DEMON VANQUISHED ⚔', {
      ...FONTS.subtitle, color: COLORS.red
    }).setOrigin(0.5);

    // Issue that was fixed
    this.add.text(cx, panelY + 30, this.issue.title, {
      ...FONTS.body, color: COLORS.white, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, panelY + 55, this.issue.description, {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    // Loot items
    const lootY = panelY + 85;
    this.add.text(cx, lootY, '── Spoils of War ──', {
      ...FONTS.small, color: COLORS.gold
    }).setOrigin(0.5);

    const xp = this.issue.hp * 10;
    const severityBonus = { critical: 500, high: 300, medium: 200, low: 100, info: 50 };
    const bonus = severityBonus[this.issue.severity] || 100;

    this.add.text(200, lootY + 25, `EXP: +${xp}`, {
      ...FONTS.body, color: COLORS.cyan
    });
    this.add.text(400, lootY + 25, `Bonus: +${bonus}`, {
      ...FONTS.body, color: COLORS.purple
    });

    // Remaining demons count
    const data = this.game.auditData;
    const remaining = data.issues.filter(i => !i.defeated).length;
    const total = data.issues.length;
    const defeated = total - remaining;

    const progressY = panelY + 140;
    this.add.text(cx, progressY, `Demons defeated: ${defeated} / ${total}`, {
      ...FONTS.body, color: remaining === 0 ? COLORS.green : COLORS.white
    }).setOrigin(0.5);

    // Progress bar
    this.add.rectangle(cx, progressY + 25, 300, 12, 0x1a1a2e).setOrigin(0.5);
    this.add.rectangle(cx, progressY + 25, 302, 14).setStrokeStyle(1, COLORS.hPurple).setOrigin(0.5);
    const progWidth = 298 * (defeated / total);
    this.add.rectangle(cx - 149, progressY + 25, progWidth, 10, COLORS.hGreen).setOrigin(0, 0.5);

    // Particle celebration
    this.addCelebrationParticles();

    // Continue button
    const continueY = 520;
    if (remaining === 0) {
      // All demons defeated!
      this.add.text(cx, continueY, '★ ALL DEMONS VANQUISHED — DUNGEON CLEARED! ★', {
        ...FONTS.subtitle, color: COLORS.gold
      }).setOrigin(0.5);

      const restartText = this.add.text(cx, continueY + 35, '[ Click to return to the surface ]', {
        ...FONTS.body, color: COLORS.gray
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      restartText.on('pointerdown', () => {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.time.delayedCall(1000, () => {
          this.game.auditData = null;
          this.scene.start('Title');
        });
      });
    } else {
      const continueText = this.add.text(cx, continueY, `[ ${remaining} demons remain — click to continue ]`, {
        ...FONTS.body, color: COLORS.gold
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.tweens.add({
        targets: continueText,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      continueText.on('pointerdown', () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(500, () => {
          this.scene.start('DungeonHall');
        });
      });
    }
  }

  addCelebrationParticles() {
    const colors = [0xf0c040, 0xe04040, 0x40c040, 0x4080e0, 0xa050d0];
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(100, 700);
      const color = colors[Phaser.Math.Between(0, colors.length - 1)];
      const particle = this.add.circle(x, -10, Phaser.Math.Between(2, 4), color, 0.8);
      this.tweens.add({
        targets: particle,
        y: Phaser.Math.Between(200, 600),
        x: x + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1500),
        ease: 'Quad.easeOut'
      });
    }
  }
}
