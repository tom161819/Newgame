// Suroviny jsou vedené podle názvu: později lze stejně přidat wood, iron apod.
export class Inventory {
  constructor() {
    this.resources = new Map();
  }

  count(resource) {
    return this.resources.get(resource) ?? 0;
  }

  add(resource, amount = 1) {
    const count = this.count(resource) + amount;
    this.resources.set(resource, count);
    return count;
  }

  spend(resource, amount) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError('Neplatná cena.');
    if (this.count(resource) < amount) return false;
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
