import { PixelArt } from '../sprites/PixelArt.js';

/**
 * Boot scene — generates pixel art, then goes straight to Summoning.
 * Title screen is handled by HTML before Phaser starts.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
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
