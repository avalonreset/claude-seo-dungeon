/**
 * Takes a screenshot of the character select screen for visual verification.
 * Usage: node scripts/screenshot-chars.js
 * Outputs: screenshots/char-select.png
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const URL = 'http://localhost:5173/';

async function takeScreenshot() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  await page.goto(URL, { waitUntil: 'networkidle' });

  // Wait for sprites to load and animate
  await page.waitForTimeout(1500);

  // Full page screenshot
  const fullPath = path.join(SCREENSHOT_DIR, 'char-select-full.png');
  await page.screenshot({ path: fullPath });
  console.log(`Full page: ${fullPath}`);

  // Cropped: just the character select area
  const charSelect = page.locator('#char-select');
  const charPath = path.join(SCREENSHOT_DIR, 'char-select-row.png');
  await charSelect.screenshot({ path: charPath });
  console.log(`Char row:  ${charPath}`);

  await browser.close();
  console.log('Done.');
}

takeScreenshot().catch(err => {
  console.error(err);
  process.exit(1);
});
