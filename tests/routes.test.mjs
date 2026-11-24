// تدقيق حتمي لمسارات الحركة المؤلَّفة: كل نقطة مقصودة وكل زوج مرتب منها
// عبر routeWaypoints + أرجل مشهد الوصول المباشرة. الفشل = عبور بصمة مبنى خلفي
// (يُرسم الممثل فوق الواجهة). تقاطع مبنى أمامي = احتجاب مقصود (يُسجَّل ولا يفشل).
import { BUILDINGS, buildingRect, DESTINATIONS, SPOTS, SAMI_DOOR, pathPoint, pointBlocked, routeWaypoints } from '../src/world/layout.js';

const STEP = 1.5;
// buildingRect تقدير محافظ: زواياه تتجاوز الفن الفعلي ببكسلات. قياس عمق الاختراق يفصل
// «قشعريرة زاوية» (موثق بصريًا: لا عبور واجهة — ألفا النقطة ٠ ولقطات توضيحية سليمة)
// عن عبور حقيقي (عمق ≥ هامش). قيِّمت أعمق قشعريرة في المسارات الحالية: ١٫٢ بكسل.
const CORE_MARGIN = 4;
const backRects = BUILDINGS.filter(b => !b.front).map(b => ({ s: b.sprite, ...buildingRect(b) }));
const frontRects = BUILDINGS.filter(b => b.front).map(buildingRect);
const inFront = (x, y) => frontRects.some(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);
const coreDepth = (x, y) => {
  for (const r of backRects) {
    const d = Math.min(x - r.x0, r.x1 - x, y - r.y0, r.y1 - y);
    if (d > 0) return { sprite: r.s, depth: d };
  }
  return null;
};

function sampleSeg(x0, y0, x1, y1, onBack, onFront, onGraze) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(d / STEP));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
    const hit = coreDepth(x, y);
    if (hit && hit.depth > CORE_MARGIN) onBack(x, y, hit);
    else if (hit) onGraze(hit);
    else if (inFront(x, y)) onFront();
  }
}
const segOf = pts => { const out = []; for (let i = 1; i < pts.length; i++) out.push([pts[i - 1], pts[i]]); return out; };

// نقاط مفتاحية: روتين + وجهات + الباب + نقاط مشاهد خاصة
const KEYS = {
  ...Object.fromEntries(Object.entries(SPOTS).map(([k, v]) => [`spot:${k}`, v])),
  ...Object.fromEntries(DESTINATIONS.map(d => [`dest:${d.id}`, d.spot])),
  doorPoint: { x: SAMI_DOOR.x, y: SAMI_DOOR.y },
  arrivalStart: { x: 30, y: 630 },
  firstTaskMid: pathPoint(0.5),
  abandonedSpot: { x: 614, y: 630 },
  notebookSami: { x: SPOTS.tree.x + 10, y: SPOTS.tree.y },
  notebookBondok: { x: SPOTS.tree.x - 22, y: SPOTS.tree.y + 8 },
  restBondok: { x: SAMI_DOOR.x + 4, y: SAMI_DOOR.y + 2 },
  restSami: { x: SAMI_DOOR.x, y: SAMI_DOOR.y + 3 },
  leaveSami: { x: SAMI_DOOR.x + 2, y: SAMI_DOOR.y + 18 },
  leaveBondok: { x: SAMI_DOOR.x + 18, y: SAMI_DOOR.y + 12 },
};

let fails = 0, frontHits = 0, checked = 0;
const grazes = new Set();
const bad = [];
const onBack = tag => (x, y, hit) => { fails++; if (bad.length < 12) bad.push(`${tag} @(${x.toFixed(0)},${y.toFixed(0)}) داخل ${hit.sprite} بعمق ${hit.depth.toFixed(1)}`); };
const onFront = () => { frontHits++; };
const onGraze = hit => { grazes.add(hit.sprite); };

// ١) النقاط نفسها خارج بصمات المباني الخلفية
for (const [name, p] of Object.entries(KEYS)) {
  checked++;
  if (pointBlocked(p.x, p.y)) { fails++; bad.push(`نقطة محجوبة: ${name} @(${p.x},${p.y})`); }
}

// ٢) كل زوج مرتب عبر routeWaypoints (يغطي الروتين، مشاهد الإنجاز، الراحة، الخروج)
const names = Object.keys(KEYS);
for (const a of names) for (const b of names) {
  if (a === b) continue;
  checked++;
  const A = KEYS[a], B = KEYS[b];
  const pts = [{ x: A.x, y: A.y }, ...routeWaypoints(A.x, A.y, B.x, B.y)];
  for (const [p, q] of segOf(pts)) sampleSeg(p.x, p.y, q.x, q.y, onBack(`${a}→${b}`), onFront, onGraze);
}

// ٣) أرجل مشهد الوصول المباشرة (بلا توجيه: (30,630)→pathPoint(0.08)→pathPoint(0.25)→الساحة)
const arrival = [{ x: 30, y: 630 }, pathPoint(0.08), pathPoint(0.25), { x: SPOTS.square.x, y: SPOTS.square.y }];
for (const [p, q] of segOf(arrival)) { checked++; sampleSeg(p.x, p.y, q.x, q.y, onBack('arrival'), onFront, onGraze); }

console.log(`مسارات مدققة: ${checked} | احتكاك زوايا ضمن هامش ${CORE_MARGIN}px (متحقق بصريًا أنه ليس عبورًا): [${[...grazes].join(', ')}] | عينات داخل مبانٍ أمامية (احتجاب مقصود): ${frontHits}`);
if (fails) {
  console.log(`✗ ${fails} عينة تعبر بصمة مبنى خلفي:`);
  for (const b of bad) console.log('  -', b);
  process.exit(1);
}
console.log('✓ كل النقاط والمسارات المؤلفة سالكة (لا عبور لواجهات المباني الخلفية)');
