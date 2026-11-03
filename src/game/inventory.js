// Suroviny jsou vedené podle názvu: později lze stejně přidat wood, iron apod.
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

  add(resource, amount = 1) {
    if(this.storage?.manages(resource)){this.storage.addToInventory(resource,amount);return this.count(resource);}
    const count = this.count(resource) + amount;
    this.resources.set(resource, count);
    return count;
  }

  spend(resource, amount) {
    if (!(resource==='gold'?Number.isFinite(amount)&&amount<=Number.MAX_SAFE_INTEGER:Number.isSafeInteger(amount)) || amount < 0) throw new RangeError('Neplatná cena.');
    if (this.count(resource) < amount) return false;
    if(this.storage?.manages(resource))return this.storage.spend(resource,amount);
    this.resources.set(resource, this.count(resource) - amount);
    return true;
  }

  canAfford(cost) {
    for (const amount of Object.values(cost)) if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Neplatná cena.');
    return Object.entries(cost).every(([resource, amount]) => this.count(resource) >= amount);
  }

  pay(cost) {
    if (!this.canAfford(cost)) return false;
    for (const [resource, amount] of Object.entries(cost)) this.spend(resource, amount);
    return true;
  }
}
