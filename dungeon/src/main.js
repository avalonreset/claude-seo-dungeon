import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { SummoningScene } from './scenes/SummoningScene.js';
import { DungeonHallScene } from './scenes/DungeonHallScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { VictoryScene } from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TitleScene, SummoningScene, DungeonHallScene, BattleScene, VictoryScene]
};

const game = new Phaser.Game(config);

// Store WebSocket connection globally
game.ws = null;
game.auditData = null;
