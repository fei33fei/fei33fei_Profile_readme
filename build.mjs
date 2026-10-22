/* =========================================================================
   沈亦菲 · 作品集 — 静态站点生成器
   输入：data/*.json  →  输出：dist/（Cloudflare Pages 构建目录）
   用法：node build.mjs [--origin=https://your-site.pages.dev]
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const ORIGIN = (process.argv.find((a) => a.startsWith('--origin=')) || '').split('=')[1]
  || process.env.SITE_ORIGIN || 'https://feyfei.pages.dev';

const read = (p) => JSON.parse(readFileSync(join(ROOT, 'data', p), 'utf8'));

const site = read('site.json');
const projectsData = read('projects.json');
const papersData = read('papers.json');
const awardsData = read('awards.json');
const profile = read('profile.json');
const resumes = read('resumes.json');

const projects = projectsData.projects;
const papers = papersData.papers;
const awardGroups = awardsData.groups;

/* ---------- 工具 ---------- */
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

/** 行内格式化：**粗体** → <strong>；【待补：xxx】 → 整理中标记 */
function inline(s = '') {
  let out = esc(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/【待补：(.+?)】/g, '<span class="todo" title="待补：$1">整理中</span>');
  return out;
}

/* CJK 追踪纪律：汉字保持正常字距，只有拉丁字母 / 数字的连续片段才加 tracking。
   输入必须是已转义的 HTML 文本。 */
const HAN = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
function tracked(s = '') {
  return String(s).split(/([\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]+)/).map((p) => {
    if (!p || HAN.test(p)) return p;
    if (!/[A-Za-z0-9]/.test(p)) return p;
    const lead = p.match(/^\s*/)[0];
    const trail = p.match(/\s*$/)[0];
    const core = p.slice(lead.length, p.length - trail.length);
    if (!core) return p;
    return `${lead}<span class="lat">${core}</span>${trail}`;
  }).join('');
}

const TRACK_CLASSES = [
  'u-meta', 'hero__eyebrow', 'hero__meta', 'chapter-mark__label', 'project-card__track',
  'project-card__headlineLabel', 'metric__label', 'table-caption', 'callout__t',
  'figure__caption', 'diagram__caption', 'pill', 'badge', 'honour-list__note',
  'career__time', 'resume-sheet__contact', 'figure__status', 'resume-tab', 'u-cap'
];
const TRACK_RE = new RegExp(
  `(<(?:span|div|p|td|th|caption|figcaption|b|label)[^>]*class="[^"]*\\b(?:${TRACK_CLASSES.join('|')})\\b[^"]*"[^>]*>)([^<]*)(</)`,
  'g'
);
function applyTracking(html) {
  return html.replace(TRACK_RE, (m, open, text, close) => open + tracked(text) + close);
}

/** 关键指标：把分隔符绑在前一个词上，避免「·」或「/」孤零零起行 */
const nb = (s = '') => esc(s).replace(/ · /g, '&nbsp;· ').replace(/ \/ /g, '&nbsp;/ ');

const GH_ICON = `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`;
const ARROW = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>`;
const BACK = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 8H3M7 4 3 8l4 4"/></svg>`;

const trackMeta = (t) => site.chapters[t] || site.chapters.cv;
const FEATURED = ['sde-net-sar-oil-spill', 'fgl-yolo-insulator', 'steel-defect-attention', 'defect-inspection-agent'];

const AWARD_LOOKUP = {
  'bridge-provincial-3rd': '大学生服务外包创新创业大赛 桥梁病变图像检测赛道',
  'cdss-national-3rd': '中国大学生计算机设计大赛（钢材缺陷分割检测）',
  'robot-prov-2nd': '中国机器人大赛暨 RoboCup 中国赛 四足仿生机器人快递运送',
  'robot-creative-2nd': '中国高校智能机器人创意大赛 足式机器人挑战赛'
};
function findAward(id) {
  const name = AWARD_LOOKUP[id];
  if (!name) return null;
  for (const g of awardGroups) {
    const hit = g.items.find((i) => i.name === name);
    if (hit) return { ...hit, group: g.label };
  }
  return null;
}

/* ---------- 通用片段 ---------- */
function chapterMark(ch, extra = '') {
  return `<div class="chapter-mark">
    <span class="chapter-mark__index">${esc(ch.index)}</span>
    <span class="chapter-mark__rule"></span>
    <span class="chapter-mark__label">${esc(ch.label)}</span>${extra}
  </div>`;
}

function iconMail() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><rect x="1" y="3" width="14" height="10"/><path d="m1 4 7 5 7-5"/></svg>`;
}
function iconPhone() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M5 1h6v4H5zM4 8h8v7H4z"/></svg>`;
}

const SITE_FAVICON = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230B1114'/%3E%3Cpath d='M6 25 L6 7 L20 7 L14 14 L26 14 L26 25 Z' fill='%23F3F0E8'/%3E%3C/svg%3E">`;

function head(title, desc, opts = {}) {
  const url = `${ORIGIN}${opts.path || '/'}`;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(site.meta.author)}">
<meta name="theme-color" content="${esc(site.meta.themeColor)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(ORIGIN + (opts.ogImage || '/assets/portrait-3x4.jpg'))}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary_large_image">
${SITE_FAVICON}
<link rel="stylesheet" href="/assets/css/styles.css">
${opts.head || ''}`;
}

function nav(active, accent) {
  return `<header class="site-nav" data-nav>
  <div class="shell shell--wide site-nav__inner">
    <a class="brand" href="/">
      <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 28V4h18l-7 8h13v16Z" fill="none" stroke="${esc(accent)}" stroke-width="1.6"/><path d="M4 28V4h6v24Z" fill="${esc(accent)}" opacity=".28"/></svg>
      <span class="brand__name">沈亦菲<em>FeyFey</em></span>
    </a>
    <nav class="site-nav__links" aria-label="主导航">
      ${site.nav.map((n) => `<a href="${n.href}"${n.href === active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`).join('\n      ')}
    </nav>
    <a class="site-nav__cta" href="/resume/">简历</a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-label="展开导航"><span></span></button>
  </div>
