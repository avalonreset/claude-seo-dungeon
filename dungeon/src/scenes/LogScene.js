import { COLORS } from '../utils/colors.js';

/**
 * Persistent activity log — right 1/3 of the screen.
 * Always visible on top of all other scenes.
 */
export class LogScene extends Phaser.Scene {
  constructor() {
    super('Log');
    this.logLines = [];
    this.maxLines = 36;
    this.lineHeight = 17;
    this.panelX = 800;   // Left edge of log panel
    this.panelW = 400;   // Full right third
    this.startY = 48;
  }

  create() {
    // Solid panel background — distinct from game area
    this.add.rectangle(1000, 337, this.panelW, 675, 0x0e0e1a);

    // Subtle left border to separate from game
    this.add.rectangle(800, 337, 2, 675, 0x2a2a4e);

    // Header
    this.add.text(1000, 16, 'ACTIVITY LOG', {
      fontFamily: 'Consolas, monospace',
      fontSize: '13px',
      color: '#8080a0',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Separator
    this.add.rectangle(1000, 34, 360, 1, 0x2a2a4e);

    // Make this scene always on top
    this.scene.bringToTop();

    // Register global log function
    this.game.addLog = (msg) => this.addLog(msg);

    this.addLog('System initialized');
    this.addLog('Waiting for commands...');
  }

  addLog(msg) {
    if (!msg) return;

    let clean = msg.replace(/[\n\r]+/g, ' ').trim();
    if (clean.length === 0) return;

    // Filter out raw JSON
    if (clean.startsWith('{') || clean.startsWith('[') || clean.startsWith('"')) return;
    if (clean.includes('":"') && clean.includes('","')) return;
    if (clean === '[working...]') return;
    if (clean.length < 3) return;

    this._pushLine(clean);
  }

  _pushLine(text) {
    // Color based on content
    let color = '#a0b0a0';
    if (text.startsWith('ERROR')) {
      color = '#e05050';
    } else if (text.startsWith('[')) {
      color = '#5cb8c8';
    } else if (text.startsWith('Audit') || text.startsWith('Fix') || text.startsWith('Score')) {
      color = '#d0b040';
    } else if (text.startsWith('System') || text.startsWith('Waiting') || text.startsWith('Connected')) {
      color = '#606078';
    } else if (text.includes('Complete')) {
      color = '#50c050';
    }

    const y = this.startY + this.logLines.length * this.lineHeight;
    const textObj = this.add.text(this.panelX + 16, y, text, {
      fontFamily: 'Consolas, monospace',
      fontSize: '12px',
      color
    });

    this.logLines.push(textObj);

    if (this.logLines.length > this.maxLines) {
      const old = this.logLines.shift();
      old.destroy();
      this.logLines.forEach((t, i) => {
        t.y = this.startY + i * this.lineHeight;
      });
    }
  }
}
