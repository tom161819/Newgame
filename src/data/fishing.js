// Fishing R1 (owner-approved concept, 7 Nov 2026). A Fisher walks to a free shore tile within `radius` of his Fisherman's
// Hut, fishes until his basket holds `basket` fish (or `maxTripDays` pass) and carries the catch to a Granary.
// About `perDay` fish per game day at a full fish stock, skill 1, in Summer, without weather.
export const FISHING=Object.freeze({
  perDay:6,basket:5,radius:8,maxTripDays:1,xp:3,
  // Water next to the shore spot: deep water gives more fish than shallow water (ground codes, src/data/worldTerrain.js).
  depth:Object.freeze({3:.8,4:1.2}),
  season:Object.freeze({Spring:1.1,Summer:1,Autumn:1,Winter:.5}),
  weather:Object.freeze({Sunny:1,Rainy:1.1,Drought:1,Frost:.8}),
  // Every connected water body (a river, a lake) has its own fish stock.
  stock:Object.freeze({perTile:4,min:40,max:400,regenPerDay:.1,winterRegen:.5,full:.5,overfished:.1}),
});
export function stockCapacity(tiles){return Math.max(FISHING.stock.min,Math.min(FISHING.stock.max,FISHING.stock.perTile*tiles));}
// Catch factor from the stock: full above half the capacity, falling in proportion below it, nothing under 10 %.
export function stockFactor(ratio){return ratio<FISHING.stock.overfished?0:ratio>=FISHING.stock.full?1:ratio/FISHING.stock.full;}
export function stockState(ratio){return ratio>=FISHING.stock.full?'plentiful':ratio>=FISHING.stock.overfished?'thinning':'overfished';}
