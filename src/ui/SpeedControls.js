import { t } from '../i18n/index.js';
// Plan m-e2-rychlost-hry (report 0.48.0): pause and 1× / 2× / 3× in the HUD, keys P and 1–3. Faster speed runs the
// same simulation steps more often per frame (no bigger steps), so 3× gives the same game as 1×. The player's pause
// stops the simulation only: the map, building and panels keep working. The speed is a setting, not part of a save.
export const GAME_SPEEDS=Object.freeze([1,2,3]);
const KEY='newgame.gameSpeed';
export function readGameSpeed(){try{const v=Number(localStorage.getItem(KEY));return GAME_SPEEDS.includes(v)?v:1;}catch{return 1;}}
export class SpeedControls {
  constructor(scene){
    this.scene=scene;this.root=document.querySelector('#speed-controls');this.controller=new AbortController();const options={signal:this.controller.signal};
    scene.gameSpeed=readGameSpeed();scene.playerPaused=false;
    if(this.root){
      this.root.replaceChildren(...[0,...GAME_SPEEDS].map(speed=>{const b=document.createElement('button');b.type='button';b.className='speed-button';b.dataset.speed=String(speed);b.textContent=speed?`${speed}×`:'‖';return b;}));
      this.root.addEventListener('click',event=>{const b=event.target.closest('[data-speed]');if(!b)return;const speed=Number(b.dataset.speed);if(speed)this.setSpeed(speed);else this.togglePause();},options);
      for(const e of ['pointerdown','mousedown','mouseup','wheel'])this.root.addEventListener(e,ev=>ev.stopPropagation(),options);
    }
    window.addEventListener('keydown',event=>{
      if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]')||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName??''))return;
      if(event.code==='KeyP'){event.preventDefault();this.togglePause();}
      else{const n=['Digit1','Digit2','Digit3'].indexOf(event.code);if(n>=0){event.preventDefault();this.setSpeed(n+1);}}
    },options);
    this.render();
  }
  setSpeed(speed){if(!GAME_SPEEDS.includes(speed))return;this.scene.gameSpeed=speed;this.scene.playerPaused=false;try{localStorage.setItem(KEY,String(speed));}catch{/* the speed still applies */}this.render();}
  togglePause(){this.scene.playerPaused=!this.scene.playerPaused;this.render();}
  render(){
    if(!this.root)return;const s=this.scene;
    for(const b of this.root.querySelectorAll('[data-speed]')){const speed=Number(b.dataset.speed),on=speed?!s.playerPaused&&s.gameSpeed===speed:s.playerPaused;b.setAttribute('aria-pressed',String(on));const label=speed?t('speed.label',{speed}):t(s.playerPaused?'speed.resume':'speed.pause');b.title=b.ariaLabel=`${label} (${speed?speed:'P'})`;}
    this.root.setAttribute('aria-label',t('speed.group'));this.root.classList.toggle('is-paused',!!s.playerPaused);
  }
  destroy(){this.controller.abort();}
}
