import { COLORS } from '../utils/colors.js';

/**
 * Generates all pixel art sprites programmatically — no external assets needed.
 * SNES-style 16-bit aesthetic, Dark Souls meets Final Fantasy.
 */
export class PixelArt {

  static generateAll(scene) {
    this.generateKnight(scene);
    this.generateDemons(scene);
    this.generateSword(scene);
    this.generateShield(scene);
    this.generateBattleBg(scene);
    this.generateDungeonTiles(scene);
    this.generateParticles(scene);
  }

  // ── Knight (protagonist) ─────────────────────────────────────
  static generateKnight(scene) {
    const g = scene.make.graphics({ add: false });
    const s = 4; // pixel scale

    // Armor body (dark steel)
    g.fillStyle(0x606878);
    g.fillRect(4*s, 6*s, 8*s, 8*s);

    // Chest plate highlight
    g.fillStyle(0x808890);
    g.fillRect(5*s, 7*s, 6*s, 4*s);

    // Helmet
    g.fillStyle(0x505868);
    g.fillRect(5*s, 2*s, 6*s, 5*s);

    // Helmet visor slit
    g.fillStyle(0x30e8f0);
    g.fillRect(6*s, 4*s, 4*s, 1*s);

    // Helmet plume
    g.fillStyle(0xc03030);
    g.fillRect(7*s, 0*s, 2*s, 3*s);
    g.fillRect(9*s, 1*s, 1*s, 2*s);

    // Arms
    g.fillStyle(0x606878);
    g.fillRect(2*s, 7*s, 2*s, 6*s);
    g.fillRect(12*s, 7*s, 2*s, 6*s);

    // Gauntlets
    g.fillStyle(0x808890);
    g.fillRect(2*s, 12*s, 2*s, 2*s);
    g.fillRect(12*s, 12*s, 2*s, 2*s);

    // Legs
    g.fillStyle(0x505060);
    g.fillRect(5*s, 14*s, 3*s, 4*s);
    g.fillRect(8*s, 14*s, 3*s, 4*s);

    // Boots
    g.fillStyle(0x403838);
    g.fillRect(4*s, 17*s, 4*s, 2*s);
    g.fillRect(8*s, 17*s, 4*s, 2*s);

    // Cape
    g.fillStyle(0x2040a0);
    g.fillRect(3*s, 6*s, 1*s, 10*s);
    g.fillRect(2*s, 8*s, 1*s, 8*s);

    g.generateTexture('knight', 16*s, 20*s);
    g.destroy();
  }

  // ── Demons (one per severity) ────────────────────────────────
  static generateDemons(scene) {
    this._demon(scene, 'demon_critical', 0xc02040, 0xff3050, 20, true);
    this._demon(scene, 'demon_high', 0xc06020, 0xff8030, 16, true);
    this._demon(scene, 'demon_medium', 0xb0a020, 0xf0d040, 14, false);
    this._demon(scene, 'demon_low', 0x308030, 0x50c050, 12, false);
    this._demon(scene, 'demon_info', 0x305080, 0x4080c0, 10, false);
  }

  static _demon(scene, key, bodyColor, eyeColor, size, hasHorns) {
    const g = scene.make.graphics({ add: false });
    const s = 4;
    const w = size;
    const h = size + 4;
    const cx = Math.floor(w / 2);

    // Body
    g.fillStyle(bodyColor);
    g.fillRect((cx-3)*s, 4*s, 6*s, (h-6)*s);

    // Head
    g.fillStyle(bodyColor);
    g.fillRect((cx-2)*s, 1*s, 4*s, 4*s);

    // Eyes (glowing)
    g.fillStyle(eyeColor);
    g.fillRect((cx-2)*s, 2*s, 1*s, 1*s);
    g.fillRect((cx+1)*s, 2*s, 1*s, 1*s);

    // Mouth
    g.fillStyle(0x200000);
    g.fillRect((cx-1)*s, 4*s, 2*s, 1*s);

    // Horns
    if (hasHorns) {
      g.fillStyle(0x404040);
      g.fillRect((cx-3)*s, 0*s, 1*s, 2*s);
      g.fillRect((cx+2)*s, 0*s, 1*s, 2*s);
    }

    // Arms/claws
    g.fillStyle(bodyColor);
    g.fillRect((cx-5)*s, 5*s, 2*s, 4*s);
    g.fillRect((cx+3)*s, 5*s, 2*s, 4*s);

    // Claws
    g.fillStyle(eyeColor);
    g.fillRect((cx-5)*s, 9*s, 1*s, 1*s);
    g.fillRect((cx+4)*s, 9*s, 1*s, 1*s);

    // Legs
    g.fillStyle(bodyColor - 0x101010);
    g.fillRect((cx-2)*s, (h-2)*s, 2*s, 2*s);
    g.fillRect((cx)*s, (h-2)*s, 2*s, 2*s);

    g.generateTexture(key, w*s, h*s);
    g.destroy();
  }

