/* 打包一份干净的源码快照用于私有云存储上传：
   排除 node_modules（wrangler 163 MB）、构建产物与诊断截图，保留可完整重建站点的一切。 */
import { readdirSync, statSync, mkdirSync, copyFileSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.publish', 'source');

const KEEP_FILES = ['package.json', 'package-lock.json', 'build.mjs', 'serve.mjs', 'wrangler.jsonc'];
const KEEP_DIRS = ['src', 'data', 'assets', 'dev'];
const SKIP_DEV = ['shots'];

function copyDir(from, to, skip = []) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue;
    const s = join(from, entry.name);
    const d = join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d, skip);
    else copyFileSync(s, d);
  }
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

for (const f of KEEP_FILES) {
  const p = join(ROOT, f);
  if (existsSync(p)) copyFileSync(p, join(OUT, f));
}
for (const d of KEEP_DIRS) {
  const p = join(ROOT, d);
  if (existsSync(p)) copyDir(p, join(OUT, d), d === 'dev' ? SKIP_DEV : []);
}

writeFileSync(join(OUT, '.gitignore'), 'node_modules/\n.publish/\ndist/\ndev/shots/\n');

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p); else files.push(p);
  }
})(OUT);
const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`✓ 源码快照 → ${OUT}`);
console.log(`  ${files.length} 个文件 · ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log('  内容：' + readdirSync(OUT).join(', '));
