import { PixelArt } from '../sprites/PixelArt.js';
import { getAllDemons } from '../demons-manifest.js';

/**
 * Boot scene - generates pixel art, then goes straight to Summoning.
 * Title screen is handled by HTML before Phaser starts.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Handle asset load failures gracefully
    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load asset: ${file.key} (${file.url})`);
    });

    // Load real pixel art PNG sprites (32x32 each) - static fallbacks
    this.load.image('knight_real', 'assets/monsters/knight.png');
    this.load.image('demon_critical_real', 'assets/monsters/demon_critical.png');
    this.load.image('demon_high_real', 'assets/monsters/demon_high.png');
    this.load.image('demon_medium_real', 'assets/monsters/demon_medium.png');
    this.load.image('demon_low_real', 'assets/monsters/demon_low.png');
    this.load.image('demon_info_real', 'assets/monsters/demon_info.png');

    // Load 4-frame idle animation for every demon in the roster.
    // Every character is from 0x72 DungeonTileset II (CC0). All face
    // right natively - scenes flip them horizontally to face the player.
    for (const demon of getAllDemons()) {
      for (let f = 0; f < demon.frames; f++) {
        this.load.image(`${demon.framePrefix}${f}`, `assets/0x72/frames/${demon.name}_idle_anim_f${f}.png`);
      }
    }

    // Remove old character textures if this is a re-entry (character swap from Gate).
    // Phaser caches textures by key - without removal, load() silently skips the new files
    // and the old character's sprites remain on screen.
    for (const key of this.textures.getTextureKeys()) {
      if (key.startsWith('char_')) {
        this.textures.remove(key);
      }
    }

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

    // Load extra animation variants (attack2, attack3, jump)
    if (cfg.extraAnims) {
      for (const anim of cfg.extraAnims) {
        this.load.spritesheet(anim.key, anim.path, { frameWidth: cfg.frameW, frameHeight: cfg.frameH });
      }
    }
  }

  create() {
    const dpr = this.game.dpr || window.GAME_DPR;
    this.cameras.main.setZoom(dpr);
    this.cameras.main.scrollX = 400 * (1 - dpr);
    this.cameras.main.scrollY = 300 * (1 - dpr);
    PixelArt.generateAll(this);

    // Create character animations from selected character config
    const cfg = this.game.characterConfig;

    // Ensure all sprite textures use NEAREST filter for crisp pixel art
    // (global pixelArt is off so text renders smoothly).
    const texKeys = [
      'knight_real', 'demon_critical_real', 'demon_high_real',
      'demon_medium_real', 'demon_low_real', 'demon_info_real',
      'char_idle', 'char_run', 'char_attack', 'char_hit', 'char_death'
    ];
    // Add every demon frame texture - critical for crisp pixel rendering
    for (const demon of getAllDemons()) {
      for (let f = 0; f < demon.frames; f++) texKeys.push(`${demon.framePrefix}${f}`);
    }
    if (cfg.extraAnims) {
      for (const anim of cfg.extraAnims) texKeys.push(anim.key);
    }
    for (const key of texKeys) {
      const tex = this.textures.get(key);
      if (tex && tex.source && tex.source[0]) {
        tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }

    // Remove old animations if they exist (handles character swap re-entry)
    const oldAnimKeys = [
      'char_idle_anim', 'char_run_anim', 'char_attack_anim',
      'char_hit_anim', 'char_death_anim',
      'char_attack2_anim', 'char_attack3_anim', 'char_jump_anim'
    ];
    for (const key of oldAnimKeys) {
      if (this.anims.exists(key)) this.anims.remove(key);
    }

    this.anims.create({ key: 'char_idle_anim', frames: this.anims.generateFrameNumbers('char_idle', { start: 0, end: cfg.idleFrames - 1 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'char_run_anim', frames: this.anims.generateFrameNumbers('char_run', { start: 0, end: cfg.runFrames - 1 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'char_attack_anim', frames: this.anims.generateFrameNumbers('char_attack', { start: 0, end: cfg.attackFrames - 1 }), frameRate: 12, repeat: 0 });
    this.anims.create({ key: 'char_hit_anim', frames: this.anims.generateFrameNumbers('char_hit', { start: 0, end: cfg.hitFrames - 1 }), frameRate: 8, repeat: 0 });
    this.anims.create({ key: 'char_death_anim', frames: this.anims.generateFrameNumbers('char_death', { start: 0, end: cfg.deathFrames - 1 }), frameRate: 8, repeat: 0 });

    // Create one 4-frame idle animation per demon character. Every
    // demon in the roster has its own distinct idle loop - no fake
    // scale-tween "breathing" anywhere.
    for (const demon of getAllDemons()) {
      if (this.anims.exists(demon.animKey)) this.anims.remove(demon.animKey);
      const frames = [];
      for (let f = 0; f < demon.frames; f++) frames.push({ key: `${demon.framePrefix}${f}` });
      this.anims.create({
        key: demon.animKey,
        frames,
        frameRate: 6,
        repeat: -1,
      });
    }

    // Register extra animation variants
    if (cfg.extraAnims) {
      for (const anim of cfg.extraAnims) {
        this.anims.create({
          key: anim.key + '_anim',
          frames: this.anims.generateFrameNumbers(anim.key, { start: 0, end: anim.frames - 1 }),
          frameRate: 12,
          repeat: 0
        });
      }
    }

    // Check if we're being re-entered from Gate with a pending destination
    const dest = this.game.pendingDestination;
    if (dest) {
      const destScene = dest.scene;
      const destData = dest.data || {};
      this.game.pendingDestination = null;
      this.cameras.main.fadeIn(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start(destScene, {
          domain: this.game.domain,
          projectPath: this.game.projectPath,
          ...destData
        });
      });
      return;
    }

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Gate', {
        domain: this.game.domain,
        projectPath: this.game.projectPath
      });
    });
  }
}
