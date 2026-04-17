// particles.js - Shared particle effects for the dungeon RPG
// Uses basic Phaser shapes (circles, rectangles) + tweens. No particle emitters.

/**
 * Ember particles rising from the bottom of the screen.
 * Warm orange/red circles that drift upward and fade out, looping forever.
 */
export function createEmbers(scene, count = 30, bounds = { x: 0, w: 800, y: 400, h: 200 }) {
  const embers = [];

  for (let i = 0; i < count; i++) {
    const size = Phaser.Math.Between(2, 5);
    const color = Phaser.Utils.Array.GetRandom([0xff6600, 0xff4400, 0xff8800, 0xffaa00, 0xcc3300]);
    const startX = bounds.x + Math.random() * bounds.w;
    const startY = bounds.y + Math.random() * bounds.h;

    const ember = scene.add.circle(startX, startY, size, color);
    ember.setAlpha(0);
    ember.setDepth(10);
    embers.push(ember);

    const delay = Math.random() * 4000;

    function animateEmber() {
      const x = bounds.x + Math.random() * bounds.w;
      const y = bounds.y + Math.random() * bounds.h;
      ember.setPosition(x, y);
      ember.setAlpha(0);
      ember.setScale(Phaser.Math.FloatBetween(0.5, 1.2));

      scene.tweens.add({
        targets: ember,
        y: y - Phaser.Math.Between(150, 350),
        x: x + Phaser.Math.FloatBetween(-40, 40),
        alpha: { from: 0, to: Phaser.Math.FloatBetween(0.4, 0.9) },
        scale: 0,
        duration: Phaser.Math.Between(2000, 4500),
        ease: 'Sine.easeOut',
        onComplete: () => {
          if (!ember.scene) return;
          animateEmber();
        }
      });
    }

    scene.time.delayedCall(delay, animateEmber);
  }

  return function cleanup() {
    embers.forEach(e => {
      if (e.scene) e.destroy();
    });
    embers.length = 0;
  };
}

/**
 * Dust motes floating gently in the air.
 * Tiny pale circles with slow drifting motion.
 */
export function createDustMotes(scene, count = 15, bounds = { x: 0, w: 800, y: 0, h: 600 }) {
  const motes = [];

  for (let i = 0; i < count; i++) {
    const size = Phaser.Math.FloatBetween(1, 3);
    const color = Phaser.Utils.Array.GetRandom([0xccccaa, 0xbbbb99, 0xddddbb, 0xaaaabb]);
    const x = bounds.x + Math.random() * bounds.w;
    const y = bounds.y + Math.random() * bounds.h;

    const mote = scene.add.circle(x, y, size, color);
    mote.setAlpha(Phaser.Math.FloatBetween(0.1, 0.35));
    mote.setDepth(5);
    motes.push(mote);

    function animateMote() {
      if (!mote.scene) return;

      const targetX = mote.x + Phaser.Math.FloatBetween(-60, 60);
      const targetY = mote.y + Phaser.Math.FloatBetween(-40, 40);

      // Wrap around bounds
      const clampedX = Phaser.Math.Wrap(targetX, bounds.x, bounds.x + bounds.w);
      const clampedY = Phaser.Math.Wrap(targetY, bounds.y, bounds.y + bounds.h);

      scene.tweens.add({
        targets: mote,
        x: clampedX,
        y: clampedY,
        alpha: Phaser.Math.FloatBetween(0.08, 0.4),
        duration: Phaser.Math.Between(3000, 7000),
        ease: 'Sine.easeInOut',
        onComplete: animateMote
      });
    }

    scene.time.delayedCall(Math.random() * 3000, animateMote);
  }

  return function cleanup() {
    motes.forEach(m => {
      if (m.scene) m.destroy();
    });
    motes.length = 0;
  };
}

/**
 * Torch flame effect at a specific position.
 * A cluster of overlapping circles that flicker in size, position, and opacity.
 */
