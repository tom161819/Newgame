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
}
