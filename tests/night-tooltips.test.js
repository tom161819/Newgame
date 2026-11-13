import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { NightSpeedUp,NIGHT_SPEED_TIP_DAY } from '../src/systems/NightSpeedUp.js';
import { DAY_NIGHT,validNightSpeedTipState } from '../src/data/dayNight.js';
import { readNightSpeed } from '../src/ui/NightControls.js';
import { BUILDING_TOOLTIP,buildingTooltipAllowed,buildingTooltipsEnabled,setBuildingTooltipsEnabled } from '../src/data/buildingTooltip.js';
import { loadDevBalance,setDevMode,setDevTooltipDelay,buildingTooltipDelayMs,resetDevBalance,devBalanceJSON } from '../src/data/devBalance.js';
import { buildingTooltipContent,buildingTooltipText } from '../src/ui/buildingTooltipContent.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};

// ---- m-noc-zrychleni (82) ----
// A scene with the clock, day/night and a speed indicator like SpeedControls (setSpeed = the player, applyAuto = the night).
function nightScene({setting=1,speed=1,day=2}={}){
  const g=new GameTimeSystem(120000);g.day=day;g.elapsed=.3*120000;
  const s={gameTime:g,seasons:{enabled:true},gameSpeed:speed,playerPaused:false};s.dayNight=new DayNightSystem(s);
  const store={value:setting},tips=[];
  s.speedControls={applyAuto(v){s.gameSpeed=v;},setSpeed(v){s.nightSpeedUp?.manualChange();s.gameSpeed=v;}};
  s.nightSpeedUp=new NightSpeedUp(s,{read:()=>store.value,save:v=>{store.value=v;},tip:{show(){tips.push(g.day);},hide(){},destroy(){}}});
  const at=(fraction,d=g.day)=>{g.day=d;g.elapsed=fraction*120000;s.nightSpeedUp.update();return s.gameSpeed;};
  return {s,g,store,tips,at,night:()=>s.dayNight.nightStart()+.05};
}

test('82: Auto speed-up at night is off by default – the night keeps the speed and the indicator',()=>{
  assert.equal(DAY_NIGHT.defaultNightSpeed,1);assert.equal(readNightSpeed(memory()),1,'nothing stored: off');
  const stored=memory();stored.setItem('newgame.nightSpeed','3');assert.equal(readNightSpeed(stored),3,'a choice made earlier in this browser is kept');
  const {s,at,night}=nightScene();assert.equal(at(.3),1);assert.equal(at(night()),1,'night: still 1');assert.equal(s.nightSpeedUp.engaged,false);
  assert.equal(s.dayNight.speed(1),1,'no extra steps per frame at night any more');
});

test('82: with the option on the night shows step 3 (moon) and dawn returns the speed from before the night',()=>{
  const {s,at,night}=nightScene({setting:3,speed:1});
  assert.equal(at(.3),1,'by day nothing');assert.equal(at(night()),3,'night: step 3');assert.equal(s.nightSpeedUp.engaged,true,'held by the automatic (moon on the indicator)');
  s.playerPaused=true;assert.equal(at(night()+.01),3,'the pause stays separate and wins');assert.equal(s.playerPaused,true);s.playerPaused=false;
  assert.equal(at(.02,s.gameTime.day+1),1,'dawn: back to 1');assert.equal(s.nightSpeedUp.engaged,false);
  // From 2× the night also goes to 3× and back to 2×; at 3× nothing changes.
  s.gameSpeed=2;assert.equal(at(night()),3);assert.equal(at(.02,s.gameTime.day+1),2);
  s.gameSpeed=3;at(night());assert.equal(s.nightSpeedUp.engaged,false,'already 3×: the night changes nothing');assert.equal(at(.02,s.gameTime.day+1),3);
  // Skip to dawn and a fight take the speed back to the one before the night.
  s.gameSpeed=1;assert.equal(at(night()),3);s.dayNight.skipToDawn();assert.equal(at(night()+.01),1,'skip runs its own ×8 steps');s.dayNight.skipping=false;assert.equal(at(night()+.02),3);
  s.dayNight.attention=()=>true;assert.equal(at(night()+.03),1,'a fight: back to 1');s.dayNight.attention=()=>false;assert.equal(at(night()+.04),3);
});

