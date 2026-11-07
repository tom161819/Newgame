// #103 (AUD80–81): kingdom policy set in the Castle panel. Taxes are paid every morning by each permanent resident; food
// rations set how many portions a resident eats per day. Both move the residents' Happiness (S13 needs).
export const TAX_RATES=Object.freeze({
  none:Object.freeze({perResident:0,happiness:10}),low:Object.freeze({perResident:.25,happiness:5}),normal:Object.freeze({perResident:.5,happiness:0}),
  high:Object.freeze({perResident:1,happiness:-10}),very_high:Object.freeze({perResident:1.5,happiness:-20}),
});
export const RATIONS=Object.freeze({
  small:Object.freeze({portions:.5,happiness:-15}),normal:Object.freeze({portions:1,happiness:0}),generous:Object.freeze({portions:1.5,happiness:10}),
});
export const DEFAULT_POLICY=Object.freeze({tax:'normal',rations:'normal'});
// Policy v2 P1: a new policy takes effect the next morning, and its Happiness effect moves towards the new value by
// `effectPerDay` points per game day (smoothly during the day), in both directions.
export const POLICY_RULES=Object.freeze({effectPerDay:5,tradeAverageDays:3});