</header>`;
}

function footer() {
  const c = site.contact;
  return `<footer class="site-footer">
  <div class="shell shell--wide site-footer__inner">
    <span>${esc(c.footer)}</span>
    <span class="site-footer__links">
      <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
      <a href="${esc(c.github)}" rel="noopener">GitHub · ${esc(c.githubHandle)}</a>
      <a href="/resume/">简历</a>
      <a href="/papers/">论文</a>
    </span>
  </div>
</footer>`;
}

function page(opts) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
${head(opts.title, opts.desc, opts)}
</head>
<body style="--chapter-accent:${esc(opts.accent)}">
<a class="skip-link" href="#main">跳到主要内容</a>
${nav(opts.active, opts.accent)}
<main id="main">
${opts.body}
</main>
${footer()}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
  return applyTracking(html);
}
/* ---------- 场景（SceneStage） ---------- */
function scene(inner, { compact = false, horizon = 44, contours = [], grain = true } = {}) {
  const c = contours.map((k, i) => {
    const cls = k.cls || 'far';
    return `<svg class="scene__contour scene__contour--${cls}" viewBox="0 0 1000 480" preserveAspectRatio="none" style="${k.style}" aria-hidden="true"><path d="${k.d}"/></svg>`;
  }).join('\n  ');
  return `<section class="scene ${compact ? 'scene--compact' : 'hero'}" style="--horizon:${horizon}%">
  <div class="scene__floor" aria-hidden="true"></div>
  <div class="scene__glow" aria-hidden="true"></div>
  <div class="scene__horizon" aria-hidden="true"></div>
  ${c}
  ${grain ? '<div class="scene__grain" aria-hidden="true"></div>' : ''}
  ${inner}
</section>`;
}

function cutEdge(key = 'a', reverse = false) {
  const d = site.cutEdges[key] || site.cutEdges.a;
  return `<div class="cutedge ${reverse ? 'cutedge--up' : ''}" aria-hidden="true"><svg viewBox="0 0 1440 64" preserveAspectRatio="none"><path d="${d}"/></svg></div>`;
}

/* ---------- 图示（诚实结构图） ---------- */
function diagram(variant) {
  const A = 'var(--chapter-accent)';
  const box = (x, y, w, h, t1, t2) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${A}" stroke-width="1.2"/><text x="${x + w / 2}" y="${t2 ? y + 30 : y + h / 2 + 5}" text-anchor="middle" font-size="15" font-family="var(--font-ui)" fill="var(--ink-primary)">${esc(t1)}</text>${t2 ? `<text x="${x + w / 2}" y="${y + 52}" text-anchor="middle" font-size="12" font-family="var(--font-mono)" fill="var(--ink-tertiary)">${esc(t2)}</text>` : ''}</g>`;
  const arrow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="var(--ink-tertiary)" stroke-width="1.2" fill="none" marker-end="url(#ar)"/>`;
  const defs = `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="var(--ink-tertiary)"/></marker></defs>`;

  if (variant === 'lscd') {
    return `<svg viewBox="0 0 900 300" role="img" aria-label="LSCD 检测头结构：P3/P4/P5 统一投影后跨尺度共享卷积，再分出回归与分类两支">${defs}
      ${box(10, 30, 108, 46, 'P3', '')}${box(10, 108, 108, 46, 'P4', '')}${box(10, 186, 108, 46, 'P5', '')}
      ${arrow(118, 53, 168, 53)}${arrow(118, 131, 168, 131)}${arrow(118, 209, 168, 209)}
      ${box(168, 66, 148, 130, 'Conv_GN 统一投影', '→ 相同隐层 hidc')}
      ${arrow(316, 131, 366, 131)}
      ${box(366, 66, 170, 130, 'share_conv 跨尺度共享', 'DWConv 3×3 + PWConv 1×1')}
      ${arrow(536, 96, 586, 76)}${arrow(536, 131, 586, 131)}${arrow(536, 166, 586, 186)}
      ${box(586, 44, 150, 56, 'cv2 回归分支', '1×1 → 4×reg_max=64')}
      ${box(586, 158, 150, 56, 'cv3 分类分支', '1×1 → nc=3')}
      ${arrow(736, 72, 786, 104)}${arrow(736, 186, 786, 154)}
      ${box(786, 104, 104, 50, 'DFL 解码', '→ xywh')}
      <text x="10" y="278" font-size="12" font-family="var(--font-mono)" fill="var(--ink-tertiary)">一次共享卷积替代三套独立卷积 —— 参数与计算量下降的主因</text>
    </svg>`;
  }
  if (variant === 'pipeline') {
    const steps = [
      ['超高分辨率原图', 'COCO-Bridge 11,123 张'],
      ['滑动窗口切片', '640 窗口 → 27,757 张'],
      ['离线 Copy-Paste 增强', '缓解类别长尾'],
      ['分层重划分', '避免同源图块泄漏']
    ];
    let g = defs;
    steps.forEach((s, i) => {
      const x = 10 + i * 226;
      g += box(x, 80, 196, 92, s[0], s[1]);
      if (i < steps.length - 1) g += arrow(x + 196, 126, x + 222, 126);
    });
    g += `<text x="10" y="212" font-size="12" font-family="var(--font-mono)" fill="var(--ink-tertiary)">切片之后必须按源图重划分 —— 否则同源图块跨训练 / 验证集，验证指标是假的</text>`;
    return `<svg viewBox="0 0 900 230" role="img" aria-label="数据处理链路：原图经滑动窗口切片、离线 Copy-Paste 增强与分层重划分得到可训练数据集">${g}</svg>`;
  }
  if (variant === 'agent-flow') {
    const steps = ['图像上传', 'YOLO 权重推理', '视觉大模型解释', '结构化检测报告', '落库并生成工单'];
    let g = defs;
    steps.forEach((s, i) => {
      const x = 6 + i * 180;
      g += box(x, 62, 152, 62, s, '');
      if (i < steps.length - 1) g += arrow(x + 152, 93, x + 176, 93);
    });
    g += arrow(196, 124, 196, 186);
    g += box(116, 186, 176, 54, '置信度 < 阈值', '→ 转人工复核');
    g += `<text x="306" y="218" font-size="12" font-family="var(--font-mono)" fill="var(--ink-tertiary)">低置信度不自动下结论 —— 保留人工复核节点</text>`;
    return `<svg viewBox="0 0 900 258" role="img" aria-label="缺陷检测 Agent 处理链路：图像上传、YOLO 推理、视觉大模型解释、结构化报告、落库生成工单，低置信度分支转人工复核">${g}</svg>`;
  }
  return '';
}

/* ---------- 项目卡片 ---------- */
function projectCard(p, i) {
  const ch = trackMeta(p.track);
  const corner = ['plate__sheet', 'plate__sheet--notch', 'plate__sheet--lowcut'][i % 3];
  const gh = p.github.status === 'live'
    ? `<a class="project-card__gh" href="${esc(p.github.url)}" target="_blank" rel="noopener">${GH_ICON}GitHub</a>`
    : `<span class="project-card__gh project-card__gh--pending">仓库待建</span>`;
  return `<article class="project-card" data-track="${esc(p.track)}" data-reveal style="--chapter-accent:${esc(ch.accent)}">
  <div class="plate"><div class="${corner}">
    <div class="project-card__top">
      <span class="project-card__index">${esc(ch.index)}</span>
      <span class="project-card__track">${esc(ch.label)}</span>
      <span class="project-card__year">${esc(p.year)}</span>
    </div>
    <h3 class="project-card__title"><a class="project-card__link" href="/projects/${esc(p.slug)}/">${esc(p.title)}</a>${p.titleEn ? `<span class="project-card__titleEn">${esc(p.titleEn)}</span>` : ''}</h3>
    <div class="project-card__headline">${nb(p.headline)}<span class="project-card__headlineLabel">${esc(p.headlineLabel)}</span></div>
    <p class="project-card__line">${esc(p.oneLine)}</p>
    <div class="project-card__foot">
      ${(p.badges || []).slice(0, 3).map((b) => `<span class="badge">${esc(b)}</span>`).join('')}
      ${gh}
    </div>
  </div></div>