test('82: a manual speed change at night wins and the automatic keeps out until the morning',()=>{
  const {s,at,night}=nightScene({setting:3,speed:1});
  assert.equal(at(night()),3);s.speedControls.setSpeed(2);assert.equal(s.gameSpeed,2);
  assert.equal(at(night()+.02),2,'stays 2 for the rest of the night');assert.equal(s.nightSpeedUp.engaged,false);
  assert.equal(at(.02,s.gameTime.day+1),2,'dawn keeps the player\'s choice');
  assert.equal(at(night()),3,'the next night the automatic works again');
  s.speedControls.setSpeed(1);assert.equal(at(night()+.01),1);
  // A change by day is just the player's speed.
  at(.3,s.gameTime.day+1);s.speedControls.setSpeed(2);assert.equal(s.nightSpeedUp.manual,false);assert.equal(at(night()),3);assert.equal(at(.02,s.gameTime.day+1),2);
});

test('82: the tip comes once per game after one year (only with the option off); Turn on sets ×3; "shown" is saved',()=>{
  assert.equal(NIGHT_SPEED_TIP_DAY,21);
  const {s,store,tips,at}=nightScene({setting:1,day:1});
  for(let d=1;d<NIGHT_SPEED_TIP_DAY;d++)at(.3,d);assert.deepEqual(tips,[],'not in the first year');
  at(.3,NIGHT_SPEED_TIP_DAY);at(.5,NIGHT_SPEED_TIP_DAY);at(.3,NIGHT_SPEED_TIP_DAY+5);assert.deepEqual(tips,[NIGHT_SPEED_TIP_DAY],'once');
  assert.equal(s.nightSpeedUp.exportState(),true);s.nightSpeedUp.enable();assert.equal(store.value,3,'Turn on = ×3');
  // A game where the option is already on never gets the tip (and does not get it later either).
  const on=nightScene({setting:3,day:NIGHT_SPEED_TIP_DAY});on.at(.3);assert.deepEqual(on.tips,[]);on.store.value=1;on.at(.4);assert.deepEqual(on.tips,[]);
  // During the tutorial it waits.
  const tut=nightScene({setting:1,day:NIGHT_SPEED_TIP_DAY});tut.s.tutorial={active:true};tut.at(.3);assert.deepEqual(tut.tips,[]);tut.s.tutorial.active=false;tut.at(.31);assert.deepEqual(tut.tips,[NIGHT_SPEED_TIP_DAY]);
  // Restored "shown" stops it.
  const loaded=nightScene({setting:1,day:30});loaded.s.nightSpeedUp.importState(true);loaded.at(.3);assert.deepEqual(loaded.tips,[]);
  assert.equal(validNightSpeedTipState(true),true);for(const bad of [false,1,'true',null,{}])assert.equal(validNightSpeedTipState(bad),false);
});

// ---- m-budovy-tooltip (86) ----
function world(){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
  const place=(type,x,y,{site=false}={})=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,...(site?{reserveMaterials:true}:{})});assert.ifError(r.error);
    if(site)s.constructionSystem.plan(r.building);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  const text=b=>buildingTooltipText(buildingTooltipContent(s,b));
  return {s,starter,place,text};
}

