import { t } from '../i18n/index.js';
import { tutorialProgress,nearestRock,tutorialPlacement,markedRocks,freeBubbleSpot,rememberSpeed } from '../systems/Tutorial.js';
import { tileCenter,gridToWorld } from '../game/isometric.js';
import { FARM_PLOT_CAPACITY } from '../data/farmPlots.js';
import { TUTORIAL_KING_MS } from '../data/tutorial.js';
import { TIPS } from '../data/tips.js';
import { foodDays } from '../data/foodOutlook.js';

// E3 tutorial (plan m-e3-tutorial-sipka): a bubble with one sentence and an arrow at the place to click. The map is never
// blocked. "Show me" opens the right panel or menu, "Skip" moves on, × ends the tutorial (Settings can bring it back).
const KEY='newgame.tutorial',SPEED_KEY='newgame.tutorial.speedSeen';
const TIPS_KEY='newgame.tips',SEEN_KEY='newgame.tipsSeen';
export const tipsEnabled=(storage=globalThis.localStorage)=>{try{return storage?.getItem(TIPS_KEY)!=='off';}catch{return true;}};
export const tutorialEnabled=(storage=globalThis.localStorage)=>{try{return storage?.getItem(KEY)!=='off';}catch{return true;}};
export function setTutorialEnabled(on,storage=globalThis.localStorage){try{storage?.setItem(KEY,on?'on':'off');}catch{/* session only */}}
const visible=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
// m-ui-prekryvy-076 (report 0.76.0 point 4): the windows the bubble (tutorial step or tip) must never cover.
export const TUTORIAL_WINDOWS='#buildings-panel,#population-panel,#population-job-menu,#policy-card,#employment-panel,#settings-panel,#royal-goals,#unit-command-bar,dialog[open]';
// A sliding window (the Population panel moves in with `transform`) measured mid-animation is still partly off screen:
// while a transition or animation runs, take the box it comes to rest at (its transform's translation taken away), so
// the bubble is not placed where the window is about to be. Pure: `translate` is {x,y} of the current transform.
export function restingRect(r,translate={x:0,y:0}){
  const dx=translate?.x||0,dy=translate?.y||0;if(!dx&&!dy)return r;
  return {left:r.left-dx,right:r.right-dx,top:r.top-dy,bottom:r.bottom-dy,width:r.width,height:r.height,x:r.left-dx,y:r.top-dy};
}
export const restingBox=e=>restingRect(e.getBoundingClientRect(),movingTranslation(e));
function movingTranslation(e){
  if(!e.getAnimations?.().some(a=>(a.playState==='running'||a.playState==='pending')&&(a.transitionProperty==null||a.transitionProperty==='transform'||a.transitionProperty==='all')))return null;
  try{const tr=getComputedStyle(e).transform;if(!tr||tr==='none')return null;const m=new DOMMatrixReadOnly(tr);return {x:m.m41,y:m.m42};}catch{return null;}
}
export function openWindowRects(doc=globalThis.document,vw=globalThis.innerWidth,vh=globalThis.innerHeight){
  return [...(doc?.querySelectorAll?.(TUTORIAL_WINDOWS)??[])].filter(visible).map(e=>restingRect(e.getBoundingClientRect(),movingTranslation(e))).filter(r=>r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<vw&&r.top<vh);
}
export class TutorialGuide {
  constructor(scene,{doc=globalThis.document}={}){
    this.scene=scene;this.doc=doc;this.active=false;this.seen=new Set();this.skipped=new Set();this.lastCheck=-Infinity;this.currentId=null;
    try{if(localStorage.getItem(SPEED_KEY))this.seen.add('speed');}catch{/* not remembered */}
    this.controller=new AbortController();const options={signal:this.controller.signal};
    this.bubble=doc.createElement('div');this.bubble.id='tutorial-bubble';this.bubble.className='tutorial-bubble';this.bubble.setAttribute('role','status');this.bubble.setAttribute('aria-live','polite');this.bubble.hidden=true;
    this.text=doc.createElement('p');this.text.className='tutorial-text';this.count=doc.createElement('small');this.count.className='tutorial-count';
    const actions=doc.createElement('div');actions.className='tutorial-actions';
    this.showButton=this.button('tutorial-show',()=>this.showMe());this.nextButton=this.button('tutorial-next',()=>this.next());this.skipButton=this.button('tutorial-skip',()=>this.skip());
    this.closeButton=this.button('tutorial-close',()=>this.end());this.closeButton.textContent='×';
    actions.append(this.showButton,this.nextButton,this.skipButton);this.bubble.append(this.closeButton,this.count,this.text,actions);
    this.arrow=doc.createElement('div');this.arrow.id='tutorial-arrow';this.arrow.className='tutorial-arrow';this.arrow.setAttribute('aria-hidden','true');this.arrow.hidden=true;
    this.done=doc.createElement('div');this.done.className='tutorial-done';this.done.textContent='✓';this.done.hidden=true;
    for(const e of ['pointerdown','mousedown','mouseup','click','wheel'])this.bubble.addEventListener(e,ev=>ev.stopPropagation(),options);
    doc.body.append(this.bubble,this.arrow,this.done);
    // m-tutorial-v2 bugs 6–7: the progress also follows the world on a timer, so a step ends even on frames where the
    // scene's update returns early (a paused or blocked frame).
    this.timer=globalThis.setInterval?.(()=>{if(this.active)this.update();},500);this.timer?.unref?.();
    // Settings: switch the tutorial off or back on (it resumes at the first step not done yet).
    this.tipSetting=doc.querySelector('#settings-tips');if(this.tipSetting){this.tipSetting.checked=tipsEnabled();this.tipSetting.addEventListener('change',()=>{try{localStorage.setItem(TIPS_KEY,this.tipSetting.checked?'on':'off');}catch{/* session */}if(!this.tipSetting.checked)this.closeTip();},options);}
    try{this.tipsSeen=new Set(JSON.parse(localStorage.getItem(SEEN_KEY)??'[]'));}catch{this.tipsSeen=new Set();}this.tip=null;this.lastTipCheck=-Infinity;
    this.setting=doc.querySelector('#settings-tutorial');if(this.setting){this.setting.checked=tutorialEnabled();this.setting.addEventListener('change',()=>{setTutorialEnabled(this.setting.checked);if(this.setting.checked){this.skipped.clear();this.resume();}else{this.active=false;this.hide();}},options);}
  }
  button(cls,action){const b=this.doc.createElement('button');b.type='button';b.className=cls;b.addEventListener('click',action,{signal:this.controller.signal});return b;}
  progress(){if(rememberSpeed(this.scene,this.seen))try{localStorage.setItem(SPEED_KEY,'1');}catch{/* session */}return tutorialProgress(this.scene,{seen:this.seen,skipped:this.skipped});}
  // A new game from the setup starts it; a loaded game resumes it while it is switched on and not finished.
  start(){if(!tutorialEnabled())return false;this.active=true;this.startedAt=performance.now();this.update(true);return true;}
  resume(){if(tutorialEnabled()&&!this.progress().allDone){this.active=true;this.startedAt=performance.now();this.update(true);}}
  end(){if(this.tip){this.closeTip();try{localStorage.setItem(TIPS_KEY,'off');}catch{/* session */}if(this.tipSetting)this.tipSetting.checked=false;return;}this.active=false;setTutorialEnabled(false);if(this.setting)this.setting.checked=false;this.hide();}
  hide(){this.bubble.hidden=true;this.arrow.hidden=true;}
  next(){if(this.tip){this.closeTip();return;}const p=this.progress();if(p.current){this.seen.add(p.current.id);if(p.current.id==='speed')try{localStorage.setItem(SPEED_KEY,'1');}catch{/* session */}}this.update(true);}
  skip(){const p=this.progress();if(p.current)this.skipped.add(p.current.id);this.update(true);}
  pendingBuilding(step){const types=new Set(this.scene.buildings.map(b=>b.type));return step.buildingIds?.find(id=>!types.has(id))??step.buildingIds?.[0];}
  showMe(){
    if(this.tip){const wiki=this.tip.wiki;this.closeTip();if(wiki&&this.scene.wikiPanel)this.scene.wikiPanel.open(wiki);else this.scene.gettingStarted?.show();return;}
    const s=this.scene,step=this.progress().current;if(!step)return;
    if(step.check==='job'){s.populationSidebar?.setOpen(true);return;}
    if(step.id==='speed'){s.speedControls?.setSpeed(2);this.next();return;}
    if(step.id==='stone'){if(s.rockMiningTool&&!s.rockMiningTool.enabled)s.rockMiningTool.activate(false);else this.doc.querySelector('#mark-rocks')?.focus();this.update(true);return;}
    if(step.id==='king'){s.worldCamera?.locate?.(s.character??{});return;}
    const id=this.pendingBuilding(step);if(id)s.gettingStarted?.showBuilding(id);
  }
  // Where the arrow points: a DOM element (selector or element) or a world point; null = no arrow (the bubble explains).
  target(step){
    const s=this.scene,q=sel=>this.doc.querySelector(sel);
    if(step.id==='king')return {world:s.player?{x:s.player.x,y:s.player.y-40}:null};
    // Builder, Hauler, Miner: the Population tab, then a resident's job button, then the profession in the job menu.
    // The whole panel is kept clear (m-tutorial-v2 point 2): the arrow and the bubble sit beside it.
    if(step.check==='job'){
      const menu=q('#population-job-menu');if(visible(menu))return {el:menu.querySelector(`[data-job="${step.job}"]`),avoid:[menu,q('#population-panel')]};
      const panel=q('#population-panel');
      if(s.populationSidebar?.open)return {el:q('.population-row .population-job.is-unemployed')??q('.population-row .population-job'),avoid:[panel]};
      return {el:q('#population-tab')};
    }
    // Stone (point 5): once "Mark to clear" is on, the arrow points down at the rock nearest to the Castle.
    if(step.id==='stone'&&s.rockMiningTool?.enabled&&!s.rockMiningTool.remove){const rock=this.rockTile();if(rock){const p=tileCenter(rock);return {world:{x:p.x,y:p.y-10},from:'above'};}}
    // m-kamenolom-u-hradu: with the Quarry chosen in the build menu, the arrow points down at the free Stone Deposit
    // nearest to the Castle (every new world has one 8–16 tiles out).
    if(step.id==='stone'&&s.buildMode&&s.selectedBuilding?.id==='quarry'){const d=this.quarryDeposit();if(d){const p=gridToWorld(d.x+1,d.y+1);return {world:{x:p.x,y:p.y-30},from:'above',placing:true,quarry:true};}}
    if(step.target)return {el:q(step.target)};
    const id=this.pendingBuilding(step);if(!id)return {};
    if(s.buildMode&&s.selectedBuilding?.id===id)return {placing:true};
    const panel=q('#buildings-panel');if(!visible(panel))return {el:q('#buildings-tab')};
    const choice=this.doc.getElementById(`${id}-choice`);
    if(visible(choice)){
      // A card scrolled out of the strip is brought into view first, so the arrow never points past the edge.
      const list=q('#building-options'),box=list?.getBoundingClientRect(),r=choice.getBoundingClientRect();
      if(box&&(r.left<box.left-1||r.right>box.right+1)&&this.scrolledTo!==id){this.scrolledTo=id;choice.scrollIntoView({inline:'center',block:'nearest'});}
      return {el:choice};
    }
    const cat=s.objectRegistry?.get(id)?.buildingCategory;return {el:cat?q(`[data-building-category="${cat}"]`):null};
  }
  quarryDeposit(){
    const s=this.scene,mining=s.naturalResources?.mining;if(!mining)return null;const c=mining.startCentre?.()??{x:50,y:50};
    return mining.deposits().filter(d=>d.type==='stone_deposit'&&d.natural.remaining>0&&d.natural.boundBuildingId==null).sort((a,b)=>Math.hypot(a.x+1-c.x,a.y+1-c.y)-Math.hypot(b.x+1-c.x,b.y+1-c.y)||a.y-b.y||a.x-b.x)[0]??null;
  }
  // The rock the stone step points at: kept while it is still an unmarked rock, otherwise the nearest one to the Castle.
  rockTile(){
    const s=this.scene,grid=s.terrainGrid;if(!grid)return null;const marked=new Set(markedRocks(s).map(r=>`${r.tile.x},${r.tile.y}`));
    const ok=t=>grid[t.y]?.[t.x]===1&&!marked.has(`${t.x},${t.y}`)&&(s.fog?.isVisibleTile?.(t)??true);
    if(this.rock&&ok(this.rock))return this.rock;
    this.rock=nearestRock(grid,s.workerSystem?.origin?.()??{x:50,y:50},{visible:t=>s.fog?.isVisibleTile?.(t)??true,skip:t=>marked.has(`${t.x},${t.y}`)});return this.rock;
  }
  screenPoint(world){
    const cam=this.scene.cameras?.main,canvas=this.scene.game?.canvas?.getBoundingClientRect?.();if(!cam||!canvas||!world)return null;
    return {x:canvas.left+(world.x-cam.worldView.x)*cam.zoom*canvas.width/cam.width,y:canvas.top+(world.y-cam.worldView.y)*cam.zoom*canvas.height/cam.height,canvas};
  }
  update(force=false){
    if(!this.active){this.updateTips();return;}const now=performance.now();if(!force&&now-this.lastCheck<150)return;this.lastCheck=now;
    if(this.scene.gameOver||!tutorialEnabled()){this.hide();return;}
    const p=this.progress();
    if(p.current?.id==='king'&&now-(this.startedAt??now)>=TUTORIAL_KING_MS)this.seen.add('king');
    if(this.currentId&&p.current?.id!==this.currentId&&!this.skipped.has(this.currentId))this.flashDone();
    if(!p.current){this.active=false;this.hide();this.scene.eventFeed?.push?.('tutorial-done',t('tutorial.finished'),{important:true});this.currentId=null;return;}
    this.currentId=p.current.id;
    const target=this.target(p.current);
    const key=target.quarry?'tutorial.step.stoneQuarry':target.placing?'tutorial.place':target.from==='above'&&p.current.id==='stone'?'tutorial.step.stoneMark':`tutorial.step.${p.current.id}`;
    this.text.textContent=t(key,{name:this.scene.objectRegistry?.get(this.pendingBuilding(p.current)??'')?.name??'',plots:FARM_PLOT_CAPACITY});
    this.count.textContent=t('tutorial.count',{step:p.doneCount+1,total:p.total});
    this.showButton.textContent=t('tutorial.show');this.skipButton.textContent=t('tutorial.skip');this.nextButton.textContent=t('tutorial.next');this.closeButton.title=this.closeButton.ariaLabel=t('tutorial.close');
    this.nextButton.hidden=!p.current.optional&&!['king','speed'].includes(p.current.id);this.showButton.hidden=p.current.id==='king'||!!target.placing;
    this.bubble.hidden=false;this.place(target);
  }
  place(target){
    const vw=innerWidth,vh=innerHeight;let point=null,rect=null;
    // A target inside a scrolling panel (e.g. a free resident's job button low in a long Population list) may be
    // scrolled out of the panel: bring it into view once per target, so the arrow points at something visible.
    if(target.el&&target.avoid&&visible(target.el)&&this.scrolledTarget!==target.el){
      const r=target.el.getBoundingClientRect(),clip=[target.avoid].flat().filter(visible).map(e=>e.getBoundingClientRect());
      if(clip.some(c=>r.left<c.right&&r.right>c.left&&(r.top<c.top||r.bottom>c.bottom))){target.el.scrollIntoView?.({block:'nearest',inline:'nearest'});this.scrolledTarget=target.el;}
    }
    if(target.el&&visible(target.el)){rect=target.el.getBoundingClientRect();point={x:rect.left+rect.width/2,y:rect.top+rect.height/2};}
    else if(target.world){const sp=this.screenPoint(target.world);if(sp)point={x:sp.x,y:sp.y};}
    if(!point){this.arrow.hidden=true;this.positionBubble(null);return;}
    // m-tutorial-v2 point 2: arrow and bubble beside the target (and beside the panel it lives in), never over it.
    const w=Math.min(300,vw-24);this.bubble.style.width=`${w}px`;const h=this.bubble.offsetHeight||90;
    const boxes=[target.avoid??[]].flat().filter(visible).map(restingBox);
    const avoid=boxes.length?{left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))}:null;
    const {arrow,bubble}=tutorialPlacement({point,rect,avoid,from:target.from??null,vw,vh,bubble:{w,h},windows:openWindowRects(this.doc,vw,vh)});
    this.arrow.hidden=false;this.arrow.style.left=`${Math.round(arrow.x)}px`;this.arrow.style.top=`${Math.round(arrow.y)}px`;this.arrow.style.transform=`translate(-50%,-50%) rotate(${arrow.angle}rad)`;this.arrow.classList.toggle('offscreen',arrow.off);
    this.bubble.style.left=`${bubble.x}px`;this.bubble.style.top=`${bubble.y}px`;
  }
  positionBubble(anchor){
    const b=this.bubble,w=Math.min(300,innerWidth-24);b.style.width=`${w}px`;const h=b.offsetHeight||90;
    if(anchor){b.style.left=`${Math.round(Math.max(12,Math.min(innerWidth-w-12,anchor.x)))}px`;b.style.top=`${Math.round(Math.max(70,Math.min(innerHeight-h-12,anchor.y)))}px`;return;}
    const at=freeBubbleSpot({x:16,y:Math.max(70,innerHeight-h-120),w,h,vw:innerWidth,vh:innerHeight,blocked:openWindowRects(this.doc),anchor:{x:16,y:innerHeight}});
    b.style.left=`${Math.round(at.x)}px`;b.style.top=`${Math.round(at.y)}px`;
  }
  flashDone(){this.done.hidden=false;this.done.classList.remove('pop');void this.done.offsetWidth;this.done.classList.add('pop');clearTimeout(this.doneTimer);this.doneTimer=setTimeout(()=>{this.done.hidden=true;},900);}
  // ---- Tips (plan m-e3-tipy) ----
  tipHolds(id){
    const s=this.scene;
    switch(id){
      case 'night':return !!s.dayNight?.isNight?.();
      case 'food':return foodDays(s.foodSystem)<3;
      case 'unemployed':return (s.workerSystem?.liveSubjects?.()??[]).filter(w=>w.profession==='idle').length>3;
      case 'material':return (s.diagnostics?.active?.()??[]).some(i=>i.reason==='waitingMaterial');
      case 'cat':return [...(s.domestic?.cats?.values?.()??[])].some(c=>c.state==='stray'&&!c.leaving);
      case 'dog':return [...(s.domestic?.dogs?.values?.()??[])].some(d=>d.state==='stray');
      case 'caravan':return !!s.caravans?.active;
      case 'winter':return s.seasons?.enabled!==false&&s.seasons?.season==='Winter';
      case 'rats':return (s.domestic?.foodLocations?.()??[]).some(l=>(s.domestic.ratsAt(l.id)??0)>=1)&&![...(s.domestic?.cats?.values?.()??[])].some(c=>c.buildingId!=null);
      default:return false;
    }
  }
  updateTips(){
    const now=performance.now();if(this.tip&&!tipsEnabled())this.closeTip(false);if(this.tip){this.placeTip();return;}
    if(now-this.lastTipCheck<1000||this.scene.gameOver||!tipsEnabled())return;this.lastTipCheck=now;
    const tip=TIPS.find(tip=>!this.tipsSeen.has(tip.id)&&this.tipHolds(tip.id));if(!tip)return;
    this.tip=tip;this.text.textContent=t(`tips.${tip.id}`);this.count.textContent=t('tips.label');
    this.showButton.hidden=false;this.showButton.textContent=t('tips.more');this.nextButton.hidden=false;this.nextButton.textContent=t('tips.gotIt');this.skipButton.hidden=true;this.closeButton.title=this.closeButton.ariaLabel=t('tips.off');
    this.bubble.classList.add('is-tip');this.bubble.hidden=false;this.placeTip();
  }
  placeTip(){
    const tip=this.tip,s=this.scene;if(!tip)return;
    if(tip.target==='cat'||tip.target==='dog'){const a=[...(s.domestic?.[`${tip.target}s`]?.values?.()??[])].find(x=>x.state==='stray');const v=a?.view;this.place(v?{world:{x:v.x,y:v.y-20}}:{});}
    else this.place(tip.target?{el:this.doc.querySelector(tip.target)}:{});
  }
  // "Got it" marks the tip seen; × switches tips off; "More" opens the help (the checklist and its answers).
  closeTip(seen=true){if(!this.tip)return;if(seen){this.tipsSeen.add(this.tip.id);try{localStorage.setItem(SEEN_KEY,JSON.stringify([...this.tipsSeen]));}catch{/* session */}}this.tip=null;this.bubble.classList.remove('is-tip');this.hide();}
  relabel(){this.update(true);}
  destroy(){this.controller.abort();globalThis.clearInterval?.(this.timer);clearTimeout(this.doneTimer);this.bubble.remove();this.arrow.remove();this.done.remove();}
}
