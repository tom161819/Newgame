import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialPlacement,freeBubbleSpot,tutorialProgress,rememberSpeed,ARROW_LENGTH } from '../src/systems/Tutorial.js';
import { goalsCardPlacement,rewardText } from '../src/ui/RoyalGoalsPanel.js';
import { deathLine } from '../src/ui/EventFeed.js';
import { noticeText } from '../src/ui/noticeText.js';
import { initCompactHud } from '../src/ui/CompactHud.js';
import { t,setLanguage,pluralCategory,pluralForm } from '../src/i18n/index.js';
import { GUIDE } from '../src/data/guide.js';
import CS_NAMES from '../src/data/names.cs.js';
import { stumpMessageShown } from '../src/systems/NaturalResourcesSystem.js';
import { workerScene } from './helpers/workerScene.js';
import { treeState } from '../src/data/naturalResources.js';
import { restingRect } from '../src/ui/TutorialGuide.js';

// m-ui-prekryvy-076 and m-drobnosti-076 (report 0.76.0 points 4–12).
const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
const ov=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const box=(at,b)=>({left:at.x,top:at.y,right:at.x+b.w,bottom:at.y+b.h});
const centre=r=>({x:r.left+r.width/2,y:r.top+r.height/2});

test('the tutorial bubble never covers an open window, the target or the arrow (point 4)',()=>{
  const bubble={w:300,h:100};
  for(const [vw,vh] of [[1440,900],[1280,720],[1920,1080]]){
    // Step "Storage and workshop" (shot 04): the Logistics category in the open Build menu, Infrastructure right of it.
    const menu=R(18,vh-380,Math.min(1180,vw-36),300),logistics=R(570,menu.top+50,130,30),infra=R(706,menu.top+50,120,30);
    const p=tutorialPlacement({point:centre(logistics),rect:logistics,vw,vh,bubble,windows:[menu]}),b=box(p.bubble,bubble);
    assert.ok(!ov(b,menu),`bubble over the Build menu at ${vw}×${vh}`);assert.ok(!ov(b,infra),'bubble over Infrastructure');
    const arrow=R(p.arrow.x-ARROW_LENGTH/2,p.arrow.y-ARROW_LENGTH/2,ARROW_LENGTH,ARROW_LENGTH);
    assert.ok(!ov(arrow,infra)&&!ov(arrow,logistics),'the arrow comes from above, beside no other category');assert.equal(p.arrow.angle,Math.PI/2);
    // The rats tip (shot 05): it points at the Notices box at the bottom left while the Build menu is open.
    const notices=R(14,vh-470,280,60),tip=tutorialPlacement({point:centre(notices),rect:notices,vw,vh,bubble,windows:[menu]});
    assert.ok(!ov(box(tip.bubble,bubble),menu)&&!ov(box(tip.bubble,bubble),notices),'the tip clears the Build menu and its target');
    // Population (shot 03): the job button of a row, the panel kept clear, and a resident's card open beside it.
    const panel=R(vw-382,200,330,560),card=R(vw-700,345,300,480),row=R(panel.left+214,600,30,50);
    const pop=tutorialPlacement({point:centre(row),rect:row,avoid:panel,vw,vh,bubble,windows:[panel,card]}),pb=box(pop.bubble,bubble);
    assert.ok(!ov(pb,panel)&&!ov(pb,card)&&!ov(pb,row),`bubble over the Population panel or the resident card at ${vw}×${vh}`);
  }
  // Without open windows the placement is unchanged; a free spot is kept as it is.
  const plain={point:{x:640,y:600},rect:R(600,580,80,40),vw:1280,vh:720,bubble};
  assert.deepEqual(tutorialPlacement({...plain,windows:[]}),tutorialPlacement(plain));
  assert.deepEqual(freeBubbleSpot({x:20,y:100,w:300,h:100,vw:1280,vh:720,blocked:[R(400,100,100,100)]}),{x:20,y:100});
  const moved=freeBubbleSpot({x:20,y:100,w:300,h:100,vw:1280,vh:720,blocked:[R(0,80,500,200)],anchor:{x:200,y:300}});
  assert.ok(!ov(box(moved,{w:300,h:100}),R(0,80,500,200)));assert.ok(moved.y>=280,'the nearest free spot (below the window)');
  // No free spot at all: the least covered one, still on screen.
  const full=freeBubbleSpot({x:20,y:100,w:300,h:100,vw:400,vh:400,blocked:[R(0,0,400,300)]});assert.equal(full.y,400-100-12,'as low as the screen allows');
});

