import { DEFAULT_GAME_SETTINGS,gameSettings } from '../systems/GameSettings.js';

export class NewGameSetup {
  constructor({onStart,onBack}){
    this.root=document.querySelector('#game-setup');this.form=document.querySelector('#game-setup-form');
    this.form.addEventListener('submit',event=>{event.preventDefault();onStart(this.value());});
    document.querySelector('#setup-back').addEventListener('click',onBack);
    document.querySelector('#setup-reset').addEventListener('click',()=>this.reset());
    this.form.addEventListener('input',()=>this.refresh());
  }
  value(){const e=this.form.elements;return gameSettings({difficulty:e.difficulty.value,wildlifePopulation:['rare','normal','abundant'][Number(e.wildlifePopulation.value)],treasureCount:Number(e.treasureCount.value),initialStoneCount:Number(e.initialStoneCount.value),fogOfWar:e.fogOfWar.checked,seasonsEnabled:e.seasonsEnabled.checked,startingCastle:e.startingCastle.checked,dayLengthSeconds:Number(e.dayLengthSeconds.value),wildlifeRespawn:e.wildlifeRespawn.value,startingGold:Number(e.startingGold.value)});}
  reset(){const s=DEFAULT_GAME_SETTINGS;for(const k of ['difficulty','treasureCount','initialStoneCount','dayLengthSeconds','wildlifeRespawn','startingGold'])this.form.elements[k].value=s[k];for(const k of ['fogOfWar','seasonsEnabled','startingCastle'])this.form.elements[k].checked=s[k];this.form.elements.wildlifePopulation.value=1;this.refresh();}
  open(){this.reset();this.root.querySelector('details').open=false;this.root.hidden=false;this.form.elements.difficulty.focus();}
  close(){this.root.hidden=true;}
  refresh(){const s=this.value(),wildlife={rare:'Ojediněle · 3 zvířata',normal:'Normal · 9 zvířat',abundant:'Hojně · 24 zvířat'}[s.wildlifePopulation];this.root.querySelector('[data-setup-output="wildlife"]').textContent=wildlife;for(const k of ['treasureCount','initialStoneCount','startingGold'])this.root.querySelector(`[data-setup-output="${k}"]`).textContent=s[k];
    document.querySelector('#setup-summary').textContent=`${s.difficulty.toUpperCase()} · ${wildlife} · ${s.treasureCount} truhel · ${s.initialStoneCount} kamenů na mapě · FoW ${s.fogOfWar?'ON':'OFF'} · Seasons ${s.seasonsEnabled?'ON':'OFF'} · Hrad ${s.startingCastle?'ON':'OFF'} · Den ${s.dayLengthSeconds} s · Respawn ${s.wildlifeRespawn} · ${s.startingGold} Gold`;
  }
}
