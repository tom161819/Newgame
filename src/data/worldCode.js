// World v2 step 1 (plan m-svet-kod-sveta, brief zadani-svet-v2.md): the world code MKW<generator>-<settings>-<seed>.
// <generator> is WORLD_GENERATOR_VERSION; <settings> is one digit (level 0–9) per WORLD_SETTINGS entry in this order;
// <seed> is base36 in capitals, 1–8 characters. New settings are only added at the end, with a new generator version.
// Level 5 (and the listed default for the count-like settings) reproduces the 0.14.0 generator's values.
export const WORLD_GENERATOR_VERSION=1;
export const WORLD_SEED_MAX=36**8-1;
// key: id used in code and Studio; max: highest level; default: today's world; scale: level → multiplier (or value).
const linear=(at0,at5,at9)=>level=>level<=5?at0+(at5-at0)*level/5:at5+(at9-at5)*(level-5)/4;
export const WORLD_SETTINGS=Object.freeze([
  {key:'rivers',name:'Rivers',max:1,default:1,describe:l=>l?'one river':'no river'},
  {key:'riverWidth',name:'River width',max:9,default:5,value:linear(.6,1,1.4),describe:l=>`×${linear(.6,1,1.4)(l).toFixed(2)} width`},
  {key:'meanders',name:'Meanders',max:9,default:5,value:linear(0,1,1.8),describe:l=>`×${linear(0,1,1.8)(l).toFixed(2)} bends`},
  {key:'fords',name:'Fords',max:9,default:5,value:linear(1.8,1,.55),describe:l=>`every ${Math.round(22*linear(1.8,1,.55)(l))} tiles`},
  {key:'lakes',name:'Lakes',max:3,default:1,describe:l=>`${l} lake${l===1?'':'s'}`},
  {key:'desert',name:'Desert',max:9,default:5,value:l=>l?.5+l*.1:0,describe:l=>l?`×${(.5+l*.1).toFixed(1)} size`:'none'},
  {key:'sandyBanks',name:'Sandy banks',max:9,default:5,value:linear(0,1,1.8),describe:l=>`×${linear(0,1,1.8)(l).toFixed(2)} beach`},
  {key:'bankVegetation',name:'Bank vegetation',max:9,default:5,value:linear(0,1,2.2),describe:l=>`×${linear(0,1,2.2)(l).toFixed(2)} bushes by water`},
  {key:'forest',name:'Forest density',max:9,default:5,value:linear(.15,1,1.9),describe:l=>`${Math.round(200*linear(.15,1,1.9)(l))} trees`},
  {key:'rocks',name:'Rocks',max:9,default:5,value:linear(.2,1,1.8),describe:l=>`${Math.round(65*linear(.2,1,1.8)(l))} outcrops`},
  {key:'bushes',name:'Bushes',max:9,default:5,value:linear(0,1,2),describe:l=>`${Math.round(26*linear(0,1,2)(l))} clusters`},
  {key:'grassScale',name:'Grass zone scale',max:9,default:5,reserved:true,describe:()=>'no effect in generator 1'},
]);
// Owner-approved defaults (world:sync from the Studio may change them; keep one digit per setting).
export const DEFAULT_WORLD_LEVELS=Object.freeze([1,5,5,5,1,5,5,5,5,5,5,5]);
export const defaultWorldLevels=()=>[...DEFAULT_WORLD_LEVELS];
export class WorldCodeError extends Error{constructor(reason,message){super(message);this.reason=reason;}}
export function validLevels(levels){return Array.isArray(levels)&&levels.length===WORLD_SETTINGS.length&&levels.every((l,i)=>Number.isInteger(l)&&l>=0&&l<=WORLD_SETTINGS[i].max);}
export function encodeWorldCode({generator=WORLD_GENERATOR_VERSION,levels=defaultWorldLevels(),seed}){
  if(!Number.isSafeInteger(generator)||generator<1)throw new WorldCodeError('invalid','Invalid world code');
  if(!validLevels(levels)||!Number.isSafeInteger(seed)||seed<0||seed>WORLD_SEED_MAX)throw new WorldCodeError('invalid','Invalid world code');
  return `MKW${generator}-${levels.join('')}-${seed.toString(36).toUpperCase()}`;
}
// Accepts lower case and surrounding spaces. Throws WorldCodeError: 'invalid' or 'generator' (another version).
export function decodeWorldCode(code,{current=WORLD_GENERATOR_VERSION}={}){
  const match=typeof code==='string'&&code.trim().toUpperCase().match(/^MKW([1-9]\d{0,3})-(\d{1,40})-([0-9A-Z]{1,8})$/);
  if(!match)throw new WorldCodeError('invalid','Invalid world code');
  const generator=Number(match[1]);
  if(generator!==current)throw new WorldCodeError('generator',`This world code is for generator version ${generator}; this build uses version ${current}.`);
  const levels=[...match[2]].map(Number),seed=parseInt(match[3],36);
  if(!validLevels(levels)||!Number.isSafeInteger(seed)||seed>WORLD_SEED_MAX)throw new WorldCodeError('invalid','Invalid world code');
  return {generator,levels,seed};
}
export const randomSeed=(random=Math.random)=>Math.floor(random()*(WORLD_SEED_MAX+1));
export const randomWorldCode=(levels=defaultWorldLevels(),random=Math.random)=>encodeWorldCode({levels,seed:randomSeed(random)});
// Levels → the values the generator uses (multipliers on the 0.14.0 WORLD_GENERATION and counts).
export function settingsFromLevels(levels=defaultWorldLevels()){
  if(!validLevels(levels))throw new WorldCodeError('invalid','Invalid world code');
  const v=key=>{const i=WORLD_SETTINGS.findIndex(s=>s.key===key);return WORLD_SETTINGS[i].value?WORLD_SETTINGS[i].value(levels[i]):levels[i];};
  return {rivers:v('rivers'),riverWidth:v('riverWidth'),meanders:v('meanders'),fordSpacing:v('fords'),lakes:v('lakes'),desert:v('desert'),
    sandyBanks:v('sandyBanks'),bankVegetation:v('bankVegetation'),forest:v('forest'),rocks:v('rocks'),bushes:v('bushes')};
}
// The simple New Game choices and the levels they set (Water: rivers, river width, lakes; Desert; Forest).
export const WORLD_PRESETS=Object.freeze({
  water:{low:{riverWidth:3,lakes:0},normal:{riverWidth:5,lakes:1},high:{riverWidth:8,lakes:3}},
  desert:{off:{desert:0},on:{desert:5}},
  forest:{sparse:{forest:2},normal:{forest:5},dense:{forest:8}},
});
const index=key=>WORLD_SETTINGS.findIndex(s=>s.key===key);
export function applyPresets(levels,{water,desert,forest}){
  const out=[...levels];for(const [group,choice]of Object.entries({water,desert,forest})){const set=WORLD_PRESETS[group][choice];if(!set)continue;for(const [k,l]of Object.entries(set))out[index(k)]=l;}
  if(water)out[index('rivers')]=1;
  return out;
}
// Which simple choice the levels match, or 'custom' when another setting differs from the default.
export function presetsFromLevels(levels){
  const match=group=>Object.entries(WORLD_PRESETS[group]).find(([,set])=>Object.entries(set).every(([k,l])=>levels[index(k)]===l))?.[0]??'custom';
  const simple=new Set(['rivers','riverWidth','lakes','desert','forest']),other=WORLD_SETTINGS.some((s,i)=>!simple.has(s.key)&&levels[i]!==DEFAULT_WORLD_LEVELS[i])||levels[index('rivers')]!==1;
  return other?{water:'custom',desert:'custom',forest:'custom',custom:true}:{water:match('water'),desert:match('desert'),forest:match('forest'),custom:['water','desert','forest'].some(g=>match(g)==='custom')};
}
