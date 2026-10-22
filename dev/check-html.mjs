/* 诊断：扫描生成 HTML 的标签配对，输出未闭合 / 错位的标签 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const html = readFileSync(file, 'utf8');
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'stop', 'use']);

const stack = [];
const problems = [];
const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
let m;
while ((m = re.exec(html)) !== null) {
  const [full, slash, tag, attrs, selfClose] = m;
  const lower = tag.toLowerCase();
  if (VOID.has(lower) || selfClose === '/') continue;
  if (slash === '/') {
    const idx = stack.map((s) => s.tag).lastIndexOf(lower);
    if (idx === -1) {
      problems.push(`多余的 </${lower}>  @ ${m.index}`);
    } else {
      if (idx !== stack.length - 1) {
        const unclosed = stack.slice(idx + 1).map((s) => `<${s.tag}> @${s.pos}`).join(', ');
        problems.push(`</${lower}> @${m.index} 关闭时仍打开着: ${unclosed}`);
      }
      stack.length = idx;
    }
  } else {
    if (lower === 'a' && stack.some((s) => s.tag === 'a')) {
      problems.push(`嵌套 <a>（链接套链接，HTML 不允许）@${m.index}  ${JSON.stringify(full.slice(0, 80))}`);
    }
    stack.push({ tag: lower, pos: m.index, text: full.slice(0, 90) });
  }
}
if (stack.length) {
  problems.push(`文件结束时仍未关闭 (${stack.length}):`);
  for (const s of stack.slice(0, 12)) problems.push(`  <${s.tag}> @${s.pos}  ${JSON.stringify(s.text)}`);
}
console.log(problems.length ? problems.join('\n') : '标签配对正常 ✅');
