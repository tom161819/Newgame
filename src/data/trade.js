// Trade F1 (S14 #59, brief zadani-obchod-f1.md, approved by the owner 7 Nov 2026). F1.1: the Marketplace and the price
// table. Base prices are in Gold per unit; a caravan sells to the kingdom at 115 % and buys from it at 80 %.
export const TRADE_RULES=Object.freeze({buyMarkup:1.15,sellFactor:.8,marketplaceCapacity:80,loadingSpots:2});
// Raw goods from the brief. Processed goods: the brief proposed Iron Bar 18, Sword 30, Armor 40, to be checked against
// what they cost to make. A Smelter turns 3 Iron Ore + 2 Wood (35 Gold of inputs) into one Bar, a Bowyer 8 Wood (32) into a
// Bow, a Swordsmith 3 Bars + 2 Wood (128) into a Sword and an Armorer 5 Bars + 2 Wood (208) into Armor. At the proposed
// prices making them would destroy value, so they are priced at their inputs plus roughly 10–15 % for the work.
// `iron` is the older Iron resource that Warehouses still store; it trades like Iron Ore.
export const BASE_PRICES=Object.freeze({wheat:2,apple:3,stone:3,wood:4,meat:5,fish:3,flour:5,bread:7,iron_ore:9,iron:9,iron_bar:40,bow:36,sword:145,armor:235});
// Tradeable goods come from the resource registry: everything the HUD counts except Gold and vehicles.
export function tradeableResources(registry){return registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&d.resourceCategory!=='vehicle');}
const round=value=>Math.max(1,Math.round(value));
// Trade F2 (live prices): a demand factor (0.75–1.35) from how much the kingdom has (free stock against a reference
// amount) and how much the merchant carries (against the middle of his type's range). Scarce goods cost more, plenty
// costs less. The factor and its reasons are computed from current stocks when prices are shown or an order is quoted;
// an order keeps the price agreed at confirmation.
export const PRICE_MODEL=Object.freeze({min:.75,max:1.35,kingdomWeight:.2,merchantWeight:.15,defaultReference:50,
  referenceStock:Object.freeze({iron_bar:10,bow:5,sword:3,armor:2}),historyDays:20,recentTrades:12});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function demand({resource,kingdomStock=null,merchantStock=null,merchantTypical=null}={}){
  const reference=PRICE_MODEL.referenceStock[resource]??PRICE_MODEL.defaultReference,reasons=[];let factor=1;
  if(Number.isFinite(kingdomStock)){const d=PRICE_MODEL.kingdomWeight*clamp(1-kingdomStock/reference,-1,1);factor+=d;if(Math.abs(d)>=.005)reasons.push({id:d>0?'kingdomLow':'kingdomHigh',percent:Math.round(d*100)});}
  if(Number.isFinite(merchantStock)&&merchantTypical>0){const d=PRICE_MODEL.merchantWeight*clamp(1-merchantStock/merchantTypical,-1,1);factor+=d;if(Math.abs(d)>=.005)reasons.push({id:d>0?'merchantLow':'merchantHigh',percent:Math.round(d*100)});}
  return {factor:clamp(factor,PRICE_MODEL.min,PRICE_MODEL.max),reasons};
}
// The middle of the amount a merchant of this type carries of a good, or null when his type does not carry it.
export function merchantTypical(type,resource){const range=MERCHANT_TYPES[type]?.stock?.[resource];return range?(range[0]+range[1])/2:null;}
// side 'buy' = the kingdom buys from a caravan, 'sell' = the kingdom sells to it. context.factor is the F2 demand factor
// (1 without it). A buy price is always above the sell price.
export function price(resource,side,context={}){
  const base=(context.basePrice??BASE_PRICES[resource])*(context.factor??1);if(!Number.isFinite(base)||base<=0)return null;
  if(side==='buy'){const sell=round(base*TRADE_RULES.sellFactor);return Math.max(round(base*TRADE_RULES.buyMarkup),sell+1);}
  if(side==='sell')return round(base*TRADE_RULES.sellFactor);
  throw new TypeError(`Unknown trade side: ${side}`);
}
export function priceTable(registry,contextFor=()=>({})){return tradeableResources(registry).map(d=>{const context=contextFor(d.id)??{};return {resource:d.id,name:d.name,base:BASE_PRICES[d.id]??null,buy:price(d.id,'buy',context),sell:price(d.id,'sell',context),factor:context.factor??1,reasons:context.reasons??[]};});}
// Trade F1.2: merchant caravans. Times are in game days (the day length follows the game settings).
export const CARAVAN_RULES=Object.freeze({minInterval:2,maxInterval:4,stay:.75,maxWait:.25,leavingWarning:.1,speed:1.6,goldMin:100,goldMax:300,
  spawnAttempts:8,retryAfter:1,maxRoute:2000});
// Each type carries some of its goods (at least one), each amount random within its range.
export const MERCHANT_TYPES=Object.freeze({
  general:{stock:{wheat:[10,30],apple:[10,25],bread:[5,20],fish:[5,15],wood:[10,30],stone:[10,30],iron_ore:[5,15]}},
  food:{stock:{wheat:[20,60],apple:[15,40],flour:[10,30],bread:[10,30],meat:[5,20],fish:[5,20]}},
  building_materials:{stock:{stone:[30,80],wood:[30,80]}},
  ore_iron:{stock:{iron_ore:[20,60],iron_bar:[3,10]}},
  arms:{stock:{bow:[1,4],sword:[1,3],armor:[1,2],iron_bar:[2,6]}},
});
