/* 本地静态预览服务器（仅开发用，不进入 dist） */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

async function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^([/\\])+/, '');
  const candidates = [];
  // 注意：Windows 上 normalize 会把 "/" 变成 "\"，所以两种分隔符都要认
  if (/^__dev[\\/]/.test(clean)) {
    const rel = clean.slice('__dev/'.length);
    candidates.push(join(ROOT, '..', 'dev', rel));
    candidates.push(join(ROOT, '..', 'dev', rel, 'index.html'));
  } else if (clean.endsWith('/') || clean.endsWith('\\')) {
    candidates.push(join(ROOT, clean, 'index.html'));
  } else {
    candidates.push(join(ROOT, clean));
    candidates.push(join(ROOT, clean, 'index.html'));
  }
  for (const c of candidates) {
    try { const s = await stat(c); if (s.isFile()) return c; } catch { /* next */ }
  }
  return null;
}

createServer(async (req, res) => {
  let file = await resolve(req.url || '/');
  if (!file) { file = join(ROOT, '404.html'); res.statusCode = 404; }
  try {
    const buf = await readFile(file);
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.end('server error');
  }
}).listen(PORT, () => console.log(`preview → http://127.0.0.1:${PORT}`));
