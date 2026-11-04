// Static server for the built Asset Studio under a GitHub-Pages-like sub-path.
// Used by studio-smoke.mjs and studio-export.mjs; no other backend exists.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const studioDist = path.join(root, 'dist-studio');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

export function buildStudio() {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'studio/vite.config.js'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Asset Studio build failed.');
}

export async function serveStudio({ directory = studioDist, base = '/Newgame/studio/' } = {}) {
  const server = createServer(async (request, response) => {
    try {
      let relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!relative.startsWith(base)) { response.writeHead(404).end(); return; }
      relative = relative.slice(base.length) || 'index.html';
      const file = path.resolve(directory, relative);
      if (!file.startsWith(directory + path.sep)) { response.writeHead(403).end(); return; }
      await stat(file);
      response.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
      createReadStream(file).pipe(response);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, url: `${origin}${base}`, close: () => new Promise(resolve => server.close(resolve)) };
}