</article>`;
}

/* ---------- 项目详情：9 段模板 ---------- */
function renderSections(sections) {
  return sections.map((s) => {
    switch (s.type) {
      case 'lead':
        return `<p class="lead">${inline(s.text)}</p>`;
      case 'h':
        return `<h2>${esc(s.text)}</h2>`;
      case 'prose':
        return (s.blocks || []).map((b) => `<p>${inline(b)}</p>`).join('\n');
      case 'steps':
        return `<ol class="steps">${(s.items || []).map((it, i) => `<li><span class="steps__n">${i + 1}</span><div><div class="steps__t">${inline(it.title)}</div><div class="steps__d">${inline(it.text)}</div></div></li>`).join('')}</ol>`;
      case 'callout':
        return `<div class="callout callout--${esc(s.tone || 'note')}"><div class="callout__t">${esc(s.title)}</div><div class="callout__x">${inline(s.text)}</div></div>`;
      case 'table': {
        const align = s.align || [];
        const th = (s.head || []).map((h, i) => `<th scope="col" class="${align[i] === 'r' ? 'r' : ''}">${esc(h)}</th>`).join('');
        const rows = (s.rows || []).map((r, ri) => {
          const hi = (s.highlight || []).includes(ri) ? ' class="is-highlight"' : '';
          return `<tr${hi}>${r.map((c, ci) => `<td class="${align[ci] === 'r' ? 'r' : ''}">${inline(c)}</td>`).join('')}</tr>`;
        }).join('');
        return `<div class="table-block">
  <div class="table-caption">${esc(s.caption || '')}</div>
  <div class="table-wrap"><table class="data-table"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>
  ${s.note ? `<p class="table-note">${inline(s.note)}</p>` : ''}
</div>`;
      }
      case 'kv':
        return `<dl class="kv">${(s.items || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${inline(v)}</dd></div>`).join('')}</dl>`;
      case 'list':
        return `<ul class="prose-list">${(s.items || []).map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
      case 'figure':
        return `<figure class="figure">
  <div class="figure__box">
    <div class="figure__status">物料整理中</div>
    <div class="figure__text">${esc(s.text || s.note || '待补入')}</div>
  </div>
  ${s.caption ? `<figcaption class="figure__caption">${esc(s.caption)}</figcaption>` : ''}
</figure>`;
      case 'diagram':
        return `<div class="diagram">${diagram(s.variant)}${s.caption ? `<div class="diagram__caption">${esc(s.caption)}</div>` : ''}</div>`;
      default:
        return '';
    }
  }).join('\n');
}

function materialsList(materials) {
  if (!materials || !materials.length) return '';
  const label = { ready: '已就绪', partial: '部分就绪', pending: '整理中' };
  return `<h2>物料清单</h2>
<ul class="materials">${materials.map((m) => `<li>
  <span class="mat-dot mat-dot--${esc(m.status)}"></span>
  <span>${esc(m.kind)}</span>
  <span class="mat-note">${m.note ? esc(m.note) + ' · ' : ''}${esc(label[m.status] || m.status)}</span>
</li>`).join('')}</ul>`;
}

function relatedBlock(p) {
  const r = p.related || {};
  const items = [];
  (r.papers || []).forEach((id) => {
    const pa = papers.find((x) => x.id === id);
    if (pa) items.push(`<li><a href="${esc(pa.link || '#')}">${esc(pa.titleZh || pa.title)}</a> <span class="u-meta">${esc(pa.kind)} · ${esc(pa.level)}</span></li>`);
  });
  (r.awards || []).forEach((id) => {
    const a = findAward(id);
    if (a) items.push(`<li>${esc(a.name)} <span class="u-meta">${esc(a.award)}${a.positionNote && a.positionNote !== '—' ? ' · ' + esc(a.positionNote) : ''}</span></li>`);
  });
  (r.projects || []).forEach((slug) => {
    const pr = projects.find((x) => x.slug === slug);
    if (pr) items.push(`<li><a href="/projects/${esc(pr.slug)}/">${esc(pr.title)}</a></li>`);
  });
  if (!items.length) return '';
  return `<h2>关联产出</h2><ul class="prose-list">${items.join('')}</ul>`;
}

/* ---------- 页面：首页 ---------- */
function buildHome() {
  const ch = site.chapters.home;
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide hero__grid">
    <div>
      <div class="hero__eyebrow" data-rise style="--i:0">${esc(site.identity.eyebrow)}</div>
      <h1 class="hero__name" data-rise style="--i:1">${esc(site.identity.name)}<em>.</em><span class="hero__latin">${esc(site.identity.nameLatin)}</span></h1>
      <p class="hero__positioning" data-rise style="--i:2">${esc(site.identity.positioning)}<span>${esc(site.identity.positioningSub)}</span></p>
      <p class="hero__meta" data-rise style="--i:3">${site.identity.metaLine.split('｜').map((t) => tracked(t.trim())).join('<br>')}</p>
      <div class="hero__cta" data-rise style="--i:4">
        ${site.identity.ctas.map((c) => `<a class="btn ${c.kind === 'primary' ? 'btn--primary' : 'btn--ghost'}" href="${c.href}">${esc(c.label)}${c.kind === 'primary' ? ARROW : ''}</a>`).join('\n        ')}
      </div>
    </div>
    <figure class="hero__portrait plate" data-rise style="--i:3">
      <div class="plate__sheet plate__sheet--notch">
        <img src="/assets/portrait-3x4.jpg" width="900" height="1200" alt="${esc(site.media.portraitAlt)}" loading="eager" decoding="async">
        <figcaption class="u-cap"><span>${esc(site.media.portrait3x4Size)}</span><span>${esc(site.identity.eyebrow.split('·')[0].trim())}</span></figcaption>
      </div>
    </figure>
  </div>`, {
    horizon: 46,
    contours: [
      { cls: 'far', d: site.chapters.home.contour, style: 'right:-9%;top:1%;width:52%;height:54%' },
      { cls: 'mid', d: site.chapters.cv.contour, style: 'left:-15%;bottom:-19%;width:70%;height:48%' },
      { cls: 'near', d: site.chapters.agent.contour, style: 'right:-12%;bottom:-13%;width:48%;height:40%' }
    ]
  }));

  body.push(cutEdge('a'));

  /* 两主线 */
  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.cv, '')}
    <div class="section__head">
      <h2 class="section__title">两条主线</h2>
      <p class="section__lede">不是三个并列的方向 —— 计算机视觉做到极致，Agent 把视觉接进流程；数学与工程作为底色渗进每一件作品里，不单独开一栏。</p>
    </div>
    <div class="tracks">
      ${profile.tracks.map((t, i) => {
    const c = site.chapters[t.id];
    const corner = i === 0 ? 'plate__sheet--notch' : 'plate__sheet--lowcut';
    return `<a class="track-card" href="${t.href}" data-reveal style="--chapter-accent:${esc(c.accent)}">
        <div class="plate"><div class="${corner}">
          <div class="track-card__index">${esc(c.index)}</div>
          <div class="track-card__label">${esc(c.label)}</div>
          <h3 class="track-card__title">${esc(t.title)}</h3>
          <p class="track-card__line">${esc(t.line)}</p>
          <div class="track-card__evidence">${esc(t.evidence)}</div>
        </div></div>
      </a>`;
  }).join('\n      ')}
    </div>
  </div>
