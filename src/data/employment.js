import { WORKPLACES } from './workplaces.js';
// Employment priorities (Castle): 1–5, 5 = filled first. Every profession with workplaces belongs to a sector; the
// presets are built from the sectors, so a new profession only needs its sector here.
export const PRIORITY_RANGE=Object.freeze({min:1,max:5,default:3});
export const EMPLOYMENT_SECTORS=Object.freeze({farmer:'food',hunter:'food',fisher:'food',miller:'food',baker:'food',woodcutter:'production',miner:'production',smelter_operator:'production',pitch_maker:'production',soldier:'defense',bowyer:'defense',swordsmith:'defense',armorer:'defense',wheelwright:'production',stablehand:'production',weaver:'production',tailor:'defense'});
// Professions the automatic employment can fill: those with workplace seats, in registry order.
export const EMPLOYMENT_PROFESSIONS=Object.freeze([...new Set(Object.values(WORKPLACES).map(w=>w.profession))]);
const preset=values=>Object.freeze(Object.fromEntries(EMPLOYMENT_PROFESSIONS.map(p=>[p,values[EMPLOYMENT_SECTORS[p]]??PRIORITY_RANGE.default])));
export const EMPLOYMENT_PRESETS=Object.freeze({
  balanced:preset({food:3,production:3,defense:3}),
  food:preset({food:5,production:2,defense:2}),
  production:preset({food:2,production:5,defense:2}),
});
export const presetOf=priorities=>Object.keys(EMPLOYMENT_PRESETS).find(id=>EMPLOYMENT_PROFESSIONS.every(p=>EMPLOYMENT_PRESETS[id][p]===priorities[p]))??'custom';

// m-nosici-auto (owner 14 Nov 2026): Haulers and Builders have no workplace seats, so automatic employment keeps a
// wanted number of them. Haulers: the owner sets the number in the Castle panel; "recommended" is 1 Hauler for every
// 10 permanent residents (at least 1). Builders join by themselves once a Builder's Workshop stands: 1 Builder for
// every 2 building sites (at least 1), at most the places of all workshops.
export const FREE_ROLES=Object.freeze({haulers:Object.freeze({perResidents:10,min:1,max:30}),builders:Object.freeze({sitesPerBuilder:2,min:1})});
export const recommendedHaulers=residents=>Math.max(FREE_ROLES.haulers.min,Math.round(residents/FREE_ROLES.haulers.perResidents));
export const wantedBuilders=(sites,places)=>places<=0?0:Math.min(places,Math.max(FREE_ROLES.builders.min,Math.ceil(sites/FREE_ROLES.builders.sitesPerBuilder)));
