import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Battle scene — Final Fantasy style turn-based combat.
 * Knight vs SEO Demon. Selecting ATTACK triggers Claude to fix the issue.
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
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Battle background
    this.add.image(400, 300, 'battle_bg');

    // Camera fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // ── Demon side (right) ─────────────────────────
    const demonKey = `demon_${this.issue.severity}`;
    this.demon = this.add.image(580, 240, demonKey).setScale(3);

    // Demon idle animation
    this.tweens.add({
      targets: this.demon,
      y: 230,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Demon name & HP bar
    this.add.text(580, 130, this.issue.title, {
      ...FONTS.body, color: COLORS.red, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(580, 150, this.issue.severity.toUpperCase(), {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    // Demon HP bar
    this.demonHpBg = this.add.rectangle(580, 170, 200, 12, 0x400000).setOrigin(0.5);
    this.demonHpBar = this.add.rectangle(481, 170, 198, 10, 0xe04040).setOrigin(0, 0.5);
    this.demonHpText = this.add.text(580, 188, `${this.demonHp} / ${this.demonMaxHp}`, {
      ...FONTS.small, color: COLORS.red
    }).setOrigin(0.5);

    // ── Knight side (left) ─────────────────────────
    this.knight = this.add.image(200, 320, 'knight').setScale(2.5);
    this.sword = this.add.image(235, 310, 'sword').setScale(1.5).setAngle(-30);
    this.shield = this.add.image(165, 325, 'shield').setScale(1.5);

    // Knight idle breathing
    this.tweens.add({
      targets: [this.knight, this.sword, this.shield],
      y: '+=5',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Knight HP
    this.add.text(200, 390, 'KNIGHT', {
      ...FONTS.body, color: COLORS.cyan, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.knightHpBar = this.add.rectangle(101, 408, 198, 10, 0x40c040).setOrigin(0, 0.5);
    this.add.rectangle(200, 408, 200, 12, 0x003000).setOrigin(0.5).setDepth(-1);

    // ── Battle log ─────────────────────────────────
    this.logPanel = this.add.rectangle(400, 470, 760, 60, 0x0a0a1a, 0.9);
    this.logPanel.setStrokeStyle(1, COLORS.hPurple);
    this.battleLog = this.add.text(30, 448, 'A wild SEO demon appears!', {
      ...FONTS.body, color: COLORS.white, wordWrap: { width: 720 }
    });

    // ── Command menu (FF-style) ────────────────────
    this.createCommandMenu();

    // ── Issue details panel ────────────────────────
    this.add.rectangle(400, 545, 760, 50, 0x1a1a2e, 0.9).setStrokeStyle(1, 0x3a3a5e);
    this.add.text(30, 528, `${this.issue.category}`, {
      ...FONTS.small, color: COLORS.cyan
    });
    this.add.text(130, 528, this.issue.description, {
      ...FONTS.small, color: COLORS.gray
    });

    // Stream text for showing Claude's progress
    this.streamText = this.add.text(30, 548, '', {
      ...FONTS.small, color: COLORS.purple, wordWrap: { width: 720 }
    });
  }

  createCommandMenu() {
    const menuX = 30;
    const menuY = 500;
    const menuW = 180;
    const menuH = 90;

    // Menu panel
    this.menuPanel = this.add.rectangle(menuX + menuW/2, menuY + menuH/2, menuW, menuH, 0x1a1a2e, 0.95);
    this.menuPanel.setStrokeStyle(2, COLORS.hGold);

    const commands = [
      { label: '⚔ ATTACK', action: () => this.doAttack() },
      { label: '🛡 DEFEND', action: () => this.doDefend() },
      { label: '👁 INSPECT', action: () => this.doInspect() },
      { label: '🏃 FLEE', action: () => this.doFlee() }
    ];

    this.menuItems = commands.map((cmd, i) => {
      const text = this.add.text(menuX + 15, menuY + 8 + i * 20, cmd.label, {
        ...FONTS.body, color: i === 0 ? COLORS.gold : COLORS.white
      }).setInteractive({ useHandCursor: true });

      text.on('pointerover', () => {
        if (this.isPlayerTurn && !this.battleOver) text.setColor(COLORS.gold);
      });
      text.on('pointerout', () => {
        if (this.isPlayerTurn && !this.battleOver) text.setColor(COLORS.white);
      });
      text.on('pointerdown', () => {
        if (this.isPlayerTurn && !this.battleOver) cmd.action();
      });

      return text;
    });

    // Cursor
    this.cursor = this.add.text(menuX + 3, menuY + 8, '▶', {
      ...FONTS.body, color: COLORS.gold
    });
    this.tweens.add({
      targets: this.cursor,
      x: menuX + 7,
      duration: 400,
      yoyo: true,
      repeat: -1
    });
  }

  setLog(msg) {
    this.battleLog.setText(msg);
  }

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
      // Demo mode — deal partial damage
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
      // Knight lunges forward
      this.tweens.add({
        targets: [this.knight, this.sword, this.shield],
        x: '+=80',
        duration: 200,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          // Flash on demon
          this.cameras.main.flash(100, 255, 255, 255);

          // Slash sprite
          const slash = this.add.image(580, 240, 'slash').setScale(3).setAlpha(0.9);
          this.tweens.add({
            targets: slash,
            alpha: 0,
            scaleX: 5,
            scaleY: 5,
            angle: 45,
            duration: 300,
            onComplete: () => { slash.destroy(); resolve(); }
          });

          // Demon knockback
          this.tweens.add({
            targets: this.demon,
            x: 620,
            duration: 100,
            yoyo: true
          });
        }
      });
    });
  }

  dealDamage(amount) {
    this.demonHp = Math.max(0, this.demonHp - amount);
    const pct = this.demonHp / this.demonMaxHp;

    // Animate HP bar
    this.tweens.add({
      targets: this.demonHpBar,
      width: 198 * pct,
      duration: 500,
      ease: 'Power2'
    });

    // Damage number popup
    const dmgText = this.add.text(580, 200, `-${amount}`, {
      ...FONTS.damage
    }).setOrigin(0.5);
    this.tweens.add({
      targets: dmgText,
      y: 160,
      alpha: 0,
      duration: 1000,
      onComplete: () => dmgText.destroy()
    });

    this.demonHpText.setText(`${this.demonHp} / ${this.demonMaxHp}`);

    // Demon flash red
    this.demon.setTint(0xff0000);
    this.time.delayedCall(200, () => this.demon.clearTint());
  }

  demonTurn() {
    if (this.battleOver) return;

    this.setLog('The demon retaliates!');

    // Demon attack animation
    this.tweens.add({
      targets: this.demon,
      x: 400,
      duration: 300,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        const damage = Phaser.Math.Between(5, 15);
        this.knightHp = Math.max(0, this.knightHp - damage);

        // Knight flash
        this.knight.setTint(0xff0000);
        this.time.delayedCall(200, () => this.knight.clearTint());

        // Update HP bar
        this.tweens.add({
          targets: this.knightHpBar,
          width: 198 * (this.knightHp / 100),
          duration: 300
        });

        // Damage popup on knight
        const dmgText = this.add.text(200, 280, `-${damage}`, {
          ...FONTS.damage, color: '#ff8040'
        }).setOrigin(0.5);
        this.tweens.add({
          targets: dmgText,
          y: 250,
          alpha: 0,
          duration: 800,
          onComplete: () => dmgText.destroy()
        });

        this.setLog(`Demon deals ${damage} damage! Your turn, knight.`);
        this.isPlayerTurn = true;
      }
    });
  }

  doDefend() {
    if (!this.isPlayerTurn || this.battleOver) return;
    this.isPlayerTurn = false;

    this.setLog('Knight raises shield! Defense increased.');

    // Shield glow
    this.shield.setTint(0x40c0f0);
    this.time.delayedCall(500, () => this.shield.clearTint());

    // Heal a bit
    this.knightHp = Math.min(100, this.knightHp + 10);
    this.tweens.add({
      targets: this.knightHpBar,
      width: 198 * (this.knightHp / 100),
      duration: 300
    });

    this.time.delayedCall(1000, () => {
      this.demonTurn();
    });
  }

  doInspect() {
    if (!this.isPlayerTurn || this.battleOver) return;

    this.setLog(`[${this.issue.category}] ${this.issue.description} | Severity: ${this.issue.severity} | HP: ${this.demonHp}/${this.demonMaxHp}`);
  }

  doFlee() {
    if (!this.isPlayerTurn || this.battleOver) return;

    this.setLog('You retreat from battle...');
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('DungeonHall');
    });
  }

  demonDefeated() {
    this.battleOver = true;

    // Mark issue as defeated in game data
    this.issue.defeated = true;

    // Demon death animation
    this.setLog(`${this.issue.title} has been vanquished!`);

    // Flash and shake
    this.cameras.main.flash(500, 255, 200, 50);
    this.cameras.main.shake(300, 0.02);

    // Demon dissolve
    this.tweens.add({
      targets: this.demon,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 15,
      y: 300,
      duration: 1500,
      ease: 'Power2'
    });

    // Transition to victory
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(800, () => {
        this.scene.start('Victory', { issue: this.issue });
      });
    });
  }
}
