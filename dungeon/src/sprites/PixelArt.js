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

  // ── Knight (protagonist) — detailed Dark Souls style ──────────
  static generateKnight(scene) {
    const g = scene.make.graphics({ add: false });
    const s = 4; // pixel scale
    const p = (x, y, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, s, s); };
    const row = (x, y, w, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, h*s); };

    // Colors
    const steel = 0x606878, steelHi = 0x8890a0, steelDk = 0x404858;
    const helmet = 0x505868, helmetHi = 0x687080;
    const visor = 0x30e8f0, visorDim = 0x20a0b0;
    const plume = 0xc03030, plumeDk = 0x901818;
    const gold = 0xd4af37, goldLt = 0xe8c850;
    const cape = 0x1838a0, capeLt = 0x2850c0;
    const leather = 0x403838, leatherDk = 0x302828;
    const leg = 0x505060;

    // ── Plume (flowing crest) ──
    p(8, 0, plume); p(9, 0, plume);
    p(7, 1, plumeDk); p(8, 1, plume); p(9, 1, plume); p(10, 1, plume);
    p(8, 2, plumeDk); p(9, 2, plumeDk);

    // ── Helmet ──
    row(6, 3, 8, helmetHi);  // top edge
    rect(5, 4, 10, 3, helmet);
    row(6, 4, 8, helmetHi);  // highlight strip
    // Visor (glowing slit)
    row(6, 5, 8, visor);
    // Chin guard
    row(6, 7, 8, steelDk);

    // ── Shoulder pauldrons ──
    rect(3, 8, 4, 2, steelHi);
    rect(13, 8, 4, 2, steelHi);
    row(3, 10, 4, steel);
    row(13, 10, 4, steel);
    // Gold rivets on shoulders
    p(4, 8, gold); p(14, 8, gold);

    // ── Chest plate ──
    rect(5, 8, 10, 6, steel);
    // Chest highlight
    rect(7, 9, 6, 3, steelHi);
    // Gold chest emblem
    rect(8, 10, 4, 2, gold);
    p(9, 9, goldLt); p(10, 9, goldLt);

    // ── Gold belt ──
    row(5, 14, 10, gold);
    p(9, 14, goldLt); p(10, 14, goldLt);

    // ── Cape (behind, left side) ──
    rect(3, 9, 2, 10, cape);
    rect(2, 11, 1, 8, cape);
    p(3, 10, capeLt); p(3, 13, capeLt); p(3, 16, capeLt);

    // ── Arms ──
    rect(3, 11, 2, 3, steel);
    rect(15, 11, 2, 3, steel);
    // Gauntlets
    rect(3, 14, 2, 1, steelHi);
    rect(15, 14, 2, 1, steelHi);
    // Gold wrist bands
    row(3, 13, 2, gold);
    row(15, 13, 2, gold);

    // ── Shield (left hand) ──
    rect(1, 12, 3, 6, 0x2848a0);
    row(1, 12, 3, gold); // top border
    row(1, 17, 3, gold); // bottom border
    p(0, 12, gold); p(0, 17, gold); // side accents
    // Shield cross
    p(2, 14, 0xe0e0e0); p(2, 15, 0xe0e0e0);
    p(1, 14, 0xc0c0c0); p(3, 14, 0xc0c0c0);

    // ── Sword (right hand) ──
    // Blade
    p(17, 3, 0xe8f0f8); p(17, 4, 0xc0c8d0);
    p(17, 5, 0xe8f0f8); p(17, 6, 0xc0c8d0);
    p(17, 7, 0xe8f0f8); p(17, 8, 0xc0c8d0);
    p(17, 9, 0xe8f0f8); p(17, 10, 0xc0c8d0);
    p(17, 11, 0xe8f0f8); p(17, 12, 0xc0c8d0);
    // Guard
    row(16, 13, 3, gold);
    // Grip
    p(17, 14, leather); p(17, 15, leather);
    // Pommel
    p(17, 16, gold);

    // ── Legs ──
    rect(6, 15, 3, 5, leg);
    rect(11, 15, 3, 5, leg);
    // Knee guards
    row(6, 17, 3, steelHi);
    row(11, 17, 3, steelHi);

    // ── Boots ──
    rect(5, 20, 4, 2, leather);
    rect(11, 20, 4, 2, leather);
    row(5, 21, 4, leatherDk);
    row(11, 21, 4, leatherDk);
    // Gold boot trim
    row(5, 20, 4, 0x504030);
    row(11, 20, 4, 0x504030);

    g.generateTexture('knight', 20*s, 22*s);
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
