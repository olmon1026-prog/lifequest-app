import { BUILDINGS, buildingRect, pointBlocked, routeWaypoints, rng } from '../src/world/layout.js';
const CORE_MARGIN = 4, STEP = 1.5;
const backRects = BUILDINGS.filter(b => !b.front).map(b => ({ s: b.sprite, ...buildingRect(b) }));
const depthAt = (x, y) => { for (const r of backRects) { const d = Math.min(x - r.x0, r.x1 - x, y - r.y0, r.y1 - y); if (d > 0) return { s: r.s, d }; } return null; };

const rnd = rng(1234), bad = [];
let maxRatio = 0, pairs = 0;
const free = () => { for (;;) { const p = { x: 10 + rnd() * 800, y: 190 + rnd() * 450 }; if (!depthAt(p.x, p.y)) return p; } };

for (let i = 0; i < 20000; i++) {
  const A = free(), B = free();
  const pts = [A, ...routeWaypoints(A.x, A.y, B.x, B.y)];
  let len = 0; pairs++;
  for (let k = 1; k < pts.length; k++) {
    const [p, q] = [pts[k - 1], pts[k]], d = Math.hypot(q.x - p.x, q.y - p.y); len += d;
    const n = Math.max(1, Math.ceil(d / STEP));
    for (let j = 0; j <= n; j++) {
      const x = p.x + (q.x - p.x) * j / n, y = p.y + (q.y - p.y) * j / n, h = depthAt(x, y);
      if (h && h.d > CORE_MARGIN) { if (bad.length < 10) bad.push(`(${A.x|0},${A.y|0})→(${B.x|0},${B.y|0}) @(${x|0},${y|0}) في ${h.s} عمق ${h.d.toFixed(1)}`); break; }
    }
  }
  const straight = Math.hypot(B.x - A.x, B.y - A.y);
  if (straight > 100) maxRatio = Math.max(maxRatio, len / straight);
}
console.log(`pairs=${pairs} maxDetourRatio=${maxRatio.toFixed(2)} (للمراجعة)`);
if (bad.length) { console.log('✗ عبور بصمة خلفية:'); bad.forEach(b => console.log('  -', b)); process.exit(1); }
console.log('✓ fuzz');
