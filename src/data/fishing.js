// Fishing R1 (owner-approved concept, 7 Nov 2026). A Fisher walks to the nearest free shore tile his Fisherman's Hut can
// reach (no fixed radius since 0.32.0; `nearestSpots` free spots are offered to the path search), fishes until his basket holds `basket` fish (or `maxTripDays` pass) and carries the catch to a Granary.
// About `perDay` fish per game day at a full fish stock, skill 1, in Summer, without weather.
export const FISHING=Object.freeze({
  perDay:6,basket:5,nearestSpots:12,spotCacheMs:10000,maxTripDays:1,xp:3,
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
