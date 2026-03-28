import { PixelArt } from '../sprites/PixelArt.js';

/**
 * Boot scene — generates pixel art, then goes straight to Summoning.
 * Title screen is handled by HTML before Phaser starts.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Load real pixel art PNG sprites (32x32 each)
    this.load.image('knight_real', 'assets/monsters/knight.png');
    this.load.image('demon_critical_real', 'assets/monsters/demon_critical.png');
    this.load.image('demon_high_real', 'assets/monsters/demon_high.png');
    this.load.image('demon_medium_real', 'assets/monsters/demon_medium.png');
    this.load.image('demon_low_real', 'assets/monsters/demon_low.png');
    this.load.image('demon_info_real', 'assets/monsters/demon_info.png');

    // Load warrior sprite sheets (luizmelo, 162x162 per frame)
    this.load.spritesheet('warrior_idle', 'assets/luizmelo/warrior/sprites/Idle.png', { frameWidth: 162, frameHeight: 162 });
    this.load.spritesheet('warrior_run', 'assets/luizmelo/warrior/sprites/Run.png', { frameWidth: 162, frameHeight: 162 });
    this.load.spritesheet('warrior_attack', 'assets/luizmelo/warrior/sprites/Attack1.png', { frameWidth: 162, frameHeight: 162 });
    this.load.spritesheet('warrior_hit', 'assets/luizmelo/warrior/sprites/Take Hit.png', { frameWidth: 162, frameHeight: 162 });
    this.load.spritesheet('warrior_death', 'assets/luizmelo/warrior/sprites/Death.png', { frameWidth: 162, frameHeight: 162 });
  }

  create() {
    PixelArt.generateAll(this);

    // Create warrior animations
    this.anims.create({ key: 'warrior_idle_anim', frames: this.anims.generateFrameNumbers('warrior_idle', { start: 0, end: 9 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'warrior_run_anim', frames: this.anims.generateFrameNumbers('warrior_run', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'warrior_attack_anim', frames: this.anims.generateFrameNumbers('warrior_attack', { start: 0, end: 6 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'warrior_hit_anim', frames: this.anims.generateFrameNumbers('warrior_hit', { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'warrior_death_anim', frames: this.anims.generateFrameNumbers('warrior_death', { start: 0, end: 6 }), frameRate: 8, repeat: 0 });

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Summoning', {
        domain: this.game.domain,
        projectPath: this.game.projectPath
      });
    });
  }
}
