import { t } from '../i18n/index.js';

// One HUD action for the existing physical cargo and saved logistics task.
export class KingCargoControl {
  constructor(scene){
    this.scene=scene;this.controller=new AbortController();this.button=document.querySelector('#king-cargo-deliver');
    this.button.addEventListener('click',()=>{scene.kingLogistics.commandDelivery();this.refresh();},{signal:this.controller.signal});this.refresh();
  }
  refresh(){
    const s=this.scene,b=this.button;b.hidden=!s.character.cargo;b.disabled=!!s.gameOver||s.gameTime.paused||s.character.transitioning||!s.character.isAlive;
    const label=t('hud.deliverCargo');b.title=label;b.setAttribute('aria-label',label);b.querySelector('span').textContent=label;
  }
  destroy(){this.controller.abort();this.button.hidden=true;}
}
