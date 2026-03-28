import { PixelArt } from '../sprites/PixelArt.js';

/**
 * Boot scene — generates all pixel art textures, then transitions to Title.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // Generate all sprites programmatically
    PixelArt.generateAll(this);

    // Launch the persistent log overlay (runs alongside all scenes)
    this.scene.launch('Log');

    // Quick flash then go to title
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('Title');
    });
  }
}
