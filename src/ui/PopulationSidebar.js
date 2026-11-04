import { JOBS,SKILLS } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { populationSummary,populationWindow,professionColor,humanPortrait,POPULATION_ROW_HEIGHT,populationDetails,residentWarnings,sortedPopulation,readPopulationPreferences,writePopulationPreferences } from './populationData.js';

export class PopulationSidebar {
  constructor(scene){
    this.scene=scene;this.root=document.querySelector('#population-panel');this.button=document.querySelector('#population-tab');this.viewport=document.querySelector('#population-viewport');this.list=document.querySelector('#population-list');
    this.rows=new Map();this.portraits=new Map();this.records=[];this.lastRefresh=-Infinity;this.controller=new AbortController();const options={signal:this.controller.signal};
    try{this.storage=window.localStorage;}catch{}this.preferences=readPopulationPreferences(this.storage);
    this.search=document.querySelector('#population-search');this.sort=document.querySelector('#population-sort');this.order=document.querySelector('#population-order');this.profession=document.querySelector('#population-profession');
    const option=(value,name)=>{const node=element('option','',name);node.value=value;return node;},skills=element('optgroup');skills.label='Individual Skills';skills.append(...Object.entries(SKILLS).map(([id,name])=>option(`skill:${id}`,name)));
    this.sort.replaceChildren(...Object.entries({level:'Overall Level',xp:'Overall XP',name:'Name',profession:'Profession'}).map(([value,name])=>option(value,name)),skills);
    this.profession.replaceChildren(option('all','All'),...Object.entries(JOBS).map(([id,job])=>option(id,job.name)));
    this.sort.value=this.preferences.sortBy;this.order.value=this.preferences.direction;this.profession.value=this.preferences.profession;this.search.value='';
    const change=()=>{clearTimeout(this.inspectTimer);this.hideDetails();this.preferences={sortBy:this.sort.value,direction:this.order.value,profession:this.profession.value};writePopulationPreferences(this.storage,this.preferences);this.viewport.scrollTop=0;this.refresh(true);};
    for(const control of [this.sort,this.order,this.profession])control.addEventListener('change',change,options);this.search.addEventListener('input',change,options);
    this.root.addEventListener('focusin',()=>{for(const key of Object.values(scene.worldCamera?.keys??{}))key.reset();},options);
    this.selection=scene.add.graphics().lineStyle(2,0xf0d78b,.95).strokeEllipse(0,-1,34,17).setVisible(false);
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
    if(this.open)this.refresh(true);else{clearTimeout(this.inspectTimer);this.hideDetails();for(const record of this.rows.values())record.controller.abort();this.list.replaceChildren();this.rows.clear();this.visibleOrder=null;}
  }
  portrait(worker){
    const key=worker.definition.id;if(this.portraits.has(key))return this.portraits.get(key);
    let url;try{if(this.scene.assets.usesSprite(worker.definition))url=this.scene.assets.previewURL(worker.definition);}catch{/* A readable portrait still works when an optional asset is unavailable. */}
    url??=humanPortrait();this.portraits.set(key,url);return url;
  }
  refresh(force=false){
    if(!this.open)return;const now=performance.now();if(!force&&now-this.lastRefresh<200)return;this.lastRefresh=now;
    const summary=populationSummary(this.scene.workerSystem.workers.values());this.records=sortedPopulation(summary.residents,this.preferences,this.search.value);
    this.deaths=sortedPopulation(this.scene.workerSystem.recentDeaths(),this.preferences,this.search.value,{includeDead:true});
    this.displayRecords=[...this.records.map(worker=>({worker})),...(this.deaths.length?[{heading:true},...this.deaths.map(worker=>({worker}))]:[])];
    const text=`Population: ${summary.total} · Employed: ${summary.employed} · Unemployed: ${summary.unemployed}`;
    const output=document.querySelector('#population-summary');if(output.textContent!==text)output.textContent=text;
    document.querySelector('#population-empty').hidden=this.records.length>0||this.deaths.length>0;document.querySelector('#population-filter-count').textContent=`${this.records.length} / ${summary.total} living shown${this.deaths.length?` · ${this.deaths.length} recent deaths`:''}`;
    this.list.style.height=`${this.displayRecords.length*POPULATION_ROW_HEIGHT}px`;this.renderVisible();this.refreshDetails();
  }
  createRow(id){
    const controller=new AbortController();
    const row=element('article','population-row');row.dataset.workerId=id;row.setAttribute('role','listitem');
    const select=element('button','population-select');select.type='button';const portrait=element('img','population-portrait');portrait.width=44;portrait.height=44;
    const portraitFrame=element('span','population-portrait-frame'),status=element('span','population-state-icon');portraitFrame.append(portrait,status);
    const text=element('span','population-row-text'),name=element('strong'),job=element('small'),progress=element('small','population-row-progress');text.append(name,job,progress);select.append(portraitFrame,text);
    const locate=element('button','population-locate','Locate');locate.type='button';locate.setAttribute('aria-label',`Locate villager ${id}`);row.append(select,locate);
    const options={signal:controller.signal};
    row.addEventListener('pointerenter',()=>this.showDetails(id,row),options);row.addEventListener('pointerleave',()=>this.deferHideDetails(),options);row.addEventListener('focus',()=>this.showDetails(id,row),options);
    select.addEventListener('focus',()=>this.showDetails(id,row),options);select.addEventListener('blur',event=>{if(!this.tooltip.contains(event.relatedTarget))this.deferHideDetails();},options);
    select.addEventListener('click',()=>{clearTimeout(this.inspectTimer);this.hideDetails();if(!this.selectResident(id))return;this.inspectTimer=setTimeout(()=>{const worker=this.resident(id);if(worker&&this.open)this.scene.unitPanel.open(worker,{management:true});},240);},options);
    select.addEventListener('dblclick',()=>this.locateResident(id),options);locate.addEventListener('click',()=>this.locateResident(id),options);
    return {row,portrait,name,job,progress,select,locate,status,controller};
  }
  renderVisible(){
    const range=populationWindow(this.displayRecords.length,this.viewport.scrollTop,this.viewport.clientHeight||300),needed=new Set(),ordered=[];
    for(let index=range.start;index<range.end;index++){
      const item=this.displayRecords[index];
      if(item.heading){
        const key='@recent-deaths';needed.add(key);let record=this.rows.get(key);
        if(!record){const row=element('h3','population-deaths-heading');row.dataset.workerId=key;record={row,controller:new AbortController()};this.rows.set(key,record);}
        record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;record.row.textContent=`Recent Deaths (${this.deaths.length})`;ordered.push(record.row);continue;
      }
      const worker=item.worker;needed.add(worker.id);let record=this.rows.get(worker.id);
      if(!record){record=this.createRow(worker.id);this.rows.set(worker.id,record);this.list.append(record.row);}
      ordered.push(record.row);
      record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;
      const skill=this.preferences.sortBy.startsWith('skill:')?this.preferences.sortBy.slice(6):null,warnings=residentWarnings(this.scene,worker),signature=JSON.stringify([worker.name,worker.profession,worker.experience,worker.definition.id,worker.workState,warnings,skill,skill?worker.skills[skill]:null,worker.isAlive]);if(signature===record.signature)continue;record.signature=signature;
      record.row.classList.toggle('is-dead',!worker.isAlive);record.row.dataset.populationState=worker.isAlive?'living':'dead';record.row.tabIndex=worker.isAlive?-1:0;record.select.disabled=!worker.isAlive;record.locate.disabled=!worker.isAlive;
      record.name.textContent=worker.name;record.job.textContent=JOBS[worker.profession]?.name??worker.profession;
      const e=worker.experience;record.progress.textContent=`LVL ${e.level} · ${skill?`${SKILLS[skill]} ${worker.skills[skill]?.level??1}`:e.level===e.maxLevel?'XP MAX':`${Math.round(e.currentXP*100)/100} / ${e.xpToNextLevel} XP`}`;
      record.portrait.src=this.portrait(worker);record.portrait.alt=`Portrait of ${worker.name}`;record.portrait.style.backgroundColor=professionColor(worker.profession);record.select.setAttribute('aria-label',`Inspect ${worker.name}`);
      record.status.hidden=!warnings.length;record.status.textContent=warnings[0]?.icon??'';record.status.title=[worker.workState,...warnings.map(warning=>warning.text)].join(' · ');
      record.locate.setAttribute('aria-label',`Locate ${worker.name}`);
    }
    for(const [id,record]of this.rows)if(!needed.has(id)){if(this.tooltipWorkerId===id)this.hideDetails();record.controller.abort();record.row.remove();this.rows.delete(id);}
    const order=ordered.map(row=>row.dataset.workerId).join('|');if(order!==this.visibleOrder){this.visibleOrder=order;this.list.replaceChildren(...ordered);}
    this.positionTooltip();
  }
  resident(id){const worker=this.scene.workerSystem.workers.get(id);return worker?.isAlive&&worker.isSubject!==false?worker:null;}
  detailWorker(id){const worker=this.scene.workerSystem.workers.get(id);return worker&&worker.isSubject!==false&&(worker.isAlive||this.scene.workerSystem.recentDeaths().some(dead=>dead.id===id))?worker:null;}
  selectResident(id,duration=Infinity){const worker=this.resident(id);if(!worker)return false;this.selectedId=id;this.selectionExpires=this.scene.gameTime.totalElapsed+duration;this.refreshSelection();return true;}
  locateResident(id){
    clearTimeout(this.inspectTimer);this.hideDetails();const worker=this.resident(id);if(!worker)return false;
    if(!this.scene.worldCamera.locate(worker)){this.clearSelection();this.scene.setStatus('This villager’s position is outside current sight.');return false;}
    this.selectResident(id,2000);return true;
  }
  clearSelection(){this.selectedId=null;this.selection.setVisible(false);}
  refreshSelection(){
    const worker=this.resident(this.selectedId);if(this.selectedId&&!worker){this.clearSelection();return;}const visible=worker&&this.scene.gameTime.totalElapsed<this.selectionExpires&&this.scene.fog.isVisibleObject(worker)&&worker.view.visible;
    this.selection.setVisible(!!visible);if(visible)this.selection.setPosition(worker.view.x,worker.view.y).setDepth(worker.view.depth+.2);
  }
  update(){this.refreshSelection();this.refresh();}
  showDetails(id,anchor){
    if(!this.open||innerWidth<600||matchMedia('(hover: none)').matches)return;
    clearTimeout(this.hideTimer);this.rows.get(this.tooltipWorkerId)?.select.removeAttribute('aria-describedby');this.rows.get(this.tooltipWorkerId)?.row.removeAttribute('aria-describedby');this.tooltipWorkerId=id;this.tooltipAnchor=anchor;this.rows.get(id)?.select.setAttribute('aria-describedby',this.tooltip.id);this.rows.get(id)?.row.setAttribute('aria-describedby',this.tooltip.id);this.refreshDetails();
  }
  deferHideDetails(){clearTimeout(this.hideTimer);this.hideTimer=setTimeout(()=>this.hideDetails(),100);}
  hideDetails(){
    clearTimeout(this.hideTimer);this.rows.get(this.tooltipWorkerId)?.select.removeAttribute('aria-describedby');this.rows.get(this.tooltipWorkerId)?.row.removeAttribute('aria-describedby');this.tooltip.hidden=true;this.tooltipWorkerId=null;this.tooltipAnchor=null;this.tooltipSignature=null;this.tooltip.replaceChildren();
  }
  refreshDetails(){
    if(!this.tooltipWorkerId||!this.open)return;const worker=this.detailWorker(this.tooltipWorkerId);
    if(!worker){this.hideDetails();return;}
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
  destroy(){this.controller.abort();this.unsubscribePopulation();this.unsubscribeJobs();this.unsubscribeAssets();this.setOpen(false);this.portraits.clear();this.selection.destroy();}
}
