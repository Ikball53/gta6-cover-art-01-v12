// Tiny static server for local preview of the cover studio.
// Serves app/ on http://localhost:8080 with no dependencies.
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), 'app');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

createServer((req, res) => {
  let path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path === '/') path = '/index.html';
  const file = normalize(join(appDir, path));
  if (!file.startsWith(appDir)) { res.writeHead(403).end('forbidden'); return; }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(8080, () => console.log('Neon Vice Cover Studio at http://localhost:8080'));
