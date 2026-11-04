import { JOBS } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { populationSummary,populationWindow,professionColor,humanPortrait,POPULATION_ROW_HEIGHT,populationDetails,residentWarnings } from './populationData.js';

export class PopulationSidebar {
  constructor(scene){
    this.scene=scene;this.root=document.querySelector('#population-panel');this.button=document.querySelector('#population-tab');this.viewport=document.querySelector('#population-viewport');this.list=document.querySelector('#population-list');
    this.rows=new Map();this.portraits=new Map();this.records=[];this.lastRefresh=-Infinity;this.controller=new AbortController();const options={signal:this.controller.signal};
    this.tooltip=document.querySelector('#population-tooltip');
    this.tooltip.addEventListener('pointerenter',()=>clearTimeout(this.hideTimer),options);this.tooltip.addEventListener('pointerleave',()=>this.hideDetails(),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.tooltip.addEventListener(event,e=>e.stopPropagation(),options);
    this.tooltip.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();this.hideDetails();}},options);
    this.tooltip.addEventListener('focusout',event=>{if(!this.tooltip.contains(event.relatedTarget))this.hideDetails();},options);
    window.addEventListener('resize',()=>this.positionTooltip(),options);
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
    if(this.open)this.refresh(true);else{this.hideDetails();for(const record of this.rows.values())record.controller.abort();this.list.replaceChildren();this.rows.clear();}
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
    this.list.style.height=`${this.records.length*POPULATION_ROW_HEIGHT}px`;this.renderVisible();this.refreshDetails();
  }
  createRow(id){
    const controller=new AbortController();
    const row=element('article','population-row');row.dataset.workerId=id;row.setAttribute('role','listitem');
    const select=element('button','population-select');select.type='button';const portrait=element('img','population-portrait');portrait.width=44;portrait.height=44;
    const portraitFrame=element('span','population-portrait-frame'),status=element('span','population-state-icon');portraitFrame.append(portrait,status);
    const text=element('span','population-row-text'),name=element('strong'),job=element('small'),progress=element('small','population-row-progress');text.append(name,job,progress);select.append(portraitFrame,text);row.append(select);
    const options={signal:controller.signal};
    select.addEventListener('pointerenter',()=>this.showDetails(id,row),options);select.addEventListener('pointerleave',()=>this.deferHideDetails(),options);
    select.addEventListener('focus',()=>this.showDetails(id,row),options);select.addEventListener('blur',event=>{if(!this.tooltip.contains(event.relatedTarget))this.deferHideDetails();},options);
    select.addEventListener('click',()=>{const worker=this.scene.workerSystem.workers.get(id);if(!worker?.isAlive||worker.isSubject===false)return;this.hideDetails();if(!this.scene.fog.isVisibleObject(worker)){this.scene.setStatus('This villager is outside current sight.');return;}this.scene.unitPanel.open(worker);},options);
    return {row,portrait,name,job,progress,select,status,controller};
  }
  renderVisible(){
    const range=populationWindow(this.records.length,this.viewport.scrollTop,this.viewport.clientHeight||300),needed=new Set();
    for(let index=range.start;index<range.end;index++){
      const worker=this.records[index];needed.add(worker.id);let record=this.rows.get(worker.id);
      if(!record){record=this.createRow(worker.id);this.rows.set(worker.id,record);this.list.append(record.row);}
      record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;
      const warnings=residentWarnings(this.scene,worker),signature=JSON.stringify([worker.name,worker.profession,worker.experience,worker.definition.id,worker.workState,warnings]);if(signature===record.signature)continue;record.signature=signature;
      record.name.textContent=worker.name;record.job.textContent=JOBS[worker.profession]?.name??worker.profession;
      const e=worker.experience;record.progress.textContent=`LVL ${e.level} · ${e.level===e.maxLevel?'XP MAX':`${Math.round(e.currentXP*100)/100} / ${e.xpToNextLevel} XP`}`;
      record.portrait.src=this.portrait(worker);record.portrait.alt=`Portrait of ${worker.name}`;record.portrait.style.backgroundColor=professionColor(worker.profession);record.select.setAttribute('aria-label',`Inspect ${worker.name}`);
      record.status.hidden=!warnings.length;record.status.textContent=warnings[0]?.icon??'';record.status.title=[worker.workState,...warnings.map(warning=>warning.text)].join(' · ');
    }
    for(const [id,record]of this.rows)if(!needed.has(id)){if(this.tooltipWorkerId===id)this.hideDetails();record.controller.abort();record.row.remove();this.rows.delete(id);}
    this.positionTooltip();
  }
  showDetails(id,anchor){
    if(!this.open||innerWidth<600||matchMedia('(hover: none)').matches)return;
    clearTimeout(this.hideTimer);this.rows.get(this.tooltipWorkerId)?.select.removeAttribute('aria-describedby');this.tooltipWorkerId=id;this.tooltipAnchor=anchor;this.rows.get(id)?.select.setAttribute('aria-describedby',this.tooltip.id);this.refreshDetails();
  }
  deferHideDetails(){clearTimeout(this.hideTimer);this.hideTimer=setTimeout(()=>this.hideDetails(),100);}
  hideDetails(){
    clearTimeout(this.hideTimer);this.rows.get(this.tooltipWorkerId)?.select.removeAttribute('aria-describedby');this.tooltip.hidden=true;this.tooltipWorkerId=null;this.tooltipAnchor=null;this.tooltipSignature=null;this.tooltip.replaceChildren();
  }
  refreshDetails(){
    if(!this.tooltipWorkerId||!this.open)return;const worker=this.scene.workerSystem.workers.get(this.tooltipWorkerId);
    if(!worker?.isAlive||worker.isSubject===false){this.hideDetails();return;}
    const data=populationDetails(this.scene,worker),signature=JSON.stringify(data);this.tooltip.hidden=false;
    if(signature!==this.tooltipSignature){
      const scroll=this.tooltip.scrollTop;this.tooltipSignature=signature;
      const title=element('h3','',data.name),profession=element('p','',`${data.profession} · Overall Level ${data.level}`),xp=element('p','',data.level===data.maxLevel?'XP MAX':`XP ${this.format(data.currentXP)} / ${data.xpToNextLevel} · Total ${this.format(data.totalXP)}`);
      const job=element('p','',`${data.job} · ${data.task}`),workplace=element('p','',`Assigned Workplace: ${data.workplace}`),talent=element('p','population-talent',`Natural Talent: ${data.talent}${data.talent==='None'?'':' · +20% XP'}`);
      const skills=data.skills.map(skill=>{const row=element('div',`population-skill${skill.talented?' talented-skill':''}`);row.dataset.skill=skill.id;row.append(element('strong','',`${skill.name}${skill.talented?' ★':''}`),element('span','',`LVL ${skill.level}`),element('small','',skill.level===skill.maxLevel?'XP MAX':`${this.format(skill.currentXP)} / ${skill.xpToNextLevel} XP`));const bar=element('progress');bar.max=skill.xpToNextLevel||1;bar.value=skill.level===skill.maxLevel?1:skill.currentXP;bar.setAttribute('aria-label',`${skill.name} XP`);row.append(bar);return row;});
      this.tooltip.replaceChildren(title,profession,xp,job,workplace,talent,...data.warnings.map(warning=>element('p','population-warning',warning.text)),element('h4','','Skills'),...skills);this.tooltip.scrollTop=scroll;
    }
    this.positionTooltip();
  }
  format(value){return String(Math.round(value*100)/100);}
  positionTooltip(){
    if(this.tooltip?.hidden||!this.tooltipAnchor?.isConnected)return;
    if(innerWidth<600){this.hideDetails();return;}
    const mobile=innerWidth<600,leftMargin=mobile?52:8,rightMargin=mobile?48:8,width=Math.min(300,innerWidth-leftMargin-rightMargin),safeTop=Math.min(96,innerHeight*.18);
    this.tooltip.style.width=`${width}px`;this.tooltip.style.maxHeight=`${Math.max(80,Math.min(480,innerHeight-safeTop-84))}px`;
    const anchor=this.tooltipAnchor.getBoundingClientRect(),panel=this.root.getBoundingClientRect(),height=this.tooltip.offsetHeight;
    this.tooltip.style.left=`${Math.max(leftMargin,Math.min(innerWidth-width-rightMargin,panel.left-width-10))}px`;
    this.tooltip.style.top=`${Math.max(safeTop,Math.min(anchor.top,innerHeight-height-76))}px`;
  }
  destroy(){this.controller.abort();this.unsubscribePopulation();this.unsubscribeJobs();this.unsubscribeAssets();this.setOpen(false);this.portraits.clear();}
}
