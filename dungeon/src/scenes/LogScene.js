import { COLORS } from '../utils/colors.js';

/**
 * Persistent log overlay — always visible on top of all other scenes.
 * Shows real-time server/Claude activity.
 */
export class LogScene extends Phaser.Scene {
  constructor() {
    super('Log');
    this.logLines = [];
    this.maxLines = 44;
    this.lineHeight = 12;
    this.panelX = 600;
    this.panelW = 200;
    this.startY = 30;
  }

  create() {
    // Semi-transparent panel background
    this.panel = this.add.rectangle(
      this.panelX + this.panelW / 2, 300,
      this.panelW, 600, 0x0a0a12, 0.85
    );
    this.panel.setStrokeStyle(1, 0x2a2a4e);

    // Header
    this.add.text(this.panelX + this.panelW / 2, 14, 'SERVER LOG', {
      fontFamily: 'monospace', fontSize: '10px', color: COLORS.purple
    }).setOrigin(0.5);

    // Separator line
    this.add.rectangle(this.panelX + this.panelW / 2, 24, this.panelW - 10, 1, 0x2a2a4e);

    // Text objects pool
    this.textObjects = [];

    // Make this scene always on top
    this.scene.bringToTop();

    // Register global log function so other scenes and the bridge can use it
    this.game.addLog = (msg) => this.addLog(msg);

    // Initial log
    this.addLog('System initialized');
    this.addLog('Waiting for commands...');
  }

  addLog(msg) {
    if (!msg) return;
    const clean = msg.replace(/[\n\r]+/g, ' ').trim();
    if (clean.length === 0) return;

    // Split long messages into multiple lines
    const maxChars = 24;
    const chunks = [];
    for (let i = 0; i < clean.length; i += maxChars) {
      chunks.push(clean.substring(i, i + maxChars));
    }

    for (const chunk of chunks) {
      this._pushLine(chunk);
    }
  }

  _pushLine(text) {
    // Color based on content
    let color = '#50c050'; // default green
    if (text.startsWith('ERROR') || text.startsWith('[error')) {
      color = '#e04040';
    } else if (text.startsWith('[')) {
      color = '#40c0c0'; // cyan for tool calls
    } else if (text.startsWith('Audit') || text.startsWith('Fix') || text.startsWith('Commit')) {
      color = '#f0c040'; // gold for status
    } else if (text.startsWith('System') || text.startsWith('Waiting') || text.startsWith('Bridge') || text.startsWith('Connected')) {
      color = '#808090'; // gray for system
    }

    // Create text object
    const y = this.startY + this.logLines.length * this.lineHeight;
    const textObj = this.add.text(this.panelX + 5, y, text, {
      fontFamily: 'monospace', fontSize: '9px', color
    });

    this.logLines.push(textObj);

    // If we've exceeded max lines, remove oldest and reposition
    if (this.logLines.length > this.maxLines) {
      const old = this.logLines.shift();
      old.destroy();

      this.logLines.forEach((t, i) => {
        t.y = this.startY + i * this.lineHeight;
      });
    }
  }
}
