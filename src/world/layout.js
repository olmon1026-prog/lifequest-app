// هندسة مشهد «قرية القمر» — بلا DOM حتى تُختبر بـ Node. أبعاد منطقية 390×640.
// المرجع: ملف القصة §4 «المشهد الحالي»: جرف يسار، بحر يعكس القمر، منارة على جرف يمين،
// قرية على منحدر، طريق متعرج يتوهج بالعنبر حتى موضع سامي، يراعات، شجرة كرز، ٣ بيوت مؤقتة.
export const W = 390, H = 640;

// خطوط المشهد الأفقية
export const SKY_H = 225;      // نهاية السماء عند خط الأفق
export const SEA_TOP = 225;    // بداية البحر
export const SHORE = 340;      // خط الشاطئ الأساسي (تتموج حوله الأرض)
export const GROUND_TOP = 300; // أعلى نقطة في الأرض (عند قاعدة جرف المنارة)

// الجرفان
export const LEFT_CLIFF = { top: 168, right: 74, base: 320 };
export const RIGHT_CLIFF = { left: 302, top: 196, base: 348 };
export const LIGHTHOUSE = { x: 346, baseY: 198 }; // قاعدة البرج على هضبة الجرف الأيمن
export const MOON = { x: 96, y: 78, r: 34 };      // القمر فوق البحر يسارًا لينعكس على الماء

// القرية على المنحدر: بيوت بارتفاعات متدرجة (x, y = قاعدة البيت)
export const VILLAGE_HOUSES = [
  { x: 108, y: 462, w: 44, roof: 'gable', tone: 0, lit: true },
  { x: 168, y: 440, w: 40, roof: 'shed',  tone: 1, lit: false },
  { x: 218, y: 470, w: 48, roof: 'gable', tone: 2, lit: true },
  { x: 262, y: 424, w: 38, roof: 'gable', tone: 0, lit: true },
  { x: 140, y: 512, w: 52, roof: 'hip',   tone: 1, lit: false },
];

// بيت سامي (وجهة «البيت») وبيت مهجور (الفصل الأول)
export const SAMI_HOUSE = { x: 96, y: 548, w: 46 };
export const ABANDONED_HOUSE = { x: 236, y: 512, w: 42 };

// شجرة الكرز على هضبة المقدمة
export const CHERRY_TREE = { x: 52, y: 596, scale: 1.25 };

// الوجهات — القرار المعتمد (الخيار الثالث): الصحة→الشاطئ، التعلم→المنارة،
// العمل→الورشة، البيت→بيت سامي، المال→السوق. spot = نقطة نشاط سامي.
export const DESTINATIONS = [
  { id: 'health',   name: 'الشاطئ',   kind: 'beach',      x: 132, y: 372, spot: { x: 132, y: 386 } },
  { id: 'learning', name: 'المنارة',  kind: 'lighthouse', x: 346, y: 208, spot: { x: 312, y: 226 } },
  { id: 'work',     name: 'الورشة',   kind: 'workshop',   x: 286, y: 452, spot: { x: 278, y: 468 } },
  { id: 'home',     name: 'بيت سامي', kind: 'house',      x: 96,  y: 548, spot: { x: 118, y: 560 } },
  { id: 'money',    name: 'السوق',    kind: 'market',     x: 176, y: 470, spot: { x: 176, y: 486 } },
];

// نقاط الروتين اليومي (محرك الحياة)
export const SPOTS = {
  door:      { x: 118, y: 560 },  // باب بيت سامي
  square:    { x: 190, y: 478 },  // ساحة القرية
  beach:     { x: 132, y: 386 },
  lighthouse:{ x: 322, y: 214 },
  tree:      { x: 66,  y: 590 },  // تحت شجرة الكرز
  overlook:  { x: 268, y: 380 },  // مطل على البحر أعلى المنحدر
};

// الطريق المتعرج من مدخل القرية (أسفل) حتى قاعدة المنارة (أعلى) — t من 0 إلى 1
const PATH_POINTS = [
  { x: 250, y: 634 }, { x: 168, y: 600 }, { x: 236, y: 552 },
  { x: 150, y: 508 }, { x: 210, y: 470 }, { x: 190, y: 432 },
  { x: 252, y: 398 }, { x: 238, y: 352 }, { x: 296, y: 306 },
  { x: 314, y: 262 }, { x: 312, y: 228 },
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

// تقدم الوجهة: مهام (غير مؤرشفة) مرتبطة بالمجال، منجز/الكل
export function destinationProgress(items, areaId) {
  const linked = items.filter(i => !i.archivedAt && i.area === areaId &&
    ['task', 'subtask', 'project', 'stage'].includes(i.type));
  if (!linked.length) return { done: 0, total: 0, ratio: null };
  const done = linked.filter(i => i.status === 'done').length;
  return { done, total: linked.length, ratio: done / linked.length };
}

// موضع البطل على المسار من التقدم العام (نهاية التوهج العنبري = التقدم الحقيقي)
export function heroT(items) {
  const active = items.filter(i => !i.archivedAt && ['task', 'subtask'].includes(i.type));
  if (!active.length) return 0.06;
  const done = active.filter(i => i.status === 'done').length;
  return 0.06 + 0.88 * (done / active.length);
}

// حالة الوجهة: مكتمل / جارٍ / مغلق (لا مهام مرتبطة)
export function destinationState(p) {
  if (p.ratio === null) return { key: 'locked', label: 'مغلق' };
  if (p.ratio >= 1) return { key: 'done', label: 'مكتمل' };
  return { key: 'open', label: 'جارٍ' };
}

// مولد أرقام شبه عشوائية حتمي (نفس البذرة = نفس الخريطة)
export function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// نجوم ثابتة من seed
export function stars(seed = 7, count = 64) {
  const rnd = rng(seed);
  return Array.from({ length: count }, () => ({
    x: rnd() * W, y: rnd() * (SKY_H - 14), r: rnd() < 0.82 ? 1 : 2, o: 0.35 + rnd() * 0.65,
    spark: rnd() < 0.08, // نجوم لامعة بشكل صليب
  }));
}

// يراعات ثابتة البذور حول الشجرة والقرية (تتحرك بالوقت في العارض)
export function fireflies(seed = 21, count = 14) {
  const rnd = rng(seed);
  return Array.from({ length: count }, () => ({
    cx: 30 + rnd() * 240, cy: 420 + rnd() * 190,
    r: 6 + rnd() * 18, speed: 0.4 + rnd() * 0.9, phase: rnd() * 7,
  }));
}