  // ── Sword ────────────────────────────────────────────────────
  static generateSword(scene) {
    const g = scene.make.graphics({ add: false });
    const s = 3;

    // Blade
    g.fillStyle(0xc0c8d0);
    g.fillRect(3*s, 0*s, 2*s, 10*s);
    // Blade edge highlight
    g.fillStyle(0xe0e8f0);
    g.fillRect(4*s, 0*s, 1*s, 10*s);
    // Guard
    g.fillStyle(0xf0c040);
    g.fillRect(1*s, 10*s, 6*s, 1*s);
    // Grip
    g.fillStyle(0x604020);
    g.fillRect(3*s, 11*s, 2*s, 4*s);
    // Pommel
    g.fillStyle(0xf0c040);
    g.fillRect(3*s, 15*s, 2*s, 1*s);

    g.generateTexture('sword', 8*s, 16*s);
    g.destroy();
  }

  // ── Shield ───────────────────────────────────────────────────
  static generateShield(scene) {
    const g = scene.make.graphics({ add: false });
    const s = 3;

    // Shield body
    g.fillStyle(0x4060a0);
    g.fillRect(1*s, 0*s, 6*s, 8*s);
    // Border
    g.fillStyle(0xf0c040);
    g.fillRect(0*s, 0*s, 1*s, 8*s);
    g.fillRect(7*s, 0*s, 1*s, 8*s);
    g.fillRect(1*s, 0*s, 6*s, 1*s);
    g.fillRect(2*s, 7*s, 4*s, 1*s);
    // Emblem (cross)
    g.fillStyle(0xe0e0e0);
    g.fillRect(3*s, 2*s, 2*s, 4*s);
    g.fillRect(2*s, 3*s, 4*s, 2*s);

    g.generateTexture('shield', 8*s, 8*s);
    g.destroy();
  }

  // ── Battle background ────────────────────────────────────────
  static generateBattleBg(scene) {
    const g = scene.make.graphics({ add: false });
    const w = 800, h = 600;

    // Dark dungeon gradient
    for (let y = 0; y < h; y += 4) {
      const shade = Math.floor(10 + (y / h) * 15);
      g.fillStyle(Phaser.Display.Color.GetColor(shade, shade, shade + 8));
      g.fillRect(0, y, w, 4);
    }

    // Stone floor
    g.fillStyle(0x2a2a3a);
    g.fillRect(0, 400, w, 200);

    // Floor tile lines
    g.lineStyle(1, 0x3a3a4a);
    for (let x = 0; x < w; x += 60) {
      g.lineBetween(x, 400, x, 600);
    }
    for (let y = 400; y < h; y += 40) {
      g.lineBetween(0, y, w, y);
    }

    // Torch glow (left)
    g.fillStyle(0x301800, 0.3);
    g.fillCircle(50, 300, 80);
    g.fillStyle(0xf08020);
    g.fillRect(45, 280, 10, 20);

    // Torch glow (right)
    g.fillStyle(0x301800, 0.3);
    g.fillCircle(750, 300, 80);
    g.fillStyle(0xf08020);
    g.fillRect(745, 280, 10, 20);

    g.generateTexture('battle_bg', w, h);
    g.destroy();
  }

  // ── Dungeon tiles ────────────────────────────────────────────
  static generateDungeonTiles(scene) {
    const g = scene.make.graphics({ add: false });

    // Floor tile
    g.fillStyle(0x2a2a3a);
    g.fillRect(0, 0, 32, 32);
    g.lineStyle(1, 0x3a3a4a);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture('tile_floor', 32, 32);
    g.clear();

    // Wall tile
    g.fillStyle(0x1a1a28);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x222234);
    g.fillRect(2, 2, 28, 14);
    g.lineStyle(1, 0x2a2a3e);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture('tile_wall', 32, 32);

    g.destroy();
  }

  // ── Particles ────────────────────────────────────────────────
  static generateParticles(scene) {
    const g = scene.make.graphics({ add: false });

    // Generic glow particle
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.clear();

    // Slash effect
    g.lineStyle(3, 0xe0e8f0);
    g.lineBetween(0, 20, 20, 0);
    g.lineStyle(2, 0xf0f8ff);
    g.lineBetween(2, 18, 18, 2);
    g.generateTexture('slash', 24, 24);

    g.destroy();
  }
}
