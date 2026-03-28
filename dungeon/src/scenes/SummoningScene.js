import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Summoning scene — knight descends into dungeon while audit runs.
 * Shows atmospheric loading with progress messages.
 */
export class SummoningScene extends Phaser.Scene {
  constructor() {
    super('Summoning');
  }

  init(data) {
    this.domain = data.domain;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const cx = 400;

    // Dungeon entrance (top)
    this.add.text(cx, 40, '⚔ DESCENDING INTO THE DUNGEON ⚔', {
      ...FONTS.subtitle, color: COLORS.red
    }).setOrigin(0.5);

    this.add.text(cx, 75, `Target: ${this.domain}`, {
      ...FONTS.body, color: COLORS.gold
    }).setOrigin(0.5);

    // Knight descending animation
    this.knight = this.add.image(cx, 150, 'knight').setScale(2);
    this.tweens.add({
      targets: this.knight,
      y: 350,
      duration: 8000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Breathing glow around knight
    const glow = this.add.circle(cx, 250, 50, 0x2040a0, 0.15);
    this.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.05,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });
    this.tweens.add({
      targets: glow,
      y: 350,
      duration: 8000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Progress messages
    this.messageText = this.add.text(cx, 440, 'Summoning the audit spirits...', {
      ...FONTS.body, color: COLORS.cyan
    }).setOrigin(0.5);

    // Log area
    this.logTexts = [];
    this.logY = 480;

    // Progress bar
    this.progressBg = this.add.rectangle(cx, 560, 400, 12, 0x1a1a2e).setOrigin(0.5);
    this.add.rectangle(cx, 560, 402, 14).setStrokeStyle(1, COLORS.hPurple).setOrigin(0.5);
    this.progressBar = this.add.rectangle(200, 560, 0, 10, COLORS.hPurple).setOrigin(0, 0.5);

    // Atmospheric messages that cycle during loading
    this.flavorMessages = [
      'Scanning the dark corridors...',
      'Detecting hostile entities...',
      'Mapping the dungeon layout...',
      'Analyzing threat levels...',
      'Identifying demon weaknesses...',
      'Forging battle strategy...',
      'The spirits speak of many foes...',
      'Preparing your arsenal...',
      'Darkness reveals its secrets...',
      'Almost there, brave knight...'
    ];
    this.messageIndex = 0;

    // Cycle flavor text
    this.time.addEvent({
      delay: 2500,
      callback: () => {
        this.messageIndex = (this.messageIndex + 1) % this.flavorMessages.length;
        this.messageText.setText(this.flavorMessages[this.messageIndex]);
      },
      loop: true
    });

    // Floating particles (embers falling)
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const ember = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xf08020, 0.6);
      this.tweens.add({
        targets: ember,
        y: 620,
        x: x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }

    // Start the actual audit
    this.runAudit();
  }

  addLog(msg) {
    // Shift existing logs up
    this.logTexts.forEach(t => t.y -= 18);
    // Remove old ones
    if (this.logTexts.length > 3) {
      const old = this.logTexts.shift();
      old.destroy();
    }
    const text = this.add.text(400, this.logY, `> ${msg}`, {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);
    this.logTexts.push(text);
  }

  setProgress(pct) {
    this.progressBar.width = 400 * Math.min(pct, 1);
  }

  async runAudit() {
    let progress = 0;
    const progressTimer = this.time.addEvent({
      delay: 300,
      callback: () => {
        progress = Math.min(progress + 0.02, 0.9);
        this.setProgress(progress);
      },
      loop: true
    });

    try {
      // Try real audit via bridge
      const result = await bridge.audit(this.domain, (streamData) => {
        // Clean up stream data for display
        const clean = streamData.replace(/[\n\r]+/g, ' ').trim();
        if (clean.length > 0) {
          this.addLog(clean.substring(0, 60));
        }
      });

      progressTimer.remove();
      this.setProgress(1);

      // result.data contains the audit object from the bridge
      const auditData = result.data || result;
      if (auditData && auditData.issues && auditData.issues.length > 0) {
        this.game.auditData = auditData;
        this.addLog(`Found ${auditData.issues.length} demons! Score: ${auditData.score}/100`);
        this.transitionToDungeon();
      } else {
        // Bridge returned but no valid data — fall back to demo
        this.addLog('Audit returned no issues — entering demo mode');
        await this.simulateAudit();
      }

    } catch (err) {
      // Demo mode — generate sample data
      progressTimer.remove();
      this.addLog('Bridge unavailable — entering demo mode');
      console.error('Audit error:', err);

      // Simulate audit progress
      await this.simulateAudit();
    }
  }

  async simulateAudit() {
    const demoIssues = [
      { id: 1, severity: 'critical', title: 'Missing SSL Certificate', description: 'Site not served over HTTPS', category: 'Security', hp: 100 },
      { id: 2, severity: 'critical', title: 'Blocked by robots.txt', description: 'Critical pages blocked from crawling', category: 'Crawlability', hp: 90 },
      { id: 3, severity: 'high', title: 'Missing Meta Descriptions', description: '12 pages missing meta descriptions', category: 'On-Page', hp: 70 },
      { id: 4, severity: 'high', title: 'Broken Internal Links', description: '8 broken links found across the site', category: 'Links', hp: 65 },
      { id: 5, severity: 'high', title: 'No Schema Markup', description: 'Missing structured data on all pages', category: 'Schema', hp: 60 },
      { id: 6, severity: 'medium', title: 'Slow Page Speed', description: 'LCP exceeds 4s on mobile', category: 'Performance', hp: 50 },
      { id: 7, severity: 'medium', title: 'Missing Alt Text', description: '23 images missing alt attributes', category: 'Accessibility', hp: 45 },
      { id: 8, severity: 'medium', title: 'Duplicate Title Tags', description: '5 pages share identical titles', category: 'On-Page', hp: 40 },
      { id: 9, severity: 'low', title: 'Missing Open Graph Tags', description: 'Social sharing metadata absent', category: 'Social', hp: 30 },
      { id: 10, severity: 'low', title: 'No XML Sitemap', description: 'Sitemap.xml not found', category: 'Crawlability', hp: 25 },
      { id: 11, severity: 'info', title: 'HTTP/2 Not Enabled', description: 'Server using HTTP/1.1', category: 'Performance', hp: 20 },
      { id: 12, severity: 'info', title: 'No Canonical Tags', description: 'Potential duplicate content issues', category: 'On-Page', hp: 20 }
    ];

    // Animate progress
    for (let i = 0; i <= 10; i++) {
      await this.delay(400);
      this.setProgress(i / 10);
      if (i % 2 === 0 && i < 10) {
        this.addLog(this.flavorMessages[Math.floor(i/2)]);
      }
    }

    this.game.auditData = {
      domain: this.domain,
      issues: demoIssues,
      score: 35,
      totalIssues: demoIssues.length
    };

    this.transitionToDungeon();
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  transitionToDungeon() {
    this.messageText.setText('The dungeon reveals itself...');
    this.messageText.setColor(COLORS.gold);

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.scene.start('DungeonHall');
      });
    });
  }
}
