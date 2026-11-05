import { WORKPLACES } from './workplaces.js';
// Employment priorities (Castle): 1–5, 5 = filled first. Every profession with workplaces belongs to a sector; the
// presets are built from the sectors, so a new profession only needs its sector here.
export const PRIORITY_RANGE=Object.freeze({min:1,max:5,default:3});
export const EMPLOYMENT_SECTORS=Object.freeze({farmer:'food',hunter:'food',miller:'food',baker:'food',woodcutter:'production',miner:'production',smelter_operator:'production',soldier:'defense',bowyer:'defense',swordsmith:'defense',armorer:'defense',wheelwright:'production'});
// Professions the automatic employment can fill: those with workplace seats, in registry order.
export const EMPLOYMENT_PROFESSIONS=Object.freeze([...new Set(Object.values(WORKPLACES).map(w=>w.profession))]);
const preset=values=>Object.freeze(Object.fromEntries(EMPLOYMENT_PROFESSIONS.map(p=>[p,values[EMPLOYMENT_SECTORS[p]]??PRIORITY_RANGE.default])));
export const EMPLOYMENT_PRESETS=Object.freeze({
  balanced:preset({food:3,production:3,defense:3}),
  food:preset({food:5,production:2,defense:2}),
  production:preset({food:2,production:5,defense:2}),
});
export const presetOf=priorities=>Object.keys(EMPLOYMENT_PRESETS).find(id=>EMPLOYMENT_PROFESSIONS.every(p=>EMPLOYMENT_PRESETS[id][p]===priorities[p]))??'custom';
