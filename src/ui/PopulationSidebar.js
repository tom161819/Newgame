import { localized } from '../i18n/names.js';
import { t,language } from '../i18n/index.js';
import { JOBS,SKILLS } from '../data/jobs.js';
import { element } from './objectLabels.js';
import { jobChoices,changeProfession } from './jobChange.js';
import { populationSummary,populationWindow,professionColor,humanPortrait,POPULATION_ROW_HEIGHT,populationDetails,residentWarnings,sortedPopulation,readPopulationPreferences,writePopulationPreferences } from './populationData.js';

export class PopulationSidebar {
  constructor(scene){
    this.scene=scene;this.root=document.querySelector('#population-panel');this.button=document.querySelector('#population-tab');this.viewport=document.querySelector('#population-viewport');this.list=document.querySelector('#population-list');
    this.rows=new Map();this.portraits=new Map();this.records=[];this.lastRefresh=-Infinity;this.controller=new AbortController();const options={signal:this.controller.signal};
    try{this.storage=window.localStorage;}catch{}this.preferences=readPopulationPreferences(this.storage);
    this.search=document.querySelector('#population-search');this.sort=document.querySelector('#population-sort');this.order=document.querySelector('#population-order');this.profession=document.querySelector('#population-profession');
    this.renderOptions();
    this.sort.value=this.preferences.sortBy;this.order.value=this.preferences.direction;this.profession.value=this.preferences.profession;this.search.value='';
    const change=()=>{clearTimeout(this.inspectTimer);this.hideDetails();this.preferences={sortBy:this.sort.value,direction:this.order.value,profession:this.profession.value};writePopulationPreferences(this.storage,this.preferences);this.viewport.scrollTop=0;this.refresh(true);};
    for(const control of [this.sort,this.order,this.profession])control.addEventListener('change',change,options);this.search.addEventListener('input',change,options);
    this.root.addEventListener('focusin',()=>{for(const key of Object.values(scene.worldCamera?.keys??{}))key.reset();},options);
    this.selection=scene.add.graphics().lineStyle(2,0xf0d78b,.95).strokeEllipse(0,-1,34,17).setVisible(false);
    this.tooltip=document.querySelector('#population-tooltip');
    // Quick job menu (owner 7. 11. 2026): one shared menu, opened from the job button of a row.
    this.jobMenu=element('div','population-job-menu');this.jobMenu.id='population-job-menu';this.jobMenu.setAttribute('role','menu');this.jobMenu.hidden=true;document.body.append(this.jobMenu);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.jobMenu.addEventListener(event,e=>e.stopPropagation(),options);
    this.jobMenu.addEventListener('keydown',event=>this.jobMenuKey(event),options);
    document.addEventListener('pointerdown',event=>{if(this.jobMenuWorkerId!=null&&!this.jobMenu.contains(event.target)&&!this.jobMenuAnchor?.contains(event.target))this.closeJobMenu();},{...options,capture:true});
    this.tooltip.addEventListener('pointerenter',()=>clearTimeout(this.hideTimer),options);this.tooltip.addEventListener('pointerleave',()=>this.hideDetails(),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.tooltip.addEventListener(event,e=>e.stopPropagation(),options);
    this.tooltip.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();this.hideDetails();}},options);
    this.tooltip.addEventListener('focusout',event=>{if(!this.tooltip.contains(event.relatedTarget))this.hideDetails();},options);
    window.addEventListener('resize',()=>{this.positionTooltip();this.positionJobMenu();},options);
    this.button.addEventListener('click',()=>this.setOpen(!this.open),options);document.querySelector('#close-population').addEventListener('click',()=>this.setOpen(false),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel','keydown','keyup'])this.root.addEventListener(event,e=>e.stopPropagation(),options);
    this.root.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();if(this.jobMenuWorkerId!=null)this.closeJobMenu();else this.setOpen(false);}},options);
    this.viewport.addEventListener('scroll',()=>{if(this.jobMenuWorkerId!=null)this.closeJobMenu({focus:false});if(this.open)this.renderVisible();},options);
    this.unsubscribePopulation=scene.workerSystem.subscribe(count=>this.updateCount(count));this.unsubscribeJobs=scene.workerSystem.jobs.onChange(()=>{this.lastRefresh=-Infinity;});
    this.unsubscribeAssets=scene.assets.subscribe(()=>{this.portraits.clear();for(const record of this.rows.values())record.signature=null;this.lastRefresh=-Infinity;});
    this.updateCount(scene.workerSystem.liveSubjects().length);this.setOpen(false);
  }
  // Sort and profession lists are rebuilt in the current language, keeping the selection.
  renderOptions(){
    const option=(value,name)=>{const node=element('option','',name);node.value=value;return node;},skills=element('optgroup'),sort=this.sort.value,profession=this.profession.value;skills.label=t('population.skills');skills.append(...Object.entries(SKILLS).map(([id,name])=>option(`skill:${id}`,name)));
    this.sort.replaceChildren(...['level','xp','name','profession','happiness'].map(value=>option(value,t(`population.sort.${value}`))),skills);
    this.profession.replaceChildren(option('all',t('buildingCategory.all')),...Object.entries(JOBS).map(([id,job])=>option(id,job.name)));
    if(sort)this.sort.value=sort;if(profession)this.profession.value=profession;
  }
  updateCount(count){document.querySelector('#population-tab-count').textContent=count;this.lastRefresh=-Infinity;}
  setOpen(value){
    this.open=!!value;if(!this.open)this.closeJobMenu({focus:false});this.root.classList.toggle('open',this.open);this.root.inert=!this.open;this.root.setAttribute('aria-hidden',String(!this.open));this.button.setAttribute('aria-expanded',String(this.open));
    if(this.open)this.refresh(true);else{clearTimeout(this.inspectTimer);this.hideDetails();for(const record of this.rows.values())record.controller.abort();this.list.replaceChildren();this.rows.clear();this.visibleOrder=null;}
  }
  portrait(worker){
    const key=worker.definition.id;if(this.portraits.has(key))return this.portraits.get(key);
    let url;try{if(this.scene.assets.usesSprite(worker.definition))url=this.scene.assets.previewURL(worker.definition);}catch{/* A readable portrait still works when an optional asset is unavailable. */}
    url??=humanPortrait();this.portraits.set(key,url);return url;
  }
  refresh(force=false){
    // While the job menu is open the list holds still, so the row under the pointer cannot move away.
    if(!this.open||this.jobMenuWorkerId!=null)return;const now=performance.now();if(!force&&now-this.lastRefresh<200)return;this.lastRefresh=now;
    const summary=populationSummary(this.scene.workerSystem.workers.values()),needs=this.scene.needs,homes=needs?.homes(),happiness=needs?worker=>needs.status(worker,homes)?.happiness??0:null;this.records=sortedPopulation(summary.residents,this.preferences,this.search.value,{happiness});
    // S13: the needs summary of the whole kingdom, above the list.
    const kingdom=needs?.summary(),needsLine=document.querySelector('#population-needs');if(needsLine&&kingdom){const text=kingdom.population?t('population.needs',{...kingdom,happiness:kingdom.happiness}):'';if(needsLine.textContent!==text)needsLine.textContent=text;needsLine.hidden=!text;}
    this.deaths=sortedPopulation(this.scene.workerSystem.recentDeaths(),this.preferences,this.search.value,{includeDead:true});
    this.displayRecords=[...this.records.map(worker=>({worker})),...(this.deaths.length?[{heading:true},...this.deaths.map(worker=>({worker}))]:[])];
    const text=t('population.summary',{total:summary.total,employed:summary.employed,unemployed:summary.unemployed});
    const output=document.querySelector('#population-summary');if(output.textContent!==text)output.textContent=text;
    document.querySelector('#population-empty').hidden=this.records.length>0||this.deaths.length>0;document.querySelector('#population-filter-count').textContent=`${t('population.shown',{count:this.records.length,total:summary.total})}${this.deaths.length?` · ${t('population.recentDeathsCount',{count:this.deaths.length})}`:''}`;
    this.list.style.height=`${this.displayRecords.length*POPULATION_ROW_HEIGHT}px`;this.renderVisible();this.refreshDetails();
  }
  createRow(id){
    const controller=new AbortController();
    const row=element('article','population-row');row.dataset.workerId=id;row.setAttribute('role','listitem');
    const select=element('button','population-select');select.type='button';const portrait=element('img','population-portrait');portrait.width=44;portrait.height=44;
    const portraitFrame=element('span','population-portrait-frame'),status=element('span','population-state-icon');portraitFrame.append(portrait,status);
    const text=element('span','population-row-text'),name=element('strong'),job=element('small'),progress=element('small','population-row-progress');text.append(name,job,progress);select.append(portraitFrame,text);
    const locate=element('button','population-locate',t('population.locate'));locate.type='button';locate.setAttribute('aria-label',t('population.locateId',{id}));
    const jobButton=element('button','population-job');jobButton.type='button';jobButton.setAttribute('aria-haspopup','menu');jobButton.setAttribute('aria-expanded','false');row.append(select,jobButton,locate);
    const options={signal:controller.signal};
    row.addEventListener('pointerenter',()=>this.showDetails(id,row),options);row.addEventListener('pointerleave',()=>this.deferHideDetails(),options);row.addEventListener('focus',()=>this.showDetails(id,row),options);
    select.addEventListener('focus',()=>this.showDetails(id,row),options);select.addEventListener('blur',event=>{if(!this.tooltip.contains(event.relatedTarget))this.deferHideDetails();},options);
    select.addEventListener('click',()=>{clearTimeout(this.inspectTimer);this.hideDetails();if(!this.selectResident(id))return;this.inspectTimer=setTimeout(()=>{const worker=this.resident(id);if(worker&&this.open)this.scene.unitPanel.open(worker,{management:true});},240);},options);
    select.addEventListener('dblclick',()=>this.locateResident(id),options);locate.addEventListener('click',()=>this.locateResident(id),options);
    jobButton.addEventListener('click',()=>{if(this.jobMenuWorkerId===id)this.closeJobMenu();else this.openJobMenu(id,jobButton);},options);
    return {row,portrait,name,job,progress,select,locate,jobButton,status,controller};
  }
  renderVisible(){
    const range=populationWindow(this.displayRecords.length,this.viewport.scrollTop,this.viewport.clientHeight||300),needed=new Set(),ordered=[];
    for(let index=range.start;index<range.end;index++){
      const item=this.displayRecords[index];
      if(item.heading){
        const key='@recent-deaths';needed.add(key);let record=this.rows.get(key);
        if(!record){const row=element('h3','population-deaths-heading');row.dataset.workerId=key;record={row,controller:new AbortController()};this.rows.set(key,record);}
        record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;record.row.textContent=t('population.recentDeaths',{count:this.deaths.length});ordered.push(record.row);continue;
      }
      const worker=item.worker;needed.add(worker.id);let record=this.rows.get(worker.id);
      if(!record){record=this.createRow(worker.id);this.rows.set(worker.id,record);this.list.append(record.row);}
      ordered.push(record.row);
      record.row.style.top=`${index*POPULATION_ROW_HEIGHT}px`;
      const skill=this.preferences.sortBy.startsWith('skill:')?this.preferences.sortBy.slice(6):null,warnings=residentWarnings(this.scene,worker),signature=JSON.stringify([worker.name,worker.profession,worker.experience,worker.definition.id,worker.workState,warnings,skill,skill?worker.skills[skill]:null,worker.isAlive,language()]);if(signature===record.signature)continue;record.signature=signature;
      record.row.classList.toggle('is-dead',!worker.isAlive);record.row.dataset.populationState=worker.isAlive?'living':'dead';record.row.tabIndex=worker.isAlive?-1:0;record.select.disabled=!worker.isAlive;record.locate.disabled=!worker.isAlive;
      record.name.textContent=worker.name;record.job.textContent=JOBS[worker.profession]?.name??worker.profession;
      const e=worker.experience;record.progress.textContent=`${t('unit.skillLevel',{level:e.level})} · ${skill?`${SKILLS[skill]} ${worker.skills[skill]?.level??1}`:e.level===e.maxLevel?t('unit.xpMax'):t('unit.skillXp',{current:Math.round(e.currentXP*100)/100,next:e.xpToNextLevel})}`;
      record.portrait.src=this.portrait(worker);record.portrait.alt=t('population.portrait',{name:worker.name});record.portrait.style.backgroundColor=professionColor(worker.profession);record.select.setAttribute('aria-label',t('population.inspect',{name:worker.name}));
      record.status.hidden=!warnings.length;record.status.textContent=warnings[0]?.icon??'';record.status.title=[localized(`work.state.${worker.workState}`,worker.workState),...warnings.map(warning=>warning.text)].join(' · ');
      record.locate.setAttribute('aria-label',t('population.locateName',{name:worker.name}));
      const unemployed=worker.profession==='idle',jobLabel=t(unemployed?'population.assignJob':'population.changeJob');record.jobButton.disabled=!worker.isAlive;record.jobButton.classList.toggle('is-unemployed',unemployed);
      record.jobButton.textContent=unemployed?'⚒+':'⇄';record.jobButton.title=jobLabel;record.jobButton.setAttribute('aria-label',`${jobLabel}: ${worker.name}`);
    }
    for(const [id,record]of this.rows)if(!needed.has(id)){if(this.tooltipWorkerId===id)this.hideDetails();record.controller.abort();record.row.remove();this.rows.delete(id);}
    const order=ordered.map(row=>row.dataset.workerId).join('|');if(order!==this.visibleOrder){this.visibleOrder=order;this.list.replaceChildren(...ordered);}
    this.positionTooltip();
  }
  openJobMenu(id,anchor){
    const worker=this.resident(id);if(!worker)return false;this.closeJobMenu({focus:false});clearTimeout(this.inspectTimer);this.hideDetails();
    this.jobMenuWorkerId=id;this.jobMenuAnchor=anchor;anchor.setAttribute('aria-expanded','true');this.jobMenu.setAttribute('aria-label',t('population.jobMenu',{name:worker.name}));
    const item=(text,{value,checked=false,full=false,className=''}={})=>{const node=element('button',`population-job-item${full?' is-full':''}${className?` ${className}`:''}`);node.type='button';node.dataset.job=value;node.setAttribute('role',value==='idle'?'menuitem':'menuitemradio');if(value!=='idle')node.setAttribute('aria-checked',String(checked));node.disabled=checked;node.tabIndex=-1;
      const mark=element('span','population-job-check',checked?'✓':'');node.append(mark,element('span','population-job-name',text));node.addEventListener('click',()=>this.chooseJob(id,value));return node;};
    const items=jobChoices(this.scene,worker).map(choice=>{const node=item(choice.free==null?choice.name:t(choice.full?'population.jobFull':'population.jobFree',{name:choice.name,count:choice.free}),{value:choice.id,checked:choice.current,full:choice.full});node.style.setProperty('--job-color',choice.color);return node;});
    const nodes=[...items];if(worker.profession!=='idle')nodes.push(element('hr','population-job-separator'),item(t('population.unemploy'),{value:'idle',className:'population-job-unemploy'}));
    this.jobMenu.replaceChildren(...nodes);this.jobMenu.hidden=false;this.positionJobMenu();
    (this.jobMenu.querySelector('.population-job-item:not(:disabled)'))?.focus();return true;
  }
  positionJobMenu(){
    if(this.jobMenu.hidden||!this.jobMenuAnchor?.isConnected)return;const a=this.jobMenuAnchor.getBoundingClientRect(),width=Math.min(230,innerWidth-16);this.jobMenu.style.width=`${width}px`;
    const height=Math.min(this.jobMenu.scrollHeight,innerHeight-24);this.jobMenu.style.maxHeight=`${innerHeight-24}px`;
    this.jobMenu.style.left=`${Math.max(8,Math.min(innerWidth-width-8,a.right-width))}px`;this.jobMenu.style.top=`${a.bottom+4+height>innerHeight-8?Math.max(12,a.top-4-height):a.bottom+4}px`;
  }
  jobMenuKey(event){
    if(event.code==='Escape'){event.preventDefault();this.closeJobMenu();return;}
    if(event.code!=='ArrowDown'&&event.code!=='ArrowUp')return;event.preventDefault();
    const items=[...this.jobMenu.querySelectorAll('.population-job-item:not(:disabled)')],i=items.indexOf(document.activeElement);
    items[(i+(event.code==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
  }
  chooseJob(id,profession){const worker=this.resident(id);if(worker&&worker.profession!==profession)changeProfession(this.scene,worker,profession);this.closeJobMenu();}
  closeJobMenu({focus=true}={}){
    if(this.jobMenuWorkerId==null)return;const anchor=this.jobMenuAnchor;this.jobMenuWorkerId=null;this.jobMenuAnchor=null;this.jobMenu.hidden=true;this.jobMenu.replaceChildren();
    anchor?.setAttribute('aria-expanded','false');if(focus&&anchor?.isConnected)anchor.focus();this.refresh(true);
  }
  resident(id){const worker=this.scene.workerSystem.workers.get(id);return worker?.isAlive&&worker.isSubject!==false?worker:null;}
  detailWorker(id){const worker=this.scene.workerSystem.workers.get(id);return worker&&worker.isSubject!==false&&(worker.isAlive||this.scene.workerSystem.recentDeaths().some(dead=>dead.id===id))?worker:null;}
  selectResident(id,duration=Infinity){const worker=this.resident(id);if(!worker)return false;this.selectedId=id;this.selectionExpires=this.scene.gameTime.totalElapsed+duration;this.refreshSelection();return true;}
  locateResident(id){
    clearTimeout(this.inspectTimer);this.hideDetails();const worker=this.resident(id);if(!worker)return false;
    if(!this.scene.worldCamera.locate(worker)){this.clearSelection();this.scene.setStatus(t('population.outOfSight'));return false;}
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
      const title=element('h3','',data.name),profession=element('p','',t('population.overallLevel',{profession:data.profession,level:data.level})),xp=element('p','',data.level===data.maxLevel?t('unit.xpMax'):t('population.xp',{current:this.format(data.currentXP),next:data.xpToNextLevel,total:this.format(data.totalXP)}));
      const job=element('p','',`${data.job} · ${data.task}`),workplace=element('p','',t('population.workplace',{place:data.workplace})),talent=element('p','population-talent',`${t('population.talent',{talent:data.talent})}${data.hasTalent?' · +20% XP':''}`);
      const skills=data.skills.map(skill=>{const row=element('div',`population-skill${skill.talented?' talented-skill':''}`);row.dataset.skill=skill.id;row.append(element('strong','',`${skill.name}${skill.talented?' ★':''}`),element('span','',t('unit.skillLevel',{level:skill.level})),element('small','',skill.level===skill.maxLevel?t('unit.xpMax'):t('unit.skillXp',{current:this.format(skill.currentXP),next:skill.xpToNextLevel})));const bar=element('progress');bar.max=skill.xpToNextLevel||1;bar.value=skill.level===skill.maxLevel?1:skill.currentXP;bar.setAttribute('aria-label',`${skill.name} XP`);row.append(bar);return row;});
      this.tooltip.replaceChildren(title,profession,xp,job,workplace,talent,...data.warnings.map(warning=>element('p','population-warning',warning.text)),element('h4','',t('unit.skills')),...skills);this.tooltip.scrollTop=scroll;
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
  destroy(){this.closeJobMenu({focus:false});this.jobMenu.remove();this.controller.abort();this.unsubscribePopulation();this.unsubscribeJobs();this.unsubscribeAssets();this.setOpen(false);this.portraits.clear();this.selection.destroy();}
}
