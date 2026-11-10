// m-drevo-start and m-jidlo-balanc (playtest 0.76.0 #2, #3): wood from day 1, more food, fewer portions, and the
// developer Balance multipliers (src/data/devBalance.js) behind the hidden Dev mode.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TUTORIAL_STEPS } from '../src/data/tutorial.js';
import { FORESTRY } from '../src/data/naturalResources.js';
import { FISHING } from '../src/data/fishing.js';
import { FARMING_RULES } from '../src/data/farming.js';
import { FOOD_RECIPES } from '../src/data/foodProduction.js';
import { RATIONS } from '../src/data/policy.js';
import { HUNTING_RULES } from '../src/data/workplaces.js';
import { WORK_RULES } from '../src/data/jobs.js';
import { NEW_GAME_DEFAULTS,STARTING_RESOURCE_CAPACITY,startingResourceTotal } from '../src/systems/GameSettings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FoodSystem } from '../src/systems/FoodSystem.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { Inventory } from '../src/game/inventory.js';
import { DEV_BALANCE_KEYS,devDefault,DEV_BALANCE_STORAGE_KEY,loadDevBalance,devFactor,devMode,setDevMode,setDevFactor,resetDevBalance,devBalanceValues } from '../src/data/devBalance.js';
import { DevBalancePanel } from '../src/ui/DevBalancePanel.js';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),map:m};};

