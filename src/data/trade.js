// Trade F1 (S14 #59, brief zadani-obchod-f1.md, approved by the owner 7 Nov 2026). F1.1: the Marketplace and the price
// table. Base prices are in Gold per unit; a caravan sells to the kingdom at 115 % and buys from it at 80 %.
export const TRADE_RULES=Object.freeze({buyMarkup:1.15,sellFactor:.8,marketplaceCapacity:80,loadingSpots:2});
// Raw goods from the brief. Processed goods: the brief proposed Iron Bar 18, Sword 30, Armor 40, to be checked against
// what they cost to make. A Smelter turns 3 Iron Ore + 2 Wood (35 Gold of inputs) into one Bar, a Bowyer 8 Wood (32) into a
// Bow, a Swordsmith 3 Bars + 2 Wood (128) into a Sword and an Armorer 5 Bars + 2 Wood (208) into Armor. At the proposed
// prices making them would destroy value, so they are priced at their inputs plus roughly 10–15 % for the work.
// `iron` is the older Iron resource that Warehouses still store; it trades like Iron Ore.
export const BASE_PRICES=Object.freeze({wheat:2,apple:3,stone:3,wood:4,meat:5,flour:5,bread:7,iron_ore:9,iron:9,iron_bar:40,bow:36,sword:145,armor:235});
// Tradeable goods come from the resource registry: everything the HUD counts except Gold and vehicles.
export function tradeableResources(registry){return registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&d.resourceCategory!=='vehicle');}
const round=value=>Math.max(1,Math.round(value));
// side 'buy' = the kingdom buys from a caravan, 'sell' = the kingdom sells to it. `context` is reserved for F2 (live
// prices: supply, demand, merchant type); F1 ignores it. A buy price is always above the sell price.
export function price(resource,side,context={}){
  const base=context.basePrice??BASE_PRICES[resource];if(!Number.isFinite(base)||base<=0)return null;
  if(side==='buy'){const sell=round(base*TRADE_RULES.sellFactor);return Math.max(round(base*TRADE_RULES.buyMarkup),sell+1);}
  if(side==='sell')return round(base*TRADE_RULES.sellFactor);
  throw new TypeError(`Unknown trade side: ${side}`);
}
export function priceTable(registry){return tradeableResources(registry).map(d=>({resource:d.id,name:d.name,base:BASE_PRICES[d.id]??null,buy:price(d.id,'buy'),sell:price(d.id,'sell')}));}