</section>`);

  /* 精选项目 */
  const feat = FEATURED.map((s) => projects.find((p) => p.slug === s)).filter(Boolean);
  body.push(`<section class="paper paper--alt section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    <div class="section__head" style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap">
      <div>
        ${chapterMark(site.chapters.home)}
        <h2 class="section__title">精选项目</h2>
      </div>
      <a class="btn btn--ink" href="/projects/">看全部 ${projects.length} 个项目${ARROW}</a>
    </div>
    <div class="collection">${feat.map((p, i) => projectCard(p, i)).join('\n')}</div>
  </div>
</section>`);

  /* 荣誉速览 */
  body.push(cutEdge('b', true));
  body.push(`<section class="paper paper--dark section" style="--chapter-accent:${esc(site.chapters.awards.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.awards)}
    <div class="section__head">
      <h2 class="section__title">荣誉速览</h2>
      <p class="section__lede">国家级 5 项 · 省级代表作 4 项。每一条都标了位次 —— 位次与级别同等重要。</p>
    </div>
    <div class="honour-list">
      ${awardsData.homeHighlights.map((h) => `<div>
        <span class="honour-list__time">${esc(h.time)}</span>
        <span class="honour-list__name">${esc(h.name)}</span>
        <span class="honour-list__award">${esc(h.award)}${h.note ? `<span class="honour-list__note">${esc(h.note)}</span>` : ''}</span>
      </div>`).join('\n      ')}
    </div>
    <div style="margin-top:34px"><a class="btn btn--ghost" href="/awards/">全部荣誉${ARROW}</a></div>
  </div>
</section>`);

  /* 联系 */
  const c = site.contact;
  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide contact-band">
    <div>
      ${chapterMark(site.chapters.about)}
      <h2 class="section__title">联系</h2>
      <p class="section__lede">正在找 2027 届的计算机视觉 / Agent 开发岗位。简历可打印为 PDF，论文与仓库链接都在下面。</p>
      <div class="hero__cta" style="margin-top:28px">
        <a class="btn btn--primary" href="/resume/">${esc(site.identity.ctas[2].label)}${ARROW}</a>
        <a class="btn btn--ink" href="mailto:${esc(c.email)}">${iconMail()} 写邮件</a>
      </div>
    </div>
    <dl class="contact-list">
      <div><dt>邮箱</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>
      <div><dt>电话</dt><dd>${esc(c.phone)}</dd></div>
      <div><dt>GitHub</dt><dd><a href="${esc(c.github)}" target="_blank" rel="noopener">${esc(c.githubHandle)}</a></dd></div>
      <div><dt>微信</dt><dd><span class="todo">整理中</span></dd></div>
    </dl>
  </div>
</section>`);

  return page({
    title: site.meta.titleFull,
    desc: site.meta.description,
    path: '/',
    active: '/',
    accent: ch.accent,
    body: body.join('\n'),
    head: `<link rel="preload" as="image" href="/assets/portrait-3x4.jpg" fetchpriority="high">`
  });
}

