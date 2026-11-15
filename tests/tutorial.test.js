// E3 tutorial (plan m-e3-tutorial-sipka) and m-tutorial-v2 (0.50 playtest points 1–9): steps follow the world, the
// optional food-chain steps close with "Next", the New Game start pays the mandatory path.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialProgress,nearestRock,tutorialPlacement,ARROW_LENGTH } from '../src/systems/Tutorial.js';
import { TUTORIAL_STEPS,TUTORIAL_PATH_BUILDINGS } from '../src/data/tutorial.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { NEW_GAME_DEFAULTS,CASTLE_START_EXTRA_RESIDENTS,STARTING_RESOURCE_CAPACITY,startingResourceTotal } from '../src/systems/GameSettings.js';
import { POPULATION } from '../src/data/jobs.js';
import { START_GARRISON } from '../src/data/military.js';
import { FARM_PLOT_CAPACITY } from '../src/data/farmPlots.js';
import { gettingStartedProblems } from '../src/systems/GettingStarted.js';
import { GUIDE } from '../src/data/guide.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const b=(type,complete=false)=>({type,construction:complete?undefined:{state:'planned'}});
const base=[b('castle',true),b('starter_stockpile',true)];
const scene=({buildings=base,jobs=['idle','idle','idle'],marked=false,speed=1}={})=>({buildings,gameSpeed:speed,workerSystem:{liveSubjects:()=>jobs.map(profession=>({profession}))},
  naturalResources:{miningWork:{rocks:{records:new Map(marked?[[1,{tile:{x:1,y:1},marked:true,produced:0}]]:[])}}}});
const current=(opts,state)=>tutorialProgress(scene(opts),state).current?.id;