export function createTorchFlame(scene, x, y, scale = 1) {
  const container = scene.add.container(x, y);
  container.setDepth(15);

  const flames = [];
  const flameConfigs = [
    { ox: 0, oy: 0, r: 8, color: 0xffcc00 },   // bright core
    { ox: 0, oy: -4, r: 6, color: 0xff8800 },   // mid
    { ox: -2, oy: -8, r: 5, color: 0xff6600 },  // upper left
    { ox: 2, oy: -8, r: 5, color: 0xff6600 },   // upper right
    { ox: 0, oy: -12, r: 4, color: 0xff4400 },  // tip
    { ox: 0, oy: -16, r: 3, color: 0xff3300 },  // wisp
  ];

  flameConfigs.forEach((cfg) => {
    const flame = scene.add.circle(cfg.ox * scale, cfg.oy * scale, cfg.r * scale, cfg.color);
    flame.setAlpha(0.7);
    container.add(flame);
    flames.push(flame);

    function flicker() {
      if (!flame.scene) return;
      scene.tweens.add({
        targets: flame,
        x: (cfg.ox + Phaser.Math.FloatBetween(-2, 2)) * scale,
        y: (cfg.oy + Phaser.Math.FloatBetween(-3, 1)) * scale,
        scaleX: Phaser.Math.FloatBetween(0.7, 1.3),
        scaleY: Phaser.Math.FloatBetween(0.8, 1.4),
        alpha: Phaser.Math.FloatBetween(0.4, 0.9),
        duration: Phaser.Math.Between(80, 200),
        ease: 'Sine.easeInOut',
        onComplete: flicker
      });
    }

    flicker();
  });

  return container;
}

/**
 * Warm torch glow - a soft radial light pool behind the flame.
 * Uses a large, low-alpha circle with a gentle pulsing tween.
 */
export function createTorchGlow(scene, x, y, radius = 80) {
  const glow = scene.add.circle(x, y, radius, 0xff9933);
  glow.setAlpha(0.12);
  glow.setDepth(2);
  glow.setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: glow,
    alpha: { from: 0.08, to: 0.18 },
    scaleX: { from: 0.95, to: 1.05 },
    scaleY: { from: 0.95, to: 1.05 },
    duration: 1200,
    ease: 'Sine.easeInOut',
    yoyo: true,
    loop: -1
  });

  return glow;
}

/**
 * Sparkle burst at a position - gold sparkles that radiate outward and fade.
 * Great for reveals, item pickups, transitions.
 */
export function createSparkleBurst(scene, x, y, count = 12, color = 0xd4af37) {
  const sparkles = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.2, 0.2);
    const distance = Phaser.Math.Between(40, 100);
    const size = Phaser.Math.Between(2, 5);

    const sparkle = scene.add.circle(x, y, size, color);
    sparkle.setAlpha(1);
    sparkle.setDepth(20);
    sparkles.push(sparkle);

    scene.tweens.add({
      targets: sparkle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0,
      duration: Phaser.Math.Between(400, 800),
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (sparkle.scene) sparkle.destroy();
      }
    });
  }

  return function cleanup() {
    sparkles.forEach(s => {
      if (s.scene) s.destroy();
    });
    sparkles.length = 0;
  };
}

/**
 * Full-screen vignette overlay - darkened edges that frame the viewport.
 * Built from four gradient-ish rectangles along each edge.
 */
