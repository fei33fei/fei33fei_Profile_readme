/* 把 site/ 的源码同步到 GitHub 仓库工作区。
   排除：node_modules（163 MB）、dist（构建产物）、.publish（源码快照副本）、dev/shots（诊断截图）
   保留：src/ data/ assets/ dev/（工具脚本）根文件，以及精选截图 → docs/ */
import { cpSync, mkdirSync, existsSync, rmSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'D:/Fey/Desktop/个人作品集网站/site';
const REPO = 'D:/Fey/Desktop/个人作品集网站/.git-sync/fei33fei_Profile_readme';

const DIRS = ['src', 'data', 'assets', 'dev'];
const ROOT_FILES = ['build.mjs', 'serve.mjs', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
const SHOTS = {
  'final-home-1440.png': 'preview-home.png',
  'final-detail-1440.png': 'preview-detail.png',
  'final-resume-1440.png': 'preview-resume.png',
  'final-home-390.png': 'preview-mobile.png'
};

for (const d of DIRS) {
  const src = join(SITE, d);
  const dst = join(REPO, d);
  if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}
// dev/shots 不入库
const shotsInRepo = join(REPO, 'dev', 'shots');
if (existsSync(shotsInRepo)) rmSync(shotsInRepo, { recursive: true, force: true });

for (const f of ROOT_FILES) {
  const src = join(SITE, f);
  if (existsSync(src)) copyFileSync(src, join(REPO, f));
}

const docs = join(REPO, 'docs');
mkdirSync(docs, { recursive: true });
for (const [from, to] of Object.entries(SHOTS)) {
  const src = join(SITE, 'dev', 'shots', from);
  if (existsSync(src)) copyFileSync(src, join(docs, to));
}

const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p); else files.push(p);
  }
})(REPO);
const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`✓ 已同步 ${files.length} 个文件 · ${(bytes / 1024 / 1024).toFixed(2)} MB`);
for (const f of files.sort()) console.log('  ' + f.replace(REPO.replace(/\\/g, '/') + '/', ''));
