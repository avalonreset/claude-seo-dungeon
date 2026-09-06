// SNES-era color palette
export const COLORS = {
  // UI
  bg: 0x0a0a1a,
  panelBg: 0x1a1a2e,
  panelBorder: 0x4a4a6e,

  // Text
  white: '#e8e8e8',
  gold: '#f0c040',
  red: '#e04040',
  green: '#40c040',
  blue: '#4080e0',
  gray: '#808090',
  purple: '#a050d0',
  cyan: '#40c0c0',

  // Hex versions for Phaser
  hWhite: 0xe8e8e8,
  hGold: 0xf0c040,
  hRed: 0xe04040,
  hGreen: 0x40c040,
  hBlue: 0x4080e0,
  hPurple: 0xa050d0,
  hCyan: 0x40c0c0,

  // Severity
  critical: '#ff2040',
  high: '#e06020',
  medium: '#f0c040',
  low: '#40c040',
  info: '#4080e0'
};

export const FONTS = {
  title: { fontFamily: '"JetBrains Mono", monospace', fontSize: '32px', color: '#d4af37', fontStyle: '600', letterSpacing: 4 },
  subtitle: { fontFamily: '"JetBrains Mono", monospace', fontSize: '18px', color: '#c0c8d0', fontStyle: '400' },
  body: { fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', color: '#c0c8d0', fontStyle: '400' },
  small: { fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: COLORS.gray, fontStyle: '400' },
  battle: { fontFamily: '"JetBrains Mono", monospace', fontSize: '16px', color: '#c0c8d0', fontStyle: '400' },
  damage: { fontFamily: '"JetBrains Mono", monospace', fontSize: '24px', color: COLORS.red, fontStyle: 'bold' }
};
