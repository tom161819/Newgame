import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';
import { MainMenu } from './game/MainMenu.js';
import { chooseRenderer,parseRendererPreference,probeWebGL,rendererLabel } from './systems/RendererSelection.js';
import '@fontsource-variable/figtree';
import '@fontsource-variable/source-serif-4';
import { initCompactHud } from './ui/CompactHud.js';
import './style.css';

for(const link of document.querySelectorAll('[data-version-archive]'))link.href=window.__NEWGAME_ARCHIVE_ROOT__??`${import.meta.env.BASE_URL}versions/`;

initCompactHud();

// Canvas stays the default: shared terrain textures and simple shapes are fast
// even without a GPU. ?renderer=webgl or ?renderer=auto opts into WebGL for testing.
const renderer=chooseRenderer(parseRendererPreference(window.location.search),requireHardware=>probeWebGL(document,{requireHardware}));
const rendererStatus=document.querySelector('#renderer-status');if(rendererStatus)rendererStatus.textContent=rendererLabel(renderer);

new Phaser.Game({
  type: renderer.type==='webgl'?Phaser.WEBGL:Phaser.CANVAS,
  parent: 'game',
  width: 1024,
  height: 640,
  backgroundColor: '#3a3c2b',
  scene: [MainMenu,GameScene],
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
});
