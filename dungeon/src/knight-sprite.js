/**
 * Animated pixel art knight for the title screen.
 * Drawn on a canvas element with idle animation:
 * - Breathing (body rise/fall)
 * - Visor glow pulse
 * - Cape sway
 * - Floating particles
 */

const SCALE = 5;
const W = 20;
const H = 26;

// Color palette
const C = {
  // Armor
  steel:     '#606878',
  steelHi:   '#8890a0',
  steelDk:   '#404858',
  steelDk2:  '#303848',

  // Helmet
  helmet:    '#505868',
  helmetHi:  '#687080',

  // Visor glow
  visor:     '#30e8f0',
  visorDim:  '#20a0b0',

  // Plume
  plume:     '#c03030',
  plumeDk:   '#901818',

  // Cape
  cape:      '#1838a0',
  capeLt:    '#2850c0',

  // Gold accents
  gold:      '#d4af37',
  goldLt:    '#e8c850',

  // Boots/grip
  leather:   '#403838',
  leatherDk: '#302828',

  // Sword
  blade:     '#c0c8d0',
  bladeHi:   '#e8f0f8',

  // Shield
  shieldBg:  '#2848a0',
  shieldBdr: '#d4af37',

  // Legs
  legArmor:  '#505060',
};

function drawPixel(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
}