test('the bubble clears the Population panel while it still slides in (smoke 03, 1440×900)',()=>{
  const L=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
  const bubble={w:300,h:125},vw=1440,vh=900,unit=L(1084,144,1424,744),rest=L(1058,200,1402,785),row=L(1112,520,1152,560);
  // The panel measured mid-slide (translateX still 120 px, 342 px, and almost off screen): the resting box is used.
  for(const dx of [14.5,120,342]){
    const mid=L(rest.left+dx,rest.top,rest.right+dx,rest.bottom),measured=restingRect(mid,{x:dx,y:0});
    assert.deepEqual([measured.left,measured.right,measured.top,measured.bottom],[rest.left,rest.right,rest.top,rest.bottom]);
    const p=tutorialPlacement({point:centre(row),rect:row,avoid:measured,vw,vh,bubble,windows:[measured,unit]}),b=box(p.bubble,bubble);
    assert.ok(!ov(b,rest)&&!ov(b,unit)&&!ov(b,row),`bubble ${JSON.stringify(b)} over the Population panel or the resident card (slide ${dx})`);
    assert.ok(b.right<=rest.left,'the bubble sits in the free space left of the panels');
  }
  assert.equal(restingRect(rest,null),rest,'a window at rest is measured as it is');
});
test('the Royal tasks card moves above the open Build menu or folds; it never covers it (point 5)',()=>{
  const menu=R(18,527,1177,300);
  assert.deepEqual(goalsCardPlacement(R(1125,415,255,165),menu,{top:140}),{shift:580-519,fold:false});
  assert.deepEqual(goalsCardPlacement(R(1125,200,255,400),menu,{top:140}),{shift:600-519,fold:true},'too tall to fit above: fold first');
  assert.deepEqual(goalsCardPlacement(R(1200,415,200,165),menu),{shift:0,fold:false},'beside the menu: nothing to do');
  assert.deepEqual(goalsCardPlacement(R(1125,300,255,100),menu),{shift:0,fold:false},'already above it');
  assert.deepEqual(goalsCardPlacement(R(1125,415,255,165),null),{shift:0,fold:false});
});