test('m-drevo-start: the Lumberjack Hut comes right after the Granary, before the Hunting Lodge',()=>{
  const ids=TUTORIAL_STEPS.map(s=>s.id);assert.equal(ids.indexOf('lumberjack_hut'),ids.indexOf('granary')+1);assert.ok(ids.indexOf('lumberjack_hut')<ids.indexOf('hunting_lodge'));
});
test('m-drevo-start: chopping is 1.5× faster from data (the wood per tree and the hut pile stay)',()=>{
  for(const [id,wood]of [['oak_tree',6],['pine_tree',5]]){const tree=objectRegistry.require(id).tree;assert.equal(tree.wood,wood);assert.equal(tree.chopDuration,FORESTRY.trees[id].chopDuration);
    assert.ok(FORESTRY.legacyChopDuration/tree.chopDuration>=1.5,'chopping is the part sped up; walking and hauling stay, so the hut makes about +50 % (scripts/balance-sim.mjs)');}
});
test('m-drevo-start: the New Game start (30 Stone, 110 Wood, 160 Bread) fills the Starter Stockpile exactly',()=>{
  assert.deepEqual([NEW_GAME_DEFAULTS.startingStone,NEW_GAME_DEFAULTS.startingWood,NEW_GAME_DEFAULTS.startingBread],[30,110,160]);
  assert.equal(startingResourceTotal(NEW_GAME_DEFAULTS),STARTING_RESOURCE_CAPACITY);
});
test('m-jidlo-balanc: more food and fewer portions come from data',()=>{
  // tabulka-budov-1 (owner table 9 Nov 2026): Mill 4 Wheat → 2 Flour, Bakery 1 Flour → 6 Bread, fields 10 Wheat, orchards 8 Apples.
  assert.deepEqual([FOOD_RECIPES.mill.input,FOOD_RECIPES.mill.output,FOOD_RECIPES.bakery.input],[{wheat:4},{flour:2},{flour:1}]);assert.deepEqual([FARMING_RULES.crops.wheat_field.yield,FARMING_RULES.crops.orchard.yield],[10,8]);
  assert.deepEqual(['rabbit','deer','wild_boar'].map(id=>objectRegistry.require(id).gameplay.meatDrop),[7,13,20]);
  assert.ok(HUNTING_RULES.huntRadius>WORK_RULES.workRadius);assert.equal(FISHING.perDay,9);assert.ok(FISHING.plentiful>1);
  assert.equal(FARMING_RULES.growthRate,1.2);assert.deepEqual(FOOD_RECIPES.bakery.output,{bread:6});
  assert.deepEqual(Object.values(RATIONS).map(r=>[r.portions,r.food]),[[.4,30],[.8,60],[1.2,80]]);
});
test('m-91: dev multipliers act whether or not the Dev tool is shown, are clamped, kept out of the browser and Reset returns 1×',()=>{
  const storage=memory();loadDevBalance(storage);assert.equal(devMode(),true,'alpha: the Dev tool icon is shown by default');
  setDevMode(false);setDevFactor('hunter',2);assert.equal(devFactor('hunter'),2,'the coefficients belong to the game, the switch only hides the icon');
  setDevMode(true);assert.equal(setDevFactor('fisher',9),4);assert.equal(setDevFactor('taxes',0),.25);assert.equal(setDevFactor('nonsense',2),false);
  assert.equal(JSON.parse(storage.getItem(DEV_BALANCE_STORAGE_KEY)).values,undefined,'values are no longer stored in the browser');loadDevBalance(storage);assert.equal(devFactor('hunter'),1,'a new start is ×1 (the save brings its own values)');
  setDevFactor('hunter',2);resetDevBalance();assert.ok(DEV_BALANCE_KEYS.every(k=>devFactor(k)===devDefault(k)),'Reset: every value at its default (×1; the forest sapling chance and hut boost their own)');assert.deepEqual(Object.keys(devBalanceValues()),DEV_BALANCE_KEYS);
  storage.setItem(DEV_BALANCE_STORAGE_KEY,'{broken');assert.doesNotThrow(()=>loadDevBalance(storage));assert.equal(devMode(),true);
  assert.doesNotThrow(()=>loadDevBalance({getItem(){throw new Error('denied');}}));setDevMode(true);setDevMode(false);
});
test('the consumption multiplier changes how much residents eat (the King keeps 2 a day)',()=>{
  const eat=factor=>{loadDevBalance(memory());setDevFactor('consumption',factor);const time=new GameTimeSystem(60000),inventory=new Inventory();inventory.add('bread',500);
    const workers=[{id:'w1',isAlive:true},{id:'w2',isAlive:true}],scene={character:{id:'king',isAlive:true},workerSystem:{liveWorkers:()=>workers},policy:{portions:()=>RATIONS.normal.portions}};
    const f=new FoodSystem(inventory,null,()=>{},{time,scene});for(let i=0;i<100;i++)f.advance(6000);const daily=f.dailyConsumption;loadDevBalance(memory());return {eaten:500-inventory.count('bread'),daily};};
  const one=eat(1),two=eat(2);assert.equal(one.daily,2+2*.8);assert.equal(two.daily,2+2*1.6);assert.equal(one.eaten,20+16);assert.equal(two.eaten,20+32);
});
// A minimal DOM for the panel (no DOM library in the node tests).
function fakeDocument(){
  const make=tag=>{const e={tagName:tag,children:[],dataset:{},hidden:false,listeners:{},attributes:{},textContent:'',
    append(...c){this.children.push(...c);},after(n){(this.parent??doc.body).children.push(n);},remove(){this.removed=true;},setAttribute(k,v){this.attributes[k]=v;},
    addEventListener(type,fn,o){if(!o?.signal?.aborted)(this.listeners[type]??=[]).push(fn);},fire(type){for(const fn of this.listeners[type]??[])fn({stopPropagation(){}});},
    querySelector(sel){const walk=n=>{for(const c of n.children){if(c.tagName===sel)return c;const r=walk(c);if(r)return r;}return null;};return walk(this);}};return e;};
  const doc={body:make('body'),createElement:make,heading:make('h3'),version:make('p'),querySelector(sel){return sel.includes('dev.title')?doc.heading:sel.includes('settings-version')?doc.version:null;}};
  return doc;
}
test('m-91: the Dev tool icon opens the menu (again closes it); Show Dev tool hides it; a slider sets the factor and shows the dot; Reset returns ×1',()=>{
  const doc=fakeDocument(),storage=memory(),scene={};const panel=new DevBalancePanel(scene,{storage,document:doc});
  try{
    assert.equal(panel.row.hidden,false,'Show Dev tool is always in Settings (no 5-click unlock)');assert.equal(panel.toggle.checked,true);assert.equal(panel.button.hidden,false);assert.equal(panel.panel.hidden,true);
    panel.button.fire('click');assert.equal(panel.panel.hidden,false);assert.equal(panel.button.attributes['aria-expanded'],'true');assert.equal(panel.sliders.size,DEV_BALANCE_KEYS.length);
    assert.equal(panel.dot.hidden,true,'no dot at ×1');
    const {input,out}=panel.sliders.get('fisher');input.value='1.5';input.fire('input');assert.equal(devFactor('fisher'),1.5);assert.equal(out.textContent,'×1.50');assert.equal(panel.dot.hidden,false,'a dot while any coefficient ≠ ×1');
    panel.reset.fire('click');assert.equal(devFactor('fisher'),1);assert.equal(panel.sliders.get('fisher').input.value,'1');assert.equal(panel.dot.hidden,true);
    panel.button.fire('click');assert.equal(panel.panel.hidden,true,'a second click closes');
    panel.button.fire('click');panel.toggle.checked=false;panel.toggle.fire('change');assert.equal(devMode(),false);assert.equal(panel.panel.hidden,true);assert.equal(panel.button.hidden,true);
  }finally{panel.destroy();loadDevBalance(memory());}
});
