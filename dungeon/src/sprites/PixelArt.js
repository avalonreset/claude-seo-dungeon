import { COLORS } from '../utils/colors.js';

/**
 * Generates all pixel art sprites programmatically — no external assets needed.
 * SNES-style 16-bit aesthetic, Dark Souls meets Final Fantasy.
 */
export class PixelArt {

  static generateAll(scene) {
    this.generateKnight(scene);
    this.generateKnightAnimFrames(scene);
    this.generateDemons(scene);
    this.generateSword(scene);
    this.generateShield(scene);
    this.generateBattleBg(scene);
    this.generateDungeonTiles(scene);
    this.generateParticles(scene);
  }

  // ── Knight (protagonist) — detailed Dark Souls style, 4 walk frames + static ──
  static generateKnight(scene) {
    const s = 4; // pixel scale

    // Colors
    const steel = 0x606878, steelHi = 0x8890a0, steelDk = 0x404858;
    const helmet = 0x505868, helmetHi = 0x687080;
    const visor = 0x30e8f0;
    const plume = 0xc03030, plumeDk = 0x901818;
    const gold = 0xd4af37, goldLt = 0xe8c850;
    const cape = 0x1838a0, capeLt = 0x2850c0, capeDk = 0x102880;
    const leather = 0x403838, leatherDk = 0x302828;
    const leg = 0x505060;

    // Per-frame variation data for the 4-frame walk cycle
    // Frame 0: Left foot forward, right foot back, arms in opposite swing
    // Frame 1: Feet together (passing position), arms neutral
    // Frame 2: Right foot forward, left foot back, arms opposite swing
    // Frame 3: Feet together again (other passing position)
    const walkFrames = [
      { // Frame 0 — left foot forward stride
        leftLegX: 5,  leftLegY: 15, leftLegH: 6,
        rightLegX: 12, rightLegY: 16, rightLegH: 5,
        leftBootX: 4,  leftBootY: 21,
        rightBootX: 12, rightBootY: 21,
        leftArmY: 10,  rightArmY: 12,  // left arm back, right arm forward
        capeSwayX: 0,  capeExtraLen: 1, capeHighlight: [10, 13, 17],
        swordBobY: -1,
      },
      { // Frame 1 — feet together, passing position
        leftLegX: 6,  leftLegY: 15, leftLegH: 5,
        rightLegX: 11, rightLegY: 15, rightLegH: 5,
        leftBootX: 5,  leftBootY: 20,
        rightBootX: 11, rightBootY: 20,
        leftArmY: 11,  rightArmY: 11,  // arms neutral
        capeSwayX: 1,  capeExtraLen: 0, capeHighlight: [10, 13, 16],
        swordBobY: 0,
      },
      { // Frame 2 — right foot forward stride
        leftLegX: 7,  leftLegY: 16, leftLegH: 5,
        rightLegX: 10, rightLegY: 15, rightLegH: 6,
        leftBootX: 7,  leftBootY: 21,
        rightBootX: 9,  rightBootY: 21,
        leftArmY: 12,  rightArmY: 10,  // right arm back, left arm forward
        capeSwayX: 0,  capeExtraLen: 1, capeHighlight: [11, 14, 17],
        swordBobY: -1,
      },
      { // Frame 3 — feet together, other passing position
        leftLegX: 6,  leftLegY: 15, leftLegH: 5,
        rightLegX: 11, rightLegY: 15, rightLegH: 5,
        leftBootX: 5,  leftBootY: 20,
        rightBootX: 11, rightBootY: 20,
        leftArmY: 11,  rightArmY: 11,  // arms neutral
        capeSwayX: -1, capeExtraLen: 0, capeHighlight: [10, 14, 16],
        swordBobY: 0,
      },
    ];

    // Generate 4 walk-cycle frame textures
    for (let fi = 0; fi < 4; fi++) {
      const f = walkFrames[fi];
      const g = scene.make.graphics({ add: false });
      const p  = (x, y, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, s, s); };
      const row  = (x, y, w, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, s); };
      const rect = (x, y, w, h, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, h*s); };

      // ── Plume (flowing crest) ──
      p(8, 0, plume); p(9, 0, plume);
      p(7, 1, plumeDk); p(8, 1, plume); p(9, 1, plume); p(10, 1, plume);
      p(8, 2, plumeDk); p(9, 2, plumeDk);

      // ── Helmet ──
      row(6, 3, 8, helmetHi);
      rect(5, 4, 10, 3, helmet);
      row(6, 4, 8, helmetHi);
      row(6, 5, 8, visor);
      row(6, 7, 8, steelDk);

      // ── Shoulder pauldrons ──
      rect(3, 8, 4, 2, steelHi);
      rect(13, 8, 4, 2, steelHi);
      row(3, 10, 4, steel);
      row(13, 10, 4, steel);
      p(4, 8, gold); p(14, 8, gold);

      // ── Chest plate ──
      rect(5, 8, 10, 6, steel);
      rect(7, 9, 6, 3, steelHi);
      rect(8, 10, 4, 2, gold);
      p(9, 9, goldLt); p(10, 9, goldLt);

      // ── Gold belt ──
      row(5, 14, 10, gold);
      p(9, 14, goldLt); p(10, 14, goldLt);

      // ── Cape (behind, left side — sways per frame) ──
      const cx = 3 + f.capeSwayX;
      rect(cx, 9, 2, 10 + f.capeExtraLen, cape);
      rect(cx - 1, 11, 1, 8 + f.capeExtraLen, cape);
      // Cape highlight pixels shift per frame
      for (const hy of f.capeHighlight) {
        p(cx, hy, capeLt);
      }
      // Cape shadow on stride frames
      if (fi === 0 || fi === 2) {
        p(cx, 12, capeDk); p(cx, 15, capeDk);
      }

      // ── Left arm (swings with walk) ──
      rect(3, f.leftArmY, 2, 3, steel);
      rect(3, f.leftArmY + 3, 2, 1, steelHi);   // gauntlet
      row(3, f.leftArmY + 2, 2, gold);           // gold wrist band

      // ── Right arm (swings opposite) ──
      rect(15, f.rightArmY, 2, 3, steel);
      rect(15, f.rightArmY + 3, 2, 1, steelHi);  // gauntlet
      row(15, f.rightArmY + 2, 2, gold);          // gold wrist band

      // ── Shield (left hand — follows left arm) ──
      const shY = f.leftArmY + 1;
      rect(1, shY, 3, 6, 0x2848a0);
      row(1, shY, 3, gold);           // top border
      row(1, shY + 5, 3, gold);       // bottom border
      p(0, shY, gold); p(0, shY + 5, gold);
      p(2, shY + 2, 0xe0e0e0); p(2, shY + 3, 0xe0e0e0);
      p(1, shY + 2, 0xc0c0c0); p(3, shY + 2, 0xc0c0c0);

      // ── Sword (right hand — bobs with step) ──
      const sBy = 3 + f.swordBobY;
      for (let bi = 0; bi < 10; bi++) {
        p(17, sBy + bi, (bi % 2 === 0) ? 0xe8f0f8 : 0xc0c8d0);
      }
      row(16, sBy + 10, 3, gold);                 // guard
      p(17, sBy + 11, leather); p(17, sBy + 12, leather); // grip
      p(17, sBy + 13, gold);                      // pommel

      // ── Legs (per-frame stride positions) ──
      rect(f.leftLegX, f.leftLegY, 3, f.leftLegH, leg);
      rect(f.rightLegX, f.rightLegY, 3, f.rightLegH, leg);
      // Knee guards
      row(f.leftLegX, f.leftLegY + 2, 3, steelHi);
      row(f.rightLegX, f.rightLegY + 2, 3, steelHi);

      // ── Boots ──
      rect(f.leftBootX, f.leftBootY, 4, 2, leather);
      rect(f.rightBootX, f.rightBootY, 4, 2, leather);
      row(f.leftBootX, f.leftBootY + 1, 4, leatherDk);
      row(f.rightBootX, f.rightBootY + 1, 4, leatherDk);
      row(f.leftBootX, f.leftBootY, 4, 0x504030);   // boot trim
      row(f.rightBootX, f.rightBootY, 4, 0x504030);  // boot trim

      g.generateTexture('knight_walk_' + fi, 20*s, 22*s);
      g.destroy();
    }

    // ── Also generate static 'knight' texture (original pose for battle scenes etc.) ──
    const g = scene.make.graphics({ add: false });
    const p  = (x, y, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, color) => { g.fillStyle(color); g.fillRect(x*s, y*s, w*s, h*s); };

    // ── Plume (flowing crest) ──
    p(8, 0, plume); p(9, 0, plume);
    p(7, 1, plumeDk); p(8, 1, plume); p(9, 1, plume); p(10, 1, plume);
    p(8, 2, plumeDk); p(9, 2, plumeDk);

    // ── Helmet ──
    row(6, 3, 8, helmetHi);
    rect(5, 4, 10, 3, helmet);
    row(6, 4, 8, helmetHi);
    row(6, 5, 8, visor);
    row(6, 7, 8, steelDk);

    // ── Shoulder pauldrons ──
    rect(3, 8, 4, 2, steelHi);
    rect(13, 8, 4, 2, steelHi);
    row(3, 10, 4, steel);
    row(13, 10, 4, steel);
    p(4, 8, gold); p(14, 8, gold);

    // ── Chest plate ──
    rect(5, 8, 10, 6, steel);
    rect(7, 9, 6, 3, steelHi);
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
    rect(3, 14, 2, 1, steelHi);
    rect(15, 14, 2, 1, steelHi);
    row(3, 13, 2, gold);
    row(15, 13, 2, gold);

    // ── Shield (left hand) ──
    rect(1, 12, 3, 6, 0x2848a0);
    row(1, 12, 3, gold);
    row(1, 17, 3, gold);
    p(0, 12, gold); p(0, 17, gold);
    p(2, 14, 0xe0e0e0); p(2, 15, 0xe0e0e0);
    p(1, 14, 0xc0c0c0); p(3, 14, 0xc0c0c0);

    // ── Sword (right hand) ──
    p(17, 3, 0xe8f0f8); p(17, 4, 0xc0c8d0);
    p(17, 5, 0xe8f0f8); p(17, 6, 0xc0c8d0);
    p(17, 7, 0xe8f0f8); p(17, 8, 0xc0c8d0);
    p(17, 9, 0xe8f0f8); p(17, 10, 0xc0c8d0);
    p(17, 11, 0xe8f0f8); p(17, 12, 0xc0c8d0);
    row(16, 13, 3, gold);
    p(17, 14, leather); p(17, 15, leather);
    p(17, 16, gold);

    // ── Legs ──
    rect(6, 15, 3, 5, leg);
    rect(11, 15, 3, 5, leg);
    row(6, 17, 3, steelHi);
    row(11, 17, 3, steelHi);

    // ── Boots ──
    rect(5, 20, 4, 2, leather);
    rect(11, 20, 4, 2, leather);
    row(5, 21, 4, leatherDk);
    row(11, 21, 4, leatherDk);
    row(5, 20, 4, 0x504030);
    row(11, 20, 4, 0x504030);

    g.generateTexture('knight', 20*s, 22*s);
    g.destroy();
  }

  // ── Create 'knight_march' animation from the 4 walk frame textures ──
  static generateKnightAnimFrames(scene) {
    scene.anims.create({
      key: 'knight_march',
      frames: [
        { key: 'knight_walk_0' },
        { key: 'knight_walk_1' },
        { key: 'knight_walk_2' },
        { key: 'knight_walk_3' },
      ],
      frameRate: 6,
      repeat: -1,
    });
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
