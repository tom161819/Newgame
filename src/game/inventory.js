// Suroviny jsou vedené podle názvu: později lze stejně přidat wood, iron apod.
import { GOLD_LIMIT } from '../data/economy.js';
export const RESOURCE_LIMITS=Object.freeze({gold:GOLD_LIMIT});
export class Inventory {
  constructor() {
    this.resources = new Map();
  }

  count(resource) {
    if(this.storage?.manages(resource))return this.storage.available(resource);
    return this.resources.get(resource) ?? 0;
  }

  exportState(){return {...Object.fromEntries(this.resources),...(this.storage?.inventorySummary()??{})};}
  importState(data){this.resources=new Map(Object.entries(data).filter(([id])=>!this.storage?.manages(id)));}
  useStorage(storage){this.storage=storage;for(const id of [...this.resources.keys()])if(storage.manages(id))this.resources.delete(id);}

  add(resource, amount = 1,details={}) {
    if(this.storage?.manages(resource)){this.storage.addToInventory(resource,amount);if(details.track!==false)this.ledger?.income(resource,amount,details.source??'Other Existing Income',details);return this.count(resource);}
    // A limited resource (Gold) takes only what fits; an amount already above the limit (an older save) is kept.
    const current=this.count(resource),limit=RESOURCE_LIMITS[resource],added=limit===undefined?amount:Math.max(0,Math.min(amount,limit-current));
    const count = current + added;
    this.resources.set(resource, count);
    if(details.track!==false&&added>0)this.ledger?.income(resource,added,details.source??'Other Existing Income',details);
    return count;
  }

  spend(resource, amount,details={}) {
    if (!(resource==='gold'?Number.isFinite(amount)&&amount<=Number.MAX_SAFE_INTEGER:Number.isSafeInteger(amount)) || amount < 0) throw new RangeError('Neplatná cena.');
    if (this.count(resource) < amount) return false;
    if(this.storage?.manages(resource)){if(!this.storage.spend(resource,amount))return false;}
    else this.resources.set(resource, this.count(resource) - amount);
    if(details.track!==false)this.ledger?.expense(resource,amount,details.source??'Other Existing Expenses',details);
    return true;
  }

  limit(resource){return RESOURCE_LIMITS[resource]??null;}

  canAfford(cost) {
    for (const amount of Object.values(cost)) if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Neplatná cena.');
    return Object.entries(cost).every(([resource, amount]) => this.count(resource) >= amount);
  }

  pay(cost,details={}) {
    if (!this.canAfford(cost)) return false;
    for (const [resource, amount] of Object.entries(cost)) this.spend(resource, amount,details);
    return true;
  }
}
