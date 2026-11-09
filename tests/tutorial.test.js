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
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const b=(type,complete=false)=>({type,construction:complete?undefined:{state:'planned'}});
const base=[b('castle',true),b('starter_stockpile',true)];
const scene=({buildings=base,jobs=['idle','idle','idle'],marked=false,speed=1}={})=>({buildings,gameSpeed:speed,workerSystem:{liveSubjects:()=>jobs.map(profession=>({profession}))},
  naturalResources:{miningWork:{rocks:{records:new Map(marked?[[1,{tile:{x:1,y:1},marked:true,produced:0}]]:[])}}}});
const current=(opts,state)=>tutorialProgress(scene(opts),state).current?.id;

test('m-tutorial-v2 step order: Hauler after Builder, Hunting Lodge first food, four optional steps, Miner after stone',()=>{
  assert.deepEqual(TUTORIAL_STEPS.map(s=>s.id),['king','builder','hauler','granary','lumberjack_hut','hunting_lodge','fisherman','farm','mill','bakery','stone','miner','house','storage','speed']);
  assert.deepEqual(TUTORIAL_STEPS.filter(s=>s.optional).map(s=>s.id),['fisherman','farm','mill','bakery']);
  for(const s of TUTORIAL_STEPS)for(const id of s.buildingIds??[])assert.ok(objectRegistry.get(id),id);
  for(const lang of [en,cs])for(const s of TUTORIAL_STEPS)assert.ok(lang[`tutorial.step.${s.id}`],`${s.id} has text`);
  assert.ok(en['tutorial.step.stoneMark']&&cs['tutorial.step.stoneMark']);
  assert.equal(FARM_PLOT_CAPACITY,4,'the Farmhouse text says up to 4 fields');
});
test('steps tick from the state of the world in order; Hauler and Miner are steps',()=>{
  assert.equal(current(),'king');
  const seen=new Set(['king']);assert.equal(current({},{seen}),'builder');
  assert.equal(current({jobs:['builder','idle']},{seen}),'hauler');
  assert.equal(current({jobs:['builder','hauler']},{seen}),'granary');
  const jobs=['builder','hauler','idle'];
  assert.equal(current({buildings:[...base,b('granary')],jobs}),'lumberjack_hut','a building also passes the king step; m-drevo-start: wood right after the Granary');
  assert.equal(current({buildings:[...base,b('granary'),b('lumberjack_hut')],jobs}),'hunting_lodge');
  assert.equal(current({buildings:[...base,b('granary'),b('lumberjack_hut'),b('hunting_lodge')],jobs}),'fisherman');
  const path=[...base,b('granary'),b('hunting_lodge'),b('lumberjack_hut')];
  assert.equal(current({buildings:path,jobs}),'fisherman','m-drevo-start: the optional food steps now follow the Hunting Lodge');
  assert.equal(current({buildings:path,jobs},{seen:new Set(['fisherman','farm','mill','bakery'])}),'stone');
  assert.equal(current({buildings:path,jobs,marked:true}),'miner');
  assert.equal(current({buildings:path,jobs:[...jobs,'miner'],marked:true}),'house');
  assert.equal(current({buildings:[...path,b('quarry')],jobs:[...jobs,'miner']}),'house','a Quarry also ends the stone step');
});
test('bug 6: marking a rock (RockMiningWork records) ends the stone step; m-tutorial-v3: a placed House blueprint ends the house step',()=>{
  const jobs=['builder','hauler','miner'],path=[...base,b('granary'),b('hunting_lodge'),b('lumberjack_hut')];
  const s=scene({buildings:path,jobs});assert.equal(tutorialProgress(s,{seen:new Set(['fisherman','farm','mill','bakery'])}).current.id,'stone');
  s.naturalResources.miningWork.rocks.records.set(7,{id:7,tile:{x:3,y:3},marked:true,produced:0});
  assert.equal(tutorialProgress(s).current.id,'house','the world change is seen on the next recompute');
  const house=b('house');s.buildings=[...path,house];assert.equal(tutorialProgress(s).current.id,'storage','the House blueprint is enough (owner point 76)');
  s.buildings.push(b('material_yard'),b('builder_workshop'));assert.equal(tutorialProgress(s).current.id,'speed');
  s.gameSpeed=2;assert.equal(tutorialProgress(s).allDone,true);
});
test('optional steps close with "Next" (seen) or by building them; Skip still skips any step',()=>{
  const jobs=['builder','hauler'],w=[...base,b('granary'),b('lumberjack_hut'),b('hunting_lodge')],seen=new Set();
  for(const [id,next] of [['fisherman','farm'],['farm','mill'],['mill','bakery'],['bakery','stone']]){assert.equal(current({buildings:w,jobs},{seen}),id);seen.add(id);assert.equal(current({buildings:w,jobs},{seen}),next);}
  assert.equal(current({buildings:[...w,b('fisherman_hut')],jobs}),'farm','building the Fisherman\'s Hut also moves on');
  assert.equal(current({},{seen:new Set(['king']),skipped:new Set(['builder','hauler'])}),'granary');
  seen.add('builder');assert.equal(current({jobs:['idle']},{seen:new Set(['king','builder'])}),'builder','"seen" does not end a mandatory step');
});
test('the New Game start pays the whole mandatory tutorial path and leaves a free Miner',()=>{
  const cost={};for(const id of TUTORIAL_PATH_BUILDINGS)for(const [r,n] of Object.entries(objectRegistry.require(id).cost))cost[r]=(cost[r]??0)+n;
  for(const s of TUTORIAL_STEPS.filter(s=>!s.optional&&['planned','built'].includes(s.check)))for(const id of s.buildingIds)assert.ok(TUTORIAL_PATH_BUILDINGS.includes(id),id);
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

// m-tutorial-v3 (owner points 74–76).
test('m-tutorial-v3: the Granary comes right after the Hauler and only the player\'s own Granary ends it',()=>{
  const ids=TUTORIAL_STEPS.map(s=>s.id),i=ids.indexOf('hauler');
  assert.equal(ids[i+1],'granary');assert.equal(ids[i+2],'lumberjack_hut');
  const jobs=['builder','hauler'],seen=new Set(['king']);
  assert.equal(current({jobs},{seen}),'granary','the Castle and the Starter Stockpile are no Granary');
  assert.equal(current({buildings:[...base,b('farmhouse'),b('warehouse')],jobs},{seen}),'granary','other stores do not end it');
  assert.equal(current({buildings:[...base,b('granary')],jobs},{seen}),'lumberjack_hut');
});
test('m-tutorial-v3: every build step ends with the placed blueprint, not with the finished building',()=>{
  assert.deepEqual(TUTORIAL_STEPS.filter(s=>s.check==='built').map(s=>s.id),[],'no step waits for a finished building');
  for(const step of TUTORIAL_STEPS.filter(s=>s.check==='planned')){
    const others=TUTORIAL_STEPS.filter(s=>s!==step&&s.check==='planned'&&!s.optional).flatMap(s=>s.buildingIds).filter(id=>!step.buildingIds.includes(id));
    const before=tutorialProgress(scene({buildings:[...base,...others.map(id=>b(id))],jobs:['builder','hauler','miner'],marked:true}),{seen:new Set(['king','fisherman','farm','mill','bakery'])});
    const after=tutorialProgress(scene({buildings:[...base,...others.map(id=>b(id)),...step.buildingIds.map(id=>b(id))],jobs:['builder','hauler','miner'],marked:true}),{seen:new Set(['king','fisherman','farm','mill','bakery'])});
    if(!step.optional)assert.equal(before.steps.find(s=>s.id===step.id).done,false,`${step.id} is open before its blueprint`);
    assert.equal(after.steps.find(s=>s.id===step.id).done,true,`${step.id}: blueprints (planned) are enough`);
  }
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