test('86: tooltip content by building type, at most 4 lines',()=>{
  const {s,place,text}=world();
  const farm=place('farmhouse',44,40),granary=place('granary',58,40),house=place('house',30,60),bakery=place('bakery',50,60),yard=place('material_yard',70,40);
  assert.deepEqual(text(house),['House','Residents 0 / 5'],'an empty house: no happiness icon');
  // Store: the largest goods first, at most 4, then used / capacity.
  const g=s.foodStorage.locations.get(`granary-${granary.id}`);for(const [id,n]of [['bread',50],['meat',30],['fish',20],['apple',10]])assert.equal(s.foodStorage.deposit(g.id,id,n),true);
  assert.deepEqual(text(granary),['Granary','Bread 50 · Meat 30 · Fish 20 · Apple 10 · 110 / 1000']);
  const stock=buildingTooltipContent(s,granary).lines[0];assert.equal(stock.kind,'stock');assert.ok(stock.items.length<=BUILDING_TOOLTIP.maxItems);
  s.foodStorage.deposit(`farmhouse-${farm.id}`,'wheat',120);
  assert.deepEqual(text(farm),['Farmhouse ⛔','Workers 0 / 3','Wheat 120 · 120 / 200'],'Farmhouse: a workplace with a store');
  assert.deepEqual(text(yard),['Material Yard','0 / 400']);
  // Workplace with a recipe: waiting for its input, then the product and its progress.
  assert.deepEqual(text(bakery),['Bakery ⛔ ⏳','Workers 0 / 1','Waiting for Flour, Wood']);
  const baker=s.workerSystem.create({x:52,y:66});assert.equal(s.workplaceSystem.assign(bakery,baker),true);
  const record=s.foodProduction.records.get(bakery.id);record.cycle={requiredWork:1000,workDone:600,inputs:{flour:1}};
  assert.deepEqual(text(bakery),['Bakery','Workers 1 / 1','Bread – 60 %']);
  record.auto=false;assert.deepEqual(text(bakery),['Bakery ⛔','Workers 1 / 1','Production paused']);record.auto=true;
  // House: residents and their happiness.
  for(let i=0;i<2;i++)s.workerSystem.create({x:32+i,y:66});s.needs.homes();
  const content=buildingTooltipContent(s,house);assert.match(content.lines[0].text,/^Residents 3 \/ 5$/,'the Baker and two more live there');assert.ok(['happy','neutral','unhappy','critical'].includes(content.lines[0].mood),'a happiness icon');
  // Fire and rats are status icons after the name.
  s.nightThreats={burning:b=>b.id===granary.id};s.domestic={ratBuildings:()=>[granary],status:()=>({level:'many'}),houseHasRats:()=>false};
  assert.equal(text(granary)[0],'Granary 🔥 🐀');delete s.nightThreats;delete s.domestic;
  // Construction site: progress and what is missing.
  const site=place('house',70,60,{site:true});site.construction.progress=45.6;
  const lines=text(site);assert.equal(lines[0],'House');assert.equal(lines[1],'Construction 45 %');
  assert.match(lines[2],/^Needs \d+ Wood$/);
  for(const b of [farm,granary,house,bakery,yard,site])assert.ok(text(b).length<=BUILDING_TOOLTIP.maxLines,`${b.type}: at most 4 lines`);
  // Never more than 4 even when a building has everything.
  const busy={...buildingTooltipContent(s,farm)};assert.ok(busy.lines.length<=BUILDING_TOOLTIP.maxLines-1);
});

test('86: construction site shows progress and lists the missing materials',()=>{
  const {place,text}=world();const site=place('house',70,60,{site:true});
  assert.deepEqual(text(site),['House','Construction 0 %','Needs 10 Wood']);
});

test('86: the delay comes from the data (0.8 s) or the Dev tool value (0.2–2 s, a browser preference); when the tooltip may show',()=>{
  assert.equal(BUILDING_TOOLTIP.delayMs,800);const storage=memory();loadDevBalance(storage);
  assert.equal(buildingTooltipDelayMs(),800);setDevTooltipDelay(1.5);
  setDevMode(false);assert.equal(buildingTooltipDelayMs(),1500,'m-91: in force whether or not the Dev tool icon is shown');setDevMode(true);assert.equal(setDevTooltipDelay(5),2);assert.equal(setDevTooltipDelay(0),.2);assert.equal(buildingTooltipDelayMs(),200);
  setDevTooltipDelay(1.2);loadDevBalance(storage);assert.equal(buildingTooltipDelayMs(),1200,'stored in the browser like the other dev values');assert.match(devBalanceJSON(),/"tooltipDelaySeconds": 1.2/);
  resetDevBalance();assert.equal(buildingTooltipDelayMs(),800,'Reset returns the default');setDevMode(false);loadDevBalance(memory());
  assert.equal(buildingTooltipAllowed({}),true);
  for(const blocked of [{buildMode:true},{dragging:true},{selected:true},{touch:true},{enabled:false}])assert.equal(buildingTooltipAllowed(blocked),false,JSON.stringify(blocked));
  const settings=memory();assert.equal(buildingTooltipsEnabled(settings),true,'on by default');setBuildingTooltipsEnabled(false,settings);assert.equal(buildingTooltipsEnabled(settings),false);
});