/* ---------- 页面：项目列表 ---------- */
function buildProjects() {
  const ch = site.chapters.cv;
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide">
    <div class="hero__eyebrow" data-rise>${esc(site.chapters.cv.index)} · ${esc(site.chapters.cv.label)}</div>
    <h1 class="hero__name" data-rise style="font-size:var(--size-display-l)">全部项目</h1>
    <p class="hero__lead" data-rise style="--i:2">${projects.length} 个项目，分属计算机视觉、Agent 开发与数学与工程三条线。CV 与 Agent 有完整详情页；数学与工程那项做轻量展示 —— 它是底色，不该占据主线位置。</p>
  </div>`, {
    compact: true, horizon: 58,
    contours: [{ cls: 'mid', d: site.chapters.cv.contour, style: 'right:-6%;top:6%;width:44%;height:58%' }]
  }));
  body.push(cutEdge('c'));

  const trackBtns = [
    ['all', '全部'], ['cv', '计算机视觉'], ['agent', 'Agent 开发'], ['base', '数学与工程']
  ];
  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    <div class="filters" data-filters>
      ${trackBtns.map(([k, l]) => `<button class="filter-btn" type="button" data-track-btn="${k}" aria-pressed="${k === 'all'}">${esc(l)}</button>`).join('\n      ')}
      <span class="filter-count" data-filter-count>${String(projects.length).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}</span>
    </div>
    <p class="sr-only" aria-live="polite" data-filter-live></p>
    <div class="collection">${projects.map((p, i) => projectCard(p, i)).join('\n')}</div>
  </div>
</section>`);

  return page({
    title: '项目 · 沈亦菲 · FeyFey',
    desc: '计算机视觉、Agent 开发与数学工程方向的 7 个项目：SAR 溢油分割、绝缘子缺陷检测、桥梁病害、钢材缺陷、路面坑洼、缺陷检测 Agent、A*+DWA 路径规划。',
    path: '/projects/', active: '/projects/', accent: ch.accent, body: body.join('\n')
  });
}

/* ---------- 页面：项目详情 ---------- */
function buildProject(p) {
  const ch = trackMeta(p.track);
  const gh = p.github.status === 'live'
    ? `<a class="btn btn--ghost" href="${esc(p.github.url)}" target="_blank" rel="noopener">${GH_ICON} GitHub 仓库</a>`
    : `<span class="todo" title="仓库尚未创建">仓库待建 · ${esc(p.github.repoName)}</span>`;

  const body = [];
  body.push(scene(`
  <div class="shell shell--wide detail-hero__grid">
    <div>
      <a class="detail-hero__back" href="/projects/">${BACK} 返回项目列表</a>
      <div class="hero__eyebrow" data-rise>${esc(ch.index)} · ${esc(ch.label)} · ${esc(p.year)}</div>
      <h1 class="detail-hero__title" data-rise style="--i:1">${esc(p.title)}</h1>
      ${p.titleEn ? `<p class="detail-hero__titleEn" data-rise style="--i:2">${esc(p.titleEn)}</p>` : ''}
      <p class="detail-hero__lead" data-rise style="--i:3">${esc(p.oneLine)}</p>
      <p class="hero__meta" data-rise style="--i:4">${esc(p.role)}</p>
      <div class="hero__cta" data-rise style="--i:5">${gh}</div>
    </div>
    <div class="detail-hero__metrics" data-rise style="--i:4">
      <div class="metric"><div class="metric__value">${nb(p.headline)}</div><span class="metric__label">${esc(p.headlineLabel)}</span></div>
      <div class="metric"><div class="metric__value" style="font-size:clamp(1.05rem,1.4vw,1.3rem)">${esc(p.venue)}</div><span class="metric__label">发表 / 竞赛</span></div>
      <div class="metric"><div class="metric__value" style="font-size:clamp(1.05rem,1.4vw,1.3rem)">${(p.badges || []).join(' · ')}</div><span class="metric__label">标签</span></div>
    </div>
  </div>`, {
    compact: true, horizon: 52,
    contours: [{ cls: 'mid', d: ch.contour, style: 'right:-8%;top:8%;width:50%;height:60%' }]
  }));

  body.push(`<div data-takeover>${cutEdge('d')}</div>`);

  body.push(`<section class="paper article" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide article__grid">
    <aside class="article__rail">
      <h2>项目速览</h2>
      <dl class="rail-list">
        <div><dt>时间</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>身份</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>成果</dt><dd>${esc(p.venue)}</dd></div>
        <div><dt>代码</dt><dd>${p.github.status === 'live' ? `<a href="${esc(p.github.url)}" target="_blank" rel="noopener">${esc(p.github.repoName)}</a>` : `<span class="todo">待建</span> ${esc(p.github.repoName)}`}</dd></div>
        <div><dt>主线</dt><dd>${esc(ch.label)}</dd></div>
      </dl>
      <div class="rail-hook">
        <div class="rail-hook__label">面试钩子</div>
        <p class="rail-hook__text">${esc(p.interviewHook)}</p>
      </div>
    </aside>
    <article class="prose">
      ${renderSections(p.sections)}
      ${relatedBlock(p)}
      ${materialsList(p.materials)}
    </article>
  </div>
</section>`);

  return page({
    title: `${p.title} · 沈亦菲 · FeyFey`,
    desc: p.oneLine,
    path: `/projects/${p.slug}/`,
    active: '/projects/',
    accent: ch.accent,
    body: body.join('\n')
  });
}

