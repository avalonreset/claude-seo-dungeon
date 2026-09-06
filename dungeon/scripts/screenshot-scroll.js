/**
 * Screenshot the abandon scroll rune in both normal and hover states.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const URL = 'http://localhost:5173/';

async function screenshotScroll() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click "Seal Your Fate" to enter the game
  await page.click('#descend-btn');
  await page.waitForTimeout(3000);

  // Screenshot normal state
  const normalPath = path.join(SCREENSHOT_DIR, 'scroll-normal.png');
  await page.screenshot({ path: normalPath });
  console.log(`Normal: ${normalPath}`);

  // The rune is at game coordinates (750, 30) inside the Phaser canvas.
  // The canvas is scaled to fit, so we need to find the actual screen position.
  // The game is 800x600 inside a Phaser.Scale.FIT container.
  const canvas = page.locator('#game-container canvas');
  const box = await canvas.boundingBox();

  if (box) {
    // Game is 800x600, canvas is scaled to fit
    const scaleX = box.width / 800;
    const scaleY = box.height / 600;
    const runeScreenX = box.x + 750 * scaleX;
    const runeScreenY = box.y + 30 * scaleY;

    console.log(`Canvas: ${box.x},${box.y} ${box.width}x${box.height}`);
    console.log(`Rune screen pos: ${runeScreenX}, ${runeScreenY}`);

    // Hover over the rune
    await page.mouse.move(runeScreenX, runeScreenY);
    await page.waitForTimeout(500);

    const hoverPath = path.join(SCREENSHOT_DIR, 'scroll-hover.png');
    await page.screenshot({ path: hoverPath });
    console.log(`Hover: ${hoverPath}`);
  }

  await browser.close();
  console.log('Done.');
}

screenshotScroll().catch(console.error);
