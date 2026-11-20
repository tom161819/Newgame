// #103 (AUD80–81): kingdom policy set in the Castle panel. Taxes are paid every morning by each permanent resident; food
// rations set how many portions a resident eats per day. Both move the residents' Happiness (S13 needs).
export const TAX_RATES=Object.freeze({
  none:Object.freeze({perResident:0,happiness:10}),low:Object.freeze({perResident:.25,happiness:5}),normal:Object.freeze({perResident:.5,happiness:0}),
  high:Object.freeze({perResident:1,happiness:-10}),very_high:Object.freeze({perResident:1.5,happiness:-20}),
});
// Policy v2 P2 / m-pridely-procenta (#68): rations work only through the Food need. `food` is the base of the Food need
// (Small 30, Normal 60, Generous 80 %); meal variety adds to it (MEAL_VARIETY). Rations add nothing to Happiness directly.
export const RATIONS=Object.freeze({
// m-jidlo-balanc (playtest 0.76.0 #3): fewer portions (0.5/1/1.5 → 0.4/0.8/1.2); the Food need percentages stay.
  small:Object.freeze({portions:.4,food:30}),normal:Object.freeze({portions:.8,food:60}),generous:Object.freeze({portions:1.2,food:80}),
});
// Before #68 Generous added +5 to the policy Happiness effect; saves from then may still hold an effect up to +5 above
// the tax effect (it then moves back to the target like any policy change). Only the save validator uses it.
export const LEGACY_RATIONS_EFFECT=5;
// Owner 19 Nov 2026: "udělej ten slider posuvný analogově, ne jen pár úrovní". The tax is a number: Gold per resident
// each morning, from 0 to 1.5 in steps of 0.05. TAX_RATES stay as named anchors: Happiness runs linearly between them,
// and the nearest one gives the slider its name and icon.
export const TAX_RANGE=Object.freeze({min:0,max:1.5,step:.05});
const TAX_ANCHORS=Object.entries(TAX_RATES).map(([level,r])=>({level,...r})).sort((a,b)=>a.perResident-b.perResident);
export function normalizeTax(value){
  const v=typeof value==='string'&&Object.hasOwn(TAX_RATES,value)?TAX_RATES[value].perResident:value;if(typeof v!=='number'||!Number.isFinite(v))return null;
  return Math.round(Math.round(Math.min(TAX_RANGE.max,Math.max(TAX_RANGE.min,v))/TAX_RANGE.step)*TAX_RANGE.step*100)/100;
}
export const validTax=value=>typeof value==='number'&&Number.isFinite(value)&&value>=TAX_RANGE.min-1e-9&&value<=TAX_RANGE.max+1e-9&&Math.abs(value/TAX_RANGE.step-Math.round(value/TAX_RANGE.step))<1e-6;
export function taxHappiness(rate){
  const a=TAX_ANCHORS;if(rate<=a[0].perResident)return a[0].happiness;
  for(let i=1;i<a.length;i++)if(rate<=a[i].perResident){const f=(rate-a[i-1].perResident)/(a[i].perResident-a[i-1].perResident);return a[i-1].happiness+f*(a[i].happiness-a[i-1].happiness);}
  return a.at(-1).happiness;
}
// The named level nearest to a rate (ties go to the lower one): the slider's name and icon, and the "high taxes" rule.
export function taxLevel(rate){let best=TAX_ANCHORS[0];for(const a of TAX_ANCHORS)if(Math.abs(a.perResident-rate)<Math.abs(best.perResident-rate)-1e-9)best=a;return best.level;}
export const DEFAULT_POLICY=Object.freeze({tax:TAX_RATES.normal.perResident,rations:RATIONS.normal.portions});
// Policy v2 P1: a new policy takes effect the next morning, and its Happiness effect moves towards the new value by
// `effectPerDay` points per game day (smoothly during the day), in both directions.
export const POLICY_RULES=Object.freeze({effectPerDay:5,tradeAverageDays:3,
  // Policy v2 P2: penalties that depend on the resident's situation; they act at once (not gradually).
  context:Object.freeze({taxedUnpaid:10,promisedFood:10,hungryTaxes:5,hungryTaxRates:Object.freeze(['high','very_high'])}),
});
// Policy v2 P3 / #68: meal variety = the kinds of food (EDIBLE_RESOURCES) a resident ate in the last `days` game days;
// each kind adds `perKind` % to the Food need target, at most `max`. A resident who got no food has a target of 0.
export const MEAL_VARIETY=Object.freeze({days:3,perKind:5,max:100});
// Owner 20 Nov 2026 (87): rations are analog too – portions per resident a day, 0.4–1.2 in steps of 0.05. RATIONS stay
// as named anchors: the Food need base runs linearly between them and the nearest one names the slider and its icon.
export const RATION_RANGE=Object.freeze({min:.4,max:1.2,step:.05});
const RATION_ANCHORS=Object.entries(RATIONS).map(([level,r])=>({level,...r})).sort((a,b)=>a.portions-b.portions);
export function normalizeRations(value){
  const v=typeof value==='string'&&Object.hasOwn(RATIONS,value)?RATIONS[value].portions:value;if(typeof v!=='number'||!Number.isFinite(v))return null;
  return Math.round(Math.round(Math.min(RATION_RANGE.max,Math.max(RATION_RANGE.min,v))/RATION_RANGE.step)*RATION_RANGE.step*100)/100;
}
export const validRations=value=>typeof value==='number'&&Number.isFinite(value)&&value>=RATION_RANGE.min-1e-9&&value<=RATION_RANGE.max+1e-9&&Math.abs(value/RATION_RANGE.step-Math.round(value/RATION_RANGE.step))<1e-6;
export function rationLevel(portions){const v=normalizeRations(portions)??RATIONS.normal.portions;return RATION_ANCHORS.reduce((best,a)=>Math.abs(a.portions-v)<Math.abs(best.portions-v)?a:best).level;}
export function rationFoodBase(portions){
  const v=normalizeRations(portions)??RATIONS.normal.portions,a=RATION_ANCHORS;if(v<=a[0].portions)return a[0].food;
  for(let i=1;i<a.length;i++)if(v<=a[i].portions){const f=(v-a[i-1].portions)/(a[i].portions-a[i-1].portions);return Math.round(a[i-1].food+f*(a[i].food-a[i-1].food));}
  return a.at(-1).food;
}
export function foodNeedTarget(rations,kinds,hungry=false){
  const base=typeof rations==='number'||Object.hasOwn(RATIONS,rations??'')?rationFoodBase(rations):RATIONS.normal.food,variety=kinds*MEAL_VARIETY.perKind;
  return {base,kinds,variety,target:hungry?0:Math.min(MEAL_VARIETY.max,base+variety),hungry:!!hungry};
}
export const FEAST=Object.freeze({foodPerResident:1,goldPerResident:1,happiness:15,days:2,cooldownDays:5});
