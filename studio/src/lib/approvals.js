// Review state. Two layers that the UI keeps visibly apart:
//  - repository manifest: art/approvals.json, committed through a pull request;
//  - local review: this browser only (localStorage), never sent anywhere.
// Exporting merges both into a new manifest that the developer commits.

export const STATUSES = Object.freeze(['draft', 'review', 'approved']);
export const STATUS_LABELS = Object.freeze({ draft: 'Draft', review: 'Review', approved: 'Approved' });
export const LOCAL_KEY = 'asset-studio.review.v1';

export function emptyManifest() { return { schema: 1, updatedAt: null, assets: {} }; }

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || manifest.schema !== 1 || typeof manifest.assets !== 'object' || Array.isArray(manifest.assets)) return ['Manifest must have schema 1 and an assets object.'];
  for (const [assetId, asset] of Object.entries(manifest.assets)) {
    if (asset.preferred != null && typeof asset.preferred !== 'string') errors.push(`${assetId}: preferred must be a variant id.`);
    for (const [variantId, record] of Object.entries(asset.variants ?? {})) {
      if (!STATUSES.includes(record.status)) errors.push(`${assetId}/${variantId}: unknown status "${record.status}".`);
      if (!Number.isInteger(record.version) || record.version < 1) errors.push(`${assetId}/${variantId}: version must be a positive integer.`);
      if (typeof record.specHash !== 'string' || !/^[0-9a-f]{8}$/.test(record.specHash)) errors.push(`${assetId}/${variantId}: specHash must be 8 hex digits.`);
      if (record.status === 'approved' && typeof record.approvedAt !== 'string') errors.push(`${assetId}/${variantId}: approved variants need approvedAt.`);
    }
  }
  return errors;
}

export function readLocal(storage) {
  try {
    const data = JSON.parse(storage?.getItem(LOCAL_KEY) ?? 'null');
    return data && data.schema === 1 && typeof data.assets === 'object' ? data : emptyManifest();
  } catch { return emptyManifest(); }
}
export function writeLocal(storage, state) {
  try { storage?.setItem(LOCAL_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function record(manifest, assetId, variantId) { return manifest.assets?.[assetId]?.variants?.[variantId] ?? null; }

// What the studio shows for one variant.
export function reviewState({ repo, local, assetId, variant }) {
  const committed = record(repo, assetId, variant.id), pending = record(local, assetId, variant.id);
  const effective = pending ?? committed ?? { status: 'draft', version: variant.version, specHash: variant.hash, note: '' };
  const outdated = effective.status !== 'draft' && (effective.specHash !== variant.hash || effective.version !== variant.version);
  const repoPreferred = repo.assets?.[assetId]?.preferred ?? null;
  const localPreferred = local.assets?.[assetId] && 'preferred' in local.assets[assetId] ? local.assets[assetId].preferred : undefined;
  const preferred = (localPreferred === undefined ? repoPreferred : localPreferred) === variant.id;
  return {
    committed, pending, effective, outdated, preferred,
    repoStatus: committed?.status ?? 'draft',
    hasLocalChange: !!pending || (localPreferred !== undefined && localPreferred !== repoPreferred),
  };
}

// Immutable update of the local layer. Approving stamps the exact version and spec hash.
export function updateLocal(local, { assetId, variant, status, note, preferred }, now = new Date().toISOString()) {
  const next = structuredClone(local);
  const asset = next.assets[assetId] ??= { variants: {} };
  asset.variants ??= {};
  if (status !== undefined || note !== undefined) {
    if (status !== undefined && !STATUSES.includes(status)) throw new RangeError(`Unknown status ${status}`);
    const previous = asset.variants[variant.id] ?? {};
    const nextStatus = status ?? previous.status ?? 'draft';
    asset.variants[variant.id] = {
      status: nextStatus,
      version: variant.version,
      specHash: variant.hash,
      note: note ?? previous.note ?? '',
      updatedAt: now,
      ...(nextStatus === 'approved' ? { approvedAt: status === 'approved' || !previous.approvedAt ? now : previous.approvedAt } : {}),
    };
  }
  if (preferred !== undefined) asset.preferred = preferred ? variant.id : null;
  next.updatedAt = now;
  return next;
}

export function discardLocal(local, assetId = null) {
  if (!assetId) return emptyManifest();
  const next = structuredClone(local);
  delete next.assets[assetId];
  return next;
}

// Repository manifest with every local change applied. Records for variants that
// no longer exist are dropped so the committed file stays clean.
export function buildExportManifest({ repo, local, catalog, now = new Date().toISOString() }) {
  const out = { schema: 1, updatedAt: now, assets: {} };
  for (const asset of catalog) {
    const ids = new Set(asset.variants.map(v => v.id));
    const repoAsset = repo.assets?.[asset.id] ?? {}, localAsset = local.assets?.[asset.id] ?? {};
    const variants = {};
    for (const id of ids) {
      const value = localAsset.variants?.[id] ?? repoAsset.variants?.[id];
      if (value) variants[id] = value;
    }
    const preferred = 'preferred' in localAsset ? localAsset.preferred : repoAsset.preferred ?? null;
    if (Object.keys(variants).length || preferred) out.assets[asset.id] = { preferred: ids.has(preferred) ? preferred : null, variants };
  }
  return out;
}

export function pendingChanges({ repo, local, catalog }) {
  const changes = [];
  for (const asset of catalog) for (const variant of asset.variants) {
    const state = reviewState({ repo, local, assetId: asset.id, variant });
    if (state.pending && (state.pending.status !== state.committed?.status || state.pending.note !== (state.committed?.note ?? '') || state.pending.specHash !== state.committed?.specHash)) {
      changes.push({ assetId: asset.id, variantId: variant.id, from: state.repoStatus, to: state.pending.status });
    }
    if (state.hasLocalChange && state.preferred && (repo.assets?.[asset.id]?.preferred ?? null) !== variant.id) changes.push({ assetId: asset.id, variantId: variant.id, preferred: true });
  }
  return changes;
}
