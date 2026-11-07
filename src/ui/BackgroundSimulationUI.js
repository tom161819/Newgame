import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { BackgroundSimulation } from '../systems/BackgroundSimulation.js';

// #60: the "Updating kingdom…" overlay during the catch-up and the "While you were away" summary. The summary is built
// only from the manager's report (real differences of the game state), never from estimates.
const minutes=ms=>Math.round(ms/60000*10)/10;
export function createBackgroundSimulation(scene){
  const overlay=document.querySelector('#catch-up-dialog'),bar=document.querySelector('#catch-up-progress'),status=document.querySelector('#catch-up-status');
  const summary=document.querySelector('#away-summary'),body=document.querySelector('#away-summary-body'),signal=scene.controls?.signal;
  overlay?.addEventListener('cancel',event=>event.preventDefault(),{signal});
  document.querySelector('#away-continue')?.addEventListener('click',()=>summary.close(),{signal});
  summary?.addEventListener('close',()=>{if(!scene.gameOver)scene.setGalleryInput(true);},{signal});
  const manager=new BackgroundSimulation(scene,{enabled:scene.settingsPanel.settings.runInBackground,
    onStart:()=>{scene.setGalleryInput(false);bar.value=0;status.textContent='';if(!overlay.open)overlay.showModal();},
    onProgress:(fraction,s)=>{bar.value=Math.round(fraction*100);status.textContent=t('background.progress',{percent:Math.round(fraction*100),minutes:minutes(s.simulated)});},
    onFinish:report=>{if(overlay.open)overlay.close();scene.updateTimeDisplay?.();scene.updateFoodDisplay?.();scene.updateInventory?.();
      if(report.gameOver)return;
      const day=scene.gameTime.dayDuration,show=report.gameMs>=day||report.skipped>=manager.rules.minReportMs;
      if(!show){scene.setGalleryInput(true);return;}
      body.replaceChildren(...summaryLines(scene,report));if(!summary.open)summary.showModal();}});
  return manager;
}
export function summaryLines(scene,report){
  const name=id=>scene.objectRegistry.get(id)?.name??id,lines=[];
  lines.push(element('p','away-time',t('background.elapsed',{days:Math.round(report.gameMs/scene.gameTime.dayDuration*10)/10,minutes:minutes(report.simulated)})));
  if(report.skipped>=1000)lines.push(element('p','away-skipped',t('background.skipped',{away:minutes(report.away),simulated:minutes(report.simulated),skipped:minutes(report.skipped)})));
  const list=element('ul','away-changes');
  for(const c of report.changes.slice(0,10))list.append(element('li',c.amount>0?'gain':'loss',`${c.amount>0?'+':''}${c.amount} ${name(c.resource)}`));
  if(report.buildings>0)list.append(element('li','',t('background.buildings',{count:report.buildings})));
  if(report.population!==0)list.append(element('li','',t(report.population>0?'background.arrived':'background.left',{count:Math.abs(report.population)})));
  if(list.childElementCount)lines.push(list);else lines.push(element('p','',t('background.noChanges')));
  if(report.events.length){lines.push(element('p','away-events-title',t('background.events')));const events=element('ul','away-events');for(const e of report.events)events.append(element('li',e.important?'important':'',e.text));lines.push(events);}
  return lines;
}
export { BackgroundSimulation };