export function createVignette(scene, width = 800, height = 600) {
  const container = scene.add.container(0, 0);
  container.setDepth(100);

  const edgeSize = Math.max(width, height) * 0.25;

  // Top edge
  const top = scene.add.rectangle(width / 2, edgeSize / 2, width, edgeSize, 0x000000);
  top.setAlpha(0.6);
  top.setOrigin(0.5, 0.5);

  // Bottom edge
  const bottom = scene.add.rectangle(width / 2, height - edgeSize / 2, width, edgeSize, 0x000000);
  bottom.setAlpha(0.6);
  bottom.setOrigin(0.5, 0.5);

  // Left edge
  const left = scene.add.rectangle(edgeSize / 2, height / 2, edgeSize, height, 0x000000);
  left.setAlpha(0.5);
  left.setOrigin(0.5, 0.5);

  // Right edge
  const right = scene.add.rectangle(width - edgeSize / 2, height / 2, edgeSize, height, 0x000000);
  right.setAlpha(0.5);
  right.setOrigin(0.5, 0.5);

  // Corner overlays for extra darkness in corners
  const cornerSize = edgeSize * 0.7;
  const corners = [
    { x: cornerSize / 2, y: cornerSize / 2 },
    { x: width - cornerSize / 2, y: cornerSize / 2 },
    { x: cornerSize / 2, y: height - cornerSize / 2 },
    { x: width - cornerSize / 2, y: height - cornerSize / 2 },
  ];

  const cornerRects = corners.map(pos => {
    const corner = scene.add.rectangle(pos.x, pos.y, cornerSize, cornerSize, 0x000000);
    corner.setAlpha(0.35);
    return corner;
  });

  container.add([top, bottom, left, right, ...cornerRects]);

  return container;
}

/**
 * Damage burst - red/orange particles that explode outward from a hit point.
 * Each particle is a small rectangle that spins and fades.
 */
export function createDamageBurst(scene, x, y, count = 16, color = 0xff3030) {
  const particles = [];
  const secondaryColor = 0xff6600;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Phaser.Math.FloatBetween(-0.3, 0.3);
    const distance = Phaser.Math.Between(30, 90);
    const size = Phaser.Math.Between(2, 6);
    const useSecondary = Math.random() > 0.6;
    const c = useSecondary ? secondaryColor : color;

    const particle = scene.add.rectangle(x, y, size, size, c);
    particle.setAlpha(0.9);
    particle.setDepth(25);
    particle.setRotation(Math.random() * Math.PI);
    particles.push(particle);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance + Phaser.Math.Between(10, 30), // slight gravity
      alpha: 0,
      scale: Phaser.Math.FloatBetween(0.2, 0.5),
      rotation: particle.rotation + Phaser.Math.FloatBetween(-3, 3),
      duration: Phaser.Math.Between(300, 700),
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (particle.scene) particle.destroy();
      }
    });
  }

  return function cleanup() {
    particles.forEach(p => {
      if (p.scene) p.destroy();
    });
    particles.length = 0;
  };
}

/**
 * Victory confetti - colorful rectangles that rain down from the top.
 * A celebratory shower of spinning, tumbling shapes.
 */
export function createConfetti(scene, count = 50) {
  const confettiPieces = [];
  const colors = [0xd4af37, 0xff4444, 0x44bbff, 0x44ff88, 0xff88ff, 0xffaa00, 0xffffff];

  for (let i = 0; i < count; i++) {
    const w = Phaser.Math.Between(4, 10);
    const h = Phaser.Math.Between(2, 6);
    const color = Phaser.Utils.Array.GetRandom(colors);
    const startX = Phaser.Math.Between(0, 800);
    const startY = Phaser.Math.Between(-100, -20);

    const piece = scene.add.rectangle(startX, startY, w, h, color);
    piece.setAlpha(0.9);
    piece.setDepth(30);
    piece.setRotation(Math.random() * Math.PI * 2);
    confettiPieces.push(piece);

    const delay = Math.random() * 1500;
    const drift = Phaser.Math.FloatBetween(-80, 80);
    const fallDistance = Phaser.Math.Between(600, 800);

    scene.time.delayedCall(delay, () => {
      if (!piece.scene) return;

      scene.tweens.add({
        targets: piece,
        y: startY + fallDistance,
        x: startX + drift,
        rotation: piece.rotation + Phaser.Math.FloatBetween(-8, 8),
        alpha: { from: 0.9, to: 0 },
        scaleX: { from: 1, to: Phaser.Math.FloatBetween(0.3, 0.8) },
        duration: Phaser.Math.Between(2000, 4000),
        ease: 'Sine.easeIn',
        onComplete: () => {
          if (piece.scene) piece.destroy();
        }
      });
    });
  }

  return function cleanup() {
    confettiPieces.forEach(p => {
      if (p.scene) p.destroy();
    });
    confettiPieces.length = 0;
  };
}
