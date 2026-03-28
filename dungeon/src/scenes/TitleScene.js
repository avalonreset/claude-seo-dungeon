import { COLORS, FONTS } from '../utils/colors.js';
import { bridge } from '../utils/ws.js';

/**
 * Title screen — SNES-style with domain + project path inputs.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const cx = 400;

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Title
    this.add.text(cx, 80, 'CLAUDE SEO', {
      ...FONTS.title, fontSize: '48px'
    }).setOrigin(0.5);

    this.add.text(cx, 130, '⚔  D U N G E O N  ⚔', {
      ...FONTS.title, fontSize: '28px', color: COLORS.red
    }).setOrigin(0.5);

    // Knight sprite
    this.add.image(cx, 220, 'knight').setScale(2);

    // Domain label + input
    this.add.text(cx, 300, 'Domain to audit:', {
      ...FONTS.body, color: COLORS.gold
    }).setOrigin(0.5);

    // Project path label + input
    this.add.text(cx, 390, 'Project source folder:', {
      ...FONTS.body, color: COLORS.cyan
    }).setOrigin(0.5);

    // Safety note
    this.add.text(cx, 475, 'Fixes are applied on a new git branch — your main branch is never touched.', {
      ...FONTS.small, color: COLORS.gray, wordWrap: { width: 500 }
    }).setOrigin(0.5);

    // Create HTML inputs
    this.htmlElements = [];
    this.createInputs();

    // Floating particles
    this.addAtmosphere();

    // Connection status
    this.statusText = this.add.text(cx, 570, 'Connecting to bridge...', {
      ...FONTS.small, color: COLORS.gray
    }).setOrigin(0.5);

    this.connectToBridge();
  }

  createInputs() {
    const inputStyle = {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '400px',
      padding: '10px 16px',
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#f0c040',
      backgroundColor: '#1a1a2e',
      border: '2px solid #4a4a6e',
      borderRadius: '0',
      textAlign: 'center',
      outline: 'none',
      zIndex: '10',
      letterSpacing: '1px'
    };

    // Domain input
    const domainInput = document.createElement('input');
    domainInput.type = 'text';
    domainInput.id = 'domain-input';
    domainInput.value = 'claude-github.com';
    domainInput.placeholder = 'example.com';
    domainInput.autocomplete = 'off';
    domainInput.spellcheck = false;
    Object.assign(domainInput.style, { ...inputStyle, top: '53%' });
    domainInput.addEventListener('focus', () => domainInput.style.borderColor = '#f0c040');
    domainInput.addEventListener('blur', () => domainInput.style.borderColor = '#4a4a6e');
    document.body.appendChild(domainInput);
    this.domainInput = domainInput;
    this.htmlElements.push(domainInput);

    // Project path input
    const pathInput = document.createElement('input');
    pathInput.type = 'text';
    pathInput.id = 'path-input';
    pathInput.value = 'E:\\claude-github-website';
    pathInput.placeholder = 'C:\\path\\to\\your\\project';
    pathInput.autocomplete = 'off';
    pathInput.spellcheck = false;
    Object.assign(pathInput.style, {
      ...inputStyle,
      top: '68%',
      color: '#40c0c0',
      fontSize: '14px'
    });
    pathInput.addEventListener('focus', () => pathInput.style.borderColor = '#40c0c0');
    pathInput.addEventListener('blur', () => pathInput.style.borderColor = '#4a4a6e');
    document.body.appendChild(pathInput);
    this.pathInput = pathInput;
    this.htmlElements.push(pathInput);

    // Enter key on either input launches
    const launch = () => {
      if (domainInput.value.trim() && pathInput.value.trim()) {
        this.launchAudit(domainInput.value.trim(), pathInput.value.trim());
      }
    };
    domainInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });
    pathInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(); });

    // DESCEND button
    const btn = document.createElement('button');
    btn.textContent = '⚔ DESCEND ⚔';
    Object.assign(btn.style, {
      position: 'absolute',
      left: '50%',
      top: '80%',
      transform: 'translateX(-50%)',
      padding: '10px 40px',
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#0a0a1a',
      backgroundColor: '#f0c040',
      border: '2px solid #f0c040',
      borderRadius: '0',
      cursor: 'pointer',
      zIndex: '10',
      letterSpacing: '3px',
      fontWeight: 'bold'
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#ffe060';
      btn.style.borderColor = '#ffe060';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = '#f0c040';
      btn.style.borderColor = '#f0c040';
    });
    btn.addEventListener('click', launch);
    document.body.appendChild(btn);
    this.htmlElements.push(btn);

    // Clean up all HTML elements on scene shutdown
    this.events.on('shutdown', () => {
      this.htmlElements.forEach(el => el.remove());
    });

    // Focus domain input
    this.time.delayedCall(500, () => domainInput.focus());
  }

  async connectToBridge() {
    try {
      await bridge.connect();
      this.statusText.setText('⚔ Bridge connected — ready for battle');
      this.statusText.setColor(COLORS.green);
    } catch (err) {
      this.statusText.setText('Bridge offline — start server with: npm run server');
      this.statusText.setColor(COLORS.red);
    }
  }

  launchAudit(domain, projectPath) {
    // Remove all HTML elements
    this.htmlElements.forEach(el => el.remove());

    // Store both domain and project path globally
    this.game.domain = domain;
    this.game.projectPath = projectPath;

    // Transition
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('Summoning', { domain, projectPath });
    });
  }

  addAtmosphere() {
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
