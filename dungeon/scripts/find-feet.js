/**
 * Uses Playwright to load each Run.png sprite sheet in a browser canvas
 * and find the actual foot position (lowest non-transparent row) per frame.
 */
const { chromium } = require('playwright');

const CHARACTERS = {
  warrior: { path: '/assets/luizmelo/warrior/sprites/Run.png', frameW: 162, frameH: 162, frames: 8 },
  samurai: { path: '/assets/luizmelo/samurai/sprites/Run.png', frameW: 200, frameH: 200, frames: 8 },
  knight:  { path: '/assets/luizmelo/warrior-pack-2/player1/Run.png', frameW: 180, frameH: 180, frames: 8 },
};

async function findFeet() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the app first so images are same-origin
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  for (const [name, cfg] of Object.entries(CHARACTERS)) {
    const result = await page.evaluate(async (c) => {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = c.path;
      });

      let maxFootY = 0;
      const perFrame = [];
      for (let f = 0; f < c.frames; f++) {
        const canvas = document.createElement('canvas');
        canvas.width = c.frameW;
        canvas.height = c.frameH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, f * c.frameW, 0, c.frameW, c.frameH, 0, 0, c.frameW, c.frameH);
        const data = ctx.getImageData(0, 0, c.frameW, c.frameH).data;

        let footY = 0;
        for (let y = c.frameH - 1; y >= 0; y--) {
          let hasPixel = false;
          for (let x = 0; x < c.frameW; x++) {
            if (data[(y * c.frameW + x) * 4 + 3] > 10) { hasPixel = true; break; }
          }
          if (hasPixel) { footY = y; break; }
        }
        perFrame.push(footY);
        if (footY > maxFootY) maxFootY = footY;
      }
      return { maxFootY, perFrame };
    }, cfg);

    console.log(`${name}: frameH=${cfg.frameH}, maxFootY=${result.maxFootY}, perFrame=[${result.perFrame.join(', ')}]`);
    console.log(`  -> originY for run = ${result.maxFootY / cfg.frameH}`);
    console.log(`  -> current groundY in config = ${name === 'warrior' ? 145 : name === 'samurai' ? 173 : 166}`);
  }

  await browser.close();
}

findFeet().catch(console.error);
