#!/usr/bin/env node
// Buildings in game (#91): prints (or writes) the table the Studio tab shows, read from the game's code only:
// every building of the construction menu with its menu category, footprint, default price and Studio asset, plus
// the resources a price may use. The Studio page builds the same table at build time from the same module.
//   npm run studio:game-buildings                (JSON to stdout)
//   npm run studio:game-buildings -- out.json    (write a file)
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameBuildings } from '../studio/src/lib/buildingPrices.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const specs = [];
for (const category of await readdir(path.join(root, 'art/assets'), { withFileTypes: true })) {
  if (!category.isDirectory()) continue;
  for (const entry of await readdir(path.join(root, 'art/assets', category.name), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try { specs.push(JSON.parse(await readFile(path.join(root, 'art/assets', category.name, entry.name, 'asset.json'), 'utf8'))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const out = `${JSON.stringify({ gameVersion: version, ...gameBuildings({ specs }) }, null, 2)}\n`;
const file = process.argv[2];
if (file) await writeFile(path.resolve(file), out); else process.stdout.write(out);