/* ---------- 页面：论文与专利 ---------- */
function buildPapers() {
  const ch = site.chapters.papers;
  const levelPill = (lvl) => {
    if (lvl.includes('SCI')) return `<span class="pill pill--sci">${esc(lvl)}</span>`;
    if (lvl.includes('EI')) return `<span class="pill pill--ei">${esc(lvl)}</span>`;
    if (lvl === '—') return `<span class="pill pill--other">${esc(lvl)}</span>`;
    return `<span class="pill pill--other">${esc(lvl)}</span>`;
  };
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide">
    <div class="hero__eyebrow" data-rise>${esc(ch.index)} · ${esc(ch.label)}</div>
    <h1 class="hero__name" data-rise style="font-size:var(--size-display-l)">论文与专利</h1>
    <p class="hero__lead" data-rise style="--i:2">${esc(papersData.intro)}</p>
  </div>`, {
    compact: true, horizon: 58,
    contours: [{ cls: 'mid', d: ch.contour, style: 'right:-6%;top:4%;width:48%;height:60%' }]
  }));
  body.push(cutEdge('a'));

  const featured = papers.filter((p) => p.featured);
  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(ch)}
    <div class="section__head"><h2 class="section__title">主推三篇</h2></div>
    <div class="collection">
      ${featured.map((pa, i) => `<article class="project-card" data-reveal style="--chapter-accent:${esc(ch.accent)}">
        <div class="plate"><div class="${['plate__sheet', 'plate__sheet--notch', 'plate__sheet--lowcut'][i % 3]}">
          <div class="project-card__top"><span class="project-card__index">${esc(pa.time)}</span><span class="project-card__track">${esc(pa.kind)}</span></div>
          <h3 class="project-card__title"><a class="project-card__link" href="${esc(pa.link || '#')}">${esc(pa.titleZh || pa.title)}</a></h3>
          <p class="project-card__line">${esc(pa.title)}</p>
          <div class="project-card__foot"><span class="badge badge--accent">${esc(pa.level)}</span><span class="badge">${esc(pa.position || '位次整理中')}</span></div>
        </div></div>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>`);

  body.push(`<section class="paper paper--alt section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    <div class="section__head">
      <h2 class="section__title">全部成果</h2>
      <p class="section__lede">类型与收录级别分两列写，每条标注署名位次。</p>
    </div>
    <div class="table-wrap">
      <table class="data-table paper-table">
        <caption class="u-meta" style="text-align:left;padding:0 0 12px">共 ${papers.length} 项 · 论文 ${papers.filter((p) => p.kind === '论文').length} · 专利 1 · 软著 1</caption>
        <thead><tr>
          <th scope="col">题目</th><th scope="col">类型</th><th scope="col">收录级别</th><th scope="col">时间</th><th scope="col">位次</th><th scope="col">状态 / 链接</th>
        </tr></thead>
        <tbody>
        ${papers.map((pa) => `<tr>
          <td><span class="t-title">${esc(pa.titleZh || pa.title)}</span>${pa.titleZh ? `<span class="t-titleZh">${esc(pa.title)}</span>` : ''}${pa.note ? `<span class="t-note">${esc(pa.note)}</span>` : ''}</td>
          <td>${esc(pa.kind)}</td>
          <td>${levelPill(pa.level)}</td>
          <td class="r">${esc(pa.time || '—')}</td>
          <td>${pa.position ? `<span class="pill pill--pos">${esc(pa.position)}</span>` : `<span class="todo">整理中</span>`}</td>
          <td>${pa.link ? `<a href="${esc(pa.link)}">查看项目</a>` : '<span class="u-meta">—</span>'}</td>
        </tr>`).join('\n        ')}
        </tbody>
      </table>
    </div>
    <p class="table-note">${esc(papersData.footnote)}</p>
  </div>
</section>`);

  return page({
    title: '论文与专利 · 沈亦菲 · FeyFey',
    desc: '5 篇一作论文（SCI 三区 ×1、EI 收录 ×2、会议 ×2）、1 项发明专利、1 项软件著作权，另有 SCI 二区四作成果如实列出。',
    path: '/papers/', active: '/papers/', accent: ch.accent, body: body.join('\n')
  });
}

/* ---------- 页面：荣誉 ---------- */
function buildAwards() {
  const ch = site.chapters.awards;
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide">
    <div class="hero__eyebrow" data-rise>${esc(ch.index)} · ${esc(ch.label)}</div>
    <h1 class="hero__name" data-rise style="font-size:var(--size-display-l)">荣誉奖项</h1>
    <p class="hero__lead" data-rise style="--i:2">${esc(awardsData.intro)}</p>
  </div>`, {
    compact: true, horizon: 58,
    contours: [{ cls: 'mid', d: ch.contour, style: 'right:-6%;top:6%;width:46%;height:58%' }]
  }));
  body.push(cutEdge('c'));

  const group = (g) => `<section class="timeline__group">
    <div class="timeline__legend"><h2>${esc(g.label)}</h2><span class="u-meta">${g.count} 项</span></div>
    <div class="timeline__list">
      ${g.items.map((it) => `<div class="timeline__item">
        <div class="timeline__time">${esc(it.time)}</div>
        <div class="timeline__name">${esc(it.name)}${it.note ? ` <span class="u-meta">${esc(it.note)}</span>` : ''}</div>
        <div class="timeline__award">${esc(it.award)}${it.positionNote && it.positionNote !== '—' ? `<span class="pill pill--pos" style="margin-left:10px">${esc(it.positionNote)}</span>` : ''}</div>
      </div>`).join('\n      ')}
    </div>
  </section>`;

  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(ch)}
    <div class="timeline">${awardGroups.map(group).join('\n    ')}</div>
    <details class="collapse">
      <summary>${esc(awardsData.collapsed.label)} · ${awardsData.collapsed.count} 项</summary>
      <div class="timeline__list">
        ${awardsData.collapsed.items.map((it) => `<div class="timeline__item">
          <div class="timeline__time">${esc(it.time)}</div>
          <div class="timeline__name">${esc(it.name)}</div>
          <div class="timeline__award">${esc(it.award)}${it.positionNote && it.positionNote !== '—' ? `<span class="pill pill--pos" style="margin-left:10px">${esc(it.positionNote)}</span>` : ''}</div>
        </div>`).join('\n        ')}
      </div>
    </details>
  </div>
</section>`);

  return page({
    title: '荣誉奖项 · 沈亦菲 · FeyFey',
    desc: '国家级 5 项、省级 4 项，另有校级与参与奖 18 项。每条标注位次。',
    path: '/awards/', active: '/awards/', accent: ch.accent, body: body.join('\n')
  });
}

/* ---------- 页面：关于我 ---------- */
function buildAbout() {
  const ch = site.chapters.about;
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide">
    <div class="hero__eyebrow" data-rise>${esc(ch.index)} · ${esc(ch.label)}</div>
    <h1 class="hero__name" data-rise style="font-size:var(--size-display-l)">关于我</h1>
  </div>`, {
    compact: true, horizon: 60,
    contours: [{ cls: 'mid', d: ch.contour, style: 'right:-6%;top:4%;width:46%;height:62%' }]
  }));
  body.push(cutEdge('b'));

  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide about-hero">
    <figure class="about-portrait plate" data-reveal>
      <div class="plate__sheet plate__sheet--notch">
        <img src="/assets/portrait-3x4.jpg" width="900" height="1200" alt="${esc(site.media.portraitAlt)}" loading="lazy" decoding="async">
        <figcaption>${esc(site.media.portrait3x4Size)} · ${esc(profile.education.school)} ${esc(profile.education.major)}</figcaption>
      </div>
    </figure>
    <div>
      <p class="about-statement" data-reveal>${esc(profile.statement.line)}</p>
      <p class="about-note" data-reveal>${esc(profile.statement.body)}</p>
      <dl class="kv" style="margin-top:34px" data-reveal>
        <div><dt>学校</dt><dd>${esc(profile.education.school)} · ${esc(profile.education.major)} · ${esc(profile.education.degree)}</dd></div>
        <div><dt>时间</dt><dd>${esc(profile.education.period)} · ${esc(profile.education.note)}</dd></div>
        <div><dt>方向</dt><dd>计算机视觉（图像分割 / 缺陷检测 / 边缘端部署）· Agent 开发</dd></div>
      </dl>
    </div>
  </div>
