import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Title screen — SNES-style with domain input.
 * "Enter thy domain, warrior."
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const cx = 400, cy = 300;

    // Dark background with subtle atmosphere
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Title
    this.add.text(cx, 100, 'CLAUDE SEO', {
      ...FONTS.title, fontSize: '48px'
    }).setOrigin(0.5);

    this.add.text(cx, 155, '⚔  D U N G E O N  ⚔', {
      ...FONTS.title, fontSize: '28px', color: COLORS.red
    }).setOrigin(0.5);

    // Knight sprite
    this.add.image(cx, 260, 'knight').setScale(2.5);

    // Subtitle
    this.add.text(cx, 350, 'Enter thy domain, warrior.', {
      ...FONTS.subtitle, color: COLORS.gold
    }).setOrigin(0.5);

    // Domain input (HTML overlay for real text input)
    this.domainValue = '';
    this.createDomainInput(cx, cy);

    // Blinking cursor effect on the prompt text
    this.promptText = this.add.text(cx, 480, '[ Press ENTER to descend ]', {
      ...FONTS.body, color: COLORS.gray
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Floating particles
    this.addAtmosphere();

    // Connection status
    this.statusText = this.add.text(cx, 570, 'Connecting to bridge...', {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    this.connectToBridge();
  }

  createDomainInput(cx, cy) {
    // Create an HTML input element overlaid on the canvas
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'domain-input';
    input.placeholder = 'example.com';
    input.autocomplete = 'off';
    input.spellcheck = false;
    Object.assign(input.style, {
      position: 'absolute',
      left: '50%',
      top: '68%',
      transform: 'translate(-50%, -50%)',
      width: '360px',
      padding: '12px 20px',
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#f0c040',
      backgroundColor: '#1a1a2e',
      border: '2px solid #4a4a6e',
      borderRadius: '0',
      textAlign: 'center',
      outline: 'none',
      zIndex: '10',
      letterSpacing: '2px',
      imageRendering: 'pixelated'
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        this.launchAudit(input.value.trim());
      }
    });

    input.addEventListener('focus', () => {
      input.style.borderColor = '#f0c040';
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#4a4a6e';
    });

    document.body.appendChild(input);
    this.domainInput = input;

    // Clean up on scene shutdown
    this.events.on('shutdown', () => {
      input.remove();
    });

    // Focus after a short delay
    this.time.delayedCall(500, () => input.focus());
  }

  async connectToBridge() {
    try {
      await bridge.connect();
      this.statusText.setText('⚔ Bridge connected — ready for battle');
      this.statusText.setColor(COLORS.green);
    } catch (err) {
      this.statusText.setText('Bridge offline — start server with: npm run server');
      this.statusText.setColor(COLORS.red);
      // Still allow demo mode
    }
  }

  launchAudit(domain) {
    // Remove input
    if (this.domainInput) this.domainInput.remove();

    // Store domain
    this.game.domain = domain;

    // Transition to summoning scene
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('Summoning', { domain });
    });
  }

  addAtmosphere() {
    // Floating dust particles
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, 800);
      const y = Phaser.Math.Between(0, 600);
      const dot = this.add.circle(x, y, 1, 0x4a4a6e, 0.5);
      this.tweens.add({
        targets: dot,
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }
}
