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
  }

  create() {
    PixelArt.generateAll(this);

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Summoning', {
        domain: this.game.domain,
        projectPath: this.game.projectPath
      });
    });
  }
}
