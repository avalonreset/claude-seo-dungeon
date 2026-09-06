/**
 * Takes screenshots of the Summoning (walk cycle) scene for each character.
 * Usage: node scripts/screenshot-summoning.js
 * Outputs: screenshots/summoning-{warrior,samurai,knight}.png
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
const URL = 'http://localhost:5173/';

const CHARACTERS = ['warrior', 'samurai', 'knight'];

async function screenshotSummoning() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  for (const char of CHARACTERS) {
    console.log(`Testing ${char}...`);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Select the character
    await page.click(`.char-option[data-char="${char}"]`);
    await page.waitForTimeout(300);

    // Screenshot the title screen with this char selected
    const titlePath = path.join(SCREENSHOT_DIR, `title-${char}-selected.png`);
    await page.screenshot({ path: titlePath });
    console.log(`  Title: ${titlePath}`);

    // Click "Seal Your Fate" to enter the game
    await page.click('#descend-btn');

    // Wait for Phaser to boot and summoning scene to render
    await page.waitForTimeout(3000);

    // Screenshot the summoning/walk cycle scene
    const summonPath = path.join(SCREENSHOT_DIR, `summoning-${char}.png`);
    await page.screenshot({ path: summonPath });
    console.log(`  Summoning: ${summonPath}`);

    // Wait a bit more for a second frame (to see animation)
    await page.waitForTimeout(1500);
    const summonPath2 = path.join(SCREENSHOT_DIR, `summoning-${char}-frame2.png`);
    await page.screenshot({ path: summonPath2 });
    console.log(`  Frame 2: ${summonPath2}`);

    await browser.close();
  }

  console.log('Done - all characters screenshotted.');
}

screenshotSummoning().catch(err => {
  console.error(err);
  process.exit(1);
});