// Owner 15 Nov 2026 ("zruš tutoriál"): the tutorial is a short start guide – the Wiki arrow, then the Getting started
// arrow – and the tasks live in the Getting started panel.
test('the start guide points at the Wiki, then at Getting started; the Wiki step ends when it was opened, the other with "Got it"',()=>{
  assert.deepEqual(TUTORIAL_STEPS.map(s=>[s.id,s.check,s.target]),[['wiki','wiki','#wiki-toggle'],['tasks','ack','#help-dialog summary']]);
  for(const step of GUIDE.intro)for(const lang of ['cs','en'])assert.ok(step.text[lang],`${step.id} ${lang}`);
  assert.equal(current(),'wiki');assert.equal(current({},{seen:new Set(['wiki'])}),'tasks');
  assert.equal(current({buildings:[...base,b('granary',true)]}),'wiki','buildings do not end the guide');
  assert.equal(tutorialProgress(scene(),{seen:new Set(['wiki','tasks'])}).allDone,true);
});
test('the New Game start pays every Getting started building and leaves a free Miner',()=>{
  const cost={};for(const id of TUTORIAL_PATH_BUILDINGS)for(const [r,n] of Object.entries(objectRegistry.require(id).cost))cost[r]=(cost[r]??0)+n;
  assert.deepEqual([...TUTORIAL_PATH_BUILDINGS],GUIDE.tasks.filter(t=>t.kind==='build').map(t=>t.building));
  assert.ok((cost.wood??0)+10<=NEW_GAME_DEFAULTS.startingWood,`wood ${cost.wood} + reserve`);assert.ok((cost.stone??0)<=NEW_GAME_DEFAULTS.startingStone,JSON.stringify(cost));
  assert.ok(startingResourceTotal(NEW_GAME_DEFAULTS)<=STARTING_RESOURCE_CAPACITY);
  const residents=POPULATION.initial+CASTLE_START_EXTRA_RESIDENTS,garrison=START_GARRISON.reduce((n,g)=>n+g.count,0);
  assert.ok(residents>=4,'Builder, Hauler, Hunter and a free Miner (the garrison is not free workers)');
  assert.ok(residents+garrison<=POPULATION.maximum,'inside the population maximum');
  assert.deepEqual(gettingStartedProblems(objectRegistry),[]);
});
test('nearestRock picks the visible unmarked rock nearest the Castle',()=>{
  const g=Array.from({length:10},()=>Array(10).fill(0));g[1][1]=1;g[5][6]=1;g[9][9]=1;
  assert.deepEqual(nearestRock(g,{x:5,y:5}),{x:6,y:5});
  assert.deepEqual(nearestRock(g,{x:5,y:5},{skip:t=>t.x===6}),{x:1,y:1});
  assert.deepEqual(nearestRock(g,{x:5,y:5},{visible:t=>t.x===9}),{x:9,y:9});
  assert.equal(nearestRock(g,{x:5,y:5},{visible:()=>false}),null);
});
test('point 2: the bubble and the arrow never cover the target or its panel (pure placement)',()=>{
  const ov=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const bubble={w:300,h:110},R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
  const cases=[];
  for(const [vw,vh] of [[1280,720],[1920,1080],[800,600],[420,800]]){
    const panel=R(vw-52-Math.min(330,vw-64),150,Math.min(330,vw-64),400);
    for(const row of [R(panel.left+10,200,60,24),R(panel.right-80,400,60,24)])cases.push({vw,vh,rect:row,avoid:panel});
    cases.push({vw,vh,rect:R(vw-120,60,100,30)});cases.push({vw,vh,rect:R(20,vh-60,80,40)});cases.push({vw,vh,rect:R(vw/2-40,vh-70,80,50)});
    cases.push({vw,vh,rect:null,point:{x:vw/2,y:vh/2},from:'above'});cases.push({vw,vh,rect:R(10,300,40,40)});
  }
  for(const c of cases){
    const point=c.point??{x:c.rect.left+c.rect.width/2,y:c.rect.top+c.rect.height/2},{arrow,bubble:at}=tutorialPlacement({point,rect:c.rect,avoid:c.avoid,from:c.from,vw:c.vw,vh:c.vh,bubble});
    const box={left:at.x,top:at.y,right:at.x+bubble.w,bottom:at.y+bubble.h},target=c.rect??R(point.x-4,point.y-4,8,8);
    assert.ok(!ov(box,target),`bubble over target ${JSON.stringify(c)}`);
    if(c.avoid&&c.vw>=800)assert.ok(!ov(box,c.avoid),`bubble over the panel ${JSON.stringify(c)}`);
    const tip={x:arrow.x+Math.cos(arrow.angle)*ARROW_LENGTH/2,y:arrow.y+Math.sin(arrow.angle)*ARROW_LENGTH/2},tail={x:arrow.x-Math.cos(arrow.angle)*ARROW_LENGTH/2,y:arrow.y-Math.sin(arrow.angle)*ARROW_LENGTH/2};
    const inside=(p,r)=>p.x>r.left&&p.x<r.right&&p.y>r.top&&p.y<r.bottom;
    assert.ok(!inside(tail,target)&&!inside(tip,target),`arrow over target ${JSON.stringify(c)}`);
    if(c.avoid)assert.ok(!inside(arrow,c.avoid),'the arrow sits beside the panel');
  }
  const rock=tutorialPlacement({point:{x:600,y:400},from:'above',vw:1280,vh:720,bubble});assert.equal(rock.arrow.angle,Math.PI/2,'above a rock, pointing down');assert.ok(rock.arrow.y<400);
});

