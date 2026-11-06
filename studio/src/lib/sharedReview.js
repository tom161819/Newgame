// Shared review (replaces the GitHub hand-over of #210 AR-3/AR-4).
// The Studio is published as a page in Claude. Reviewers' decisions are kept in that page's database instead of one
// browser: one document per variant (`reviews/<asset>__<variant>`) and one per asset preference (`preferred/<asset>`).
// Together they form exactly the "local layer" manifest the Studio already understands, now shared by every reviewer.
// At the start of a chat Claude reads the documents, takes them over into art/approvals.json (takeOver below), commits,
// republishes the Studio and then deletes the documents it took over (only at the version it read).
import { buildExportManifest, emptyManifest, validateManifest } from './approvals.js';

export const REVIEWS = 'reviews';
export const PREFERRED = 'preferred';
export const SHARED_NOTE = 'Committed review state for Asset Studio. Reviewers decide in the shared Studio page; Claude takes the decisions over into this file at the start of a chat.';

// Database path segments allow letters, digits and _ - . ~ : @ + only.
const segment = value => (String(value).replace(/[^A-Za-z0-9_\-.~:@+]/g, '_').slice(0, 200) || '_');
export const reviewDocId = (assetId, variantId) => segment(`${assetId}__${variantId}`);
export const preferredDocId = assetId => segment(assetId);
const isId = value => typeof value === 'string' && value.length > 0 && value.length <= 200;
const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));

// Shared data is untrusted: a record is kept only when it is a valid manifest record the Studio could have written.
function validRecord(assetId, variantId, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  return validateManifest({ schema: 1, assets: { [assetId]: { variants: { [variantId]: record } } } }).length === 0;
}

// Database documents (their data) → the Studio's local-layer manifest.
export function layerFromDocs(reviewDocs = [], preferredDocs = []) {
  const layer = emptyManifest();
  const asset = id => (layer.assets[id] ??= { variants: {} });
  let latest = null;
  const seen = at => { if (iso(at) && (!latest || at > latest)) latest = at; };
  for (const doc of reviewDocs) {
    if (!doc || !isId(doc.assetId) || !isId(doc.variantId) || !validRecord(doc.assetId, doc.variantId, doc.record)) continue;
    asset(doc.assetId).variants[doc.variantId] = structuredClone(doc.record);
    seen(doc.at ?? doc.record.updatedAt);
  }
  for (const doc of preferredDocs) {
    if (!doc || !isId(doc.assetId) || !(doc.variantId === null || isId(doc.variantId))) continue;
    asset(doc.assetId).preferred = doc.variantId;
    seen(doc.at);
  }
  layer.updatedAt = latest;
  return layer;
}

// Which documents change between two local layers: { path, data } to set, or { path, data: null } to delete.
export function docWrites(before, after, { by = null, now = new Date().toISOString() } = {}) {
  const writes = [], stamp = { ...(by ? { by } : {}), at: now };
  const assets = new Set([...Object.keys(before?.assets ?? {}), ...Object.keys(after?.assets ?? {})]);
  for (const assetId of assets) {
    const b = before?.assets?.[assetId] ?? {}, a = after?.assets?.[assetId] ?? {};
    const variants = new Set([...Object.keys(b.variants ?? {}), ...Object.keys(a.variants ?? {})]);
    for (const variantId of variants) {
      const prev = b.variants?.[variantId], next = a.variants?.[variantId];
      if (JSON.stringify(prev ?? null) === JSON.stringify(next ?? null)) continue;
      writes.push({ path: `${REVIEWS}/${reviewDocId(assetId, variantId)}`, data: next ? { assetId, variantId, record: structuredClone(next), ...stamp } : null });
    }
    const had = 'preferred' in b, has = 'preferred' in a;
    if (had !== has || (has && b.preferred !== a.preferred)) writes.push({ path: `${PREFERRED}/${preferredDocId(assetId)}`, data: has ? { assetId, variantId: a.preferred ?? null, ...stamp } : null });
  }
  return writes;
}

// Reviewer ids named in a layer (decisions and comments), for showing names.
export function reviewerIds(layer) {
  const ids = new Set();
  for (const asset of Object.values(layer?.assets ?? {})) for (const record of Object.values(asset.variants ?? {})) {
    if (isId(record.decidedBy)) ids.add(record.decidedBy);
    for (const c of record.comments ?? []) if (isId(c.by)) ids.add(c.by);
  }
  return [...ids];
}

// Claude's take-over. `docs` are the database documents as Claude read them: { reviews: [{ id, version, data }],
// preferred: [...] }. `catalog` lists the Studio assets and their variant ids ([{ id, variants: [{ id }] }]).
// Returns the new art/approvals.json, the revision requests to turn into tasks, and the documents to delete once the
// republished Studio contains the new manifest (each at the version read, so a later decision is never lost).
export function takeOver({ repo, docs, catalog, now = new Date().toISOString() }) {
  const reviews = docs?.reviews ?? [], preferred = docs?.preferred ?? [];
  const layer = layerFromDocs(reviews.map(d => d.data), preferred.map(d => d.data));
  const manifest = { ...buildExportManifest({ repo, local: layer, catalog, now }), note: SHARED_NOTE };
  const ordered = { schema: manifest.schema, updatedAt: manifest.updatedAt, note: manifest.note, assets: manifest.assets };
  const known = new Map(catalog.map(asset => [asset.id, new Set(asset.variants.map(v => v.id))]));
  const decisions = [], revisions = [], ignored = [];
  for (const doc of reviews) {
    const d = doc.data ?? {}, record = layer.assets[d.assetId]?.variants?.[d.variantId];
    if (!record || !known.get(d.assetId)?.has(d.variantId)) { ignored.push(doc.id); continue; }
    const before = repo.assets?.[d.assetId]?.variants?.[d.variantId]?.status ?? 'draft';
    decisions.push({ assetId: d.assetId, variantId: d.variantId, version: record.version, from: before, to: record.status, by: record.decidedBy ?? null });
    if (record.status === 'revision-requested') revisions.push({ assetId: d.assetId, variantId: d.variantId, version: record.version, comments: (record.comments ?? []).filter(c => c.version === record.version).map(c => c.text) });
  }
  for (const doc of preferred) {
    const d = doc.data ?? {};
    if (!known.has(d.assetId)) ignored.push(doc.id);
    else decisions.push({ assetId: d.assetId, preferred: ordered.assets[d.assetId]?.preferred ?? null });
  }
  const remove = [...reviews.map(d => ({ path: `${REVIEWS}/${d.id}`, version: d.version })), ...preferred.map(d => ({ path: `${PREFERRED}/${d.id}`, version: d.version }))];
  return { manifest: ordered, decisions, revisions, ignored, remove };
}
