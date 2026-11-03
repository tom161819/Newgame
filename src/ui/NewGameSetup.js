import { DEFAULT_GAME_SETTINGS,gameSettings } from '../systems/GameSettings.js';

export class NewGameSetup {
  constructor({onStart,onBack}){
    this.root=document.querySelector('#game-setup');this.form=document.querySelector('#game-setup-form');
    this.form.addEventListener('submit',event=>{event.preventDefault();onStart(this.value());});
    document.querySelector('#setup-back').addEventListener('click',onBack);
    this.form.addEventListener('input',()=>this.refresh());
  }
  value(){return gameSettings({difficulty:this.form.elements.difficulty.value,wildlifePopulation:['rare','normal','abundant'][Number(this.form.elements.wildlifePopulation.value)],treasureCount:Number(this.form.elements.treasureCount.value),initialStoneCount:Number(this.form.elements.initialStoneCount.value)});}
  open(){const s=DEFAULT_GAME_SETTINGS;for(const k of ['difficulty','treasureCount','initialStoneCount'])this.form.elements[k].value=s[k];this.form.elements.wildlifePopulation.value=1;this.refresh();this.root.hidden=false;this.form.elements.difficulty.focus();}
  close(){this.root.hidden=true;}
  refresh(){const s=this.value();this.root.querySelector('[data-setup-output="wildlife"]').textContent={rare:'Ojediněle · 3 zvířata',normal:'Normal · 9 zvířat',abundant:'Hojně · 24 zvířat'}[s.wildlifePopulation];for(const k of ['treasureCount','initialStoneCount'])this.root.querySelector(`[data-setup-output="${k}"]`).textContent=s[k];}
}
