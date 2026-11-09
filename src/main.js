import Phaser from 'phaser';
import { GameScene } from './game/GameScene.js';
import { MainMenu } from './game/MainMenu.js';
import { chooseRenderer,parseRendererPreference,probeWebGL,rendererLabel } from './systems/RendererSelection.js';
import '@fontsource-variable/figtree';
import '@fontsource-variable/source-serif-4';
import { initCompactHud } from './ui/CompactHud.js';
import { initCompactHints } from './ui/compactHints.js';
import './style.css';
import '../art/ui/ui-fonts.js';
import '../art/ui/ui-theme.css';
import { applyUiStyle } from './ui/UiTheme.js';

for(const link of document.querySelectorAll('[data-version-archive]'))link.href=window.__NEWGAME_ARCHIVE_ROOT__??`${import.meta.env.BASE_URL}versions/`;

initCompactHud();initCompactHints();
// UI Lab look and layout (owner's design from the Studio by default), before the main menu shows.
applyUiStyle();

// Canvas stays the default: shared terrain textures and simple shapes are fast
// even without a GPU. ?renderer=webgl or ?renderer=auto opts into WebGL for testing.
// Settings → Renderer remembers the choice in this browser (an artifact page cannot take ?renderer= in its address).
let savedRenderer=null;try{savedRenderer=localStorage.getItem('newgame.renderer');}catch{/* default */}
const rendererPreference=new URLSearchParams(window.location.search).has('renderer')?parseRendererPreference(window.location.search):parseRendererPreference(`?renderer=${savedRenderer??''}`);
const rendererChoice=document.querySelector('#renderer-choice');
if(rendererChoice){rendererChoice.value=rendererPreference;rendererChoice.addEventListener('change',()=>{try{localStorage.setItem('newgame.renderer',rendererChoice.value);}catch{/* not saved */}window.location.reload();});}
const renderer=chooseRenderer(rendererPreference,requireHardware=>probeWebGL(document,{requireHardware}));
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
