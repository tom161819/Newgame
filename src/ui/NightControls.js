import { DAY_NIGHT } from '../data/dayNight.js';
import { t } from '../i18n/index.js';

// Day and night N1 HUD and setting: the part of the day next to the clock, at night a "Skip to dawn" button and
// "Plans for tomorrow: N" (construction waiting for the morning); in Settings "Auto speed-up at night" (off, ×2, ×3 –
// kept in this browser; default off since m-noc-zrychleni, a value the player chose earlier is kept).
const KEY='newgame.nightSpeed';
export function readNightSpeed(storage=globalThis.localStorage){
  try{const v=Number(storage?.getItem(KEY));return DAY_NIGHT.nightSpeeds.includes(v)?v:DAY_NIGHT.defaultNightSpeed;}catch{return DAY_NIGHT.defaultNightSpeed;}
}
export function saveNightSpeed(value,storage=globalThis.localStorage){try{storage?.setItem(KEY,String(value));}catch{}}
export class NightControls {
  constructor(scene){
    this.scene=scene;this.part=document.querySelector('#day-part');this.skip=document.querySelector('#skip-to-dawn');this.plans=document.querySelector('#night-plans');this.select=document.querySelector('#settings-night-speed');
    this.abort=new AbortController();const options={signal:this.abort.signal};
    this.skip?.addEventListener('click',()=>{scene.dayNight.skipToDawn();this.update();},options);
    if(this.select){this.select.replaceChildren(...DAY_NIGHT.nightSpeeds.map(v=>{const o=document.createElement('option');o.value=String(v);o.textContent=v===1?t('night.speedOff'):`×${v}`;return o;}));
      this.select.value=String(readNightSpeed());this.select.addEventListener('change',()=>saveNightSpeed(Number(this.select.value)),options);}
    // N3: night threat switches in Settings (the game's own switches, saved with the game).
    this.threatBoxes=Object.fromEntries(['wolves','thieves','fires'].map(id=>[id,document.querySelector(`#settings-threat-${id}`)]));
    for(const [id,box] of Object.entries(this.threatBoxes)){if(!box)continue;box.checked=scene.nightThreats?.enabled[id]!==false;box.addEventListener('change',()=>scene.nightThreats?.setEnabled(id,box.checked),options);}
    // m-topeni-domu: the winter heating switch (saved with the game).
    this.heatingBox=document.querySelector('#settings-heating');if(this.heatingBox){this.heatingBox.checked=scene.heating?.enabled!==false;this.heatingBox.addEventListener('change',()=>scene.heating?.setEnabled(this.heatingBox.checked),options);}
    this.update();
  }
  syncThreats(){if(this.heatingBox)this.heatingBox.checked=this.scene.heating?.enabled!==false;for(const [id,box] of Object.entries(this.threatBoxes??{}))if(box)box.checked=this.scene.nightThreats?.enabled[id]!==false;}
  plannedCount(){return (this.scene.buildings??[]).filter(b=>b.construction&&b.construction.state!=='complete').length;}
  syncSpeed(){if(this.select)this.select.value=String(readNightSpeed());}
  update(){
    const dn=this.scene.dayNight,part=dn.part(),night=part==='night';
    if(this.part&&this.part.dataset.part!==part){this.part.dataset.part=part;this.part.textContent=t(`night.part.${part}`);this.part.title=night?t(`night.moon.${this.moonName(dn.moon())}`):'';}
    if(this.skip){this.skip.hidden=!night||!!dn.underground?.();this.skip.classList.toggle('active',!!dn.skipping);}
    if(this.plans){const n=night?this.plannedCount():0;this.plans.hidden=!night||!n;const text=t('night.plans',{count:n});if(this.plans.textContent!==text)this.plans.textContent=text;}
  }
  moonName(light){return light>.85?'full':light<.15?'new':'half';}
  destroy(){this.abort.abort();}
}
