import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';
import { COLUMNS, ROWS, TILE_SIZE, MAP_HEADROOM } from './game/map.js';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COLUMNS * TILE_SIZE,
  height: ROWS * TILE_SIZE + MAP_HEADROOM,
  backgroundColor: '#1e303b',
  scene: GameScene,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
