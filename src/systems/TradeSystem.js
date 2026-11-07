import { price,tradeableResources } from '../data/trade.js';
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
export class TradeSystem {
  constructor(scene){
    this.scene=scene;this.orders=[];this.seq=0;this.listeners=new Set();
    if(scene.caravans)scene.caravans.deliveryPending=caravan=>this.openOrders(caravan.id).some(o=>o.status==='Transporting');
  }
  get storage(){return this.scene.foodStorage;}
  get caravan(){return this.scene.caravans?.active??null;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  openOrders(caravanId=null){return this.orders.filter(o=>OPEN.has(o.status)&&(caravanId===null||o.caravanId===caravanId));}
  marketplace(id){return this.scene.buildings.find(b=>b.id===id&&b.type==='marketplace'&&buildingIsComplete(b))??null;}
  market(id){return this.storage?.locations.get(marketId(id))??null;}
  // Gold promised to running purchases is not free to spend on another one.
  reservedGold(){return this.openOrders().filter(o=>o.side==='buy').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0);}
  pendingSaleGold(){return this.openOrders().filter(o=>o.side==='sell').reduce((n,o)=>n+(o.quantity-o.delivered)*o.price,0);}
  freeGold(){return Math.max(0,this.scene.inventory.count('gold')-this.reservedGold());}
  // Room for bought goods in every store that takes them (Granary groups, Warehouses, Armory, Starter Stockpile).
  storeRoom(resource){return [...this.storage.locations.values()].filter(l=>this.storage.isStock(l)&&l.allowed.includes(resource)).reduce((n,l)=>n+this.storage.room(l.id,resource),0);}
  marketUsed(id){const l=this.market(id);return l?Object.values(l.stock).reduce((n,v)=>n+v,0)+this.storage.incoming(l.id):0;}
  inTransitTo(id,resource){let n=0;for(const r of this.storage.reservations.values())if(r.kind==='capacity'&&r.locationId===marketId(id)&&r.resource===resource)n+=r.amount;return n;}
  // What an order would cost and whether it can be placed. Errors follow the brief (§5).
  quote(side,resource,quantity,{marketplaceId=this.caravan?.marketplaceId}={}){
    const c=this.caravan,unit=price(resource,side==='buy'?'buy':'sell'),total=unit===null?0:unit*quantity,errors=[];
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
          c.stock[o.resource]-=n;c.gold+=n*o.price;o.delivered+=n;
          this.scene.resourceLedger?.income(o.resource,n,'Trade Purchase',{type:'purchase',id:`${o.id}:${o.delivered}`,entityId:o.marketplaceId});dirty=true;
        }
        if(o.delivered>=o.quantity)o.status='Completed';else if(o.delivered>0||n===0)o.status='Transporting';
        if((c.stock[o.resource]??0)<=0&&o.delivered<o.quantity){o.status=o.delivered>0?'PartiallyCompleted':'Failed';}
        continue;
      }
      // Selling: goods free on the Marketplace go to the caravan; each unit is paid on hand-over.
      const free=this.storage.free(market.id,o.resource),n=Math.min(free,o.quantity-o.delivered,Math.floor(c.gold/o.price));
      if(n>0&&this.storage.withdraw(market.id,o.resource,n)){
        c.stock[o.resource]=(c.stock[o.resource]??0)+n;c.gold-=n*o.price;o.delivered+=n;
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
  exportState(){const closed=this.orders.filter(o=>!OPEN.has(o.status)).slice(-30);return {seq:this.seq,orders:this.orders.filter(o=>OPEN.has(o.status)||closed.includes(o)).map(o=>({...o}))};}
  importState(state){this.seq=state?.seq??0;this.orders=(state?.orders??[]).map(o=>({...o}));this.changed();}
  destroy(){this.listeners.clear();if(this.scene.caravans)this.scene.caravans.deliveryPending=()=>false;}
}
