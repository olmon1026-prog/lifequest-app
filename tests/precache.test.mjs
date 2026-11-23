// يتأكد أن كل ملف في src/ و assets/ موجود في قائمة FILES داخل sw.js (constraints §13)
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const m = sw.match(/const FILES = \[([\s\S]*?)\];/);
assert.ok(m, 'FILES list not found in sw.js');
const listed = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);

function walk(dir, base = '') {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p, base + f + '/'));
    else out.push(base + f);
  }
  return out;
}
const root = new URL('..', import.meta.url).pathname;
const onDisk = [...walk(root + 'src', 'src/'), ...walk(root + 'assets', 'assets/')];
const missing = onDisk.filter(f => !listed.includes(f));
assert.deepEqual(missing, [], 'ملفات غير مدرجة في sw.js FILES: ' + missing.join(', '));
for (const f of listed) statSync(root + f); // كل مدرج موجود فعلًا
console.log('✓ precache: كل ملفات src/ و assets/ مدرجة وكل المدرج موجود');