</section>`);

  body.push(`<section class="paper paper--alt section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.about)}
    <div class="section__head"><h2 class="section__title">经历</h2></div>
    <div class="career">
      ${profile.timeline.map((t) => `<div class="career__item" data-reveal>
        <div>
          <div class="career__time">${esc(t.time)}</div>
          <span class="career__kind">${esc(t.kind)}</span>
        </div>
        <div>
          <h3 class="career__title">${esc(t.title)}</h3>
          <ul class="career__list">${(t.items || []).map((i) => `<li>${inline(i)}</li>`).join('')}</ul>
          ${t.note ? `<p class="career__note">${inline(t.note)}</p>` : ''}
        </div>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`);

  body.push(`<section class="paper section" style="--chapter-accent:${esc(site.chapters.base.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.base)}
    <div class="section__head">
      <h2 class="section__title">${esc(profile.base.label)}</h2>
      <p class="section__lede">${esc(profile.base.note)}</p>
    </div>
    <dl class="base-list">
      ${profile.base.items.map((b) => `<div><dt>${esc(b.k)}</dt><dd>${inline(b.v)}</dd></div>`).join('\n      ')}
    </dl>
  </div>
</section>`);

  body.push(`<section class="paper paper--alt section" style="--chapter-accent:${esc(site.chapters.base.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.base)}
    <div class="section__head">
      <h2 class="section__title">技能矩阵</h2>
      <p class="section__lede">按两条主线 + 底色分组。不做进度条百分比 —— 会与不会用「熟练度百分比」衡量本身没有意义。</p>
    </div>
    <div class="skill-matrix">
      ${profile.skills.map((g) => `<div class="skill-group" data-reveal>
        <h3>${esc(g.group)}</h3>
        <ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`);

  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    ${chapterMark(site.chapters.about)}
    <div class="section__head">
      <h2 class="section__title">${esc(profile.method.title)}</h2>
      <p class="section__lede">${esc(profile.method.lead)}</p>
    </div>
    <div class="method-grid">
      ${profile.method.points.map((p) => `<div class="method-item" data-reveal>
        <div class="method-item__t">${esc(p.t)}</div>
        <p class="method-item__d">${esc(p.d)}</p>
      </div>`).join('\n      ')}
    </div>
  </div>
</section>`);

  return page({
    title: '关于我 · 沈亦菲 · FeyFey',
    desc: '南通理工学院人工智能专业 2027 届。计算机视觉与 Agent 开发双主线，用友 BIP 实施顾问实习经历，4 篇一作论文。',
    path: '/about/', active: '/about/', accent: ch.accent, body: body.join('\n')
  });
}

/* ---------- 页面：简历 ---------- */
function buildResume() {
  const ch = site.chapters.about;
  const body = [];
  body.push(scene(`
  <div class="shell shell--wide">
    <div class="hero__eyebrow" data-rise>${esc(site.chapters.about.index)} · 简历</div>
    <h1 class="hero__name" data-rise style="font-size:var(--size-display-l)">简历</h1>
    <p class="hero__lead" data-rise style="--i:2">三版按求职方向拆分，内容逐段取自原始简历文件，没有改写。PDF 尚未定稿导出 —— 用下面的按钮直接打印为 PDF，内容与页面上完全一致。</p>
  </div>`, {
    compact: true, horizon: 60,
    contours: [{ cls: 'mid', d: ch.contour, style: 'right:-6%;top:4%;width:44%;height:60%' }]
  }));
  body.push(cutEdge('d'));

  const renderBlocks = (blocks) => blocks.map((b) => {
    if (b.type === 'section') return `<section><h2>${esc(b.title)}</h2>${(b.paragraphs || []).map((p) => `<p>${inline(p)}</p>`).join('')}</section>`;
    if (b.type === 'note') return `<div class="resume-note"><h2>${esc(b.title)}</h2>${(b.paragraphs || []).map((p) => `<p>${inline(p)}</p>`).join('')}</div>`;
    if (b.type === 'list') return `<section><h2>${esc(b.title)}</h2><ul>${(b.items || []).map((i) => `<li>${inline(i)}</li>`).join('')}</ul></section>`;
    if (b.type === 'entries') return `<section><h2>${esc(b.title)}</h2>${(b.items || []).map((e) => `<div class="resume-entry"><h3>${inline(e.h)}</h3>${e.p ? `<p>${inline(e.p)}</p>` : ''}${e.quote ? `<p class="resume-quote">${inline(e.quote)}</p>` : ''}</div>`).join('')}</section>`;
    return '';
  }).join('\n');

  body.push(`<section class="paper section" style="--chapter-accent:${esc(ch.accent)}">
  <div class="shell shell--wide">
    <div class="resume-tools">
      <button class="btn btn--solid" type="button" data-print>打印 / 导出 PDF</button>
      <span class="u-meta">${esc(resumes.note)}</span>
    </div>
    <div class="resume-tabs" role="tablist" aria-label="简历版本">
      ${resumes.variants.map((v, i) => `<button class="resume-tab" type="button" role="tab" data-resume-tab="${esc(v.id)}" aria-selected="${i === 0}" aria-controls="resume-${esc(v.id)}" id="tab-${esc(v.id)}" tabindex="${i === 0 ? '0' : '-1'}"><b>${esc(v.code)}</b><span>${esc(v.label)}</span></button>`).join('\n      ')}
    </div>
    ${resumes.variants.map((v, i) => `<div class="resume-panel" role="tabpanel" data-resume-panel="${esc(v.id)}" id="resume-${esc(v.id)}" aria-labelledby="tab-${esc(v.id)}" tabindex="0"${i === 0 ? '' : ' hidden'}>
      <div class="resume-sheet">
        <header class="resume-sheet__head">
          <h2 class="resume-sheet__title">${esc(v.title)}</h2>
          <p class="resume-sheet__target">求职意向：${esc(v.target)}</p>
          <p class="resume-sheet__meta">${v.meta.map((m) => esc(m)).join('　|　')}</p>
          <p class="resume-sheet__contact">${esc(v.contact)}</p>
        </header>
        ${renderBlocks(v.blocks)}
      </div>
    </div>`).join('\n    ')}
  </div>
</section>`);

  return page({
    title: '简历 · 沈亦菲 · FeyFey',
    desc: '三版简历：Agent 应用与工作流 / AI 产品经理与解决方案 / 生成式 AI 与 NLP。可直接打印为 PDF。',
    path: '/resume/', active: '/resume/', accent: ch.accent, body: body.join('\n')
  });
}

