/**
 * Animated warrior sprite for the title screen.
 * Uses the luizmelo warrior idle sprite sheet (10 frames, 162x162 each).
 */

const FRAME_COUNT = 10;
const FRAME_W = 162;
const FRAME_H = 162;
const DISPLAY_SCALE = 1.8;
const FPS = 8;

let spriteSheet = null;
let loaded = false;

export function initKnightSprite() {
  const container = document.getElementById('knight-canvas');
  if (!container) return;

  // Make container bigger for the new sprite
  container.style.width = `${FRAME_W * DISPLAY_SCALE}px`;
  container.style.height = `${FRAME_H * DISPLAY_SCALE}px`;

  const canvas = document.createElement('canvas');
  canvas.width = FRAME_W * DISPLAY_SCALE;
  canvas.height = FRAME_H * DISPLAY_SCALE;
  canvas.style.imageRendering = 'pixelated';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Load the sprite sheet
  spriteSheet = new Image();
  spriteSheet.src = 'assets/luizmelo/warrior/sprites/Idle.png';
  spriteSheet.onload = () => {
    loaded = true;
  };

  let frame = 0;
  let tick = 0;

  function animate() {
    tick++;

    if (loaded) {
      // Advance frame at the desired FPS
      if (tick % Math.round(60 / FPS) === 0) {
        frame = (frame + 1) % FRAME_COUNT;
      }

      // Clear and draw current frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        spriteSheet,
        frame * FRAME_W, 0, FRAME_W, FRAME_H,  // source
        0, 0, FRAME_W * DISPLAY_SCALE, FRAME_H * DISPLAY_SCALE  // dest
      );
    }

    requestAnimationFrame(animate);
  }

  animate();
}
