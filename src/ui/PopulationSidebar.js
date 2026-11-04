import { JOBS } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { populationSummary,populationWindow,professionColor,humanPortrait,POPULATION_ROW_HEIGHT } from './populationData.js';

export class PopulationSidebar {
  constructor(scene){
    this.scene=scene;this.root=document.querySelector('#population-panel');this.button=document.querySelector('#population-tab');this.viewport=document.querySelector('#population-viewport');this.list=document.querySelector('#population-list');
    this.rows=new Map();this.portraits=new Map();this.records=[];this.lastRefresh=-Infinity;this.controller=new AbortController();const options={signal:this.controller.signal};
    this.button.addEventListener('click',()=>this.setOpen(!this.open),options);document.querySelector('#close-population').addEventListener('click',()=>this.setOpen(false),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.root.addEventListener(event,e=>e.stopPropagation(),options);
    this.root.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();this.setOpen(false);}},options);
    this.viewport.addEventListener('scroll',()=>{if(this.open)this.renderVisible();},options);
    this.unsubscribePopulation=scene.workerSystem.subscribe(count=>this.updateCount(count));this.unsubscribeJobs=scene.workerSystem.jobs.onChange(()=>{this.lastRefresh=-Infinity;});
    this.unsubscribeAssets=scene.assets.subscribe(()=>{this.portraits.clear();for(const record of this.rows.values())record.signature=null;this.lastRefresh=-Infinity;});
    this.updateCount(scene.workerSystem.liveSubjects().length);this.setOpen(false);
  }
  updateCount(count){document.querySelector('#population-tab-count').textContent=count;this.lastRefresh=-Infinity;}
  setOpen(value){
    this.open=!!value;this.root.classList.toggle('open',this.open);this.root.inert=!this.open;this.root.setAttribute('aria-hidden',String(!this.open));this.button.setAttribute('aria-expanded',String(this.open));
    if(this.open)this.refresh(true);else{for(const record of this.rows.values())record.controller.abort();this.list.replaceChildren();this.rows.clear();}
  }
  portrait(worker){
    const key=worker.definition.id;if(this.portraits.has(key))return this.portraits.get(key);
    let url;try{if(this.scene.assets.usesSprite(worker.definition))url=this.scene.assets.previewURL(worker.definition);}catch{/* A readable portrait still works when an optional asset is unavailable. */}
    url??=humanPortrait();this.portraits.set(key,url);return url;
  }
  refresh(force=false){
    if(!this.open)return;const now=performance.now();if(!force&&now-this.lastRefresh<200)return;this.lastRefresh=now;
    const summary=populationSummary(this.scene.workerSystem.workers.values());this.records=summary.residents;
    const text=`Population: ${summary.total} · Employed: ${summary.employed} · Unemployed: ${summary.unemployed}`;
    const output=document.querySelector('#population-summary');if(output.textContent!==text)output.textContent=text;
    document.querySelector('#population-empty').hidden=summary.total>0;
    this.list.style.height=`${this.records.length*POPULATION_ROW_HEIGHT}px`;this.renderVisible();
  }
  createRow(id){
    const controller=new AbortController();
    const row=element('article','population-row');row.dataset.workerId=id;row.setAttribute('role','listitem');
    const select=element('button','population-select');select.type='button';const portrait=element('img','population-portrait');portrait.width=44;portrait.height=44;
    const text=element('span','population-row-text'),name=element('strong'),job=element('small'),progress=element('small','population-row-progress');text.append(name,job,progress);select.append(portrait,text);row.append(select);
    select.addEventListener('click',()=>{const worker=this.scene.workerSystem.workers.get(id);if(!worker?.isAlive||worker.isSubject===false)return;if(!this.scene.fog.isVisibleObject(worker)){this.scene.setStatus('This villager is outside current sight.');return;}this.scene.unitPanel.open(worker);},{signal:controller.signal});
    return {row,portrait,name,job,progress,select,controller};
  }
  renderVisible(){
    const range=populationWindow(this.records.length,this.viewport.scrollTop,this.viewport.clientHeight||300),needed=new Set();
    for(let index=range.start;index<range.end;index++){
      const worker=this.records[index];needed.add(worker.id);let record=this.rows.get(worker.id);
      if(!record){record=this.createRow(worker.id);this.rows.set(worker.id,record);this.list.append(record.row);}
      record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;
      const signature=JSON.stringify([worker.name,worker.profession,worker.experience,worker.definition.id]);if(signature===record.signature)continue;record.signature=signature;
      record.name.textContent=worker.name;record.job.textContent=JOBS[worker.profession]?.name??worker.profession;
      const e=worker.experience;record.progress.textContent=`LVL ${e.level} · ${e.level===e.maxLevel?'XP MAX':`${Math.round(e.currentXP*100)/100} / ${e.xpToNextLevel} XP`}`;
      record.portrait.src=this.portrait(worker);record.portrait.alt=`Portrait of ${worker.name}`;record.portrait.style.backgroundColor=professionColor(worker.profession);record.select.setAttribute('aria-label',`Inspect ${worker.name}`);
    }
    for(const [id,record]of this.rows)if(!needed.has(id)){record.controller.abort();record.row.remove();this.rows.delete(id);}
  }
  destroy(){this.controller.abort();this.unsubscribePopulation();this.unsubscribeJobs();this.unsubscribeAssets();this.setOpen(false);this.portraits.clear();}
}
