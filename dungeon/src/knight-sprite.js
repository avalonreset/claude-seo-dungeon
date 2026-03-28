/**
 * Character select sprites for the title screen.
 * Loads idle sprite sheets for 3 characters, animates each on its own canvas,
 * and stores the selected character config on window.selectedCharacter.
 */

const CHARACTERS = {
  warrior: {
    name: 'warrior',
    idlePath: 'assets/luizmelo/warrior/sprites/Idle.png',
    runPath: 'assets/luizmelo/warrior/sprites/Run.png',
    attackPath: 'assets/luizmelo/warrior/sprites/Attack1.png',
    frameW: 162,
    frameH: 162,
    idleFrames: 10,
    runFrames: 8,
    attackFrames: 7
  },
  samurai: {
    name: 'samurai',
    idlePath: 'assets/luizmelo/samurai/sprites/Idle.png',
    runPath: 'assets/luizmelo/samurai/sprites/Run.png',
    attackPath: 'assets/luizmelo/samurai/sprites/Attack1.png',
    frameW: 200,
    frameH: 200,
    idleFrames: 8,
    runFrames: 8,
    attackFrames: 6
  },
  knight: {
    name: 'knight',
    idlePath: 'assets/luizmelo/warrior-pack-2/player1/Idle.png',
    runPath: 'assets/luizmelo/warrior-pack-2/player1/Run.png',
    attackPath: 'assets/luizmelo/warrior-pack-2/player1/Attack2.png',
    frameW: 180,
    frameH: 180,
    idleFrames: 11,
    runFrames: 8,
    attackFrames: 7
  }
};

const CANVAS_SIZE = 200;
const FPS = 8;

// Track animation state per character
const animState = {};

function setSelected(charKey) {
  window.selectedCharacter = { ...CHARACTERS[charKey] };

  // Update DOM classes
  document.querySelectorAll('.char-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.char === charKey);
  });
}

function setupCharCanvas(charKey) {
  const char = CHARACTERS[charKey];
  const canvas = document.getElementById(`char-${charKey}`);
  if (!canvas) return;

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const img = new Image();
  img.src = char.idlePath;

  animState[charKey] = { img, ctx, loaded: false, frame: 0, tick: 0 };

  img.onload = () => {
    animState[charKey].loaded = true;
  };
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

    state.ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    state.ctx.drawImage(
      state.img,
      state.frame * char.frameW, 0, char.frameW, char.frameH,
      0, 0, CANVAS_SIZE, CANVAS_SIZE
    );
  }

  requestAnimationFrame(animateAll);
}

export function initKnightSprite() {
  // Set default selection
  setSelected('warrior');

  // Setup each character canvas
  for (const charKey of Object.keys(CHARACTERS)) {
    setupCharCanvas(charKey);
  }

  // Click handlers for selection
  document.querySelectorAll('.char-option').forEach(el => {
    el.addEventListener('click', () => {
      setSelected(el.dataset.char);
    });
  });

  // Start animation loop
  animateAll();
}
