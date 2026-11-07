import { LOGISTICS_RULES } from '../data/logistics.js';
import { decodeWorldCode } from '../data/worldCode.js';
export const DEFAULT_GAME_SETTINGS=Object.freeze({difficulty:'normal',wildlifePopulation:'normal',treasureCount:1,initialStoneCount:30,
  fogOfWar:true,explorationMode:true,seasonsEnabled:true,startingCastle:false,dayLengthSeconds:120,wildlifeRespawn:'normal',startingGold:0,
  startingStone:0,startingWood:0,startingIronOre:0,startingBread:0,autoEmployment:true,worldCode:null,
  // Day and night N3: night threats (each can be switched off).
  nightWolves:true,nightThieves:true,nightFires:true});
// Owner request 7 Nov 2026: the New Game Setup proposes a built Castle (can be switched off), Gold at its limit (500)
// and 40 of each starting resource, which fills the Starter Stockpile (4 × 40 = 160). DEFAULT_GAME_SETTINGS stays the
// neutral base for older saves and automated scenarios.
export const NEW_GAME_DEFAULTS=Object.freeze({...DEFAULT_GAME_SETTINGS,startingCastle:true,startingGold:500,startingStone:40,startingWood:60,startingIronOre:0,startingBread:200});
// Physical goods placed once in the Starter Stockpile; their total fits its capacity.
export const STARTING_RESOURCES=Object.freeze({startingStone:'stone',startingWood:'wood',startingIronOre:'iron_ore',startingBread:'bread'});
export const STARTING_RESOURCE_STEP=5,STARTING_RESOURCE_CAPACITY=LOGISTICS_RULES.starterCapacity;
export const startingResourceTotal=s=>Object.keys(STARTING_RESOURCES).reduce((n,k)=>n+(s?.[k]??0),0);
export const DIFFICULTIES=Object.freeze({
  easy:{kingHP:1.5,kingDPS:1.25,animalHP:.75,animalDPS:.75},
  normal:{kingHP:1,kingDPS:1,animalHP:1,animalDPS:1},
  hard:{kingHP:.8,kingDPS:.85,animalHP:1.3,animalDPS:1.3},
});
export const WILDLIFE_COUNTS=Object.freeze({rare:1,normal:3,abundant:8});
export const WILDLIFE_INTERVALS=Object.freeze({off:0,slow:120000,normal:60000,fast:30000});
// World v2: the world code of this game (null only before a New Game picks one, and in test scenarios).
const validWorldCode=code=>{if(code===null)return true;try{decodeWorldCode(code);return typeof code==='string'&&code===code.trim().toUpperCase();}catch{return false;}};
export function gameSettings(input=DEFAULT_GAME_SETTINGS){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Neplatné nastavení nové hry.');
  const s={...DEFAULT_GAME_SETTINGS,...input};
  if(!Object.hasOwn(DIFFICULTIES,s.difficulty)||!Object.hasOwn(WILDLIFE_COUNTS,s.wildlifePopulation)
    ||!Number.isInteger(s.treasureCount)||s.treasureCount<0||s.treasureCount>10
    ||!Number.isInteger(s.initialStoneCount)||s.initialStoneCount<0||s.initialStoneCount>100||s.initialStoneCount%5!==0
    ||typeof s.fogOfWar!=='boolean'||['nightWolves','nightThieves','nightFires'].some(k=>typeof s[k]!=='boolean')||typeof s.explorationMode!=='boolean'||typeof s.seasonsEnabled!=='boolean'||typeof s.autoEmployment!=='boolean'||typeof s.startingCastle!=='boolean'||![60,120,240].includes(s.dayLengthSeconds)
    ||!Object.hasOwn(WILDLIFE_INTERVALS,s.wildlifeRespawn)||!Number.isInteger(s.startingGold)||s.startingGold<0||s.startingGold>500||s.startingGold%25!==0
    ||!validWorldCode(s.worldCode)
    ||Object.keys(STARTING_RESOURCES).some(k=>!Number.isInteger(s[k])||s[k]<0||s[k]>STARTING_RESOURCE_CAPACITY||s[k]%STARTING_RESOURCE_STEP!==0)||startingResourceTotal(s)>STARTING_RESOURCE_CAPACITY)throw new Error('Neplatné nastavení nové hry.');
  return Object.freeze(Object.fromEntries(Object.keys(DEFAULT_GAME_SETTINGS).map(k=>[k,s[k]])));
}
export function configuredStats(definition,settings){
  const stats={...definition.stats},d=DIFFICULTIES[settings?.difficulty??'normal'];
  if(definition.id==='king'){stats.maxHP*=d.kingHP;stats.attackDPS*=d.kingDPS;}
  else if(definition.gameplay?.huntable){stats.maxHP*=d.animalHP;stats.attackDPS*=d.animalDPS;}
  return stats;
}
export const animalInitialCount=(definition,settings)=>definition.gameplay.nightPredator?0:definition.gameplay.huntable?WILDLIFE_COUNTS[settings?.wildlifePopulation??'normal']:definition.gameplay.initialCount;
export const resourceSpawnSettings=(definition,settings)=>definition.id==='stone'?{...definition.spawn,initial:settings?.initialStoneCount??definition.spawn.initial,max:Math.max(definition.spawn.max,settings?.initialStoneCount??0)}:definition.spawn;
