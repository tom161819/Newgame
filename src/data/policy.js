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
export const DEFAULT_POLICY=Object.freeze({tax:'normal',rations:'normal'});
// Policy v2 P1: a new policy takes effect the next morning, and its Happiness effect moves towards the new value by
// `effectPerDay` points per game day (smoothly during the day), in both directions.
export const POLICY_RULES=Object.freeze({effectPerDay:5,tradeAverageDays:3,
  // Policy v2 P2: penalties that depend on the resident's situation; they act at once (not gradually).
  context:Object.freeze({taxedUnpaid:10,promisedFood:10,hungryTaxes:5,hungryTaxRates:Object.freeze(['high','very_high'])}),
});
// Policy v2 P3 / #68: meal variety = the kinds of food (EDIBLE_RESOURCES) a resident ate in the last `days` game days;
// each kind adds `perKind` % to the Food need target, at most `max`. A resident who got no food has a target of 0.
export const MEAL_VARIETY=Object.freeze({days:3,perKind:5,max:100});
export function foodNeedTarget(rations,kinds,hungry=false){
  const base=RATIONS[rations]?.food??RATIONS.normal.food,variety=kinds*MEAL_VARIETY.perKind;
  return {base,kinds,variety,target:hungry?0:Math.min(MEAL_VARIETY.max,base+variety),hungry:!!hungry};
}
export const FEAST=Object.freeze({foodPerResident:1,goldPerResident:1,happiness:15,days:2,cooldownDays:5});