test('86: StorePreview shows the building tooltip after the delay and keeps the store gauge preview',async()=>{
  const {s,place}=world();const granary=place('granary',58,40);s.assets={previewURL:()=>''};
  const make=tag=>{const e={tagName:tag,children:[],dataset:{},style:{},hidden:false,className:'',textContent:'',attributes:{},classList:{set:new Set(),add(c){this.set.add(c);},remove(c){this.set.delete(c);},contains(c){return this.set.has(c);}},
    append(...c){this.children.push(...c);},replaceChildren(...c){this.children=[...c];},setAttribute(k,v){this.attributes[k]=v;},remove(){},addEventListener(){}};return e;};
  const doc={body:make('body'),createElement:make,querySelector:()=>null},saved=globalThis.document;globalThis.document=doc;globalThis.innerWidth=800;globalThis.innerHeight=600;
  const {StorePreview}=await import('../src/ui/StorePreview.js');
  try{
    const p=new StorePreview(s,{document:doc,buildingDelay:20,storage:memory()});
    p.hoverBuilding(granary,100,100);assert.equal(p.root.hidden,true,'not at once');
    await new Promise(r=>setTimeout(r,40));assert.equal(p.root.hidden,false,'shown after the delay');assert.equal(p.root.classList.contains('building-tooltip'),true);
    assert.equal(p.root.children[0].textContent,'Granary');
    p.hoverBuilding(granary,100,100,{allowed:false});assert.equal(p.root.hidden,true,'hidden at once when not allowed');
    // A dialog that opens while the delay runs (Escape → Game Menu) keeps it closed.
    let dialog=null;doc.querySelector=q=>/dialog\[open\]/.test(q)?dialog:null;p.hoverBuilding(null,0,0);p.hoverBuilding(granary,100,100);dialog={};await new Promise(r=>setTimeout(r,40));assert.equal(p.root.hidden,true,'not over a dialog');
    dialog=null;doc.querySelector=()=>null;p.hoverBuilding(null,0,0);
    p.enabled=false;p.hoverBuilding(granary,100,100);await new Promise(r=>setTimeout(r,40));assert.equal(p.root.hidden,true,'switched off');
    p.hover({key:'hud-store',locations:()=>p.locationsOf(granary),x:5,y:5,below:true,delay:10});p.hoverBuilding(null,0,0);await new Promise(r=>setTimeout(r,30));assert.equal(p.root.hidden,false,'the gauge preview is not cleared by the map');
    p.destroy();
  }finally{globalThis.document=saved;}
});

test('86/82: nightSpeedTip needs no SAVE_VERSION bump (62 since tabulka-budov-1); nightSpeedTip is optional, strictly validated, and round-trips',()=>{
  assert.equal(SAVE_VERSION,62);
  const {s}=world();s.nightSpeedUp=new NightSpeedUp(s,{read:()=>1,save:()=>{},tip:null});
  const plain=serializeGameState(s);assert.equal(Object.hasOwn(plain,'nightSpeedTip'),false,'absent until shown');validateGameState(plain);
  s.nightSpeedUp.tipShown=true;const shown=serializeGameState(s);assert.equal(shown.nightSpeedTip,true);validateGameState(shown);
  for(const bad of [false,'yes',1])assert.throws(()=>validateGameState({...shown,nightSpeedTip:bad}));
  s.nightSpeedUp.tipShown=false;loadGameState(s,shown);assert.equal(s.nightSpeedUp.tipShown,true,'restored');
});