// A tiny DOM for SideCards: elements by selector, hidden flags, listeners.
function fakeDom(){
  const make=(id)=>{const listeners=new Map(),attrs=new Map();const el={id,hidden:false,dataset:{},style:{},children:[],offsetHeight:30,textContent:'',
    addEventListener:(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},click(){for(const fn of listeners.get('click')??[])fn({stopPropagation(){}});},
    setAttribute:(k,v)=>attrs.set(k,String(v)),getAttribute:k=>attrs.get(k)??null,getBoundingClientRect:()=>({top:300,bottom:400,left:1400,right:1430,height:100,width:30}),
    append:(...nodes)=>el.children.push(...nodes),before:node=>{el.previous=node;},replaceChildren:(...nodes)=>{el.children=nodes;},querySelector:()=>null};return el;};
  const nodes={};for(const id of ['#policy-tab','#employment-tab','#population-tab','#policy-card','#policy-card-body','#close-policy-card','#employment-panel','section.kingdom-policy'])nodes[id]=make(id);
  nodes['#policy-card'].hidden=true;nodes['#employment-panel'].hidden=true;
  const doc={querySelector:s=>nodes[s]??null,createElement:tag=>make(tag),documentElement:make('html')};
  return {doc,nodes};
}
test('side windows exclude each other; the Employments card shows no copy of the Policy (point 6)',async()=>{
  const {doc,nodes}=fakeDom(),saved={document:globalThis.document,window:globalThis.window,MutationObserver:globalThis.MutationObserver};
  globalThis.document=doc;globalThis.window={addEventListener(){}};globalThis.MutationObserver=class{observe(){}disconnect(){}};
  try{
    const {SideCards}=await import('../src/ui/SideCards.js');
    const panel=nodes['#employment-panel'],population={open:false,setOpen(v){this.open=v;}},employment={open(){panel.hidden=false;},close(){panel.hidden=true;}};
    const unitPanel={dialog:{open:false},open(){this.dialog.open=true;},close(){this.dialog.open=false;}};
    const cards=new SideCards({employmentPanel:employment,populationSidebar:population,unitPanel});
    const state=()=>({policy:cards.isOpen('policy'),population:cards.isOpen('population'),employment:cards.isOpen('employment'),unit:unitPanel.dialog.open});
    nodes['#policy-tab'].click();assert.deepEqual(state(),{policy:true,population:false,employment:false,unit:false});
    nodes['#employment-tab'].click();assert.deepEqual(state(),{policy:false,population:false,employment:true,unit:false},'opening Employments closes Policy');
    assert.equal(nodes['section.kingdom-policy'].hidden,true,'the Castle\'s policy section is hidden in the Employments card');assert.equal(cards.policyLink.hidden,false);
    cards.policyLink.click();assert.deepEqual(state(),{policy:true,population:false,employment:false,unit:false},'the link opens the Policy card instead');
    assert.equal(nodes['section.kingdom-policy'].hidden,false);assert.equal(cards.policyLink.hidden,true);
    employment.open();assert.deepEqual(state(),{policy:false,population:false,employment:true,unit:false},'the Castle opens its whole window and closes Policy');
    assert.equal(nodes['section.kingdom-policy'].hidden,false,'opened from the Castle the policy stays in the window');
    unitPanel.open({id:'king'});assert.deepEqual(state(),{policy:false,population:false,employment:false,unit:true},'the King panel closes the cards on its edge');
    nodes['#policy-tab'].click();assert.deepEqual(state(),{policy:true,population:false,employment:false,unit:false},'and a card closes the King panel');
    population.setOpen(true);assert.deepEqual(state(),{policy:false,population:true,employment:false,unit:false});
    nodes['#policy-tab'].click();nodes['#policy-tab'].click();assert.deepEqual(state(),{policy:false,population:false,employment:false,unit:false},'a second click closes it');
    cards.destroy();
  }finally{Object.assign(globalThis,saved);}
});

test('Czech number forms for resources and days, death lines by sex, the More button and the Materials counter (points 8, 11, 12)',()=>{
  setLanguage('cs',{persist:false});
  try{
    assert.deepEqual([1,2,4,5,10,0,1.5].map(n=>pluralCategory(n)),['one','few','few','other','other','other','many']);
    assert.equal(pluralForm({one:'den',few:'dny',other:'dní'},3),'dny');assert.equal(pluralForm({one:'den',other:'dní'},3),'dní','missing form → other');
    assert.equal(rewardText({stone:10}),'10 kamenů');assert.equal(rewardText({stone:2,gold:15},2),'2 kameny, 15 zlata, 2 body dovedností');assert.equal(rewardText({stone:1}),'1 kámen');
    const food=days=>noticeText({buildings:[],objectRegistry:{get:()=>null}},{reason:'foodLow',params:{days}});
    assert.match(food(2),/na 2 dny\./);assert.match(food(1),/na 1 den\./);assert.match(food(0),/na 0 dní\./);
    assert.equal(t('market.days',{count:1.5}),'1.5 dne');assert.equal(t('market.days',{count:3}),'3 dny');assert.equal(t('policy.feastNo.cooldown',{days:2,count:2}),'Možná za 2 dny.');
    assert.equal(deathLine({name:'Veronika Šikovná',identity:{sex:'f'}},'zranění'),'Veronika Šikovná zemřela – zranění.');
    assert.equal(deathLine({name:'Václav Motyka',identity:{sex:'m'}},'zranění'),'Václav Motyka zemřel – zranění.');
    assert.equal(deathLine({name:'Host'},'zranění'),'Host zemřel(a) – zranění.','no identity: the neutral form');
    assert.equal(t('hud.storeCapacity'),'Materiál');assert.match(t('hud.storeCapacityHint'),/Jídlo se sem nepočítá/);
    setLanguage('en',{persist:false});assert.equal(t('hud.storeCapacity'),'Materials');assert.equal(deathLine({name:'Anna',identity:{sex:'f'}},'wounds'),'Anna died – wounds.');
    assert.equal(rewardText({stone:10}),'10 stone');
    // The More button carries its key, so the language read after it relabels it ("Více").
    const attrs=new Map(),toggle={hidden:false,textContent:'',title:'',setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k),addEventListener(){},classList:{toggle(){}}};
    initCompactHud({querySelector:s=>s==='#hud-details-toggle'?toggle:s==='#hud-details'?{hidden:true}:null},null);
    assert.equal(attrs.get('data-i18n'),'hud.more');assert.equal(attrs.get('data-i18n-attr'),'title:hud.moreTitle');
  }finally{setLanguage('en',{persist:false});}
});

