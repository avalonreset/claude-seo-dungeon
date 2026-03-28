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
    cropX: 42, cropY: 20, cropW: 80, cropH: 130,
    groundY: 145  // Y in sprite where feet touch ground
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
    cropX: 48, cropY: 30, cropW: 100, cropH: 140,
    groundY: 173  // Y in sprite where feet touch ground
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
    cropX: 40, cropY: 20, cropW: 110, cropH: 140,
    groundY: 166  // Y in sprite where feet touch ground
  }
};

// All canvases share the same fixed size so feet align on the same ground plane
const CANVAS_W = 200;
const CANVAS_H = 280;
const GROUND_LINE = 278; // Y pixel in canvas where all feet land
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

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  canvas.style.width = CANVAS_W + 'px';
  canvas.style.height = CANVAS_H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const img = new Image();
  img.src = char.idlePath;

  // Calculate scale: fit character so top doesn't clip above canvas
  const feetOffsetInCrop = char.groundY - char.cropY;
  const maxScale = GROUND_LINE / feetOffsetInCrop;
  const scale = Math.min(maxScale, 2.2); // cap at 2.2x

  const drawW = Math.round(char.cropW * scale);
  const drawH = Math.round(char.cropH * scale);
  const feetOffsetScaled = Math.round(feetOffsetInCrop * scale);
  const drawY = GROUND_LINE - feetOffsetScaled;
  const drawX = Math.round((CANVAS_W - drawW) / 2);

  animState[charKey] = { img, ctx, loaded: false, frame: 0, tick: 0, drawX, drawY, drawW, drawH };
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

    state.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw cropped sprite, bottom-aligned to ground line
    state.ctx.drawImage(
      state.img,
      state.frame * char.frameW + char.cropX, char.cropY, char.cropW, char.cropH,
      state.drawX, state.drawY, state.drawW, state.drawH
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
