// Trade F1 (S14 #59, brief zadani-obchod-f1.md, approved by the owner 7 Nov 2026). F1.1: the Marketplace and the price
// table. Base prices are in Gold per unit; a caravan sells to the kingdom at 115 % and buys from it at 80 %.
export const TRADE_RULES=Object.freeze({buyMarkup:1.15,sellFactor:.8,marketplaceCapacity:80,loadingSpots:2});
// Raw goods from the brief. Processed goods: the brief proposed Iron Bar 18, Sword 30, Armor 40, to be checked against
// what they cost to make. A Smelter turns 3 Iron Ore + 2 Wood (35 Gold of inputs) into one Bar, a Bowyer 8 Wood (32) into a
// Bow, a Swordsmith 3 Bars + 2 Wood (128) into a Sword and an Armorer 5 Bars + 2 Wood (208) into Armor. At the proposed
// prices making them would destroy value, so they are priced at their inputs plus roughly 10–15 % for the work.
// `iron` is the older Iron resource that Warehouses still store; it trades like Iron Ore.
export const BASE_PRICES=Object.freeze({wheat:2,apple:3,stone:3,wood:4,meat:5,fish:3,flour:5,bread:7,iron_ore:9,iron:40,bow:36,sword:145,armor:235,pitch:4,torch:2});
// Tradeable goods come from the resource registry: everything the HUD counts except Gold and vehicles.
export function tradeableResources(registry){return registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&d.resourceCategory!=='vehicle');}
const round=value=>Math.max(1,Math.round(value));
// Trade F2 (live prices): a demand factor (0.75–1.35) from how much the kingdom has (free stock against a reference
// amount) and how much the merchant carries (against the middle of his type's range). Scarce goods cost more, plenty
// costs less. The factor and its reasons are computed from current stocks when prices are shown or an order is quoted;
// an order keeps the price agreed at confirmation.
export const PRICE_MODEL=Object.freeze({min:.75,max:1.35,kingdomWeight:.2,merchantWeight:.15,defaultReference:50,
  referenceStock:Object.freeze({iron:10,bow:5,sword:3,armor:2}),historyDays:20,recentTrades:12});
// Trade F3 (automatic trade, S14 §12–13): off by default. Each good has one rule – sell above a reserve at a minimum
// price, or buy when the stock falls below a level, up to a target, at a maximum price – never both, so a good cannot be
// bought and sold back automatically. Rules are checked every `checkMs` of game time while a caravan trades, and each
// good gets at most one automatic order per caravan visit. `budget` caps the Gold automatic buying spends per visit.
export const AUTO_TRADE=Object.freeze({checkMs:2000,defaultBudget:100,maxBudget:5000,maxAmount:10000,maxPrice:100000,foodReserveDays:3,mealsPerDay:2,
  defaults:Object.freeze({sell:Object.freeze({keep:50,minPrice:1}),buy:Object.freeze({below:20,upTo:50,maxPrice:null})})});
const AUTO_KEYS={sell:['keep','minPrice'],buy:['below','upTo','maxPrice']};
// A clean rule or an error id. Amounts are whole numbers; a buy target must not be below its trigger level.
export function autoRule(rule){
  if(!rule||!['sell','buy'].includes(rule.mode))return {error:'mode'};
  const out={mode:rule.mode};for(const key of AUTO_KEYS[rule.mode]){const v=Number(rule[key]),max=key.endsWith('rice')?AUTO_TRADE.maxPrice:AUTO_TRADE.maxAmount,min=key.endsWith('rice')?1:0;if(!Number.isSafeInteger(v)||v<min||v>max)return {error:key};out[key]=v;}
  if(out.mode==='buy'&&out.upTo<out.below)return {error:'upTo'};
  return {rule:out};
}
export function validateAutoTrade(a,{check,integer,resource}){
  check(a&&typeof a==='object'&&Object.keys(a).sort().join()==='budget,enabled,rules,visit');check(typeof a.enabled==='boolean');integer(a.budget,0,AUTO_TRADE.maxBudget);
  check(a.rules&&typeof a.rules==='object');for(const [id,rule]of Object.entries(a.rules)){resource(id);const r=autoRule(rule);check(!r.error&&Object.keys(rule).sort().join()===Object.keys(r.rule).sort().join());}
  if(a.visit!==null){check(a.visit&&typeof a.visit==='object'&&Object.keys(a.visit).sort().join()==='caravanId,done,spent'&&typeof a.visit.caravanId==='string');integer(a.visit.spent,0);check(Array.isArray(a.visit.done)&&new Set(a.visit.done).size===a.visit.done.length);for(const id of a.visit.done)resource(id);}
}
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
  general:{stock:{wheat:[10,30],apple:[10,25],bread:[5,20],fish:[5,15],wood:[10,30],stone:[10,30],iron_ore:[5,15],torch:[5,15]}},
  food:{stock:{wheat:[20,60],apple:[15,40],flour:[10,30],bread:[10,30],meat:[5,20],fish:[5,20]}},
  building_materials:{stock:{stone:[30,80],wood:[30,80],pitch:[5,15],torch:[10,30]}},
  ore_iron:{stock:{iron_ore:[20,60],iron:[3,10]}},
  arms:{stock:{bow:[1,4],sword:[1,3],armor:[1,2],iron:[2,6]}},
});
