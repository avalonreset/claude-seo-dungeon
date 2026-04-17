// ============================================================
// FONT SYSTEM - Dark 16-bit RPG
// Primary typeface: JetBrains Mono (loaded via Google Fonts)
// DO NOT use "Press Start 2P" - it renders poorly at all sizes
// ============================================================

const FONT_PRIMARY = '"JetBrains Mono", monospace';

// ---------------------
// TITLE
// Big headers: "DESCENDING INTO THE DUNGEON", screen titles
// JetBrains Mono 600 weight, wide letter-spacing, gold
// ---------------------
export const TITLE = {
  fontFamily: FONT_PRIMARY,
  fontSize: '28px',
  fontStyle: '600',
  color: '#d4af37',
  letterSpacing: 6,
};

// Larger variant for splash / full-screen titles
export const TITLE_LG = {
  fontFamily: FONT_PRIMARY,
  fontSize: '36px',
  fontStyle: '600',
  color: '#d4af37',
  letterSpacing: 8,
};

// ---------------------
// HEADING
// Section headers, demon names, scene labels
// JetBrains Mono bold, 16-18px, white or gold
// ---------------------
export const HEADING = {
  fontFamily: FONT_PRIMARY,
  fontSize: '18px',
  fontStyle: 'bold',
  color: '#e8e8e8',
};

export const HEADING_GOLD = {
  fontFamily: FONT_PRIMARY,
  fontSize: '18px',
  fontStyle: 'bold',
  color: '#d4af37',
};

export const HEADING_SM = {
  fontFamily: FONT_PRIMARY,
  fontSize: '16px',
  fontStyle: 'bold',
  color: '#e8e8e8',
};

// ---------------------
// BODY
// Descriptions, battle log, status messages
// JetBrains Mono regular, 14px, light gray
// ---------------------
export const BODY = {
  fontFamily: FONT_PRIMARY,
  fontSize: '14px',
  color: '#c0c8d0',
};

export const BODY_WHITE = {
  fontFamily: FONT_PRIMARY,
  fontSize: '14px',
  color: '#e8e8e8',
};

export const BODY_SM = {
  fontFamily: FONT_PRIMARY,
  fontSize: '13px',
  color: '#c0c8d0',
};

// ---------------------
// LABEL
// Small labels: severity badges, categories, HP/MP
// JetBrains Mono 600, 11-12px, colored per context
// ---------------------
export const LABEL = {
  fontFamily: FONT_PRIMARY,
  fontSize: '12px',
  fontStyle: '600',
  color: '#c0c8d0',
};

export const LABEL_SM = {
  fontFamily: FONT_PRIMARY,
  fontSize: '11px',
  fontStyle: '600',
  color: '#c0c8d0',
};

export const LABEL_GOLD = {
  fontFamily: FONT_PRIMARY,
  fontSize: '12px',
  fontStyle: '600',
  color: '#d4af37',
};

export const LABEL_RED = {
  fontFamily: FONT_PRIMARY,
  fontSize: '12px',
  fontStyle: '600',
  color: '#e04040',
};

export const LABEL_GREEN = {
  fontFamily: FONT_PRIMARY,
  fontSize: '12px',
  fontStyle: '600',
  color: '#40c040',
};

export const LABEL_BLUE = {
  fontFamily: FONT_PRIMARY,
  fontSize: '12px',
  fontStyle: '600',
  color: '#4080e0',
};

// ---------------------
// ACCENT
// Special callouts: damage numbers, XP gains, critical hits
// JetBrains Mono bold, 20px+, colored
// ---------------------
export const ACCENT = {
  fontFamily: FONT_PRIMARY,
  fontSize: '22px',
  fontStyle: 'bold',
  color: '#e8e8e8',
};

export const ACCENT_DAMAGE = {
  fontFamily: FONT_PRIMARY,
  fontSize: '24px',
  fontStyle: 'bold',
  color: '#e04040',
};

export const ACCENT_HEAL = {
  fontFamily: FONT_PRIMARY,
  fontSize: '22px',
  fontStyle: 'bold',
  color: '#40c040',
};

export const ACCENT_XP = {
  fontFamily: FONT_PRIMARY,
  fontSize: '20px',
  fontStyle: 'bold',
  color: '#d4af37',
};

export const ACCENT_CRIT = {
  fontFamily: FONT_PRIMARY,
  fontSize: '28px',
  fontStyle: 'bold',
  color: '#ff4060',
};

// ---------------------
// GLOW HELPER
// Returns a modified style for glow text layers.
// Use with Phaser ADD blend mode for neon / magic effects:
//   const glowText = this.add.text(x, y, str, glow(ACCENT_DAMAGE, '#ff0000'));
//   glowText.setBlendMode(Phaser.BlendModes.ADD);
// ---------------------
export function glow(style, glowColor) {
  return {
    ...style,
    color: glowColor || style.color,
    stroke: glowColor || style.color,
    strokeThickness: 4,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: glowColor || style.color,
      blur: 12,
      fill: true,
    },
  };
}

// Convenience: all styles in one object (mirrors the old FONTS export shape)
export const FONTS = {
  title: TITLE,
  titleLg: TITLE_LG,
  heading: HEADING,
  headingGold: HEADING_GOLD,
  headingSm: HEADING_SM,
  body: BODY,
  bodyWhite: BODY_WHITE,
  bodySm: BODY_SM,
  label: LABEL,
  labelSm: LABEL_SM,
  labelGold: LABEL_GOLD,
  labelRed: LABEL_RED,
  labelGreen: LABEL_GREEN,
  labelBlue: LABEL_BLUE,
  accent: ACCENT,
  accentDamage: ACCENT_DAMAGE,
  accentHeal: ACCENT_HEAL,
  accentXp: ACCENT_XP,
  accentCrit: ACCENT_CRIT,
};
