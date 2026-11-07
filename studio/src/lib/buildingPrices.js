// Buildings in game (#91, plan g-studio-ceny-budov): the Studio tab that shows every building the game offers with its
// price, and lets the owner (Contributor and up) propose a new price. The game's code stays the only source of truth:
// the table is built from a fresh ObjectRegistry (no per-browser overrides), and a proposal is only a shared database
// document `prices/<buildingId>` in the common format { buildingId, cost, by, at, note } that the Mechaniky chat applies
// with `npm run prices:sync` when the owner writes „převzít ceny“. `cost` is the WHOLE new price.
import { ObjectRegistry } from '../../../src/systems/ObjectRegistry.js';
import { objectDefinitions } from '../../../src/data/objects/index.js';
import { BUILDING_CATEGORIES } from '../../../src/data/buildingCategories.js';
import { validateCost, sameCost, CostError, COST_LIMIT } from '../../../src/data/buildingCostAuthoring.js';

export const PRICES = 'prices';
export { COST_LIMIT };

// Database path segments allow letters, digits and _ - . ~ : @ + only; building ids already fit.
export const priceDocId = buildingId => String(buildingId).replace(/[^A-Za-z0-9_\-.~:@+]/g, '_');

const menuOrder = (a, b) => (a.menuOrder ?? Number.MAX_SAFE_INTEGER) - (b.menuOrder ?? Number.MAX_SAFE_INTEGER);

// The table: categories in menu order, each with its buildings in menu order, and the resources a price may use.
// `specs` (Studio asset specs) link a building to its Studio asset by plannedGameObjectId or by the exported sprite.
export function gameBuildings({ definitions = objectDefinitions, specs = [] } = {}) {
  const registry = new ObjectRegistry(definitions);
  const byGameId = new Map();
  for (const spec of specs) {
    if (spec.plannedGameObjectId) byGameId.set(spec.plannedGameObjectId, spec.id);
  }
  const studioAssetFor = definition => {
    if (byGameId.has(definition.id)) return byGameId.get(definition.id);
    const match = typeof definition.artSource === 'string' && definition.artSource.match(/^art\/sprites\/([^/]+)\//);
    return match && specs.some(s => s.id === match[1]) ? match[1] : null;
  };
  const buildings = registry.buildables().map(d => ({
    id: d.id,
    name: d.name,
    category: BUILDING_CATEGORIES[d.buildingCategory] ? d.buildingCategory : 'other',
    footprint: { width: d.width, height: d.height },
    cost: { ...registry.costDefaults.get(d.id) },
    artSource: d.artSource ?? null,
    sprite: d.sprite ?? null,
    studioAsset: studioAssetFor(d),
    menuOrder: d.menuOrder,
  }));
  const categories = [...Object.entries(BUILDING_CATEGORIES).map(([id, c]) => ({ id, name: c.name, icon: c.icon })), { id: 'other', name: 'Other', icon: '•' }]
    .map(c => ({ ...c, buildings: buildings.filter(b => b.category === c.id).sort(menuOrder).map(({ menuOrder: _, ...b }) => b) }))
    .filter(c => c.buildings.length);
  const resources = registry.costResources().map(d => ({ id: d.id, name: d.name }));
  return { categories, resources, count: buildings.length };
}

// Row by row difference between the game price and a proposal, in a stable order: the game's resources first.
export function priceDiff(from = {}, to = {}) {
  const ids = [...Object.keys(from), ...Object.keys(to).filter(id => !(id in from))];
  return ids.map(resource => {
    const a = from[resource], b = to[resource];
    const kind = a === undefined ? 'added' : b === undefined ? 'removed' : a === b ? 'same' : 'changed';
    return { resource, from: a ?? null, to: b ?? null, kind };
  });
}

// Editing a draft price. Each returns a new cost or throws a CostError the page explains.
export function setAmount(cost, resource, value) {
  const amount = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > COST_LIMIT) throw new CostError('cost.amount', { resource });
  if (!(resource in cost)) throw new CostError('cost.unknownResource', { resource });
  return { ...cost, [resource]: amount };
}
export function addResource(cost, resource, value, resources) {
  if (!resources.has(resource)) throw new CostError('cost.unknownResource', { resource });
  if (resource in cost) throw new CostError('cost.duplicate', { resource });
  return setAmount({ ...cost, [resource]: 1 }, resource, value);
}
export function removeResource(cost, resource) {
  if (!(resource in cost)) return cost;
  if (Object.keys(cost).length <= 1) throw new CostError('cost.empty', { resource });
  const next = { ...cost };
  delete next[resource];
  return next;
}
export const costErrorText = (error, names = {}) => {
  const name = id => names[id] ?? id;
  if (!(error instanceof CostError)) return 'The price could not be changed.';
  return {
    'cost.amount': `Amount of ${name(error.detail.resource)} must be a whole number from 1 to ${COST_LIMIT}.`,
    'cost.empty': 'A building must cost at least one resource; the last one cannot be removed.',
    'cost.unknownResource': `${name(error.detail.resource)} is not a resource the game knows.`,
    'cost.duplicate': `${name(error.detail.resource)} is already in the price.`,
  }[error.code] ?? 'The price is not valid.';
};

// A proposal document as the page writes it.
export function proposalDoc(buildingId, cost, { by = null, note = '', now = new Date().toISOString() } = {}) {
  return { buildingId, cost: { ...cost }, ...(by ? { by } : {}), at: now, note: String(note ?? '').trim().slice(0, 500) };
}

// Shared documents are untrusted: keep a proposal only when it names a building in the table and is a valid price.
// Returns Map buildingId → { cost, by, at, note, docId, unchanged } (unchanged: the game already has this price).
export function proposalsFrom(docs, table) {
  const buildings = new Map(table.categories.flatMap(c => c.buildings).map(b => [b.id, b]));
  const resources = new Set(table.resources.map(r => r.id)), out = new Map();
  for (const doc of docs ?? []) {
    const data = doc?.data ?? doc, building = buildings.get(data?.buildingId);
    if (!building) continue;
    let cost;
    try { cost = validateCost(data.cost, resources); } catch { continue; }
    const at = typeof data.at === 'string' && !Number.isNaN(Date.parse(data.at)) ? data.at : '';
    const previous = out.get(building.id);
    if (previous && previous.at > at) continue;
    out.set(building.id, { cost, by: typeof data.by === 'string' ? data.by : null, at, note: typeof data.note === 'string' ? data.note.slice(0, 500) : '', docId: doc?.id ?? priceDocId(building.id), unchanged: sameCost(building.cost, cost) });
  }
  return out;
}

// The hand-over list for Claude / prices:sync (same format as the Asset Library's Copy prices JSON).
export const proposalsJson = proposals => [...proposals].filter(([, p]) => !p.unchanged).map(([buildingId, p]) => ({ buildingId, cost: p.cost, by: p.by, at: p.at, note: p.note }));

export const formatCost = (cost, names = {}) => Object.entries(cost ?? {}).map(([id, n]) => `${names[id] ?? id} × ${n}`).join(', ') || 'free';
export { sameCost };
