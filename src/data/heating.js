// m-topeni-domu (plan 37): Houses burn Wood for warmth in autumn and winter. Each House keeps a small woodpile
// (`heat-<id>`, a 'fuel' store) that Haulers fill from the stores; at the start of each day an occupied House burns
// its day's Wood. Enough Wood = warm (Happiness bonus), too little = cold (penalty, poorer rest at home).
export const HEATING=Object.freeze({
  resource:'wood',
  // Woodpile size of one House.
  capacity:12,
  // Wood a House burns on one day by season; seasons not listed burn nothing and have no effect.
  perDay:Object.freeze({Autumn:1,Winter:3}),
  // Frost raises the day's need (rounded up).
  weather:Object.freeze({Frost:1.5}),
  // Happiness for the residents of a warm / cold House, scaled by season (autumn counts half).
  warmBonus:6,coldPenalty:12,
  seasonEffect:Object.freeze({Autumn:.5,Winter:1}),
  // Woodpiles are filled in these seasons, so they are full when autumn starts (priority: below light fuel 25,
  // above workshop output 30).
  fillSeasons:Object.freeze(['Summer','Autumn','Winter']),refillPriority:26,
  // A resident with nothing to do (waiting at work or idle) fetches Wood for his own House when it is below this.
  selfFetchBelow:6,selfFetchCheckMs:3000,
  // A resident of a cold House rests like one sleeping in the settlement (DAILY_REST.recoverPerDay).
  coldRestAs:'settlement',
  // Soldiers of a cold Barracks fight weaker (damage multiplier).
  coldCombat:.9,
  // The autumn warning: stored Wood below this share of the winter's estimated need.
  warnShare:1,
});
// Heated buildings: `factor` multiplies the day's Wood; `effect` – who feels it: the House's residents, the residents
// sleeping in the settlement's base places (the Castle), or the Barracks' soldiers (combat).
// Owner 13 Nov: the Castle and the Barracks heat too.
export const HEATED=Object.freeze({
  house:Object.freeze({factor:1,effect:'residents'}),
  castle:Object.freeze({factor:2,effect:'settlement'}),
  barracks:Object.freeze({factor:1,effect:'soldiers'}),
});
export const HEATED_BUILDINGS=Object.freeze(Object.keys(HEATED));
