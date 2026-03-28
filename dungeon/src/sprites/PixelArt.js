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

  // ── Demons (one per severity) — Dark Souls style dungeon monsters ─────────
  static generateDemons(scene) {
    this._demonCritical(scene);
    this._demonHigh(scene);
    this._demonMedium(scene);
    this._demonLow(scene);
    this._demonInfo(scene);
  }

  // ── CRITICAL: Massive Horned Demon Lord with wings — 24x28, red/black ─────
  static _demonCritical(scene) {
    const s = 4;
    const g = scene.make.graphics({ add: false });
    const p    = (x, y, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, h*s); };

    const black = 0x0a0008, dkRed = 0x500818, red = 0x901020, ltRed = 0xc02030;
    const hotRed = 0xff3050, ember = 0xff6040, orange = 0xffa030;
    const horn = 0x383028, hornHi = 0x585040, hornDk = 0x201810;
    const skin = 0x701018, skinHi = 0x902028, skinDk = 0x480810;
    const claw = 0x382820, clawHi = 0x504030;
    const wingMembrane = 0x580810, wingBone = 0x401018, wingEdge = 0x300608;
    const eyeGlow = 0xff3050, eyeCore = 0xff8080, eyeOuter = 0xcc2040;
    const tooth = 0xe0d8c0, toothDk = 0xa09880;
    const mouthDk = 0x200008;

    // ── Horns (large, swept back, jagged) ──
    p(5, 0, hornHi); p(4, 1, horn); p(5, 1, horn);
    p(5, 2, horn); p(6, 2, hornDk); p(6, 3, horn); p(7, 3, hornDk);
    p(7, 4, horn);
    p(18, 0, hornHi); p(18, 1, horn); p(19, 1, horn);
    p(17, 2, hornDk); p(18, 2, horn); p(17, 3, horn);
    p(16, 4, horn);
    p(3, 1, hornHi); p(20, 1, hornHi);
    p(4, 0, hornDk); p(19, 0, hornDk);

    // ── Head (broad, menacing) ──
    row(8, 4, 8, skinDk);
    rect(7, 5, 10, 4, skin);
    row(8, 5, 8, skinHi);
    row(7, 6, 10, skinDk); // brow ridge
    // Eyes (glowing, 2px wide each)
    p(8, 7, eyeOuter); p(9, 7, eyeGlow); p(10, 7, eyeCore);
    p(13, 7, eyeCore); p(14, 7, eyeGlow); p(15, 7, eyeOuter);
    p(9, 8, 0x801020); p(14, 8, 0x801020); // glow underneath
    p(11, 8, skinDk); p(12, 8, skinDk); // nose
    // Mouth with jagged teeth
    row(8, 9, 8, mouthDk);
    p(8, 9, tooth); p(10, 9, tooth); p(13, 9, tooth); p(15, 9, tooth);
    row(8, 10, 8, mouthDk);
    p(9, 10, toothDk); p(11, 10, toothDk); p(12, 10, toothDk); p(14, 10, toothDk);
    row(8, 11, 8, skinDk); // jaw
    p(8, 11, tooth); p(15, 11, tooth); // lower fangs
    p(8, 12, toothDk); p(15, 12, toothDk);

    // ── Wings (large, bat-like, spread wide) ──
    // Left wing
    rect(0, 5, 2, 1, wingBone); rect(1, 6, 2, 1, wingBone);
    rect(2, 7, 2, 1, wingBone); rect(3, 8, 2, 1, wingBone);
    p(0, 4, wingBone); p(1, 3, wingBone); p(2, 2, wingBone);
    rect(0, 6, 3, 6, wingMembrane); rect(1, 8, 4, 5, wingMembrane);
    rect(2, 10, 4, 4, wingMembrane);
    p(0, 7, wingEdge); p(0, 9, wingEdge); p(0, 11, wingEdge);
    p(0, 3, clawHi); p(1, 2, clawHi);
    // Right wing
    rect(22, 5, 2, 1, wingBone); rect(21, 6, 2, 1, wingBone);
    rect(20, 7, 2, 1, wingBone); rect(19, 8, 2, 1, wingBone);
    p(23, 4, wingBone); p(22, 3, wingBone); p(21, 2, wingBone);
    rect(21, 6, 3, 6, wingMembrane); rect(19, 8, 4, 5, wingMembrane);
    rect(18, 10, 4, 4, wingMembrane);
    p(23, 7, wingEdge); p(23, 9, wingEdge); p(23, 11, wingEdge);
    p(23, 3, clawHi); p(22, 2, clawHi);

    // ── Neck ──
    rect(9, 12, 6, 1, skinDk);

    // ── Torso (massive, muscular) ──
    rect(7, 13, 10, 7, skin);
    rect(8, 13, 3, 2, skinHi); rect(13, 13, 3, 2, skinHi); // pecs
    rect(11, 13, 2, 6, skinDk); // center shadow
    row(8, 16, 3, skinDk); row(13, 16, 3, skinDk); // abs
    row(8, 18, 3, skinDk); row(13, 18, 3, skinDk);
    p(7, 14, skinDk); p(16, 14, skinDk); // rib shadow
    p(7, 15, skinDk); p(16, 15, skinDk);

    // ── Shoulder spikes ──
    p(6, 12, claw); p(5, 11, clawHi);
    p(17, 12, claw); p(18, 11, clawHi);

    // ── Arms (thick, muscular, reaching outward) ──
    rect(4, 13, 3, 5, skin); rect(3, 14, 2, 3, skinDk);
    p(4, 13, skinHi);
    // Left clawed hand
    p(2, 18, claw); p(3, 18, claw); p(4, 18, claw);
    p(1, 19, clawHi); p(3, 19, clawHi); p(5, 19, clawHi);
    p(1, 20, ember); p(3, 20, ember); p(5, 20, ember); // glowing claw tips
    // Right arm
    rect(17, 13, 3, 5, skin); rect(19, 14, 2, 3, skinDk);
    p(19, 13, skinHi);
    p(19, 18, claw); p(20, 18, claw); p(21, 18, claw);
    p(18, 19, clawHi); p(20, 19, clawHi); p(22, 19, clawHi);
    p(18, 20, ember); p(20, 20, ember); p(22, 20, ember);

    // ── Belt / waist ──
    row(7, 20, 10, black);
    p(11, 20, dkRed); p(12, 20, dkRed);

    // ── Legs (powerful, digitigrade) ──
    rect(7, 21, 4, 3, skinDk); rect(8, 21, 2, 3, skin);
    rect(7, 24, 3, 2, skinDk);
    row(6, 26, 4, claw); p(5, 27, clawHi); p(6, 27, claw);
    p(8, 27, claw); p(9, 27, clawHi);
    rect(13, 21, 4, 3, skinDk); rect(14, 21, 2, 3, skin);
    rect(14, 24, 3, 2, skinDk);
    row(14, 26, 4, claw); p(14, 27, clawHi); p(15, 27, claw);
    p(17, 27, claw); p(18, 27, clawHi);

    // ── Tail (barbed) ──
    p(11, 21, skinDk); p(10, 22, skinDk); p(9, 23, skinDk);
    p(8, 24, skinDk); p(7, 25, skinDk);
    p(6, 25, ltRed);

    // ── Ember particles / aura ──
    p(6, 6, ember); p(17, 5, ember);
    p(3, 16, orange); p(20, 17, orange);
    p(1, 13, hotRed); p(22, 14, hotRed);

    g.generateTexture('demon_critical', 24*s, 28*s);
    g.destroy();
  }

  // ── HIGH: Skeletal Death Knight with scythe — 20x24, orange/dark ──────────
  static _demonHigh(scene) {
    const s = 4;
    const g = scene.make.graphics({ add: false });
    const p    = (x, y, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, h*s); };

    const bone = 0xc8c0a8, boneDk = 0x908878, boneHi = 0xe0d8c0;
    const cloak = 0x181018, cloakMid = 0x282028, cloakHi = 0x383038;
    const cloakEdge = 0x201820;
    const eyeGlow = 0xff8030, eyeCore = 0xffb060, eyeOuter = 0xcc6020;
    const scytheBlade = 0xa0a8b0, scytheHi = 0xd0d8e0, scytheDk = 0x707880;
    const shaft = 0x403020, shaftHi = 0x584030;
    const rust = 0x804020;
    const orange = 0xff8030, dkOrange = 0xb05818;

    // ── Hood / Cowl ──
    row(7, 0, 6, cloakHi);
    rect(6, 1, 8, 3, cloak);
    row(7, 1, 6, cloakMid);
    p(6, 2, cloakEdge); p(13, 2, cloakEdge);

    // ── Skull face inside hood ──
    rect(8, 2, 4, 3, bone);
    p(8, 2, boneHi); p(11, 2, boneHi);
    p(8, 3, 0x100008); p(9, 3, eyeCore); // left eye socket
    p(10, 3, eyeCore); p(11, 3, 0x100008); // right eye socket
    p(9, 4, boneDk); p(10, 4, boneDk); // nose hole
    row(8, 5, 4, boneDk); // jaw
    p(8, 5, bone); p(11, 5, bone); // cheekbones
    p(8, 6, bone); p(10, 6, bone); // lower fangs

    // ── Neck / spine ──
    p(9, 6, boneDk); p(10, 6, boneDk);

    // ── Tattered cloak body ──
    rect(5, 7, 10, 10, cloak);
    p(5, 8, cloakMid); p(14, 8, cloakMid);
    p(6, 10, cloakHi); p(13, 10, cloakHi);
    p(5, 12, cloakMid); p(14, 12, cloakMid);
    p(7, 14, cloakHi); p(12, 14, cloakHi);
    // Rib cage visible through torn cloak
    p(8, 8, boneDk); p(11, 8, boneDk);
    p(8, 9, bone); p(9, 9, boneDk); p(10, 9, boneDk); p(11, 9, bone);
    p(8, 10, boneDk); p(11, 10, boneDk);
    p(8, 11, bone); p(11, 11, bone);
    p(9, 10, boneDk); p(10, 10, boneDk); // spine
    p(9, 12, boneDk); p(10, 12, boneDk);

    // ── Skeletal arms ──
    rect(3, 8, 2, 5, cloak); p(3, 9, cloakMid);
    p(3, 13, bone); p(4, 13, boneDk); p(2, 13, bone); // left hand
    rect(15, 8, 2, 5, cloak); p(16, 9, cloakMid);
    p(15, 13, boneDk); p(16, 13, bone); p(17, 13, bone); // right hand

    // ── Scythe (huge, held left side) ──
    rect(2, 7, 1, 14, shaft);
    p(2, 8, shaftHi); p(2, 12, shaftHi); p(2, 16, shaftHi);
    // Blade (curved, top)
    row(0, 3, 3, scytheBlade);
    p(0, 2, scytheHi); p(1, 2, scytheBlade);
    p(0, 4, scytheDk); p(1, 4, scytheBlade); p(2, 4, scytheBlade);
    p(0, 5, scytheDk); p(1, 5, scytheBlade);
    p(1, 6, scytheDk); p(2, 6, scytheDk);
    p(0, 2, scytheHi); p(0, 3, scytheHi); // blade edge glow
    p(1, 4, rust); p(0, 5, rust); // rust

    // ── Tattered cloak bottom (ragged edges) ──
    row(5, 17, 10, cloak);
    p(5, 18, cloakMid); p(7, 18, cloak); p(9, 18, cloakMid);
    p(11, 18, cloak); p(13, 18, cloakMid); p(14, 18, cloak);
    p(6, 19, cloak); p(8, 19, cloakEdge); p(10, 19, cloak); p(12, 19, cloakEdge);
    p(5, 19, cloakHi); p(14, 19, cloakHi);
    p(7, 20, cloak); p(11, 20, cloak);

    // ── Skeletal feet ──
    p(7, 21, boneDk); p(8, 21, bone);
    p(11, 21, bone); p(12, 21, boneDk);
    p(6, 22, boneDk); p(7, 22, bone);
    p(12, 22, bone); p(13, 22, boneDk);

    // ── Ghostly aura ──
    p(4, 5, dkOrange); p(16, 6, dkOrange);
    p(3, 15, orange); p(17, 16, orange);
    p(18, 10, eyeOuter);

    g.generateTexture('demon_high', 20*s, 24*s);
    g.destroy();
  }

  // ── MEDIUM: Hulking Armored Orc/Troll — 18x22, yellow/brown ──────────────
  static _demonMedium(scene) {
    const s = 4;
    const g = scene.make.graphics({ add: false });
    const p    = (x, y, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, h*s); };

    const skinGrn = 0x4a6830, skinGrnHi = 0x607840, skinGrnDk = 0x304820;
    const armor = 0x605040, armorHi = 0x807060, armorDk = 0x403020;
    const armorPlate = 0x706050, armorRivet = 0x908070;
    const eyeGlow = 0xf0d040, eyeCore = 0xffe060;
    const tusk = 0xe0d8b0, tuskDk = 0xb0a880;
    const leather = 0x403020, leatherDk = 0x302010;
    const spike = 0x504030, spikeHi = 0x706050;
    const belt = 0x504028, beltBuckle = 0xc0a040;
    const yellow = 0xf0d040;

    // ── Head (broad, flat, brutish) ──
    rect(6, 0, 6, 5, skinGrn);
    row(7, 0, 4, skinGrnHi);
    row(6, 1, 6, skinGrnDk); // heavy brow
    p(7, 2, eyeCore); p(10, 2, eyeCore); // angry eyes
    p(8, 3, skinGrnDk); p(9, 3, skinGrnDk); // flat nose
    row(7, 4, 4, skinGrnDk); // mouth
    // Tusks from lower jaw
    p(6, 4, tusk); p(11, 4, tusk);
    p(6, 3, tuskDk); p(11, 3, tuskDk);
    p(5, 3, tusk); p(12, 3, tusk); // tusk tips
    row(6, 5, 6, skinGrnDk); // jaw

    // ── Neck ──
    rect(7, 5, 4, 1, skinGrn);

    // ── Spiked shoulder pauldrons ──
    rect(2, 6, 4, 3, armor); row(2, 6, 4, armorHi);
    p(3, 6, armorRivet);
    p(1, 5, spike); p(2, 4, spikeHi); p(3, 5, spike); // spikes
    rect(12, 6, 4, 3, armor); row(12, 6, 4, armorHi);
    p(14, 6, armorRivet);
    p(16, 5, spike); p(15, 4, spikeHi); p(14, 5, spike);

    // ── Chest armor (heavy plate) ──
    rect(5, 6, 8, 6, armor);
    rect(6, 7, 6, 4, armorPlate);
    row(7, 7, 4, armorHi);
    row(6, 9, 6, armorDk); row(6, 11, 6, armorDk); // segments
    p(6, 7, armorRivet); p(11, 7, armorRivet); // rivets
    p(6, 10, armorRivet); p(11, 10, armorRivet);
    p(8, 7, armorDk); p(9, 7, armorDk); // center seam
    p(8, 10, armorDk); p(9, 10, armorDk);

    // ── Arms (huge, muscular) ──
    rect(1, 8, 3, 5, skinGrn);
    p(1, 8, skinGrnHi); p(2, 9, skinGrnHi);
    rect(1, 11, 3, 1, leather); // bracer
    rect(0, 13, 3, 2, skinGrn); // left fist
    p(0, 14, skinGrnDk); p(2, 14, skinGrnDk);
    rect(14, 8, 3, 5, skinGrn);
    p(16, 8, skinGrnHi); p(15, 9, skinGrnHi);
    rect(14, 11, 3, 1, leather);
    rect(15, 13, 3, 2, skinGrn); // right fist
    p(15, 14, skinGrnDk); p(17, 14, skinGrnDk);

    // ── Belt ──
    row(5, 12, 8, belt);
    p(8, 12, beltBuckle); p(9, 12, beltBuckle);

    // ── Loincloth / waist armor ──
    rect(5, 13, 8, 2, leather);
    rect(6, 13, 6, 2, leatherDk);
    p(6, 14, leather); p(11, 14, leather);
    p(7, 13, armorDk); p(10, 13, armorDk);

    // ── Legs (thick, armored) ──
    rect(5, 15, 3, 4, skinGrn);
    p(5, 15, leather); p(7, 15, leather);
    row(5, 16, 3, armorDk);
    rect(10, 15, 3, 4, skinGrn);
    p(10, 15, leather); p(12, 15, leather);
    row(10, 16, 3, armorDk);

    // ── Boots (heavy, ironshod) ──
    rect(4, 19, 4, 2, armorDk); rect(10, 19, 4, 2, armorDk);
    row(4, 19, 4, armor); row(10, 19, 4, armor);
    row(4, 20, 4, armorDk); row(10, 20, 4, armorDk);
    p(4, 20, armorHi); p(10, 20, armorHi); // iron toe caps

    // ── War paint / scars ──
    p(7, 1, yellow); p(10, 1, yellow);
    p(6, 2, 0x804020);

    g.generateTexture('demon_medium', 18*s, 22*s);
    g.destroy();
  }

  // ── LOW: Sneaky Goblin Rogue — 14x18, green ──────────────────────────────
  static _demonLow(scene) {
    const s = 4;
    const g = scene.make.graphics({ add: false });
    const p    = (x, y, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, h*s); };

    const skin = 0x407830, skinHi = 0x589840, skinDk = 0x285018;
    const ear = 0x508838, earDk = 0x386828;
    const eyeGlow = 0x50c050, eyeCore = 0x80ff80;
    const leather = 0x3a3020, leatherHi = 0x504028, leatherDk = 0x282010;
    const strap = 0x484030;
    const blade = 0xa0a8b0, bladeHi = 0xd0d8e0, bladeDk = 0x707880;
    const hilt = 0x604828;
    const cloth = 0x282820, clothHi = 0x383830;
    const tooth = 0xd0c8a0;
    const hood = 0x302820, hoodHi = 0x403830;

    // ── Hood (pulled low) ──
    row(4, 0, 6, hoodHi);
    rect(3, 1, 8, 2, hood);
    p(4, 1, hoodHi); p(9, 1, hoodHi);

    // ── Pointed ears ──
    p(2, 2, ear); p(1, 1, earDk); p(1, 2, ear);
    p(11, 2, ear); p(12, 1, earDk); p(12, 2, ear);

    // ── Face (small, angular, cunning) ──
    rect(4, 3, 6, 3, skin);
    p(4, 3, skinHi); p(9, 3, skinHi);
    p(5, 3, eyeCore); p(8, 3, eyeCore); // beady eyes
    p(6, 4, skinDk); p(7, 4, skinDk); // nose
    p(6, 5, skinDk);
    row(5, 5, 4, skinDk); // mouth
    p(5, 5, tooth); p(7, 5, tooth); // fangs

    // ── Neck ──
    p(6, 6, skinDk); p(7, 6, skinDk);

    // ── Torso (hunched, leather armor) ──
    rect(4, 7, 6, 4, leather);
    rect(5, 7, 4, 3, leatherHi);
    p(5, 8, leatherDk); p(8, 8, leatherDk);
    // Cross straps
    p(5, 7, strap); p(6, 8, strap); p(7, 9, strap);
    p(8, 7, strap); p(7, 8, strap); p(6, 9, strap);
    p(6, 8, 0x807040); p(7, 8, 0x807040); // buckle

    // ── Arms with daggers ──
    rect(2, 8, 2, 3, skin); p(2, 8, skinHi);
    p(2, 11, skin);
    p(1, 9, bladeHi); p(1, 10, blade); p(1, 11, bladeDk);
    p(1, 12, hilt); p(1, 8, bladeHi); p(1, 7, blade);
    rect(10, 8, 2, 3, skin); p(11, 8, skinHi);
    p(11, 11, skin);
    p(12, 9, bladeHi); p(12, 10, blade); p(12, 11, bladeDk);
    p(12, 12, hilt); p(12, 8, bladeHi); p(12, 7, blade);

    // ── Belt with pouches ──
    row(4, 11, 6, leatherDk);
    p(5, 11, 0x605030); p(8, 11, 0x605030);
    p(6, 11, 0x807040);

    // ── Legs (crouched) ──
    rect(4, 12, 3, 3, cloth); rect(7, 12, 3, 3, cloth);
    p(4, 13, clothHi); p(9, 13, clothHi);
    p(5, 14, strap); p(8, 14, strap);

    // ── Feet (bare, clawed) ──
    rect(3, 15, 3, 2, skinDk); rect(8, 15, 3, 2, skinDk);
    p(3, 16, skin); p(5, 16, skin);
    p(8, 16, skin); p(10, 16, skin);
    p(3, 17, skinDk); p(10, 17, skinDk);

    g.generateTexture('demon_low', 14*s, 18*s);
    g.destroy();
  }

  // ── INFO: Small Imp/Bat creature — 12x16, blue/gray ──────────────────────
  static _demonInfo(scene) {
    const s = 4;
    const g = scene.make.graphics({ add: false });
    const p    = (x, y, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, s, s); };
    const row  = (x, y, w, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, s); };
    const rect = (x, y, w, h, c) => { g.fillStyle(c); g.fillRect(x*s, y*s, w*s, h*s); };

    const skin = 0x485868, skinHi = 0x607080, skinDk = 0x303848;
    const belly = 0x586878;
    const eyeGlow = 0x4080c0, eyeCore = 0x60b0ff;
    const wingMem = 0x384858, wingBone = 0x405060, wingEdge = 0x283040;
    const horn = 0x484050, hornHi = 0x585860;
    const mouth = 0x200818;
    const tooth = 0xd0c8b0;
    const tail = 0x404858, tailTip = 0xff4040;
    const claw = 0x383840;

    // ── Horns (small, curved) ──
    p(3, 0, horn); p(2, 1, hornHi);
    p(8, 0, horn); p(9, 1, hornHi);

    // ── Head (round, oversized — impish) ──
    rect(3, 1, 6, 4, skin);
    row(4, 1, 4, skinHi);
    p(4, 2, eyeGlow); p(5, 2, eyeCore); // big eyes
    p(6, 2, eyeCore); p(7, 2, eyeGlow);
    p(4, 1, skinDk); p(7, 1, skinDk); // brows
    p(5, 3, skinDk); // snub nose
    row(4, 4, 4, mouth); // wide grin
    p(4, 4, tooth); p(7, 4, tooth);
    p(5, 4, 0x400818); // tongue

    // ── Bat ears ──
    p(1, 1, skin); p(1, 2, skinHi); p(2, 2, skin);
    p(10, 1, skin); p(10, 2, skinHi); p(9, 2, skin);
    p(0, 1, skinDk); p(11, 1, skinDk);

    // ── Tiny wings ──
    p(0, 4, wingBone); p(1, 4, wingBone); p(1, 5, wingMem);
    p(0, 5, wingMem); p(0, 6, wingEdge); p(1, 6, wingMem);
    p(0, 7, wingEdge); p(1, 7, wingMem); p(2, 6, wingMem);
    p(0, 3, wingBone);
    p(10, 4, wingBone); p(11, 4, wingBone); p(10, 5, wingMem);
    p(11, 5, wingMem); p(11, 6, wingEdge); p(10, 6, wingMem);
    p(11, 7, wingEdge); p(10, 7, wingMem); p(9, 6, wingMem);
    p(11, 3, wingBone);

    // ── Body (small, round pot-belly) ──
    rect(4, 5, 4, 4, skin);
    rect(5, 6, 2, 2, belly);
    p(5, 5, skinHi); p(6, 5, skinHi);
    p(5, 7, skinDk); // belly button

    // ── Arms (tiny, clawed) ──
    p(3, 6, skin); p(2, 7, skin); p(2, 8, claw);
    p(8, 6, skin); p(9, 7, skin); p(9, 8, claw);

    // ── Legs (stubby) ──
    rect(4, 9, 2, 3, skinDk); rect(6, 9, 2, 3, skinDk);
    p(4, 9, skin); p(7, 9, skin);
    p(3, 12, claw); p(4, 12, skinDk); p(5, 12, skinDk);
    p(6, 12, skinDk); p(7, 12, skinDk); p(8, 12, claw);

    // ── Tail (barbed tip) ──
    p(6, 10, tail); p(7, 11, tail); p(8, 12, tail);
    p(9, 13, tail); p(10, 13, tail); p(11, 13, tail);
    p(11, 14, tailTip);

    // ── Aura sparkles ──
    p(1, 3, 0x3060a0); p(10, 0, 0x3060a0);
    p(0, 8, eyeGlow);

    g.generateTexture('demon_info', 12*s, 16*s);
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

    // ====================================================================
    // BASE FILL -- deep dark blue-black
    // ====================================================================
    g.fillStyle(0x0a0a18);
    g.fillRect(0, 0, w, h);

    // ====================================================================
    // CEILING AREA (y 0-150) -- dark stone with brick texture
    // ====================================================================
    // Subtle gradient from near-black at top to slightly lighter
    for (let y = 0; y < 150; y += 4) {
      const t = y / 150;
      const r = Math.floor(8 + t * 8);
      const gb = Math.floor(8 + t * 6);
      const b = Math.floor(14 + t * 10);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gb, b));
      g.fillRect(0, y, w, 4);
    }

    // Ceiling brick texture -- horizontal mortar lines
    for (let y = 8; y < 150; y += 18) {
      g.fillStyle(0x08080f);
      g.fillRect(0, y, w, 1);
    }
    // Vertical mortar lines (staggered per row)
    for (let row = 0; row < 9; row++) {
      const yStart = row * 18;
      const offset = (row % 2 === 0) ? 0 : 32;
      for (let x = offset; x < w; x += 64) {
        g.fillStyle(0x08080f);
        g.fillRect(x, yStart, 1, 18);
      }
    }

    // Stalactites hanging from ceiling
    const stalactites = [80, 190, 310, 420, 500, 620, 730];
    for (const sx of stalactites) {
      const sLen = 15 + Math.floor((sx * 7) % 25); // pseudo-random length
      // Each stalactite is a narrow triangle-ish shape
      for (let i = 0; i < sLen; i++) {
        const bw = Math.max(1, Math.floor(6 - (i / sLen) * 6));
        g.fillStyle(i < sLen * 0.5 ? 0x12121e : 0x0e0e18);
        g.fillRect(sx - Math.floor(bw / 2), i, bw, 1);
      }
    }

    // Hanging chains (two sets)
    const chainPositions = [{ x: 260, len: 90 }, { x: 540, len: 70 }];
    for (const ch of chainPositions) {
      for (let i = 0; i < ch.len; i += 6) {
        const linkColor = (i % 12 < 6) ? 0x28283a : 0x202030;
        g.fillStyle(linkColor);
        g.fillRect(ch.x - 1, i, 3, 5);
        g.fillStyle(0x18181e);
        g.fillRect(ch.x, i + 1, 1, 3); // inner hole of link
      }
    }

    // ====================================================================
    // WALL AREA (y 150-380) -- stone brick walls with perspective
    // ====================================================================

    // Wall base gradient
    for (let y = 150; y < 380; y += 2) {
      const t = (y - 150) / 230;
      const r = Math.floor(18 + t * 10);
      const gb = Math.floor(18 + t * 8);
      const b = Math.floor(28 + t * 12);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gb, b));
      g.fillRect(0, y, w, 2);
    }

    // Brick texture on walls
    for (let row = 0; row < 12; row++) {
      const y = 150 + row * 20;
      // Horizontal mortar
      g.fillStyle(0x101020);
      g.fillRect(0, y, w, 1);
      // Vertical mortar (staggered)
      const offset = (row % 2 === 0) ? 0 : 28;
      for (let x = offset; x < w; x += 56) {
        g.fillStyle(0x101020);
        g.fillRect(x, y, 1, 20);
      }
      // Subtle brick highlight on top edge of some bricks
      if (row % 3 === 0) {
        for (let x = offset + 2; x < w; x += 56) {
          g.fillStyle(0x262638);
          g.fillRect(x, y + 1, 52, 1);
        }
      }
    }

    // Perspective lines converging to center (vanishing point ~400, 265)
    const vpX = 400, vpY = 265;
    g.lineStyle(1, 0x0e0e1a);
    // Left wall edge
    g.lineBetween(0, 150, vpX - 200, vpY);
    g.lineBetween(0, 380, vpX - 200, vpY + 60);
    // Right wall edge
    g.lineBetween(w, 150, vpX + 200, vpY);
    g.lineBetween(w, 380, vpX + 200, vpY + 60);
    // Additional perspective guides
    g.lineStyle(1, 0x0c0c16);
    g.lineBetween(0, 200, vpX - 160, vpY + 10);
    g.lineBetween(w, 200, vpX + 160, vpY + 10);
    g.lineBetween(0, 300, vpX - 120, vpY + 40);
    g.lineBetween(w, 300, vpX + 120, vpY + 40);

    // Left side wall panel (darker, giving depth)
    g.fillStyle(0x0e0e1a, 0.6);
    g.fillRect(0, 150, 100, 230);
    g.fillStyle(0x0c0c16, 0.5);
    g.fillRect(0, 150, 50, 230);

    // Right side wall panel
    g.fillStyle(0x0e0e1a, 0.6);
    g.fillRect(700, 150, 100, 230);
    g.fillStyle(0x0c0c16, 0.5);
    g.fillRect(750, 150, 50, 230);

    // Cracks on the walls
    const cracks = [
      { x: 160, y: 200, segs: [[0,0],[3,8],[1,16],[5,22],[2,30]] },
      { x: 600, y: 180, segs: [[0,0],[-2,6],[-5,14],[-3,22],[-6,28]] },
      { x: 350, y: 220, segs: [[0,0],[4,5],[2,12],[6,16]] },
      { x: 480, y: 250, segs: [[0,0],[-3,7],[-1,15],[-4,20]] },
    ];
    g.lineStyle(1, 0x0a0a14);
    for (const crack of cracks) {
      for (let i = 0; i < crack.segs.length - 1; i++) {
        const a = crack.segs[i], b = crack.segs[i + 1];
        g.lineBetween(crack.x + a[0], crack.y + a[1], crack.x + b[0], crack.y + b[1]);
      }
    }

    // Moss patches (small green-tinted rectangles on lower wall)
    const mosses = [
      { x: 120, y: 340, w: 18, h: 6 },
      { x: 680, y: 350, w: 14, h: 5 },
      { x: 300, y: 360, w: 10, h: 4 },
      { x: 520, y: 355, w: 12, h: 5 },
      { x: 60,  y: 360, w: 16, h: 6 },
      { x: 740, y: 345, w: 10, h: 4 },
    ];
    for (const m of mosses) {
      g.fillStyle(0x1a2818, 0.7);
      g.fillRect(m.x, m.y, m.w, m.h);
      g.fillStyle(0x203020, 0.5);
      g.fillRect(m.x + 2, m.y + 1, m.w - 4, m.h - 2);
    }

    // ====================================================================
    // TORCHES on walls (left and right, two per side)
    // ====================================================================
    const torchPositions = [
      { x: 120, y: 240 },
      { x: 680, y: 240 },
      { x: 60,  y: 280 },
      { x: 740, y: 280 },
    ];

    for (const tp of torchPositions) {
      // Torch bracket (dark metal)
      g.fillStyle(0x303040);
      g.fillRect(tp.x - 2, tp.y - 5, 4, 20);
      g.fillStyle(0x404050);
      g.fillRect(tp.x - 4, tp.y - 5, 8, 3);

      // Torch head (wood)
      g.fillStyle(0x604020);
      g.fillRect(tp.x - 3, tp.y - 18, 6, 14);
      g.fillStyle(0x705030);
      g.fillRect(tp.x - 2, tp.y - 16, 4, 10);

      // Flame core
      g.fillStyle(0xf0d040);
      g.fillRect(tp.x - 2, tp.y - 26, 4, 8);
      g.fillStyle(0xf09020);
      g.fillRect(tp.x - 3, tp.y - 24, 6, 5);
      g.fillStyle(0xff6010);
      g.fillRect(tp.x - 1, tp.y - 28, 2, 4);

      // Warm glow on wall -- layered semi-transparent circles
      g.fillStyle(0xf09020, 0.04);
      g.fillCircle(tp.x, tp.y - 10, 120);
      g.fillStyle(0xf09020, 0.06);
      g.fillCircle(tp.x, tp.y - 10, 80);
      g.fillStyle(0xf09020, 0.08);
      g.fillCircle(tp.x, tp.y - 10, 50);
      g.fillStyle(0xf0a030, 0.10);
      g.fillCircle(tp.x, tp.y - 10, 30);
      g.fillStyle(0xf0c050, 0.06);
      g.fillCircle(tp.x, tp.y - 10, 16);
    }

    // ====================================================================
    // FLOOR AREA (y 380-600) -- cobblestone with perspective
    // ====================================================================

    // Floor base -- gradient darker at edges, lighter in center
    for (let y = 380; y < h; y += 2) {
      const t = (y - 380) / 220;
      const r = Math.floor(22 + t * 14);
      const gb = Math.floor(22 + t * 12);
      const b = Math.floor(32 + t * 16);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gb, b));
      g.fillRect(0, y, w, 2);
    }

    // Center torchlight pool on floor
    g.fillStyle(0xf09020, 0.03);
    g.fillCircle(400, 460, 200);
    g.fillStyle(0xf09020, 0.04);
    g.fillCircle(400, 460, 130);
    g.fillStyle(0xf0a030, 0.03);
    g.fillCircle(400, 460, 70);

    // Perspective floor grid -- lines converging toward vanishing point
    // Horizontal lines (get closer together near the horizon)
    for (let i = 0; i < 12; i++) {
      const t = i / 12;
      const y = 380 + Math.floor(t * t * 220); // quadratic spacing
      g.lineStyle(1, 0x2a2a3c);
      g.lineBetween(0, y, w, y);
    }

    // Vertical lines converging to vanishing point
    const floorVPY = 380;
    const numVLines = 14;
    for (let i = 0; i <= numVLines; i++) {
      const xBottom = (i / numVLines) * w;
      const xTop = 400 + (xBottom - 400) * 0.3; // converge toward center
      g.lineStyle(1, 0x2a2a3c);
      g.lineBetween(xTop, floorVPY, xBottom, h);
    }

    // Individual cobblestones -- scattered irregular rectangles
    const stones = [];
    // Generate pseudo-random stones in a grid pattern
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 14; col++) {
        const baseX = col * 58 + 10;
        const baseY = 390 + row * 28;
        // Pseudo-random offset using simple hash
        const hash = (row * 17 + col * 31) % 13;
        const ox = hash - 6;
        const oy = (hash * 3) % 7 - 3;
        const sw = 40 + (hash % 10);
        const sh = 18 + (hash % 6);
        stones.push({ x: baseX + ox, y: baseY + oy, w: sw, h: sh });
      }
    }

    for (const st of stones) {
      if (st.y < 380 || st.y + st.h > h) continue;
      // Stone fill -- slightly varied color
      const hash = (st.x * 7 + st.y * 13) % 11;
      const shade = 26 + hash;
      g.fillStyle(Phaser.Display.Color.GetColor(shade, shade, shade + 10));
      g.fillRect(st.x, st.y, st.w, st.h);
      // Stone top edge highlight
      g.fillStyle(0x303042, 0.5);
      g.fillRect(st.x, st.y, st.w, 1);
      // Stone bottom edge shadow
      g.fillStyle(0x0a0a12, 0.6);
      g.fillRect(st.x, st.y + st.h - 1, st.w, 1);
      // Left edge highlight
      g.fillStyle(0x2c2c3e, 0.4);
      g.fillRect(st.x, st.y, 1, st.h);
    }

    // Darken floor edges (left and right)
    g.fillStyle(0x0a0a18, 0.5);
    g.fillRect(0, 380, 80, 220);
    g.fillStyle(0x0a0a18, 0.3);
    g.fillRect(80, 380, 60, 220);
    g.fillStyle(0x0a0a18, 0.5);
    g.fillRect(720, 380, 80, 220);
    g.fillStyle(0x0a0a18, 0.3);
    g.fillRect(660, 380, 60, 220);

    // ====================================================================
    // ATMOSPHERIC EFFECTS
    // ====================================================================

    // Floor mist / fog -- semi-transparent gray rectangles layered
    const mistRects = [
      { x: 50,  y: 540, w: 200, h: 30 },
      { x: 300, y: 555, w: 250, h: 25 },
      { x: 550, y: 545, w: 180, h: 28 },
      { x: 100, y: 565, w: 300, h: 20 },
      { x: 420, y: 570, w: 280, h: 18 },
      { x: 0,   y: 560, w: 150, h: 22 },
      { x: 650, y: 558, w: 150, h: 24 },
      { x: 200, y: 530, w: 160, h: 15 },
      { x: 480, y: 535, w: 140, h: 14 },
    ];
    for (const mr of mistRects) {
      g.fillStyle(0x404860, 0.08);
      g.fillRect(mr.x, mr.y, mr.w, mr.h);
    }
    // Second pass -- slightly lighter mist near center
    g.fillStyle(0x505878, 0.06);
    g.fillRect(250, 550, 300, 30);
    g.fillStyle(0x484e68, 0.05);
    g.fillRect(200, 560, 400, 25);

    // ====================================================================
    // DARK VIGNETTE -- all edges
    // ====================================================================
    // Top vignette
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x000000, 0.15 - i * 0.02);
      g.fillRect(0, i * 12, w, 12);
    }
    // Bottom vignette
    for (let i = 0; i < 6; i++) {
      g.fillStyle(0x000000, 0.15 - i * 0.02);
      g.fillRect(0, h - (i + 1) * 12, w, 12);
    }
    // Left vignette
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.18 - i * 0.02);
      g.fillRect(i * 14, 0, 14, h);
    }
    // Right vignette
    for (let i = 0; i < 8; i++) {
      g.fillStyle(0x000000, 0.18 - i * 0.02);
      g.fillRect(w - (i + 1) * 14, 0, 14, h);
    }

    // Corner extra darkening
    g.fillStyle(0x000000, 0.12);
    g.fillRect(0, 0, 120, 80);
    g.fillRect(w - 120, 0, 120, 80);
    g.fillRect(0, h - 80, 120, 80);
    g.fillRect(w - 120, h - 80, 120, 80);

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