/* ---------- 404 ---------- */
function build404() {
  const ch = site.chapters.home;
  return page({
    title: '页面未找到 · 沈亦菲 · FeyFey',
    desc: '这个地址没有对应的页面。',
    path: '/404.html', active: '', accent: ch.accent,
    body: scene(`
  <div class="shell shell--wide" style="text-align:center;padding-block:clamp(60px,10vw,150px)">
    <div class="hero__eyebrow">404</div>
    <h1 class="hero__name" style="font-size:var(--size-display-l)">这条巷子没有通向作品</h1>
    <p class="hero__lead" style="margin-inline:auto">地址可能改过，或者链接多敲了一个字。</p>
    <div class="hero__cta" style="justify-content:center">
      <a class="btn btn--primary" href="/">回首页${ARROW}</a>
      <a class="btn btn--ghost" href="/projects/">看项目</a>
    </div>
  </div>`, { compact: true, horizon: 50, contours: [{ cls: 'mid', d: ch.contour, style: 'left:20%;top:10%;width:60%;height:60%' }] })
  });
}

/* ---------- 输出 ---------- */
function write(rel, content) {
  const p = join(DIST, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

/* 设计令牌：单一来源 = data/site.json */
function tokensCSS() {
  const p = site.palette, t = site.type;
  return `:root{
  --font-display: ${t.displayStack};
  --font-ui: ${t.uiStack};
  --font-mono: ${t.monoStack};
  --scene-ground: ${p.sceneGround};
  --scene-ground-lift: ${p.sceneGroundLift};
  --paper: ${p.surfaceReading};
  --paper-alt: ${p.surfaceReadingAlt};
  --ink-primary: ${p.inkPrimary};
  --ink-secondary: ${p.inkSecondary};
  --ink-tertiary: ${p.inkTertiary};
  --material-highlight: ${p.materialHighlight};
  --focus-ring: ${p.focusRing};
  --rule: color-mix(in srgb, ${p.inkPrimary} 13%, transparent);
  --rule-strong: color-mix(in srgb, ${p.inkPrimary} 24%, transparent);
  --measure: 40em;
  --gutter: clamp(22px, 4.4vw, 72px);
  --shell-max: 1320px;
  --shell-max-wide: 1480px;
  --size-display-xl: clamp(3rem, 7vw, 7rem);
  --size-display-l: clamp(2.3rem, 4.4vw, 4.1rem);
  --size-display-m: clamp(1.8rem, 2.7vw, 2.5rem);
  --size-display-s: clamp(1.3rem, 1.8vw, 1.6rem);
  --size-lede: clamp(1.02rem, 1.25vw, 1.22rem);
}`;
}

if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

/* CSS + JS */
const css = readFileSync(join(ROOT, 'src', 'styles.css'), 'utf8').replace('/*__TOKENS__*/', tokensCSS());
write('assets/css/styles.css', css);
write('assets/js/site.js', readFileSync(join(ROOT, 'src', 'site.js'), 'utf8'));

/* 资源：证件照三态（原始 / 3:4 / 1:1）与静态资源 */
for (const f of ['portrait-3x4.jpg', 'portrait-1x1.jpg']) {
  cpSync(join(ROOT, 'assets', f), join(DIST, 'assets', f));
}
cpSync(join(ROOT, 'assets', 'src'), join(DIST, 'assets', 'src'), { recursive: true });

/* 数据 JSON —— 内容 API，随站点一起发布 */
for (const f of ['site.json', 'projects.json', 'papers.json', 'awards.json', 'profile.json', 'resumes.json']) {
  write(`data/${f}`, readFileSync(join(ROOT, 'data', f), 'utf8'));
}

/* 合并版 JSON */
write('portfolio.json', JSON.stringify({
  meta: { ...site.meta, origin: ORIGIN, generated: new Date().toISOString() },
  identity: site.identity,
  chapters: site.chapters,
  contact: site.contact,
  media: site.media,
  assets: site.assets,
  tracks: profile.tracks,
  statement: profile.statement,
  education: profile.education,
  timeline: profile.timeline,
  skills: profile.skills,
  base: profile.base,
  method: profile.method,
  projects: projectsData.projects,
  papers: papersData.papers,
  awards: awardsData,
  resumes: resumes.variants
}, null, 2));

/* 页面 */
write('index.html', buildHome());
write('projects/index.html', buildProjects());
for (const p of projects) write(`projects/${p.slug}/index.html`, buildProject(p));
write('papers/index.html', buildPapers());
write('awards/index.html', buildAwards());
write('about/index.html', buildAbout());
write('resume/index.html', buildResume());
write('404.html', build404());

/* Cloudflare Pages 产物 */
write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=0, must-revalidate
  Access-Control-Allow-Origin: *

/portfolio.json
  Cache-Control: public, max-age=0, must-revalidate
  Access-Control-Allow-Origin: *
`);

write('_redirects', `/resume.pdf /resume/ 301
/project/* /projects/:splat 301
/projects /projects/ 301
/papers /papers/ 301
/awards /awards/ 301
/about /about/ 301
`);

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

const urls = ['/', '/projects/', ...projects.map((p) => `/projects/${p.slug}/`), '/papers/', '/awards/', '/about/', '/resume/'];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')}
</urlset>
`);

console.log(`✓ 构建完成 → ${DIST}`);
console.log(`  页面：${urls.length + 2} ｜ 项目详情：${projects.length} ｜ 数据文件：6 + portfolio.json`);
console.log(`  站点地址基准：${ORIGIN}`);
