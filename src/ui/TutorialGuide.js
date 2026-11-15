import { t } from '../i18n/index.js';
import { tutorialProgress,nearestRock,tutorialPlacement,markedRocks,freeBubbleSpot,rememberSpeed,tutorialQuarryDeposit,depositCentre } from '../systems/Tutorial.js';
import { tileCenter,gridToWorld } from '../game/isometric.js';
import { FARM_PLOT_CAPACITY } from '../data/farmPlots.js';
import { TUTORIAL_KING_MS } from '../data/tutorial.js';
import { TipQueue } from './tipQueue.js';
import { DAY_DURATION } from '../systems/GameTimeSystem.js';
import { foodDays } from '../data/foodOutlook.js';
import { GUIDE,guideText } from '../data/guide.js';
import { TIP_GAP_SECONDS } from '../data/tips.js';
import { language } from '../i18n/index.js';

// E3 tutorial (plan m-e3-tutorial-sipka): a bubble with one sentence and an arrow at the place to click. The map is never
// blocked. "Show me" opens the right panel or menu, "Skip" moves on, × ends the tutorial (Settings can bring it back).
const KEY='newgame.tutorial',SPEED_KEY='newgame.tutorial.speedSeen';
const TIPS_KEY='newgame.tips',SEEN_KEY='newgame.tipsSeen';
// Owner 15 Nov 2026: the start guide (Wiki arrow, Getting started arrow) is shown once per browser.
const INTRO_KEY='newgame.guide.intro';
export const introDone=(storage=globalThis.localStorage)=>{try{return storage?.getItem(INTRO_KEY)==='done';}catch{return false;}};
export const tipsEnabled=(storage=globalThis.localStorage)=>{try{return storage?.getItem(TIPS_KEY)!=='off';}catch{return true;}};
export const tutorialEnabled=(storage=globalThis.localStorage)=>{try{return storage?.getItem(KEY)!=='off';}catch{return true;}};
export function setTutorialEnabled(on,storage=globalThis.localStorage){try{storage?.setItem(KEY,on?'on':'off');}catch{/* session only */}}
const visible=el=>!!el&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
// m-ui-prekryvy-076 (report 0.76.0 point 4): the windows the bubble (tutorial step or tip) must never cover.
export const TUTORIAL_WINDOWS='#buildings-panel,#population-panel,#population-job-menu,#policy-card,#employment-panel,#settings-panel,#royal-goals,#unit-command-bar,#help-dialog,dialog[open]';
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
export function openWindowRects(doc=globalThis.document,vw=globalThis.innerWidth,vh=globalThis.innerHeight,selector=TUTORIAL_WINDOWS){
  return [...(doc?.querySelectorAll?.(selector)??[])].filter(visible).map(e=>restingRect(e.getBoundingClientRect(),movingTranslation(e))).filter(r=>r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<vw&&r.top<vh);
}
// m-tipy-mimo-listu (report 0.83.0 point 2): a tip also keeps clear of the HUD – the top bar (resources, speed, day),
// the side tabs, Settings and the Dev tool with its panel, the camera buttons ("Follow the king"), the bottom bar, the
// Notices bar, the event lines and the minimap – on top of the open windows the tutorial bubble avoids.
export const TIP_CLEAR='.inventory,.population-tab,#settings-button,#dev-tool-button,#dev-balance-panel,#follow-king,#dismount,.buildings-bar,#notices-panel,#event-feed,#minimap,#night-speed-tip,#kingdom-bar';
export const tipWindowRects=(doc=globalThis.document,vw=globalThis.innerWidth,vh=globalThis.innerHeight)=>[...openWindowRects(doc,vw,vh),...openWindowRects(doc,vw,vh,TIP_CLEAR)];
// The highest a tip may sit: below the top bar (its box, when it spans the top of the screen), never above 70 px.
export function tipTop(topBar,{gap=8,min=70}={}){return Math.max(min,topBar&&topBar.top<min?Math.ceil(topBar.bottom+gap):0);}
// Pure (unit tested): where a tip's arrow and bubble go. Like tutorialPlacement, with the HUD boxes as windows and the
// top bar as the upper limit; without a point the bubble takes the free spot nearest to the bottom left corner.
export function tipPlacement({point=null,rect=null,from=null,vw,vh,bubble,windows=[],topBar=null,arrowLength}){
  const top=tipTop(topBar),all=topBar?[topBar,...windows]:windows;
  if(!point){const at=freeBubbleSpot({x:16,y:Math.max(top,vh-bubble.h-120),w:bubble.w,h:bubble.h,vw,vh,blocked:all,anchor:{x:16,y:vh},top});return {arrow:null,bubble:{x:Math.round(at.x),y:Math.round(at.y)}};}
  return tutorialPlacement({point,rect,from,vw,vh,bubble,windows:all,top,arrowLength});
}
const box=r=>r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;
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
    // m-tutorial-v3 (point 74): arrow and bubble are measured again at once when the window is resized or a panel has
    // finished opening or closing, not only on the next timer tick.
    const relayout=()=>{if(this.active)this.update(true);else if(this.tip)this.placeTip();};
    globalThis.addEventListener?.('resize',relayout,options);
    doc.addEventListener?.('transitionend',e=>{if(e.target?.matches?.(TUTORIAL_WINDOWS)||this.tip&&e.target?.matches?.(TIP_CLEAR))relayout();},options);
    // Settings: switch the tutorial off or back on (it resumes at the first step not done yet).
    this.tipSetting=doc.querySelector('#settings-tips');if(this.tipSetting){this.tipSetting.checked=tipsEnabled();this.tipSetting.addEventListener('change',()=>{try{localStorage.setItem(TIPS_KEY,this.tipSetting.checked?'on':'off');}catch{/* session */}if(!this.tipSetting.checked)this.closeTip();},options);}
    let seen=[];try{seen=JSON.parse(localStorage.getItem(SEEN_KEY)??'[]');}catch{/* none */}this.tips=new TipQueue({seen:Array.isArray(seen)?seen:[]});this.lastTipCheck=-Infinity;
    this.bubble.addEventListener('pointerenter',()=>{this.hovered=true;},options);this.bubble.addEventListener('pointerleave',()=>{this.hovered=false;},options);
    this.setting=doc.querySelector('#settings-tutorial');if(this.setting){this.setting.checked=tutorialEnabled();this.setting.addEventListener('change',()=>{setTutorialEnabled(this.setting.checked);if(this.setting.checked){this.skipped.clear();this.resume();}else{this.active=false;this.hide();}},options);}
  }
  // The tip in the bubble (TipQueue.current); smoke scripts may set it directly.
  get tip(){return this.tips?.current??null;}
  set tip(value){if(this.tips)this.tips.current=value??null;}
  get tipsSeen(){return this.tips.seen;}
  button(cls,action){const b=this.doc.createElement('button');b.type='button';b.className=cls;b.addEventListener('click',action,{signal:this.controller.signal});return b;}
  progress(){if(rememberSpeed(this.scene,this.seen))try{localStorage.setItem(SPEED_KEY,'1');}catch{/* session */}return tutorialProgress(this.scene,{seen:this.seen,skipped:this.skipped});}
  // A new game from the setup starts it; a loaded game resumes it while it is switched on and not finished.
  start(){if(!tutorialEnabled()||introDone())return false;this.active=true;this.startedAt=performance.now();this.update(true);return true;}
  resume(){if(tutorialEnabled()&&!introDone()&&!this.progress().allDone){this.active=true;this.startedAt=performance.now();this.update(true);}}
  end(){if(this.tip){this.closeTip();try{localStorage.setItem(TIPS_KEY,'off');}catch{/* session */}if(this.tipSetting)this.tipSetting.checked=false;return;}this.active=false;setTutorialEnabled(false);if(this.setting)this.setting.checked=false;this.hide();}
  hide(){this.bubble.hidden=true;this.arrow.hidden=true;}
  next(){if(this.tip){this.closeTip();return;}const p=this.progress();if(p.current){this.seen.add(p.current.id);if(p.current.id==='speed')try{localStorage.setItem(SPEED_KEY,'1');}catch{/* session */}}this.update(true);}
  skip(){const p=this.progress();if(p.current)this.skipped.add(p.current.id);this.update(true);}
  pendingBuilding(step){const types=new Set(this.scene.buildings.map(b=>b.type));return step.buildingIds?.find(id=>!types.has(id))??step.buildingIds?.[0];}
  showMe(){
    if(this.tip){const wiki=this.tip.wiki;this.closeTip();if(wiki&&this.scene.wikiPanel)this.scene.wikiPanel.open(wiki);else this.scene.gettingStarted?.show();return;}
    const s=this.scene,step=this.progress().current;if(!step)return;
    if(step.id==='wiki'){s.wikiPanel?.open();this.seen.add('wiki');this.update(true);return;}
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
    if(step.id==='stone'&&s.buildMode&&s.selectedBuilding?.id==='quarry'){const d=this.quarryDeposit();if(d){const c=depositCentre(d),p=gridToWorld(c.x,c.y);return {world:{x:p.x,y:p.y-30},from:'above',placing:true,quarry:true};}}
    // Owner 15 Nov 2026 start guide: the Getting started arrow stays beside the panel, never over its tasks.
    if(step.check==='ack'&&step.target)return {el:q(step.target),avoid:[q('#help-dialog')]};
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
    // m-drobnosti-083: large deposits count too, and a deposit the player can see (or has explored) comes first.
    const fog=s.fog,seen=d=>{if(!fog?.enabled||!fog.displayState)return 2;const w=d.definition?.width??2,h=d.definition?.height??w;let best=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)best=Math.max(best,fog.displayState({x:d.x+x,y:d.y+y}));return best;};
    return tutorialQuarryDeposit(mining.deposits(),c,seen);
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
    if(this.scene.wikiPanel?.isOpen)this.seen.add('wiki');
    const p=this.progress();
    if(p.current?.id==='king'&&now-(this.startedAt??now)>=TUTORIAL_KING_MS)this.seen.add('king');
    if(this.currentId&&p.current?.id!==this.currentId&&!this.skipped.has(this.currentId))this.flashDone();
    if(!p.current){try{localStorage.setItem(INTRO_KEY,'done');}catch{/* session */}this.lastTipClosed=this.gameNow();this.active=false;this.hide();this.currentId=null;return;}
    this.currentId=p.current.id;
    const target=this.target(p.current);
    const key=target.quarry?'tutorial.step.stoneQuarry':target.placing?'tutorial.place':target.from==='above'&&p.current.id==='stone'?'tutorial.step.stoneMark':`tutorial.step.${p.current.id}`;
    const intro=GUIDE.intro.find(step=>step.id===p.current.id);
    this.arrow.classList.toggle('big',!!intro);
    this.text.textContent=guideText(intro?.text,language())??t(key,{name:this.scene.objectRegistry?.get(this.pendingBuilding(p.current)??'')?.name??'',plots:FARM_PLOT_CAPACITY});
    this.count.textContent=t('tutorial.count',{step:p.doneCount+1,total:p.total});
    this.showButton.textContent=t('tutorial.show');this.skipButton.textContent=t('tutorial.skip');this.nextButton.textContent=t('tutorial.next');this.closeButton.title=this.closeButton.ariaLabel=t('tutorial.close');
    this.nextButton.hidden=!p.current.optional&&!['king','speed'].includes(p.current.id)&&p.current.check!=='ack';this.showButton.hidden=p.current.id==='king'||p.current.check==='ack'||!!target.placing;
    if(p.current.check==='ack')this.nextButton.textContent=t('tips.gotIt');
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
    if(this.tip&&!this.active){this.placeTipBubble(point,rect,target,vw,vh);return;}
    if(!point){this.arrow.hidden=true;this.positionBubble(null);return;}
    // m-tutorial-v2 point 2: arrow and bubble beside the target (and beside the panel it lives in), never over it.
    const w=Math.min(300,vw-24);this.bubble.style.width=`${w}px`;const h=this.bubble.offsetHeight||90;
    const boxes=[target.avoid??[]].flat().filter(visible).map(restingBox);
    const avoid=boxes.length?{left:Math.min(...boxes.map(b=>b.left)),right:Math.max(...boxes.map(b=>b.right)),top:Math.min(...boxes.map(b=>b.top)),bottom:Math.max(...boxes.map(b=>b.bottom))}:null;
    const {arrow,bubble}=this.placed('step',{point,rect:box(rect),avoid,from:target.from??null,vw,vh,bubble:{w,h},windows:openWindowRects(this.doc,vw,vh).map(box),arrowLength:this.arrowLength()},tutorialPlacement);
    this.arrow.hidden=false;this.arrow.style.left=`${Math.round(arrow.x)}px`;this.arrow.style.top=`${Math.round(arrow.y)}px`;this.arrow.style.transform=`translate(-50%,-50%) rotate(${arrow.angle}rad)`;this.arrow.classList.toggle('offscreen',arrow.off);
    this.bubble.style.left=`${bubble.x}px`;this.bubble.style.top=`${bubble.y}px`;
  }
  // performance-3: the search for a free spot (thousands of candidate places) runs only when something it depends on
  // moved; with the same boxes as last time the last answer stands.
  placed(kind,input,solve){const key=kind+JSON.stringify(input);if(this.placedKey!==key){this.placedKey=key;this.placedResult=solve(input);}return this.placedResult;}
  // m-tipy-mimo-listu: a tip is measured against the HUD and the open windows (tipPlacement).
  placeTipBubble(point,rect,target,vw,vh){
    const w=Math.min(300,vw-24);this.bubble.style.width=`${w}px`;const h=this.bubble.offsetHeight||90;
    const bar=this.doc.querySelector?.('.inventory'),topBar=bar&&visible(bar)?bar.getBoundingClientRect():null;
    const windows=tipWindowRects(this.doc,vw,vh).filter(r=>!topBar||r.left!==topBar.left||r.top!==topBar.top||r.right!==topBar.right||r.bottom!==topBar.bottom);
    const {arrow,bubble}=this.placed('tip',{point,rect:box(rect),from:target.from??null,vw,vh,bubble:{w,h},windows:windows.map(box),topBar:box(topBar),arrowLength:this.arrowLength()},tipPlacement);
    this.arrow.hidden=!arrow;if(arrow){this.arrow.style.left=`${Math.round(arrow.x)}px`;this.arrow.style.top=`${Math.round(arrow.y)}px`;this.arrow.style.transform=`translate(-50%,-50%) rotate(${arrow.angle}rad)`;this.arrow.classList.toggle('offscreen',arrow.off);}
    this.bubble.style.left=`${bubble.x}px`;this.bubble.style.top=`${bubble.y}px`;
  }
  // The drawn length of the pointer in the current UI design (golden arrow 40 px, the medieval pointers 56 px), with the
  // 12 % of its pulse animation, so the placement keeps the whole pointer off the target.
  arrowLength(){const a=this.arrow,off=a.classList.contains('offscreen');if(off)a.classList.remove('offscreen');const w=parseFloat(globalThis.getComputedStyle?.(a)?.width)||0;if(off)a.classList.add('offscreen');return Math.round(Math.max(w,34)*1.12);}
  positionBubble(anchor){
    const b=this.bubble,w=Math.min(300,innerWidth-24);b.style.width=`${w}px`;const h=b.offsetHeight||90;
    if(anchor){b.style.left=`${Math.round(Math.max(12,Math.min(innerWidth-w-12,anchor.x)))}px`;b.style.top=`${Math.round(Math.max(70,Math.min(innerHeight-h-12,anchor.y)))}px`;return;}
    const at=freeBubbleSpot({x:16,y:Math.max(70,innerHeight-h-120),w,h,vw:innerWidth,vh:innerHeight,blocked:openWindowRects(this.doc),anchor:{x:16,y:innerHeight}});
    b.style.left=`${Math.round(at.x)}px`;b.style.top=`${Math.round(at.y)}px`;
  }
  flashDone(){this.done.hidden=false;this.done.classList.remove('pop');void this.done.offsetWidth;this.done.classList.add('pop');clearTimeout(this.doneTimer);this.doneTimer=setTimeout(()=>{this.done.hidden=true;},900);}
  // ---- Tips (plan m-e3-tipy) ----
  // Owner 15 Nov 2026: a 'sequence' tip comes after the start guide, when the earlier ones are seen and TIP_GAP_SECONDS
  // of play (game time) have passed since the last tip was closed.
  sequenceHolds(id){
    if(!introDone())return false;const list=this.tips.tips.filter(tip=>tip.kind==='sequence'),i=list.findIndex(tip=>tip.id===id);
    if(i<0||list.slice(0,i).some(tip=>!this.tips.seen.has(tip.id)))return false;
    this.lastTipClosed??=this.gameNow();return this.gameNow()-this.lastTipClosed>=TIP_GAP_SECONDS*1000;
  }
  tipHolds(id){
    const s=this.scene;
    if(this.tips.byId(id)?.kind==='sequence')return this.sequenceHolds(id);
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
  gameNow(){return this.scene.gameTime?.totalElapsed??0;}
  dayMs(){return this.scene.gameTime?.dayDuration??DAY_DURATION;}
  saveSeen(){try{localStorage.setItem(SEEN_KEY,JSON.stringify([...this.tips.seen]));}catch{/* session */}}
  updateTips(){
    const now=performance.now();if(this.tip&&!tipsEnabled())this.closeTip(false);
    // m-tipy-mimo-listu: a tip left alone for a game day folds into the Notices bar (the "!" tab), the next one may come.
    if(this.tip&&this.tips.due(this.gameNow(),this.dayMs(),{held:this.hovered})){this.parkTip();return;}
    // performance-2: the tip follows the layout five times a second (its placing reads many window rectangles).
    if(this.tip){if(now-(this.lastTipPlace??0)>=200){this.lastTipPlace=now;this.placeTip();}return;}
    if(now-this.lastTipCheck<1000||this.scene.gameOver||!tipsEnabled())return;this.lastTipCheck=now;
    // One tip at a time: the night speed-up tip counts as one too.
    if(this.scene.nightSpeedUp?.tip?.visible)return;
    const tip=this.tips.next(id=>this.tipHolds(id),this.gameNow());if(tip)this.showTip(tip);
  }
  showTip(tip){
    this.text.textContent=guideText(tip.text,language())??t(`tips.${tip.id}`);this.count.textContent=t('tips.label');
    this.showButton.hidden=false;this.showButton.textContent=t('tips.more');this.nextButton.hidden=false;this.nextButton.textContent=t('tips.gotIt');this.skipButton.hidden=true;this.closeButton.title=this.closeButton.ariaLabel=t('tips.off');
    this.arrow.classList.remove('big');this.bubble.classList.add('is-tip');this.bubble.hidden=false;this.hovered=false;this.placeTip();
  }
  placeTip(){
    const tip=this.tip,s=this.scene;if(!tip)return;
    if(tip.target==='cat'||tip.target==='dog'){const a=[...(s.domestic?.[`${tip.target}s`]?.values?.()??[])].find(x=>x.state==='stray');const v=a?.view;this.place(v?{world:{x:v.x,y:v.y-20}}:{});}
    else this.place(tip.target?{el:this.doc.querySelector(tip.target)}:{});
  }
  // "Got it" marks the tip seen; × switches tips off; "More" opens the help (the checklist and its answers).
  closeTip(seen=true){if(!this.tip)return;this.lastTipClosed=this.gameNow();this.tips.close(seen);if(seen)this.saveSeen();this.bubble.classList.remove('is-tip');this.hide();}
  // Folded into the Notices bar: seen (it does not pop up again), listed there until opened or closed.
  parkTip(){if(!this.tips.park(this.gameNow()))return;this.lastTipClosed=this.gameNow();this.saveSeen();this.bubble.classList.remove('is-tip');this.hide();this.scene.noticesPanel?.render?.();}
  // The tips folded into the Notices bar, as notice rows (NoticesPanel).
  parkedTips(){return this.tips.parkedList().map(({id,at})=>({key:`tip:${id}`,tip:id,reason:'tip',category:'tip',severity:'info',entityId:null,lastNotified:at,text:guideText(this.tips.byId(id)?.text,language())??t(`tips.${id}`)}));}
  // A parked tip clicked in the Notices bar opens again (not while the tutorial runs: it uses the same bubble).
  reopenTip(id){if(this.active||!this.tips.reopen(id,this.gameNow()))return false;this.saveSeen();this.showTip(this.tip);this.scene.noticesPanel?.render?.();return true;}
  dropTip(id){if(this.tips.drop(id))this.scene.noticesPanel?.render?.();}
  relabel(){this.update(true);}
  destroy(){this.controller.abort();globalThis.clearInterval?.(this.timer);clearTimeout(this.doneTimer);this.bubble.remove();this.arrow.remove();this.done.remove();}
}