test('m-tutorial-v3 point 74: the drawn arrow never overlaps its target, also at the screen edge and with the big pointers',()=>{
  const ov=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
  const R=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h}),bubble={w:300,h:126};
  for(const [vw,vh] of [[1920,1080],[1366,768],[1280,720],[800,600]])for(const L of [34,45,63]){
    const T=L*.65;
    // The Population tab and the other side tabs hug the right edge; the build tab sits at the bottom left; HUD buttons on top.
    for(const rect of [R(vw-42,vh*.45,34,118),R(vw-34,vh*.3,34,118),R(vw-20,200,20,60),R(20,vh-60,80,40),R(vw/2,80,40,30),R(0,300,30,30),R(vw/2-40,vh/2,80,50)]){
      const point={x:rect.left+rect.width/2,y:rect.top+rect.height/2},{arrow,bubble:at}=tutorialPlacement({point,rect,vw,vh,bubble,arrowLength:L});
      assert.equal(arrow.off,false,`an on-screen target is never "off screen" ${JSON.stringify(rect)}`);
      const horizontal=Math.abs(Math.cos(arrow.angle))>.5,box=horizontal?R(arrow.x-L/2,arrow.y-T/2,L,T):R(arrow.x-T/2,arrow.y-L/2,T,L);
      assert.ok(!ov(box,rect),`arrow ${L}px over the target ${vw}x${vh} ${JSON.stringify(rect)} ${JSON.stringify(arrow)}`);
      assert.ok(!ov({left:at.x,top:at.y,right:at.x+bubble.w,bottom:at.y+bubble.h},rect),`bubble over the target ${JSON.stringify(rect)}`);
      // It points at the target: the tip lies within reach of the box.
      const tip={x:arrow.x+Math.cos(arrow.angle)*L/2,y:arrow.y+Math.sin(arrow.angle)*L/2};
      assert.ok(tip.x>=rect.left-12&&tip.x<=rect.right+12&&tip.y>=rect.top-12&&tip.y<=rect.bottom+12,`the arrow points at the target ${JSON.stringify({rect,arrow})}`);
    }
  }
  const away=tutorialPlacement({point:{x:2500,y:300},rect:R(2480,280,40,40),vw:1920,vh:1080,bubble,arrowLength:63});assert.equal(away.arrow.off,true,'a target outside the screen still gets the edge arrow');
});

// Owner 15 Nov 2026: after the start guide the 'sequence' tips come one after another, TIP_GAP_SECONDS of play apart;
// the 'event' tips keep their own moments. Texts come from the guide data.
test('sequence tips wait for the start guide, come in order and keep the gap; texts from the guide data',async()=>{
  const { TutorialGuide }=await import('../src/ui/TutorialGuide.js'),{ TipQueue }=await import('../src/ui/tipQueue.js'),{ TIPS,TIP_GAP_SECONDS }=await import('../src/data/tips.js');
  const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
  let now=0;const guide=Object.create(TutorialGuide.prototype);Object.assign(guide,{scene:{gameTime:{totalElapsed:0}},tips:new TipQueue({tips:TIPS})});
  Object.defineProperty(guide.scene.gameTime,'totalElapsed',{get:()=>now});
  const seq=TIPS.filter(t=>t.kind==='sequence').map(t=>t.id);assert.deepEqual(seq,['fullscreen','king_key','shift_build','speed']);
  assert.equal(guide.tipHolds('fullscreen'),false,'not before the start guide is done');
  store.set('newgame.guide.intro','done');assert.equal(guide.tipHolds('fullscreen'),false,'the gap runs from now');
  now=TIP_GAP_SECONDS*1000;assert.equal(guide.tipHolds('fullscreen'),true);assert.equal(guide.tipHolds('king_key'),false,'the second waits for the first');
  guide.tips.open(guide.tips.byId('fullscreen'));guide.closeTip=TutorialGuide.prototype.closeTip;guide.saveSeen=()=>{};guide.hide=()=>{};guide.bubble={classList:{remove(){}}};guide.closeTip();
  assert.equal(guide.tipHolds('king_key'),false,'gap after the closed tip');now+=TIP_GAP_SECONDS*1000;assert.equal(guide.tipHolds('king_key'),true);
  for(const tip of TIPS)for(const lang of ['cs','en'])if(tip.kind==='sequence')assert.ok(tip.text[lang],`${tip.id} ${lang}`);else assert.ok((lang==='cs'?cs:en)[`tips.${tip.id}`],`${tip.id} ${lang} i18n`);
  delete globalThis.localStorage;
});
