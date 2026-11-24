// هندسة عالم «قرية القمر» — بلا DOM حتى تُختبر بـ Node.
// العالم 820×640 (أوسع من ضعف الشاشة): الشاشة نافذة 390×640 بكاميرا تتبع سامي.
// التوزيع (ملف القصة §4): غربًا مدخل الغابة والشاطئ، وسطًا القرية على المنحدر، شرقًا جرف المنارة.
export const W = 820, H = 640;        // حجم العالم
export const VIEW_W = 390, VIEW_H = 640; // نافذة العرض

export const SKY_H = 200;
export const SEA_TOP = 200;
export const SHORE = 330;             // خط الشاطئ الأساسي

export const LEFT_CLIFF = { top: 170, right: 66, base: 320 }; // جرف صغير غربي عند المدخل
export const RIGHT_CLIFF = { left: 636, top: 186, base: 352 };
export const LIGHTHOUSE = { x: 736, baseY: 190 };
export const MOON = { x: 120, y: 72, r: 34 };

// القرية على شارعين مخططين: صف شمالي أبوابه على الشارع، وصف جنوبي فيه
// البيت الحجري الكبير وبيت سامي والمهجور. كل مبنى أصل مولّد مختلف التصميم
// (قاعدة SLYNYRD: منظور واحد يوحّد المشهد؛ المباني متصلة بالأرض ببقعة مهترئة).
// smoke = [إزاحة المدخنة من المركز ×w، ارتفاعها ×الارتفاع] لدخان حي.
export const BUILDINGS = [
  // الصف الشمالي: أبوابها على الشارع من الجنوب (طبقة خلفية)
  { sprite: 'stone',     x: 60,  y: 545, w: 110 },
  { sprite: 'housea',    x: 215, y: 514, w: 140, smoke: [ 0.26, -0.80] },
  { sprite: 'sami',      x: 390, y: 512, w: 160, smoke: [ 0.27, -0.78] },
  { sprite: 'workshop',  x: 560, y: 484, w: 140, smoke: [ 0.30, -0.86] },
  // الصف الجنوبي: قصيرة لا تتجاوز الطريق (طبقة أمامية)
  { sprite: 'market',    x: 170, y: 640, w: 66,  front: true },
  { sprite: 'houseb',    x: 520, y: 614, w: 90,  front: true },
  { sprite: 'ruined',    x: 620, y: 618, w: 110, front: true },
  { sprite: 'beachhut',  x: 132, y: 372, w: 100 },
];

// صخور مولّدة على وجهي الجرفين
export const ROCK_SPOTS = [
  { x: 30,  y: 268, w: 66 }, { x: 56, y: 200, w: 48 },          // الجرف الغربي
  { x: 706, y: 340, w: 44 }, { x: 782, y: 316, w: 96 },         // جرف المنارة (بعيدًا عن السلم)
];

export const SAMI_HOUSE = { x: 390, y: 512, w: 160 };
export const SAMI_DOOR = { x: 390, y: 514 };            // نقطة وقوف سامي أمام الباب
export const SAMI_DOORWAY = { x: 390, y: 505, w: 32, h: 55 }; // فتحة الباب (احتياطي كودي)
export const CHERRY_TREE = { x: 76, y: 584, scale: 1.5 };

// الغابة غربًا (ظلال مقدمة للفصل ٤)
export const FOREST_EDGE = 70;

// الوجهات — الخيار الثالث المعتمد. spot = نقطة نشاط سامي.
export const DESTINATIONS = [
  { id: 'health',   name: 'الشاطئ',   kind: 'beach',      x: 132, y: 372, spot: { x: 140, y: 392 } },
  { id: 'learning', name: 'المنارة',  kind: 'lighthouse', x: 736, y: 200, spot: { x: 730, y: 204 } },
  { id: 'work',     name: 'الورشة',   kind: 'workshop',   x: 560, y: 484, spot: { x: 560, y: 506 } },
  { id: 'home',     name: 'بيت سامي', kind: 'house',      x: 390, y: 512, spot: { x: 424, y: 524 } },
  { id: 'money',    name: 'السوق',    kind: 'market',     x: 170, y: 640, spot: { x: 170, y: 602 } },
];

// نقاط الروتين اليومي
export const SPOTS = {
  door:      { x: 424, y: 524 },
  square:    { x: 322, y: 540 },
  beach:     { x: 140, y: 392 },
  lighthouse:{ x: 730, y: 204 },
  tree:      { x: 96,  y: 596 },
  overlook:  { x: 620, y: 398 },
};

// الطريق الرئيسي: من مدخل الغابة غربًا عبر القرية حتى قاعدة المنارة شرقًا — t من 0 إلى 1
const PATH_POINTS = [
  { x: 16,  y: 634 }, { x: 90,  y: 590 }, { x: 180, y: 560 },
  { x: 268, y: 548 }, { x: 350, y: 540 }, { x: 414, y: 522 },
  { x: 470, y: 496 }, { x: 585, y: 492 }, { x: 645, y: 430 },
  { x: 665, y: 350 }, { x: 680, y: 290 }, { x: 712, y: 230 },
  { x: 734, y: 196 },
];

// Catmull-Rom ناعم عبر نقاط الطريق
export function pathPoint(t) {
  const pts = PATH_POINTS;
  const n = pts.length - 1;
  const f = Math.min(0.99999, Math.max(0, t)) * n;
  const i = Math.floor(f), u = f - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[Math.min(n, i + 1)], p3 = pts[Math.min(n, i + 2)];
  const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return { x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) };
}

// أقرب t على الطريق لنقطة (لتحريك سامي على الطريق من أي موضع)
export function nearestPathT(x, y) {
  let best = 0, bd = 1e9;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const p = pathPoint(t);
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

// الكاميرا: تتبع هدفًا مع بقاء النافذة داخل العالم
export function cameraFor(targetX, vw = VIEW_W) {
  return Math.max(0, Math.min(W - vw, targetX - vw / 2));
}

export function destinationProgress(items, areaId) {
  const linked = items.filter(i => !i.archivedAt && i.area === areaId &&
    ['task', 'subtask', 'project', 'stage'].includes(i.type));
  if (!linked.length) return { done: 0, total: 0, ratio: null };
  const done = linked.filter(i => i.status === 'done').length;
  return { done, total: linked.length, ratio: done / linked.length };
}

// موضع التقدم الحقيقي على الطريق (نهاية التوهج العنبري)
export function heroT(items) {
  const active = items.filter(i => !i.archivedAt && ['task', 'subtask'].includes(i.type));
  if (!active.length) return 0.06;
  const done = active.filter(i => i.status === 'done').length;
  return 0.06 + 0.88 * (done / active.length);
}

export function destinationState(p) {
  if (p.ratio === null) return { key: 'locked', label: 'مغلق' };
  if (p.ratio >= 1) return { key: 'done', label: 'مكتمل' };
  return { key: 'open', label: 'جارٍ' };
}

export function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function stars(seed = 7, count = 110) {
  const rnd = rng(seed);
  return Array.from({ length: count }, () => ({
    x: rnd() * W, y: rnd() * (SKY_H - 14), r: rnd() < 0.82 ? 1 : 2, o: 0.35 + rnd() * 0.65,
    spark: rnd() < 0.08,
  }));
}

export function fireflies(seed = 21, count = 16) {
  const rnd = rng(seed);
  return Array.from({ length: count }, () => ({
    cx: 20 + rnd() * 560, cy: 420 + rnd() * 190,
    r: 6 + rnd() * 18, speed: 0.4 + rnd() * 0.9, phase: rnd() * 7,
  }));
}
