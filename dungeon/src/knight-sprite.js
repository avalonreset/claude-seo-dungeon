/**
 * Character select sprites for the title screen.
 * Crops out transparent padding and displays characters at proper size.
 */

const CHARACTERS = {
  warrior: {
    name: 'warrior',
    idlePath: 'assets/luizmelo/warrior/sprites/Idle.png',
    runPath: 'assets/luizmelo/warrior/sprites/Run.png',
    attackPath: 'assets/luizmelo/warrior/sprites/Attack1.png',
    hitPath: 'assets/luizmelo/warrior/sprites/Take Hit.png',
    deathPath: 'assets/luizmelo/warrior/sprites/Death.png',
    frameW: 162, frameH: 162,
    idleFrames: 10, runFrames: 8, attackFrames: 7, hitFrames: 3, deathFrames: 7,
    // Crop rect: where the actual character pixels are within the frame
    cropX: 30, cropY: 55, cropW: 105, cropH: 105
  },
  samurai: {
    name: 'samurai',
    idlePath: 'assets/luizmelo/samurai/sprites/Idle.png',
    runPath: 'assets/luizmelo/samurai/sprites/Run.png',
    attackPath: 'assets/luizmelo/samurai/sprites/Attack1.png',
    hitPath: 'assets/luizmelo/samurai/sprites/Take Hit.png',
    deathPath: 'assets/luizmelo/samurai/sprites/Death.png',
    frameW: 200, frameH: 200,
    idleFrames: 8, runFrames: 8, attackFrames: 6, hitFrames: 4, deathFrames: 6,
    cropX: 48, cropY: 30, cropW: 100, cropH: 140
  },
  knight: {
    name: 'knight',
    idlePath: 'assets/luizmelo/warrior-pack-2/player1/Idle.png',
    runPath: 'assets/luizmelo/warrior-pack-2/player1/Run.png',
    attackPath: 'assets/luizmelo/warrior-pack-2/player1/Attack2.png',
    hitPath: 'assets/luizmelo/warrior-pack-2/player1/Take Hit.png',
    deathPath: 'assets/luizmelo/warrior-pack-2/player1/Death.png',
    frameW: 180, frameH: 180,
    idleFrames: 11, runFrames: 8, attackFrames: 7, hitFrames: 4, deathFrames: 11,
    cropX: 40, cropY: 20, cropW: 110, cropH: 140
  }
};

const DISPLAY_H = 280; // Fixed display height for all characters
const FPS = 8;

const animState = {};

function setSelected(charKey) {
  window.selectedCharacter = { ...CHARACTERS[charKey] };
  document.querySelectorAll('.char-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.char === charKey);
  });
}

function setupCharCanvas(charKey) {
  const char = CHARACTERS[charKey];
  const canvas = document.getElementById(`char-${charKey}`);
  if (!canvas) return;

  // Calculate display width to maintain aspect ratio
  const aspect = char.cropW / char.cropH;
  const displayW = Math.round(DISPLAY_H * aspect);

  canvas.width = displayW;
  canvas.height = DISPLAY_H;
  canvas.style.width = displayW + 'px';
  canvas.style.height = DISPLAY_H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const img = new Image();
  img.src = char.idlePath;

  animState[charKey] = { img, ctx, loaded: false, frame: 0, tick: 0, displayW };
  img.onload = () => { animState[charKey].loaded = true; };
}

function animateAll() {
  const interval = Math.round(60 / FPS);

  for (const charKey of Object.keys(CHARACTERS)) {
    const state = animState[charKey];
    if (!state || !state.loaded) continue;

    const char = CHARACTERS[charKey];
    state.tick++;

    if (state.tick % interval === 0) {
      state.frame = (state.frame + 1) % char.idleFrames;
    }

    state.ctx.clearRect(0, 0, state.displayW, DISPLAY_H);

    // Draw ONLY the cropped character area, scaled up to fill the canvas
    state.ctx.drawImage(
      state.img,
      state.frame * char.frameW + char.cropX, char.cropY, char.cropW, char.cropH,
      0, 0, state.displayW, DISPLAY_H
    );
  }

  requestAnimationFrame(animateAll);
}

export function initKnightSprite() {
  setSelected('warrior');

  for (const charKey of Object.keys(CHARACTERS)) {
    setupCharCanvas(charKey);
  }

  document.querySelectorAll('.char-option').forEach(el => {
    el.addEventListener('click', () => {
      setSelected(el.dataset.char);
    });
  });

  animateAll();
}
