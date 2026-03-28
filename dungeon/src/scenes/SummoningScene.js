import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Summoning scene — knight descends into dungeon while audit runs.
 * Shows atmospheric loading with progress messages.
 * Transitions to DungeonHall once audit completes.
 */
export class SummoningScene extends Phaser.Scene {
  constructor() {
    super('Summoning');
  }

  init(data) {
    this.domain = data.domain;
    this.projectPath = data.projectPath;
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
      scaleX: 1.5, scaleY: 1.5, alpha: 0.05,
      duration: 2000, yoyo: true, repeat: -1
    });
    this.tweens.add({
      targets: glow,
      y: 350, duration: 8000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1
    });

    // Status message
    this.messageText = this.add.text(cx, 420, 'Summoning the audit spirits...', {
      ...FONTS.body, color: COLORS.cyan
    }).setOrigin(0.5);

    // Stream output area — shows what Claude is doing
    this.streamText = this.add.text(cx, 450, '', {
      ...FONTS.small, color: COLORS.purple, wordWrap: { width: 700 }
    }).setOrigin(0.5);

    // Demon counter — shows demons found so far
    this.demonCounter = this.add.text(cx, 480, '', {
      ...FONTS.body, color: COLORS.red
    }).setOrigin(0.5);

    // Log area
    this.logTexts = [];
    this.logY = 510;

    // Progress bar
    this.add.rectangle(cx, 560, 402, 14).setStrokeStyle(1, COLORS.hPurple).setOrigin(0.5);
    this.progressBar = this.add.rectangle(200, 560, 0, 10, COLORS.hPurple).setOrigin(0, 0.5);

    // Atmospheric messages
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

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        this.messageIndex = (this.messageIndex + 1) % this.flavorMessages.length;
        this.messageText.setText(this.flavorMessages[this.messageIndex]);
      },
      loop: true
    });

    // Floating embers
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const ember = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xf08020, 0.6);
      this.tweens.add({
        targets: ember,
        y: 620, x: x + Phaser.Math.Between(-50, 50), alpha: 0,
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1, delay: Phaser.Math.Between(0, 3000)
      });
    }

    // Track how many stream chunks we've received (to show activity)
    this.streamChunks = 0;

    // Start audit
    this.runAudit();
  }

  addLog(msg) {
    this.logTexts.forEach(t => t.y -= 18);
    if (this.logTexts.length > 2) {
      const old = this.logTexts.shift();
      old.destroy();
    }
    const text = this.add.text(300, this.logY, `> ${msg}`, {
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
      delay: 500,
      callback: () => {
        progress = Math.min(progress + 0.008, 0.9);
        this.setProgress(progress);
      },
      loop: true
    });

    try {
      const result = await bridge.audit(this.domain, this.projectPath, (streamData) => {
        this.streamChunks++;
        const clean = streamData.replace(/[\n\r]+/g, ' ').trim();
        if (clean.length > 0) {
          this.streamText.setText(clean.substring(0, 60));
          if (this.game.addLog) this.game.addLog(clean);
        }
        this.demonCounter.setText(`Claude is working... (${this.streamChunks} signals received)`);
      });

      progressTimer.remove();
      this.setProgress(1);

      const auditData = result.data || result;
      if (auditData && auditData.issues && auditData.issues.length > 0) {
        this.game.auditData = auditData;
        this.messageText.setText('The dungeon reveals itself...');
        this.messageText.setColor(COLORS.gold);
        this.streamText.setText('');
        this.demonCounter.setText(`${auditData.issues.length} demons detected! Score: ${auditData.score}/100`);
        this.demonCounter.setColor(COLORS.gold);

        // Dramatic pause before transition
        this.cameras.main.flash(300, 200, 50, 50);
        this.time.delayedCall(2000, () => {
          this.cameras.main.fadeOut(1000, 0, 0, 0);
          this.time.delayedCall(1000, () => {
            this.scene.start('DungeonHall');
          });
        });
      } else {
        this.addLog('Audit returned no issues — entering demo mode');
        await this.simulateAudit();
      }

    } catch (err) {
      progressTimer.remove();
      console.error('Audit error:', err);
      if (this.game.addLog) this.game.addLog('ERROR: ' + err.message);
      this.addLog('Bridge error — entering demo mode');
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

    this.messageText.setText('The dungeon reveals itself...');
    this.messageText.setColor(COLORS.gold);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.time.delayedCall(1000, () => {
        this.scene.start('DungeonHall');
      });
    });
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
