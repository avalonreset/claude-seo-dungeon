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

    // Load character sprite sheets dynamically based on selection
    const cfg = this.game.characterConfig || {
      name: 'warrior',
      idlePath: 'assets/luizmelo/warrior/sprites/Idle.png',
      runPath: 'assets/luizmelo/warrior/sprites/Run.png',
      attackPath: 'assets/luizmelo/warrior/sprites/Attack1.png',
      hitPath: 'assets/luizmelo/warrior/sprites/Take Hit.png',
      deathPath: 'assets/luizmelo/warrior/sprites/Death.png',
      frameW: 162,
      frameH: 162,
      idleFrames: 10,
      runFrames: 8,
      attackFrames: 7,
      hitFrames: 3,
      deathFrames: 7
    };
    this.game.characterConfig = cfg;

    this.load.spritesheet('char_idle', cfg.idlePath, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
    this.load.spritesheet('char_run', cfg.runPath, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
    this.load.spritesheet('char_attack', cfg.attackPath, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
    this.load.spritesheet('char_hit', cfg.hitPath, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
    this.load.spritesheet('char_death', cfg.deathPath, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
  }

  create() {
    PixelArt.generateAll(this);

    // Create character animations from selected character config
    const cfg = this.game.characterConfig;
    this.anims.create({ key: 'char_idle_anim', frames: this.anims.generateFrameNumbers('char_idle', { start: 0, end: cfg.idleFrames - 1 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'char_run_anim', frames: this.anims.generateFrameNumbers('char_run', { start: 0, end: cfg.runFrames - 1 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'char_attack_anim', frames: this.anims.generateFrameNumbers('char_attack', { start: 0, end: cfg.attackFrames - 1 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'char_hit_anim', frames: this.anims.generateFrameNumbers('char_hit', { start: 0, end: cfg.hitFrames - 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'char_death_anim', frames: this.anims.generateFrameNumbers('char_death', { start: 0, end: cfg.deathFrames - 1 }), frameRate: 8, repeat: 0 });

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Summoning', {
        domain: this.game.domain,
        projectPath: this.game.projectPath
      });
    });
  }
}
