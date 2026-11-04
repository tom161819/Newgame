// Asset specifications: categories, validation and the catalog that joins
// studio assets (art/assets/**/asset.json) with existing in-game definitions.
import { specHash } from './hash.js';

export const CATEGORIES = Object.freeze([
  { id: 'buildings', label: 'Buildings' },
  { id: 'units', label: 'Units' },
  { id: 'trees', label: 'Trees' },
  { id: 'nature', label: 'Nature' },
  { id: 'resources', label: 'Resources' },
  { id: 'decorations', label: 'Decorations' },
]);
export const CATEGORY_IDS = Object.freeze(CATEGORIES.map(c => c.id));
const ID = /^[a-z][a-z0-9-]*$/;

// In-game definitions use the object registry categories; map them to studio ones.
export function studioCategoryForGameObject(definition) {
  if (/tree/.test(definition.id)) return 'trees';
  switch (definition.category) {
    case 'building': return 'buildings';
    case 'character': case 'animal': return 'units';
    case 'resource': return 'resources';
    case 'terrain': return 'nature';
    case 'decoration': return /rock|outcrop|deposit|bush/.test(definition.id) ? 'nature' : 'decorations';
    default: return 'decorations';
  }
}

export function validateAssetSpec(spec, { generators, style, path = spec?.id }) {
  const errors = [], fail = message => errors.push(`${path}: ${message}`);
  if (!spec || typeof spec !== 'object') return [`${path}: asset.json must be an object.`];
  if (spec.schema !== 1) fail('schema must be 1.');
  if (typeof spec.id !== 'string' || !ID.test(spec.id)) fail('id must be lowercase letters, digits and hyphens.');
  if (typeof spec.name !== 'string' || !spec.name.trim()) fail('name is required.');
  if (!CATEGORY_IDS.includes(spec.category)) fail(`category must be one of ${CATEGORY_IDS.join(', ')}.`);
  const footprint = spec.footprint;
  if (!footprint || !Number.isInteger(footprint.width) || !Number.isInteger(footprint.height) || footprint.width < 1 || footprint.height < 1 || footprint.width > 6 || footprint.height > 6) {
    fail('footprint needs integer width and height between 1 and 6 tiles.');
  }
  const generator = generators[spec.generator];
  if (!generator) fail(`unknown generator "${spec.generator}".`);
  if (!Array.isArray(spec.variants) || !spec.variants.length) { fail('at least one variant is required.'); return errors; }
  const seen = new Set();
  for (const variant of spec.variants) {
    const where = `variant ${variant?.id ?? '?'}`;
    if (typeof variant?.id !== 'string' || !ID.test(variant.id)) fail(`${where}: invalid id.`);
    else if (seen.has(variant.id)) fail(`${where}: duplicate id.`);
    else if (!variant.id.startsWith(`${spec.id}-`)) fail(`${where}: id must start with "${spec.id}-".`);
    seen.add(variant?.id);
    if (typeof variant?.name !== 'string' || !variant.name.trim()) fail(`${where}: name is required.`);
    if (!Number.isInteger(variant?.version) || variant.version < 1) fail(`${where}: version must be a positive integer.`);
    if (!variant?.spec || typeof variant.spec !== 'object') { fail(`${where}: spec object is required.`); continue; }
    if (!generator || !footprint) continue;
    try {
      const model = generator.build(variant.spec, { footprint, style });
      for (const problem of checkModel(model, { footprint, style })) fail(`${where}: ${problem}`);
    } catch (error) { fail(`${where}: generator failed: ${error.message}`); }
  }
  return errors;
}

// Every primitive must use a style-guide material and stay inside the footprint.
export function checkModel(model, { footprint, style }) {
  const problems = [], halfW = footprint.width / 2 + 1e-6, halfH = footprint.height / 2 + 1e-6;
  for (const part of model.primitives) {
    if (!style.materials[part.material]) problems.push(`material "${part.material}" is not in the style guide.`);
    const { min, max } = primitiveBounds(part);
    if (min[0] < -halfW || max[0] > halfW || min[2] < -halfH || max[2] > halfH) problems.push(`${part.shape} (${part.material}) leaves the ${footprint.width}×${footprint.height} footprint.`);
    if (min[1] < -1e-6) problems.push(`${part.shape} goes below ground.`);
  }
  for (const light of model.lights ?? []) if (!style.lightSources[light.type]) problems.push(`light type "${light.type}" is not in the style guide.`);
  return problems;
}

// Axis-aligned bounds of a primitive, including boxes rotated around the vertical axis.
export function primitiveBounds(part) {
  const [x, y, z] = part.at;
  if (part.shape === 'cylinder') {
    // Four-sided cylinders are square-aligned, so their half-extent is r / √2.
    const r = Math.max(part.radiusTop, part.radiusBottom) * (part.segments === 4 ? Math.SQRT1_2 : 1);
    return { min: [x - r, y, z - r], max: [x + r, y + part.height, z + r] };
  }
  const [w, h, d] = part.size, cos = Math.abs(Math.cos(part.rotation ?? 0)), sin = Math.abs(Math.sin(part.rotation ?? 0));
  const hx = (cos * w + sin * d) / 2, hz = (sin * w + cos * d) / 2;
  return { min: [x - hx, y, z - hz], max: [x + hx, y + h, z + hz] };
}

export function modelBounds(model) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const part of model.primitives) {
    const b = primitiveBounds(part);
    for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], b.min[i]); max[i] = Math.max(max[i], b.max[i]); }
  }
  return { min, max };
}

// Repository paths are derived from ids so links and exports never drift apart.
export function assetPaths(asset, variant) {
  const base = `art/assets/${asset.category}/${asset.id}/asset.json`;
  return {
    spec: base,
    generator: `studio/src/generators/${asset.generator}.js`,
    sprite: variant ? `art/sprites/${asset.id}/${variant.id}.v${variant.version}.png` : null,
    spriteMeta: variant ? `art/sprites/${asset.id}/${variant.id}.v${variant.version}.json` : null,
  };
}

export function buildCatalog({ specs, generators, style, gameDefinitions = [], gameSprites = {} }) {
  const studio = specs.map(spec => ({
    ...spec,
    source: 'studio',
    variants: spec.variants.map(variant => ({
      ...variant,
      hash: specHash({ generator: spec.generator, generatorVersion: generators[spec.generator]?.version ?? 0, styleVersion: style.version, variant }),
      paths: assetPaths(spec, variant),
    })),
    paths: assetPaths(spec),
  })).sort((a, b) => a.name.localeCompare(b.name));
  const game = gameDefinitions.filter(d => d.sprite && d.category !== 'equipment').map(d => ({
    id: `game:${d.id}`,
    gameObjectId: d.id,
    name: d.name,
    category: studioCategoryForGameObject(d),
    description: d.description,
    footprint: { width: d.width ?? 1, height: d.height ?? 1 },
    source: 'game',
    sprite: gameSprites[d.sprite.replace(/^\//, '')] ?? null,
    spritePath: `public${d.sprite}`,
    renderMode: d.renderMode,
    origin: d.origin,
    visualHeight: d.visualHeight,
  })).sort((a, b) => a.name.localeCompare(b.name));
  return { studio, game, all: [...studio, ...game] };
}

export function filterCatalog(items, { category = 'all', source = 'all', query = '' } = {}) {
  const needle = query.trim().toLowerCase();
  return items.filter(item => (category === 'all' || item.category === category)
    && (source === 'all' || item.source === source)
    && (!needle || `${item.name} ${item.id}`.toLowerCase().includes(needle)));
}
