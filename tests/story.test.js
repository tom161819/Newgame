import test from 'node:test';
import assert from 'node:assert/strict';
import { CourtSystem } from '../src/systems/CourtSystem.js';
import { StorySystem,validStoryState } from '../src/systems/StorySystem.js';
import { STORY,STORY_EVENTS,STORY_ENDINGS,STORY_EXTRA_LETTERS,storyEnding,raidUnits } from '../src/data/story.js';
import { COURT } from '../src/data/court.js';
import { Inventory } from '../src/game/inventory.js';
import { setLanguage,t } from '../src/i18n/index.js';

const building=(type,extra={})=>({type,construction:{state:'complete'},...extra});
function world({gold=500,level=1,soldiers=0}={}){
  const inventory=new Inventory();inventory.add('gold',gold);inventory.add('wood',200);const feed=[],castle=building('castle',{level});
  const residents=[...Array.from({length:10},()=>({profession:'farmer'})),...Array.from({length:soldiers},()=>({profession:'soldier'}))];
  const scene={kingdomRanks:true,gameSettings:{story:true},inventory,gameTime:{day:1},buildings:[castle,building('lumberjack_hut')],workerSystem:{liveSubjects:()=>residents},eventFeed:{push:(k,text)=>feed.push(text)},
    animalSystem:{animals:new Map(),remove(a){this.animals.delete(a.id);}}};
  const court=new CourtSystem(scene,{spawn:units=>{let n=0;for(const [id,c] of Object.entries(units))for(let i=0;i<c;i++){const a={id:`${id}${i}-${scene.gameTime.day}`,type:id,isAlive:true,definition:{gameplay:{hostile:true}}};scene.animalSystem.animals.set(a.id,a);n++;}return n;}});
  scene.court=court;let joined=0;const story=new StorySystem(scene,court,{reinforce:n=>{joined+=n;}});scene.story=story;
  const tick=day=>{scene.gameTime.day=day;court.wait=0;story.wait=0;court.update(0);story.update(0);};
  const readAll=(pick={})=>{let guard=0;while(story.inbox.length&&guard++<50){const id=story.inbox[0];if(id==='tribute')story.closeTribute(pick.tribute!=='refuse');else{const c=story.choicesOf(id);story.close(id,c?(pick[id]??c[0].id):null);}}};
  return {scene,court,story,inventory,feed,tick,readAll,castle,joined:()=>joined,kill:()=>scene.animalSystem.animals.clear()};
}
test('story: every letter and choice has a text in both languages', () => {
  const ids=[...STORY_EVENTS.map(e=>e.id),...STORY_EXTRA_LETTERS];
  for(const lang of ['en','cs']){setLanguage(lang);
    for(const id of ids)for(const part of ['title','from','body']){const key=`story.${id}.${part}`;assert.notEqual(t(key),key,`${lang} ${key}`);}
    for(const ev of STORY_EVENTS)for(const c of ev.choices??[]){const key=`story.${ev.id}.${c.id}`;assert.notEqual(t(key),key,`${lang} ${key}`);}
    for(const k of ['story.tribute.pay','story.tribute.refuse',...Object.keys(STORY.raidExtra).map(k=>`story.raid.${k}`),...[1,2,3,4,5,6,7,8].map(n=>`story.chapter.${n}`)])assert.notEqual(t(k),k,`${lang} ${k}`);}
  setLanguage('en');assert.equal(new Set(ids).size,ids.length);
});
test('story: the prologue opens the game; chapters follow the Castle level and a minimum time; the year follows', () => {
  const {story,tick,readAll,castle}=world();tick(1);assert.deepEqual(story.inbox,['prologue']);assert.equal(story.year,1420);
  assert.equal(story.close('prologue','x'),true);tick(2);assert.deepEqual(story.inbox,['purkart']);readAll();
  castle.level=2;tick(5);assert.equal(story.chapter,1,'not before 10 days');readAll();tick(11);assert.equal(story.chapter,2);assert.ok(story.inbox.includes('crusade'));readAll();
  castle.level=4;tick(21);assert.equal(story.chapter,3,'one chapter at a time');tick(22);assert.equal(story.chapter,3);
  assert.equal(story.close('aid',null),false,'a choice is needed');const trust=story.court.trust;assert.equal(story.close('aid','send'),true);assert.equal(story.court.trust,trust+10);assert.equal(story.flags.aidSent,true);
});
test('story: Smil slanders, a saboteur is caught by guards (proof 1), beaten raiders give proofs 2 and 3, then Smil can be accused', () => {
  const {story,court,tick,readAll,castle,kill}=world({soldiers:2});court.nextOrderDay=1e6;tick(1);readAll();
  tick(6);assert.equal(court.trust,COURT.startTrust+STORY.smil.slander,'slander in chapter 1');
  castle.level=2;tick(11);readAll();assert.equal(story.chapter,2);tick(13);assert.equal(story.evidence,1,'the guards caught the saboteur');readAll();
  castle.level=3;tick(21);readAll();assert.equal(story.chapter,3);tick(28);assert.equal(story.raid,null);tick(35);assert.ok(story.raid,'hired raiders, not in the first days of the chapter');assert.equal(story.raid.kind,'smil');
  kill();tick(36);assert.equal(story.raid,null);assert.equal(story.evidence,2);readAll();
  castle.level=4;tick(37);assert.equal(story.chapter,4);readAll({choice:'crown'});assert.equal(story.faction,null,'the choice comes two days into the chapter');
  tick(39);assert.deepEqual(story.choicesOf('choice').map(c=>c.id),['crown','prague','tabor','own']);readAll({choice:'crown'});assert.equal(story.faction,'crown');tick(40);assert.equal(story.chapter,5);
  let guard=0;while(story.evidence<3&&guard++<40){tick(story.day+1);if(story.raid){kill();}readAll();}
  assert.equal(story.evidence,3);assert.equal(story.canAccuse(),true);const trust=court.trust;assert.equal(story.accuse(),true);assert.equal(court.trust,Math.min(100,trust+STORY.accuseTrust));assert.equal(story.smilFallen,true);
  assert.equal(story.canAccuse(),false);
});
test('story: the choice is lasting; each side changes who sends orders, what comes and what it pays', () => {
  for(const side of ['prague','tabor','own']){
    const {story,court,tick,readAll,castle,inventory,joined}=world({level:4});story.importState(null);assert.equal(story.chapter,4);court.nextOrderDay=1e6;
    tick(3);readAll({choice:side});assert.equal(story.faction,side);story.apply({faction:'crown'});assert.equal(story.faction,side,'no way back');
    assert.equal(court.active,side!=='own');assert.equal(court.patron,side==='own'?'king':side);if(side!=='own')assert.equal(court.trust,50);
    assert.equal(joined(),side==='tabor'?STORY.reinforcements:0);
    const before=inventory.count('gold');tick(4);readAll();tick(5);assert.equal(inventory.count('gold')-before,STORY.income[side]*4*2,'daily income');
  }
});
test('story: the own lord is asked for tribute – pay or be attacked; a lost fight costs stores', () => {
  const {story,court,tick,readAll,inventory,kill,scene}=world({level:4});story.importState(null);court.nextOrderDay=1e6;tick(3);readAll({choice:'own'});
  tick(story.nextRaidDay);assert.equal(story.inbox.at(-1),'tribute');const cost=STORY.tributeGold*4;story.inbox=['tribute'];const gold=inventory.count('gold');
  readAll();assert.equal(inventory.count('gold'),gold-cost);tick(story.day);assert.equal(story.raid,null);readAll({landfryd:'alone'});
  tick(story.nextRaidDay);readAll({tribute:'refuse'});tick(story.day);assert.equal(story.raid?.kind,'tribute');
  scene.buildings[0].hp={hp:1,max:100};scene.buildings[0].currentHP=1;court.castleFallen=()=>true;const wood=inventory.count('wood');tick(story.day);
  assert.equal(story.raid,null);assert.equal(inventory.count('wood'),wood-Math.floor(wood*STORY.raid.plunderShare));assert.ok(story.inbox.includes('raidLost'));
});
test('story: chapters 5–7 run by time to the epilogue and an ending; the state is saved exactly', () => {
  const {story,court,tick,readAll,kill}=world({level:4});story.importState(null);court.nextOrderDay=1e6;tick(3);readAll({choice:'tabor'});
  let day=4;for(;day<120&&!story.ending;day++){tick(day);if(story.raid||court.expedition)kill();readAll({lipanyTabor:'leave'});}
  assert.equal(story.chapter,8);assert.equal(story.ending,'taborSurvivor');assert.equal(story.year,1437);assert.equal(court.active,false,'no orders after the epilogue');
  for(const id of ['zizka','usti','rides','domazlice','lipanyTabor','jihlava','epilogue'])assert.ok(story.fired.includes(id),id);
  const saved=JSON.parse(JSON.stringify(story.exportState()));assert.equal(validStoryState(saved),true);const other=world().story;other.importState(saved);assert.deepEqual(other.exportState(),saved);
  for(const bad of [s=>s.chapter=9,s=>s.faction='x',s=>s.fired.push('nope'),s=>s.flags.a=1,s=>s.raid={kind:'x',day:1},s=>s.extra=1,s=>s.evidence=4]){const c=structuredClone(saved);bad(c);assert.equal(validStoryState(c),false);}
  assert.deepEqual([['crown',{},3,50],['crown',{},0,10],['crown',{},0,50],['prague',{traitor:true},3,50],['prague',{},0,50],['tabor',{lastStand:true},0,0],['tabor',{turncoat:true},0,0],['own',{landfryd:true},3,0],['own',{landfryd:true},0,0],['own',{},3,0]]
    .map(([faction,flags,evidence,trust])=>storyEnding({faction,flags,evidence,trust})),['crownBrod','crownFall','crownSecond','pragueTraitor','pragueLord','taborLast','taborTurncoat','ownBrod','ownFree','ownIsland']);
  assert.equal(STORY_ENDINGS.length,12);
});
test('story: a raid is sized by the player\'s army, with archers, swordsmen and knights by Castle level', () => {
  assert.deepEqual(raidUnits('smil',0,3),{enemy_soldier:3},'at least three men');
  assert.deepEqual(raidUnits('smil',4,3),{enemy_archer:1,enemy_soldier:3});
  assert.deepEqual(raidUnits('royal',20,4),{enemy_archer:7,enemy_swordsman:5,enemy_knight:2,enemy_soldier:12});
  const total=u=>Object.values(u).reduce((n,v)=>n+v,0);assert.equal(total(raidUnits('lastStand',10,4)),22);assert.ok(total(raidUnits('mercs',10,4))<total(raidUnits('royal',10,4)));
});
