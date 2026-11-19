// Local-only preview server. Runs the real business routes with an in-memory
// store so login, schedule, grades and applications can be exercised without
// cloud credentials. Never packaged for publication.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createApp, errorResponse } from '../functions/app.mjs';
import { createMemoryStore } from '../functions/store.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const port = Number(process.argv[2] || 8000);
const handle = createApp({ store: createMemoryStore() });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

async function serveStatic(pathname, res) {
  const safe = normalize(pathname).replace(/^([/\\])+/, '');
  let target = join(dist, safe);
  try {
    const info = await stat(target);
    if (info.isDirectory()) target = join(target, 'index.html');
  } catch {
    target = join(dist, 'index.html');
  }
  try {
    const data = await readFile(target);
    res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Build the site first: npm run build');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
  if (url.pathname.startsWith('/functions/v1/app')) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });
    let response;
    try {
      response = await handle(request);
    } catch (error) {
      console.error('[api]', error?.message ?? error);
      response = errorResponse(error);
    }
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.writeHead(response.status);
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  await serveStatic(url.pathname === '/' ? '/index.html' : url.pathname, res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Atlas local preview: http://127.0.0.1:${port}/`);
});