test('Czech origins take "z" or "ze" before a hard cluster (point 11)',()=>{
  for(const origin of CS_NAMES.origins){
    const m=/^(ze?) (\S)(\S)/u.exec(origin);assert.ok(m,origin);const [,prep,first,second]=m,vowel=/[aeiouyáéíóúůýě]/iu.test(second);
    if(/[sšzž]/iu.test(first)&&!vowel)assert.equal(prep,'ze',origin);
  }
  assert.ok(CS_NAMES.origins.includes('z Hrnčíř'),'Hrnčíře (genitive plural) is right');
});

test('point 9: the speed-up is remembered once (the speed step became a start-guide tip)',()=>{
  // Owner 15 Nov 2026: speed is now a sequence tip of the start guide; the remembered speed-up still works.
  const scene={buildings:[],gameSpeed:3,workerSystem:{liveSubjects:()=>[]}},seen=new Set();
  assert.ok(GUIDE.tips.some(t=>t.id==='speed'&&t.kind==='sequence'));
  assert.equal(rememberSpeed(scene,seen),true);assert.equal(rememberSpeed(scene,seen),false,'remembered once');assert.ok(seen.has('speed'));
  const fresh={...scene,gameSpeed:1};assert.equal(rememberSpeed(fresh,new Set()),false);
});

test('the King\'s felled wood is carried by Haulers; the stump line only for the King (point 10)',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true});s.workerSystem.unsubscribe();
  const state=treeState(`tree-${s.naturalResources.nextId++}`);state.growthCheckpoint=s.naturalResources.growthClock;state.ageCheckpoint=s.naturalResources.ageClock;
  s.addResource(s.objectRegistry.require('oak_tree'),{x:46,y:40},state);const tree=s.naturalResources.byId.get(state.id);
  const lines=[],set=s.setStatus;s.setStatus=text=>{lines.push(text);return set?.call(s,text);};
  assert.ok(s.naturalResources.beginKingChop(tree));for(let i=0;i<400&&tree.natural.stage!==0;i++)s.simulate(100);
  assert.equal(tree.natural.stage,0);const drop=[...s.dropSystem.drops.values()].find(d=>d.resource==='wood');assert.equal(drop.amount,6);
  setLanguage('en',{persist:false});assert.ok(lines.some(l=>/beside the stump/.test(l)),'the King hears where his wood is');
  const hauler=s.workerSystem.create({x:44,y:42});assert.ok(s.workerSystem.jobs.assign(hauler,'hauler'));hauler.stoneCollection={...hauler.stoneCollection,enabled:false};
  for(let i=0;i<600&&s.inventory.count('wood')<6;i++)s.simulate(100);
  assert.equal(s.inventory.count('wood'),6,'a Hauler took it to storage');assert.equal(s.dropSystem.drops.size,0);assert.equal(s.character.cargo??null,null,'not the King');
  assert.equal(stumpMessageShown(s,hauler),false,'a Woodcutter\'s felling stays silent');assert.equal(stumpMessageShown(s,s.character),true);
  assert.equal(stumpMessageShown({...s,character:s.character,unitSelection:{ids:new Set(['w1'])}},s.character),false,'residents selected: the King is not the one in hand');
});
