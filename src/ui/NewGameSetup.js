import { t } from '../i18n/index.js';
import { NEW_GAME_DEFAULTS,gameSettings,STARTING_RESOURCES,STARTING_RESOURCE_CAPACITY,startingResourceTotal } from '../systems/GameSettings.js';

export class NewGameSetup {
  constructor({onStart,onBack}){
    this.root=document.querySelector('#game-setup');this.form=document.querySelector('#game-setup-form');
    this.form.addEventListener('submit',event=>{event.preventDefault();onStart(this.value());});
    document.querySelector('#setup-back').addEventListener('click',onBack);
    document.querySelector('#setup-reset').addEventListener('click',()=>this.reset());
    // The Starter Stockpile holds STARTING_RESOURCE_CAPACITY (160) units: a slider that would overflow it is held at the remaining room.
    this.form.addEventListener('input',event=>{const key=event.target?.name;if(Object.hasOwn(STARTING_RESOURCES,key)){const e=this.form.elements,others=Object.keys(STARTING_RESOURCES).filter(k=>k!==key).reduce((n,k)=>n+Number(e[k].value),0);if(Number(e[key].value)+others>STARTING_RESOURCE_CAPACITY)e[key].value=String(STARTING_RESOURCE_CAPACITY-others);}this.refresh();});
  }
  value(){const e=this.form.elements;return gameSettings({difficulty:e.difficulty.value,wildlifePopulation:['rare','normal','abundant'][Number(e.wildlifePopulation.value)],treasureCount:Number(e.treasureCount.value),initialStoneCount:Number(e.initialStoneCount.value),fogOfWar:e.fogOfWar.checked,explorationMode:e.explorationMode.checked,seasonsEnabled:e.seasonsEnabled.checked,autoEmployment:e.autoEmployment.checked,startingCastle:e.startingCastle.checked,dayLengthSeconds:Number(e.dayLengthSeconds.value),wildlifeRespawn:e.wildlifeRespawn.value,startingGold:Number(e.startingGold.value),...Object.fromEntries(Object.keys(STARTING_RESOURCES).map(k=>[k,Number(e[k].value)]))});}
  reset(){const s=NEW_GAME_DEFAULTS;for(const k of ['difficulty','treasureCount','initialStoneCount','dayLengthSeconds','wildlifeRespawn','startingGold',...Object.keys(STARTING_RESOURCES)])this.form.elements[k].value=s[k];for(const k of ['fogOfWar','explorationMode','seasonsEnabled','startingCastle','autoEmployment'])this.form.elements[k].checked=s[k];this.form.elements.wildlifePopulation.value=1;this.refresh();}
  open(){this.reset();this.root.querySelector('details').open=false;this.root.hidden=false;this.form.elements.difficulty.focus();}
  close(){this.root.hidden=true;}
  refresh(){const s=this.value(),wildlife=t(`setup.wildlife.${s.wildlifePopulation}`,{count:{rare:3,normal:9,abundant:24}[s.wildlifePopulation]}),on=v=>t(v?'state.on':'state.off');this.root.querySelector('[data-setup-output="wildlife"]').textContent=wildlife;for(const k of ['treasureCount','initialStoneCount','startingGold',...Object.keys(STARTING_RESOURCES)])this.root.querySelector(`[data-setup-output="${k}"]`).textContent=s[k];this.root.querySelector('#setup-resources-total').textContent=`${startingResourceTotal(s)} / ${STARTING_RESOURCE_CAPACITY}`;
    const stockpile=startingResourceTotal(s)?t('setup.summary.stockpile',{list:Object.entries(STARTING_RESOURCES).filter(([k])=>s[k]).map(([k,id])=>`${s[k]} ${t(`resource.${id}`)}`).join(', ')}):null;
    document.querySelector('#setup-summary').textContent=[t(`difficulty.${s.difficulty}`).toUpperCase(),wildlife,t('setup.summary.chests',{count:s.treasureCount}),t('setup.summary.stones',{count:s.initialStoneCount}),`${t('setup.fog')} ${on(s.fogOfWar)}`,`${t('setup.exploration')} ${on(s.explorationMode)}`,`${t('setup.seasons')} ${on(s.seasonsEnabled)}`,t('setup.summary.castle',{state:on(s.startingCastle)}),t('setup.summary.day',{seconds:s.dayLengthSeconds}),t('setup.summary.respawn',{mode:t(`setup.respawn.${s.wildlifeRespawn}`).split(' · ')[0]}),t('setup.summary.gold',{count:s.startingGold}),stockpile].filter(Boolean).join(' · ');
  }
}
