import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';
import { MainMenu } from './game/MainMenu.js';
import './style.css';

new Phaser.Game({
  // Sdílené textury terénu a jednoduché tvary jsou v Canvasu rychlé i bez GPU.
  type: Phaser.CANVAS,
  parent: 'game',
  width: 1024,
  height: 640,
  backgroundColor: '#3a3c2b',
  scene: [MainMenu,GameScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
});
