import { devFactor } from '../data/devBalance.js';
import { price,tradeableResources,demand,merchantTypical,PRICE_MODEL,AUTO_TRADE,autoRule ,effectiveAutoRule,vehicleSalePrice} from '../data/trade.js';
import { EDIBLE_RESOURCES } from '../data/seasons.js';
import { t } from '../i18n/index.js';
import { GOLD_LIMIT } from '../data/economy.js';
import { buildingIsComplete } from '../game/buildings.js';

// Trade F1.3 (#59): orders with a caravan at a Marketplace, carried physically by Haulers.
// SELL: goods free in the kingdom's stores are carried to the Marketplace (`market-<id>`); each unit handed to the caravan
//   is paid at that moment at the price fixed on confirmation. BUY: the caravan unloads onto the Marketplace and is paid
//   per unloaded unit; Haulers carry the goods into a fitting store, and only there they count as the kingdom's stock.
// The caravan waits for a Transporting order at most 0.25 day (CaravanSystem). When it leaves, the rest of every open order
// is cancelled: nothing disappears – goods on the Marketplace go back to the stores, reserved Gold is freed.
export const ORDER_STATUSES=Object.freeze(['Pending','Transporting','PartiallyCompleted','Completed','Cancelled','Failed']);
export const ORDER_ERRORS=Object.freeze(['notEnoughGold','notEnoughResources','merchantOutOfStock','merchantGold','storage','marketFull','caravanLeaving','treasuryFull','otherSide','noCaravan','quantity']);
const OPEN=new Set(['Pending','Transporting']);
export const marketId=building=>`market-${building.id??building}`;
export const emptyAutoTrade=()=>({enabled:false,budget:AUTO_TRADE.defaultBudget,rules:{},visit:null});
export const emptyTradeStats=()=>({sold:0,bought:0,transactions:0,byResource:{},recent:[],history:{}});
// Save validation of the statistics (schema 48).
export function validateTradeStats(st,{check,number,integer,array,resource,day}){
  check(st&&typeof st==='object'&&Object.keys(st).sort().join()==='bought,byResource,history,recent,sold,transactions');number(st.sold,0);number(st.bought,0);integer(st.transactions,0);
  for(const [id,row]of Object.entries(st.byResource)){resource(id);check(row&&Object.keys(row).sort().join()==='bought,sold,value');integer(row.bought,0);integer(row.sold,0);number(row.value,0);}
  array(st.recent,PRICE_MODEL.recentTrades);for(const r of st.recent){check(['buy','sell'].includes(r.side)&&Object.keys(r).sort().join()==='day,price,quantity,resource,side');resource(r.resource);integer(r.day,1,day);integer(r.quantity,1);integer(r.price,1);}
  for(const [id,rows]of Object.entries(st.history)){resource(id);array(rows,PRICE_MODEL.historyDays);check(rows.length>0&&new Set(rows.map(e=>e.day)).size===rows.length);for(const e of rows){integer(e.day,Math.max(1,day-PRICE_MODEL.historyDays+1),day);check(Object.keys(e).every(k=>['day','buy','sell'].includes(k))&&(e.buy!==undefined||e.sell!==undefined));if(e.buy!==undefined)integer(e.buy,1);if(e.sell!==undefined)integer(e.sell,1);}}
}
export class TradeSystem {
  constructor(scene){
    this.scene=scene;this.orders=[];this.seq=0;this.listeners=new Set();this.stats=emptyTradeStats();this.auto=emptyAutoTrade();
    if(scene.caravans)scene.caravans.deliveryPending=caravan=>this.openOrders(caravan.id).some(o=>o.status==='Transporting');
  }
  get storage(){return this.scene.foodStorage;}
  get caravan(){return this.scene.caravans?.active??null;}
  // Trade F2: the demand factor of a good now (kingdom's free stock, the caravan's stock against his type's usual load).
  marketContext(resource,caravan=this.caravan){
    return {...demand({resource,kingdomStock:this.storage?.available?.(resource)??null,merchantStock:caravan?caravan.stock?.[resource]??0:null,merchantTypical:caravan?merchantTypical(caravan.type,resource):null}),...(devFactor('buyPrice')!==1?{buyScale:devFactor('buyPrice')}:{}),...(devFactor('sellPrice')!==1?{sellScale:devFactor('sellPrice')}:{})};
  }
  unitPrice(resource,side,caravan=this.caravan){return price(resource,side,this.marketContext(resource,caravan));}
  today(){return this.scene.gameTime?.day??1;}
  // Trade F2 statistics: every hand-over (a batch of an order) is one transaction; prices come only from real trades
  // and from the offers a caravan made on arrival, kept for the last PRICE_MODEL.historyDays days.
  record(side,resource,quantity,unit){
    const s=this.stats,value=quantity*unit,row=s.byResource[resource]??={bought:0,sold:0,value:0};
    if(side==='buy'){s.bought+=value;row.bought+=quantity;}else{s.sold+=value;row.sold+=quantity;}
    row.value+=value;s.transactions++;s.recent.unshift({day:this.today(),side,resource,quantity,price:unit});s.recent.length=Math.min(s.recent.length,PRICE_MODEL.recentTrades);
    this.history(resource,{[side]:unit});
  }
  history(resource,prices){
    const day=this.today(),list=this.stats.history[resource]??=[];let entry=list.find(e=>e.day===day);if(!entry){entry={day};list.push(entry);}
    Object.assign(entry,prices);
    for(const [id,rows]of Object.entries(this.stats.history)){this.stats.history[id]=rows.filter(e=>e.day>day-PRICE_MODEL.historyDays);if(!this.stats.history[id].length)delete this.stats.history[id];}
  }
  // On arrival: the offered prices of every good the caravan sells or would buy.
  recordOffers(caravan=this.caravan){if(!caravan)return;for(const d of tradeableResources(this.scene.objectRegistry)){const sell=this.unitPrice(d.id,'sell',caravan),buy=(caravan.stock[d.id]??0)>0?this.unitPrice(d.id,'buy',caravan):null;if(sell!==null)this.history(d.id,{...(buy!==null?{buy}:{}),sell});}this.changed();}
  summary(){const s=this.stats,top=Object.entries(s.byResource).sort((a,b)=>b[1].value-a[1].value).slice(0,3).map(([resource,row])=>({resource,...row}));return {sold:s.sold,bought:s.bought,balance:s.sold-s.bought,transactions:s.transactions,top,recent:s.recent};}
  // Trade F3: automatic trade settings.
  setAutoEnabled(on){this.auto.enabled=!!on;this.autoCheckedAt=undefined;this.changed();}
  setAutoBudget(gold){const v=Number(gold);if(!Number.isSafeInteger(v)||v<0||v>AUTO_TRADE.maxBudget)return false;this.auto.budget=v;this.changed();return true;}
  // One rule per good (mode 'sell' or 'buy'); 'off' or null removes it. Returns {ok} or {ok:false,error}.
  setAutoRule(resource,rule){
    if(!tradeableResources(this.scene.objectRegistry).some(d=>d.id===resource))return {ok:false,error:'resource'};
    if(!rule||rule.mode==='off'){delete this.auto.rules[resource];this.changed();return {ok:true};}
    const r=autoRule(rule);if(r.error)return {ok:false,error:r.error};this.auto.rules[resource]=r.rule;this.autoCheckedAt=undefined;this.changed();return {ok:true,rule:r.rule};
  }
  residents(){return (this.scene.workerSystem?.liveWorkers?.().length??0)+1;}
  // How much food the kingdom should keep: every resident's meals for AUTO_TRADE.foodReserveDays days.
  foodReserve(){return this.residents()*AUTO_TRADE.mealsPerDay*AUTO_TRADE.foodReserveDays;}
  // A warning when an automatic sale of food would leave less edible food than the reserve.
  autoWarning(resource,rule=this.auto.rules[resource]){
    if(rule?.mode==='between')rule={mode:'sell',keep:rule.above};
    if(rule?.mode!=='sell'||!EDIBLE_RESOURCES.includes(resource))return null;
    const total=EDIBLE_RESOURCES.reduce((n,id)=>n+(this.storage?.available(id)??0),0),sold=Math.max(0,(this.storage?.available(resource)??0)-rule.keep),left=total-sold,reserve=this.foodReserve();
    return left<reserve&&(sold>0||rule.keep<reserve)?{reserve,left}:null;
  }
  // The amount an automatic rule would trade now (0 = nothing), within every limit the manual window has.
  autoQuantity(resource,rule,c=this.caravan){
    const market=this.market(c.marketplaceId),room=market?market.capacity-this.marketUsed(c.marketplaceId):0;if(room<=0)return 0;
    if(rule.mode==='sell'){
      const unit=this.unitPrice(resource,'sell');if(unit===null||unit<rule.minPrice)return 0;
      const owed=this.openOrders(c.id).filter(o=>o.side==='sell').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0),limit=this.scene.inventory.limit?.('gold')??GOLD_LIMIT;
      return Math.max(0,Math.min(this.storage.available(resource)-rule.keep,Math.floor((c.gold-owed)/unit),Math.floor((limit-this.scene.inventory.count('gold')-this.pendingSaleGold())/unit),room));
    }
    const coming=this.openOrders().filter(o=>o.side==='buy'&&o.resource===resource).reduce((n,o)=>n+o.quantity-o.delivered,0),stock=this.storage.available(resource)+coming+(market.stock[resource]??0);
    if(stock>=rule.below)return 0;const unit=this.unitPrice(resource,'buy');if(unit===null||unit>rule.maxPrice)return 0;
    return Math.max(0,Math.min(rule.upTo-stock,c.stock[resource]??0,Math.floor((this.auto.budget-(this.auto.visit?.spent??0))/unit),Math.floor(this.freeGold()/unit),this.storeRoom(resource)-coming-(market.stock[resource]??0),room));
  }
  // Checked from update(): while a caravan trades, each rule may place one order per visit, small enough to be carried
  // before the caravan leaves.
  autoTrade(){
    const a=this.auto,c=this.caravan;if(!a.enabled||!c||c.phase!=='trading'||c.waiting||!Object.keys(a.rules).length)return false;
    const now=this.scene.gameTime?.totalElapsed??0;if(this.autoCheckedAt!==undefined&&now-this.autoCheckedAt<AUTO_TRADE.checkMs&&now>=this.autoCheckedAt)return false;this.autoCheckedAt=now;
    if(a.visit?.caravanId!==c.id)a.visit={caravanId:c.id,spent:0,done:[]};
    const leavesIn=this.scene.caravans.status()?.active?.leavesIn??0;let placed=false;
    for(const [resource,rule]of Object.entries(a.rules)){
      if(a.visit.done.includes(resource))continue;
      const eff=effectiveAutoRule(rule,this.storage.available(resource));if(!eff)continue;
      let quantity=this.autoQuantity(resource,eff,c);
      while(quantity>=1&&this.estimate(eff.mode,resource,quantity,c.marketplaceId)>leavesIn)quantity=Math.floor(quantity/2);
      if(quantity<1)continue;
      const result=this.place(eff.mode,resource,quantity);if(!result.ok)continue;
      result.order.auto=true;a.visit.done.push(resource);if(eff.mode==='buy')a.visit.spent+=quantity*result.order.price;placed=true;
      const good=this.scene.objectRegistry.get(resource)?.name??resource;
      this.scene.eventFeed?.push(`trade:auto:${result.order.id}`,t(`market.auto.feed.${eff.mode}`,{quantity,good,price:result.order.price}));
    }
    if(placed)this.changed();return placed;
  }
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  openOrders(caravanId=null){return this.orders.filter(o=>OPEN.has(o.status)&&(caravanId===null||o.caravanId===caravanId));}
  marketplace(id){return this.scene.buildings.find(b=>b.id===id&&b.type==='marketplace'&&buildingIsComplete(b))??null;}
  market(id){return this.storage?.locations.get(marketId(id))??null;}
  // Gold promised to running purchases is not free to spend on another one.
  reservedGold(){return this.openOrders().filter(o=>o.side==='buy').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0);}
  pendingSaleGold(){return this.openOrders().filter(o=>o.side==='sell').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0);}
  // Vehicles a merchant would buy now: parked ones (not in use or reserved), each with its price.
  vehiclesForSale(){const v=this.scene.vehicles;if(!v)return [];return [...v.vehicles.values()].filter(x=>x.state==='parked'&&vehicleSalePrice(x.type)).map(x=>({id:x.id,type:x.type,price:vehicleSalePrice(x.type)}));}
  // The merchant takes the vehicle (and a wagon's horse) at once and pays from his Gold.
  sellVehicle(id){
    const c=this.caravan,v=this.scene.vehicles?.vehicles.get(id);if(!c||c.phase!=='trading')return {ok:false,error:'noCaravan'};
    if(!v||v.state!=='parked')return {ok:false,error:'vehicle'};const price=vehicleSalePrice(v.type);if(!price)return {ok:false,error:'vehicle'};if(c.gold<price)return {ok:false,error:'merchantGold'};
    if(v.horseId!=null){const st=this.scene.stables;st?.horses.delete(v.horseId);const horse=this.scene.animalSystem?.animals.get(v.horseId);if(horse)this.scene.animalSystem.remove(horse);}
    this.scene.vehicles.vehicles.delete(id);this.scene.vehicles.changed();c.gold-=price;
    this.scene.inventory.add('gold',price,{source:'Trade Sale',type:'sale',id:`vehicle-sale:${id}`});this.scene.updateInventory?.();
    this.scene.eventFeed?.push(`trade:vehicle:${id}`,t('market.vehicleSold',{good:this.scene.objectRegistry.get(v.type)?.name??v.type,price}));this.changed();return {ok:true,price};
  }
  freeGold(){return Math.max(0,this.scene.inventory.count('gold')-this.reservedGold());}
  // Room for bought goods in every store that takes them (Granary groups, Warehouses, Armory, Starter Stockpile).
  storeRoom(resource){return [...this.storage.locations.values()].filter(l=>this.storage.isStock(l)&&l.allowed.includes(resource)).reduce((n,l)=>n+this.storage.room(l.id,resource),0);}
  marketUsed(id){const l=this.market(id);return l?Object.values(l.stock).reduce((n,v)=>n+v,0)+this.storage.incoming(l.id):0;}
  inTransitTo(id,resource){let n=0;for(const r of this.storage.reservations.values())if(r.kind==='capacity'&&r.locationId===marketId(id)&&r.resource===resource)n+=r.amount;return n;}
  // What an order would cost and whether it can be placed. Errors follow the brief (§5).
  quote(side,resource,quantity,{marketplaceId=this.caravan?.marketplaceId}={}){
    const c=this.caravan,unit=this.unitPrice(resource,side==='buy'?'buy':'sell'),total=unit===null?0:unit*quantity,errors=[];
    if(!c||c.phase!=='trading'||c.marketplaceId!==marketplaceId)errors.push('noCaravan');
    else if(this.scene.caravans.status().active.leavesIn<=0||c.waiting)errors.push('caravanLeaving');
    if(!Number.isSafeInteger(quantity)||quantity<1)errors.push('quantity');
    if(!tradeableResources(this.scene.objectRegistry).some(d=>d.id===resource)||unit===null)errors.push('quantity');
    if(this.openOrders().some(o=>o.resource===resource&&o.side!==side))errors.push('otherSide');
    const market=this.market(marketplaceId),capacity=market?.capacity??0,used=market?this.marketUsed(marketplaceId):0;
    if(side==='buy'){
      if(c&&(c.stock[resource]??0)<quantity)errors.push('merchantOutOfStock');
      if(total>this.freeGold())errors.push('notEnoughGold');
      const coming=this.openOrders().filter(o=>o.side==='buy'&&o.resource===resource).reduce((n,o)=>n+o.quantity-o.delivered,0);
      if(this.storeRoom(resource)<quantity+coming+(market?.stock[resource]??0))errors.push('storage');
      if(capacity-used<Math.min(quantity,capacity))errors.push('marketFull');
    }else{
      if(this.storage.available(resource)<quantity)errors.push('notEnoughResources');
      if(c&&c.gold<total+this.openOrders(c.id).filter(o=>o.side==='sell').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0))errors.push('merchantGold');
      if(this.scene.inventory.count('gold')+this.pendingSaleGold()+total>(this.scene.inventory.limit?.('gold')??GOLD_LIMIT))errors.push('treasuryFull');
      if(capacity-used<=0)errors.push('marketFull');
    }
    return {side,resource,quantity,unit,total,errors:[...new Set(errors)],eta:this.estimate(side,resource,quantity,marketplaceId)};
  }
  // A rough delivery time in ms: trips by the free Haulers over the distance to the Marketplace and back.
  estimate(side,resource,quantity,marketplaceId){
    const haulers=Math.max(1,this.scene.workerSystem?.liveWorkers?.().filter(w=>w.profession==='hauler').length??1),m=this.marketplace(marketplaceId);
    if(!m)return 0;const stores=[...this.storage.locations.values()].filter(l=>this.storage.isStock(l)&&l.allowed.includes(resource));
    const distance=stores.length?Math.min(...stores.map(l=>Math.hypot(l.x-m.x,l.y-m.y))):20,trips=Math.ceil(quantity/(10*haulers));
    return trips*(2*distance/1.2+4)*1000;
  }
  place(side,resource,quantity){
    const q=this.quote(side,resource,quantity);if(q.errors.length)return {ok:false,errors:q.errors,quote:q};
    const c=this.caravan,order={id:`trade-${++this.seq}`,caravanId:c.id,marketplaceId:c.marketplaceId,resource,side,quantity,price:q.unit,delivered:0,status:'Pending',placedAt:this.scene.gameTime.totalElapsed};
    this.orders.push(order);this.changed();return {ok:true,order,quote:q};
  }
  cancel(id){const o=this.orders.find(o=>o.id===id&&OPEN.has(o.status));if(!o)return false;o.status=o.delivered>0?'PartiallyCompleted':'Cancelled';this.changed();return true;}
  caravanLeft(caravan){let any=false;for(const o of this.openOrders(caravan.id)){o.status=o.delivered>0?'PartiallyCompleted':'Cancelled';any=true;}if(any)this.changed();}
  update(){
    this.autoTrade();
    const c=this.caravan;let dirty=false;
    for(const o of this.openOrders()){
      if(!c||c.id!==o.caravanId||!this.marketplace(o.marketplaceId)){o.status=o.delivered>0?'PartiallyCompleted':'Failed';dirty=true;continue;}
      if(c.phase!=='trading')continue;
      const market=this.market(o.marketplaceId);if(!market)continue;
      if(o.side==='buy'){
        // Unloading: as much as the Marketplace has room for; each unit is paid when it is put down.
        const room=market.capacity-this.marketUsed(o.marketplaceId),n=Math.min(o.quantity-o.delivered,c.stock[o.resource]??0,room,Math.floor(this.scene.inventory.count('gold')/o.price));
        if(n>0&&this.storage.deposit(market.id,o.resource,n)){
          if(!this.scene.inventory.pay({gold:n*o.price},{source:'Trade Purchase',type:'purchase',entityId:o.marketplaceId})){this.storage.withdraw(market.id,o.resource,n);continue;}
          c.stock[o.resource]-=n;c.gold+=n*o.price;o.delivered+=n;this.record('buy',o.resource,n,o.price);
          this.scene.resourceLedger?.income(o.resource,n,'Trade Purchase',{type:'purchase',id:`${o.id}:${o.delivered}`,entityId:o.marketplaceId});dirty=true;
        }
        if(o.delivered>=o.quantity)o.status='Completed';else if(o.delivered>0||n===0)o.status='Transporting';
        if((c.stock[o.resource]??0)<=0&&o.delivered<o.quantity){o.status=o.delivered>0?'PartiallyCompleted':'Failed';}
        continue;
      }
      // Selling: goods free on the Marketplace go to the caravan; each unit is paid on hand-over.
      const free=this.storage.free(market.id,o.resource),n=Math.min(free,o.quantity-o.delivered,Math.floor(c.gold/o.price));
      if(n>0&&this.storage.withdraw(market.id,o.resource,n)){
        c.stock[o.resource]=(c.stock[o.resource]??0)+n;c.gold-=n*o.price;o.delivered+=n;this.record('sell',o.resource,n,o.price);
        this.scene.inventory.add('gold',n*o.price,{source:'Trade Sale',type:'sale',id:`${o.id}:${o.delivered}:gold`,entityId:o.marketplaceId});
        this.scene.resourceLedger?.expense(o.resource,n,'Trade Sale',{type:'sale',id:`${o.id}:${o.delivered}`,entityId:o.marketplaceId});dirty=true;
      }
      if(o.delivered>=o.quantity)o.status='Completed';else if(o.status==='Pending')o.status='Transporting';
      if(o.delivered<o.quantity&&c.gold<o.price){o.status=o.delivered>0?'PartiallyCompleted':'Failed';}
    }
    if(dirty)this.changed();
  }
  // Hauler tasks (LogisticsTaskManager): carry goods for a sale to the Marketplace; carry everything else on a
  // Marketplace (bought goods, goods of a cancelled sale) into the stores.
  candidates(){
    const storage=this.storage;if(!storage)return [];const tasks=[],stores=[...storage.locations.values()].filter(l=>storage.isStock(l));
    for(const o of this.openOrders().filter(o=>o.side==='sell')){
      const market=this.market(o.marketplaceId);if(!market)continue;
      let missing=o.quantity-o.delivered-(market.stock[o.resource]??0)-this.inTransitTo(o.marketplaceId,o.resource);
      for(const store of stores){if(missing<=0)break;const amount=Math.min(missing,storage.free(store.id,o.resource));if(amount<=0)continue;tasks.push({priority:5,sourceId:store.id,destinationId:market.id,resource:o.resource,amount});missing-=amount;}
    }
    const selling=new Set(this.openOrders().filter(o=>o.side==='sell').map(o=>`${o.marketplaceId}:${o.resource}`));
    for(const market of storage.locations.values()){
      if(market.kind!=='market')continue;
      for(const [resource,stock]of Object.entries(market.stock)){
        if(stock<=0||selling.has(`${market.buildingId}:${resource}`))continue;const amount=storage.free(market.id,resource);if(amount<=0)continue;
        for(const store of stores)if(store.allowed.includes(resource)&&storage.room(store.id,resource)>0)tasks.push({priority:25,sourceId:market.id,destinationId:store.id,resource,amount});
      }
    }
    return tasks;
  }
  // Open orders and the last 30 finished ones (for the panel) are kept.
  exportState(){const closed=this.orders.filter(o=>!OPEN.has(o.status)).slice(-30);return {seq:this.seq,orders:this.orders.filter(o=>OPEN.has(o.status)||closed.includes(o)).map(o=>({...o})),stats:structuredClone(this.stats),auto:structuredClone(this.auto)};}
  importState(state){this.seq=state?.seq??0;this.orders=(state?.orders??[]).map(o=>({...o}));this.stats=state?.stats?structuredClone(state.stats):emptyTradeStats();this.auto=state?.auto?structuredClone(state.auto):emptyAutoTrade();this.autoCheckedAt=undefined;this.changed();}
  destroy(){this.listeners.clear();if(this.scene.caravans)this.scene.caravans.deliveryPending=()=>false;}
}
