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
    const result = await page.evaluate(([a, v]) => window.assetStudio.exportSprite(a, v), [asset.id, variant.id]);
    const png = Buffer.from(result.png.replace(/^data:image\/png;base64,/, ''), 'base64');
    await mkdir(path.join(root, path.dirname(result.paths.sprite)), { recursive: true });
    await writeFile(path.join(root, result.paths.sprite), png);
    await writeFile(path.join(root, result.paths.spriteMeta), `${JSON.stringify(result.meta, null, 2)}\n`);
    for (const [i, tile] of result.tiles.entries()) await writeFile(path.join(root, result.paths.spriteTiles[i]), Buffer.from(tile.replace(/^data:image\/png;base64,/, ''), 'base64'));
    if (result.sheet) await writeFile(path.join(root, result.paths.spriteSheet), Buffer.from(result.sheet.replace(/^data:image\/png;base64,/, ''), 'base64'));
    if (result.front) await writeFile(path.join(root, result.paths.spriteFront), Buffer.from(result.front.replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log(`Exported ${result.paths.sprite} (${result.meta.width}×${result.meta.height}, hash ${result.meta.specHash})`);
  }
} finally {
  await browser.close();
  await server.close();
}
