import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const src = readFileSync(new URL('../src/world/world.js', import.meta.url), 'utf8');
const must = [
  ['drag slop (3)',              /DRAG_SLOP/],
  ['syncBtns عند الرسم (4)',     /\n\s*syncBtns\(\);/],
  ['touch-action على اللافتات (11)', /pointer-events:auto;cursor:pointer;touch-action:none/],
  ['معالجة resize (6)',          /ResizeObserver|addEventListener\('resize'/],
  ['leaveHome يصفّر enterAt (10)', /function leaveHome[\s\S]{0,700}enterAt\s*=\s*0/],
];
const mustNot = [
  ['القرصة تقرأ كاش الإطار (5)', /wx\s*=\s*engine\.camXi/],
  ['cx القديمة (2)',             /box\.width\s*\/\s*\(2\s*\*\s*scale\)/],
];
for (const [n, re] of must) assert.match(src, re, `ناقص: ${n}`);
for (const [n, re] of mustNot) assert.doesNotMatch(src, re, `موجود: ${n}`);
console.log('✓ world-source-guards');
