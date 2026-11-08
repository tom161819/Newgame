// Renders every studio variant in a real browser and writes the sprites into the
// repository: art/sprites/<asset>/<variant>.v<version>.png and .json.
//   npm run studio:export              (all variants)
//   npm run studio:export -- watchtower (one asset)
// Files are only written locally; commit them through a pull request.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { browserRuntime } from './browser-runtime.mjs';
import { buildStudio, serveStudio, root } from './studio-server.mjs';

const only = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
// Approved figures are also exported in eight directions for the game's walking villagers.
const approvals = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../art/approvals.json', import.meta.url), 'utf8'));
const approvedVariant = (assetId, variantId) => approvals.assets?.[assetId]?.variants?.[variantId]?.status === 'approved';
buildStudio();
const server = await serveStudio();
const runtime = await browserRuntime();
const browser = await runtime.chromium.launch({ executablePath: runtime.executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage();
  await page.goto(server.url);
  await page.waitForFunction(() => window.assetStudio?.ready);
  const assets = (await page.evaluate(() => window.assetStudio.assets())).filter(asset => !only.length || only.includes(asset.id));
  if (!assets.length) throw new Error(`No studio asset matches ${only.join(', ')}.`);
  for (const asset of assets) for (const variant of asset.variants) {
    const facings = asset.category === 'units' && approvedVariant(asset.id, variant.id);
    const result = await page.evaluate(([a, v, f]) => window.assetStudio.exportSprite(a, v, { facings: f }), [asset.id, variant.id, facings]);
    if (result.baked) { console.log(`Skipped ${result.paths.sprite}: baked by Blender (npm run blender:bake).`); continue; }
    if (result.anim) await writeFile(path.join(root, result.paths.spriteAnim), Buffer.from(result.anim.replace(/^data:image\/png;base64,/, ''), 'base64'));
    if (result.walk) await writeFile(path.join(root, result.paths.spriteWalk), Buffer.from(result.walk.replace(/^data:image\/png;base64,/, ''), 'base64'));
    for (const [k, png] of result.facingPngs.entries()) await writeFile(path.join(root, result.paths.sprite.replace(/\.png$/, `.facing-${k}.png`)), Buffer.from(png.replace(/^data:image\/png;base64,/, ''), 'base64'));
    const png = Buffer.from(result.png.replace(/^data:image\/png;base64,/, ''), 'base64');
    await mkdir(path.join(root, path.dirname(result.paths.sprite)), { recursive: true });
    await writeFile(path.join(root, result.paths.sprite), png);
    await writeFile(path.join(root, result.paths.spriteMeta), `${JSON.stringify(result.meta, null, 2)}\n`);
    for (const [i, tile] of result.tiles.entries()) await writeFile(path.join(root, result.paths.spriteTiles[i]), Buffer.from(tile.replace(/^data:image\/png;base64,/, ''), 'base64'));
    for (const file of result.iconFiles ?? []) await writeFile(path.join(root, file.path), Buffer.from(file.png.replace(/^data:image\/png;base64,/, ''), 'base64'));
    for (const file of result.iconTexts ?? []) await writeFile(path.join(root, file.path), file.text);
    if (result.sheet) await writeFile(path.join(root, result.paths.spriteSheet), Buffer.from(result.sheet.replace(/^data:image\/png;base64,/, ''), 'base64'));
    if (result.front) await writeFile(path.join(root, result.paths.spriteFront), Buffer.from(result.front.replace(/^data:image\/png;base64,/, ''), 'base64'));
    for (const layer of ['still', 'rotor']) if (result[layer]) await writeFile(path.join(root, result.paths[`sprite${layer[0].toUpperCase()}${layer.slice(1)}`]), Buffer.from(result[layer].replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log(`Exported ${result.paths.sprite} (${result.meta.width}×${result.meta.height}, hash ${result.meta.specHash})`);
  }
} finally {
  await browser.close();
  await server.close();
}
