// Review state. Two layers that the UI keeps visibly apart:
//  - repository manifest: art/approvals.json, committed through a pull request;
//  - local review: this browser only (localStorage), never sent anywhere.
// Exporting merges both into a new manifest that the developer commits.

// #210/#211: the owner's decisions are review states of one exact variant version. `revision-requested` and
// `rejected` join the original three; `blocked` marks a variant waiting on something else (a technical problem).
// Derived, never stored: Outdated (the record's version/hash differ from the variant) and In Game (see inGame()).
export const STATUSES = Object.freeze(['draft', 'review', 'revision-requested', 'approved', 'rejected', 'blocked']);
export const BASIC_STATUSES = Object.freeze(['draft', 'review', 'approved']);
export const STATUS_LABELS = Object.freeze({ draft: 'Draft', review: 'Review', 'revision-requested': 'Revision requested', approved: 'Approved', rejected: 'Rejected', blocked: 'Blocked' });
const HASH = /^[0-9a-f]{8}$/;
const iso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
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
      // Optional #211 fields: comments, revision history and the owner review that decided the status.
      if (record.comments !== undefined) {
        if (!Array.isArray(record.comments)) errors.push(`${assetId}/${variantId}: comments must be a list.`);
        else record.comments.forEach((c, i) => { if (!c || !Number.isInteger(c.version) || c.version < 1 || typeof c.text !== 'string' || !c.text.trim() || !iso(c.at)) errors.push(`${assetId}/${variantId}: comment ${i + 1} needs version, text and at.`); });
      }
      if (record.history !== undefined) {
        if (!Array.isArray(record.history)) errors.push(`${assetId}/${variantId}: history must be a list.`);
        else record.history.forEach((h, i) => { if (!h || !Number.isInteger(h.version) || h.version < 1 || !HASH.test(h.specHash ?? '') || !STATUSES.includes(h.status) || !iso(h.at)) errors.push(`${assetId}/${variantId}: history entry ${i + 1} needs version, specHash, status and at.`); else if (h.version >= record.version) errors.push(`${assetId}/${variantId}: history entry ${i + 1} must be older than version ${record.version}.`); });
      }
      if (record.decidedBy !== undefined && (typeof record.decidedBy !== 'string' || !record.decidedBy)) errors.push(`${assetId}/${variantId}: decidedBy must be a reviewer id.`);
      if (record.review !== undefined && (!record.review || !Number.isInteger(record.review.issue) || record.review.issue < 1 || typeof record.review.submissionId !== 'string' || !record.review.submissionId)) errors.push(`${assetId}/${variantId}: review needs the issue number and submissionId.`);
      if (record.status === 'revision-requested' && !(record.comments ?? []).some(c => c.version === record.version)) errors.push(`${assetId}/${variantId}: a revision request needs a comment for version ${record.version}.`);
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
  const status = effective.status;
  return {
    committed, pending, effective, outdated, preferred,
    revisionRequested: status === 'revision-requested' && !outdated, rejected: status === 'rejected', blocked: status === 'blocked',
    // Waiting for the owner: anything not decided for this exact version (a revised v2 after a revision request too).
    awaitsOwner: outdated ? status !== 'rejected' : ['draft', 'review'].includes(status),
    repoStatus: committed?.status ?? 'draft',
    hasLocalChange: !!pending || (localPreferred !== undefined && localPreferred !== repoPreferred),
  };
}

// #127: a variant still waits for approval unless it is approved for its current version and spec
// (draft, in review, or an approval made outdated by a newer recipe). Uses the effective state, local edits included.
export const awaitsApproval = state => !(state.effective.status === 'approved' && !state.outdated) && state.effective.status !== 'rejected';
export function reviewSummary({ repo, local, asset }) {
  const pending = asset.variants.filter(variant => awaitsApproval(reviewState({ repo, local, assetId: asset.id, variant }))).map(variant => variant.id);
  return { pending, approved: asset.variants.length - pending.length, total: asset.variants.length };
}

// Immutable update of the local layer. Approving stamps the exact version and spec hash.
// `by` is the reviewer's opaque id in the shared Studio page (never a name); it is omitted in a local-only review.
export function updateLocal(local, { assetId, variant, status, note, comment, preferred, by }, now = new Date().toISOString()) {
  const next = structuredClone(local);
  const asset = next.assets[assetId] ??= { variants: {} };
  asset.variants ??= {};
  if (status !== undefined || note !== undefined || comment !== undefined) {
    if (status !== undefined && !STATUSES.includes(status)) throw new RangeError(`Unknown status ${status}`);
    const previous = asset.variants[variant.id] ?? {};
    const nextStatus = status ?? previous.status ?? 'draft';
    const comments = [...(previous.comments ?? [])];
    if (comment !== undefined && String(comment).trim()) comments.push({ version: variant.version, text: String(comment).trim(), at: now, ...(by ? { by } : {}) });
    if (nextStatus === 'revision-requested' && !comments.some(c => c.version === variant.version)) throw new RangeError('A revision request needs a comment that says what to change.');
    asset.variants[variant.id] = {
      status: nextStatus,
      version: variant.version,
      specHash: variant.hash,
      note: note ?? previous.note ?? '',
      updatedAt: now,
      ...(by ? { decidedBy: by } : previous.decidedBy ? { decidedBy: previous.decidedBy } : {}),
      ...(nextStatus === 'approved' ? { approvedAt: status === 'approved' || !previous.approvedAt ? now : previous.approvedAt } : {}),
      ...(comments.length ? { comments } : {}),
      ...(previous.history ? { history: previous.history } : {}),
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
      const repoValue = repoAsset.variants?.[id], localValue = localAsset.variants?.[id], value = localValue ?? repoValue;
      if (!value) continue;
      // Comments and history only grow: repository entries are kept and local ones appended once.
      const seen = new Set(), comments = [...(repoValue?.comments ?? []), ...(localValue?.comments ?? [])].filter(c => { const key = `${c.version}|${c.at}|${c.text}`; if (seen.has(key)) return false; seen.add(key); return true; });
      variants[id] = { ...value, ...(comments.length ? { comments } : {}), ...(repoValue?.history || value.history ? { history: repoValue?.history ?? value.history } : {}) };
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

// #211: a new version of a variant (Claude's revision). The old record moves into history and the new one starts in
// review: an approval, rejection or revision request never carries over to another version.
export function nextRevision(record, { version, specHash }, now = new Date().toISOString()) {
  if (!Number.isInteger(version) || version <= (record?.version ?? 0)) throw new RangeError(`The new version must be greater than ${record?.version ?? 0}.`);
  const history = [...(record?.history ?? []), ...(record ? [{ version: record.version, specHash: record.specHash, status: record.status, at: record.updatedAt ?? now }] : [])];
  return { status: 'review', version, specHash, note: '', updatedAt: now, ...(record?.comments?.length ? { comments: record.comments } : {}), history };
}

// #211: In Game is derived from the game data, never stored: a variant is in the game when a game object or villager
// look names exactly its exported sprite metadata (artSource) of the current version.
export function gameArtSources({ definitions = [], villagerArt = {} } = {}) {
  const sources = new Set();
  const add = value => { if (typeof value === 'string' && value.startsWith('art/sprites/')) sources.add(value); };
  for (const d of definitions) { add(d.artSource); for (const art of Object.values(d.artSprites ?? {})) add(art?.artSource); }
  for (const look of Object.values(villagerArt)) add(look?.artSource);
  return sources;
}
export const inGame = (paths, sources) => !!paths?.spriteMeta && sources.has(paths.spriteMeta);
