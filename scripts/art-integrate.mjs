// #215 art:integrate — puts exactly the owner-approved export of a building variant into the game.
//   npm run art:integrate -- <variantId>
// Checks: approved by the owner's review for this version and hash, export up to date, footprint matches the game
// object. Copies the PNG (and front/still/rotor layers) to public/assets/buildings/<id>/ and writes the
// APPROVED_BUILDING_ART entry. The game's mechanics are never changed; a mismatch stops with a problem to report.
import { readFile, writeFile, copyFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadCatalog } from './asset-review-lib.mjs';
import { integrationProblems, buildingArtEntry, setBuildingArt } from './art-tools-lib.mjs';
import { objectDefinitions } from '../src/data/objects/index.js';

const root = fileURLToPath(new URL('../', import.meta.url)), variantId = process.argv[2];
if (!variantId) { console.error('Usage: npm run art:integrate -- <variantId>'); process.exit(1); }
const catalog = loadCatalog(root), entry = catalog.get(variantId);
if (!entry) { console.error(`Unknown variant ${variantId}.`); process.exit(1); }
const variant = { id: variantId, version: entry.version, hash: entry.hash }, file = `${variantId}.v${variant.version}.png`;
const approvals = JSON.parse(await readFile(path.join(root, 'art/approvals.json'), 'utf8')), record = approvals.assets?.[entry.assetId]?.variants?.[variantId] ?? null;
const meta = JSON.parse(await readFile(path.join(root, `art/sprites/${entry.assetId}/${variantId}.v${variant.version}.json`), 'utf8'));
const spec = JSON.parse(await readFile(path.join(root, 'art/assets', meta.category, entry.assetId, 'asset.json'), 'utf8')), gameId = spec.gameObjectId ?? spec.plannedGameObjectId;
const definition = objectDefinitions.find(d => d.id === gameId);
const problems = integrationProblems({ record, meta, variant, definition });
if (problems.length) { console.error(problems.map(p => `- ${p}`).join('\n')); console.error('Not integrated.'); process.exit(1); }
if (definition.category !== 'building') { console.error(`${gameId} is a ${definition.category}; only buildings are automated so far. Integrate by hand (see AGENTS.md).`); process.exit(1); }
const target = path.join(root, 'public/assets/buildings', gameId); await mkdir(target, { recursive: true });
for (const layer of ['', '.front', '.still', '.rotor']) { const from = path.join(root, `art/sprites/${entry.assetId}/${variantId}.v${variant.version}${layer}.png`); try { await access(from); await copyFile(from, path.join(target, `${variantId}.v${variant.version}${layer}.png`)); } catch { /* layer not exported */ } }
const artFile = path.join(root, 'src/data/objects/approvedArt.js');
await writeFile(artFile, setBuildingArt(await readFile(artFile, 'utf8'), gameId, buildingArtEntry({ gameId, file, meta })));
console.log(`${variantId} v${variant.version} (#${variant.hash}) is now the art of ${gameId}. Next: adjust the image count in tests/assets.test.js if needed, CHANGELOG, release, smoke.`);