function drawKnight(ctx, frame) {
  const breathOffset = Math.sin(frame * 0.05) * 0.6;
  const visorGlow = 0.7 + Math.sin(frame * 0.08) * 0.3;
  const capeFrame = Math.sin(frame * 0.04);

  ctx.clearRect(0, 0, W * SCALE, (H + 4) * SCALE);

  const by = breathOffset;

  // ── Plume ──
  const plumeData = [
    [8, -1 + by, C.plume], [9, -1 + by, C.plume],
    [8, 0 + by, C.plume], [9, 0 + by, C.plumeDk],
    [10, 0 + by, C.plume],
    [8, 1 + by, C.plumeDk],
  ];
  plumeData.forEach(([x, y, c]) => drawPixel(ctx, x, Math.round(y), c));

  // ── Helmet ──
  for (let x = 6; x <= 13; x++) {
    for (let y = 2; y <= 5; y++) {
      const yy = Math.round(y + by);
      if (x === 6 || x === 13 || y === 2) {
        drawPixel(ctx, x, yy, C.helmetHi);
      } else {
        drawPixel(ctx, x, yy, C.helmet);
      }
    }
  }

  // ── Visor ──
  const visorColor = visorGlow > 0.85 ? C.visor : C.visorDim;
  for (let x = 7; x <= 12; x++) {
    drawPixel(ctx, x, Math.round(4 + by), visorColor);
  }
  // Visor glow effect
  if (visorGlow > 0.85) {
    ctx.fillStyle = `rgba(48, 232, 240, ${visorGlow * 0.15})`;
    ctx.fillRect(7 * SCALE - 2, Math.round(4 + by) * SCALE - 2, 6 * SCALE + 4, SCALE + 4);
  }

  // ── Shoulder pauldrons ──
  for (let x = 4; x <= 6; x++) {
    drawPixel(ctx, x, Math.round(6 + by), C.steelHi);
    drawPixel(ctx, x, Math.round(7 + by), C.steel);
  }
  for (let x = 13; x <= 15; x++) {
    drawPixel(ctx, x, Math.round(6 + by), C.steelHi);
    drawPixel(ctx, x, Math.round(7 + by), C.steel);
  }

  // ── Chest plate ──
  for (let x = 6; x <= 13; x++) {
    for (let y = 6; y <= 13; y++) {
      const yy = Math.round(y + by);
      if (y === 6) {
        drawPixel(ctx, x, yy, C.steelHi);
      } else if (x === 6 || x === 13) {
        drawPixel(ctx, x, yy, C.steelDk);
      } else if (x >= 8 && x <= 11 && y >= 8 && y <= 10) {
        drawPixel(ctx, x, yy, C.steelHi);
      } else {
        drawPixel(ctx, x, yy, C.steel);
      }
    }
  }

  // ── Gold belt ──
  for (let x = 6; x <= 13; x++) {
    drawPixel(ctx, x, Math.round(13 + by), C.gold);
  }
  drawPixel(ctx, 9, Math.round(13 + by), C.goldLt);
  drawPixel(ctx, 10, Math.round(13 + by), C.goldLt);

  // ── Cape (left side, behind body) ──
  const capeOff = Math.round(capeFrame * 0.8);
  for (let y = 7; y <= 18; y++) {
    const cx = 4 + (y > 14 ? capeOff : 0);
    drawPixel(ctx, cx, Math.round(y + by), y % 3 === 0 ? C.capeLt : C.cape);
    if (y > 10) {
      drawPixel(ctx, cx - 1, Math.round(y + by), C.cape);
    }
  }

  // ── Arms ──
  // Left arm (holds shield)
  for (let y = 8; y <= 12; y++) {
    drawPixel(ctx, 4, Math.round(y + by), C.steel);
    drawPixel(ctx, 3, Math.round(y + by), C.steelDk);
  }
  // Left gauntlet
  drawPixel(ctx, 3, Math.round(13 + by), C.steelHi);
  drawPixel(ctx, 4, Math.round(13 + by), C.steelHi);

  // Right arm (holds sword)
  for (let y = 8; y <= 12; y++) {
    drawPixel(ctx, 15, Math.round(y + by), C.steel);
    drawPixel(ctx, 16, Math.round(y + by), C.steelDk);
  }
  // Right gauntlet
  drawPixel(ctx, 15, Math.round(13 + by), C.steelHi);
  drawPixel(ctx, 16, Math.round(13 + by), C.steelHi);

  // ── Shield (left hand) ──
  for (let y = 10; y <= 16; y++) {
    for (let x = 1; x <= 4; x++) {
      const yy = Math.round(y + by);
      if (x === 1 || x === 4 || y === 10 || y === 16) {
        drawPixel(ctx, x, yy, C.shieldBdr);
      } else {
        drawPixel(ctx, x, yy, C.shieldBg);
      }
    }
  }
  // Shield cross emblem
  drawPixel(ctx, 2, Math.round(12 + by), '#e0e0e0');
  drawPixel(ctx, 3, Math.round(12 + by), '#e0e0e0');
  drawPixel(ctx, 2, Math.round(13 + by), '#e0e0e0');
  drawPixel(ctx, 3, Math.round(13 + by), '#e0e0e0');

  // ── Sword (right hand) ──
  const swordBob = Math.sin(frame * 0.06) * 0.5;
  // Blade
  for (let y = 3; y <= 12; y++) {
    drawPixel(ctx, 17, Math.round(y + by + swordBob), y % 2 === 0 ? C.bladeHi : C.blade);
  }
  // Guard
  drawPixel(ctx, 16, Math.round(13 + by + swordBob), C.gold);
  drawPixel(ctx, 17, Math.round(13 + by + swordBob), C.gold);
  drawPixel(ctx, 18, Math.round(13 + by + swordBob), C.gold);
  // Grip
  drawPixel(ctx, 17, Math.round(14 + by + swordBob), C.leather);
  drawPixel(ctx, 17, Math.round(15 + by + swordBob), C.leather);
  // Pommel
  drawPixel(ctx, 17, Math.round(16 + by + swordBob), C.gold);

  // ── Legs ──
  for (let y = 14; y <= 19; y++) {
    drawPixel(ctx, 7, Math.round(y), C.legArmor);
    drawPixel(ctx, 8, Math.round(y), C.legArmor);
    drawPixel(ctx, 11, Math.round(y), C.legArmor);
    drawPixel(ctx, 12, Math.round(y), C.legArmor);
  }

  // ── Boots ──
  for (let x = 6; x <= 9; x++) {
    drawPixel(ctx, x, 20, C.leather);
    drawPixel(ctx, x, 21, C.leatherDk);
  }
  for (let x = 10; x <= 13; x++) {
    drawPixel(ctx, x, 20, C.leather);
    drawPixel(ctx, x, 21, C.leatherDk);
  }
}

// ── Floating particles around the knight ──
const particles = [];
for (let i = 0; i < 8; i++) {
  particles.push({
    x: Math.random() * W * SCALE,
    y: Math.random() * H * SCALE,
    speed: 0.2 + Math.random() * 0.4,
    alpha: Math.random(),
    size: 1 + Math.random()
  });
}

function drawParticles(ctx, frame) {
  particles.forEach(p => {
    p.y -= p.speed;
    p.alpha = 0.3 + Math.sin(frame * 0.05 + p.x) * 0.3;
    if (p.y < 0) {
      p.y = H * SCALE;
      p.x = Math.random() * W * SCALE;
    }
    ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Init ──
export function initKnightSprite() {
  const container = document.getElementById('knight-canvas');
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = (H + 4) * SCALE;
  canvas.style.imageRendering = 'pixelated';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let frame = 0;

  function animate() {
    drawKnight(ctx, frame);
    drawParticles(ctx, frame);
    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}
