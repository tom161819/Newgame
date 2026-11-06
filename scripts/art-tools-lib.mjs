// #215 (AR-5 of #210): pure helpers for art:revise and art:integrate.
import { nextRevision } from '../studio/src/lib/approvals.js';

// art:revise — the asset spec gets the next version of one variant; its approval record starts again in review.
export function reviseSpec(spec, variantId) {
  const variant = spec.variants.find(v => v.id === variantId); if (!variant) throw new RangeError(`${spec.id} has no variant ${variantId}.`);
  return { ...spec, variants: spec.variants.map(v => v.id === variantId ? { ...v, version: v.version + 1 } : v) };
}
export function reviseRecord(approvals, assetId, variantId, { version, specHash }, now) {
  const next = structuredClone(approvals), asset = next.assets[assetId] ??= { preferred: null, variants: {} };
  asset.variants[variantId] = nextRevision(asset.variants[variantId] ?? null, { version, specHash }, now); next.updatedAt = now;
  return next;
}

// art:integrate — may this exact export enter the game? Approved by the owner's review for this version and hash,
// and technically matching the game object. A mismatch is a problem for the art, never a reason to change mechanics.
export function integrationProblems({ record, meta, variant, definition }) {
  const problems = [];
  if (!record || record.status !== 'approved') problems.push(`${variant.id} is not approved (status ${record?.status ?? 'none'}).`);
  else {
    if (!record.review) problems.push(`${variant.id} has no owner review reference (review: {issue, submissionId}).`);
    if (record.version !== variant.version || record.specHash !== variant.hash) problems.push(`${variant.id}: the approval is for v${record.version} #${record.specHash}, the variant is now v${variant.version} #${variant.hash}.`);
  }
  if (meta.specHash !== variant.hash || meta.version !== variant.version) problems.push(`${variant.id}: the exported sprite is v${meta.version} #${meta.specHash}; run npm run studio:export first.`);
  if (!definition) problems.push(`${variant.id}: the target game object does not exist.`);
  else if (definition.category === 'building' && (definition.width !== meta.footprint.width || definition.height !== meta.footprint.height)) problems.push(`${variant.id}: the art is ${meta.footprint.width}×${meta.footprint.height} but ${definition.id} is ${definition.width}×${definition.height}. Open a technical issue to fix the art; do not change the building.`);
  return problems;
}

// The APPROVED_BUILDING_ART entry for an export (same fields the existing approved buildings use).
export function buildingArtEntry({ gameId, file, meta }) {
  const entry = { sprite: `/assets/buildings/${gameId}/${file}`, artSource: `art/sprites/${meta.assetId}/${file.replace(/\.png$/, '.json')}`, origin: meta.baseOrigin, visualHeight: meta.visualHeight };
  if (meta.gameLights?.length) entry.lights = meta.gameLights;
  if (meta.frontLayer) entry.frontSprite = `/assets/buildings/${gameId}/${file.replace(/\.png$/, '.front.png')}`;
  return entry;
}
// Insert or replace one line `  id:{...},` inside `APPROVED_BUILDING_ART=Object.freeze({ … });` in approvedArt.js.
export function setBuildingArt(source, gameId, entry) {
  const start = source.indexOf('export const APPROVED_BUILDING_ART=Object.freeze({'); if (start < 0) throw new Error('APPROVED_BUILDING_ART not found.');
  const end = source.indexOf('\n});', start), line = `  ${gameId}:${JSON.stringify(entry)},`;
  const block = source.slice(start, end), lines = block.split('\n'), at = lines.findIndex(l => l.startsWith(`  ${gameId}:{`));
  if (at >= 0) lines[at] = line; else lines.push(line);
  return source.slice(0, start) + lines.join('\n') + source.slice(end);
}
