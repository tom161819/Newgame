import { LEDGER_HISTORY_DAYS,TRANSACTION_TYPES,emptyLedgerState,addTransaction } from '../data/resourceLedger.js';

// Economic journal only. Physical quantities remain owned by the original
// inventory, ground, cargo, site and storage models; transfers never enter here.
export class ResourceTransactionLedger {
  constructor(scene){
    this.scene=scene;this.listeners=new Set();this.revision=0;this.importState(emptyLedgerState(scene.gameTime));scene.inventory.ledger=this;
    this.unsubscribeDay=scene.gameTime.onDayClosed(day=>this.closeDay(day));this.unsubscribeActivity=scene.activities.on(e=>this.activity(e));
  }
  resource(id){const d=this.scene.objectRegistry.get(id);return d?.category==='resource'&&d.collectible?d:null;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){this.revision++;for(const listener of this.listeners)listener();}
  suspend(){this.enabled=false;}
  income(resource,quantity,source,details={}){return this.record({resource,quantity,source,direction:'income',type:'acquisition',...details});}
  expense(resource,quantity,source,details={}){return this.record({resource,quantity,source,direction:'expense',type:'consumption',...details});}
  record(data){
    if(!this.enabled||!this.resource(data.resource)||!(data.quantity>0)||!Number.isFinite(data.quantity))return false;
    if(data.id&&this.processed.has(data.id))return false;
    if(!['income','expense'].includes(data.direction)||!TRANSACTION_TYPES.includes(data.type)||typeof data.source!=='string'||!data.source||data.source.length>160||['__proto__','constructor','prototype'].includes(data.source)||data.resource!=='gold'&&!Number.isSafeInteger(data.quantity))throw new TypeError('Invalid resource transaction');
    const id=data.id??`ledger-${this.nextId++}`;if(typeof id!=='string'||!id||id.length>256)throw new TypeError('Invalid transaction ID');
    const tx=Object.freeze({id,time:this.scene.gameTime.totalElapsed,day:this.current.day,resource:data.resource,quantity:data.quantity,direction:data.direction,type:data.type,source:data.source,entityId:data.entityId??null});
    this.processed.add(id);this.current.transactions.push(tx);addTransaction(this.current.totals,tx);this.changed();return tx;
  }
  activity(event){
    const d=this.scene.objectRegistry.get(event.objectType),id=`economic:${event.id}`,entityId=event.objectId??event.actor?.id??null;
    if(event.type==='treeChopped'&&d?.tree)this.income('wood',d.tree.wood,'Woodcutting',{id,entityId,type:'production'});
    if(event.type==='depositMined'&&d?.deposit)this.income(d.deposit.resource,1,d.deposit.resource==='stone'?'Mining':'Iron Mining',{id,entityId,type:'production'});
    if(event.type==='cropHarvested'&&d?.crop)this.income(d.crop.resource,d.crop.yield,d.crop.resource==='apple'?'Orchard Harvest':'Farming',{id,entityId,type:'production'});
  }
  closeDay(day){
    if(day<this.current.day)return false;if(day!==this.current.day)throw new Error('Resource ledger day is out of sequence');
    this.history.push(this.current);if(this.history.length>LEDGER_HISTORY_DAYS)this.history.splice(0,this.history.length-LEDGER_HISTORY_DAYS);this.current={day:day+1,partial:false,transactions:[],totals:{}};this.changed();return true;
  }
  get lastDay(){return this.history.at(-1)??null;}
  summary(resource){const value=this.lastDay?.totals[resource];return this.lastDay?{day:this.lastDay.day,partial:this.lastDay.partial,...(value??{income:0,expenses:0,net:0,incomeBySource:{},expensesBySource:{}})}:null;}
  exportState(){return structuredClone({version:1,nextId:this.nextId,startedAt:this.startedAt,current:this.current,history:this.history,processedIds:[...this.processed]});}
  importState(data){const state=structuredClone(data);this.nextId=state.nextId;this.startedAt=state.startedAt;this.current=state.current;this.history=state.history;this.processed=new Set(state.processedIds);this.enabled=true;this.changed();}
  destroy(){this.unsubscribeDay();this.unsubscribeActivity();if(this.scene.inventory.ledger===this)delete this.scene.inventory.ledger;this.listeners.clear();}
}
