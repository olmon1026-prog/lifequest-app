// هندسة المشهد: بلا DOM حتى تُختبر بـ Node. أبعاد منطقية 390×640.
export const W = 390, H = 640;

// خط أفق البحر والرمال
export const SEA_TOP = 300;
export const SAND_TOP = 430;

// الوجهات (states.json): صحة←شاطئ، تعلم←منارة، شغل←ورشة، بيت←منزل، فلوس←سوق
// x,y = نقطة قاعدة المبنى على الرمال. labelX/labelY = موضع اللافتة.
export const DESTINATIONS = [
  { id: 'learning', name: 'بيت التعلّم', kind: 'lighthouse', x: 60,  y: 470 },
  { id: 'work',     name: 'بيت العمل',   kind: 'workshop',   x: 320, y: 490 },
  { id: 'health',   name: 'بيت الصحة',   kind: 'beach',      x: 55,  y: 585 },
  { id: 'home',     name: 'البيت',       kind: 'house',      x: 195, y: 555 },
  { id: 'money',    name: 'السوق',       kind: 'market',     x: 325, y: 600 },
];

// مسار متعرج على الرمال من الأسفل للأعلى (t من 0 إلى 1)
export function pathPoint(t) {
  const y = H - 24 - t * (H - 24 - (SAND_TOP + 30));
  const x = W / 2 + Math.sin(t * Math.PI * 2.2) * 70 * (1 - t * 0.55);
  return { x, y };
}

// تقدم الوجهة: مهام (غير مؤرشفة) مرتبطة بالمجال، منجز/الكل
export function destinationProgress(items, areaId) {
  const linked = items.filter(i => !i.archivedAt && i.area === areaId &&
    ['task', 'subtask', 'project', 'stage'].includes(i.type));
  if (!linked.length) return { done: 0, total: 0, ratio: null };
  const done = linked.filter(i => i.status === 'done').length;
  return { done, total: linked.length, ratio: done / linked.length };
}

// موضع البطل على المسار من التقدم العام لمهام الأسبوع الحالي (فتح التطبيق لا يحرّكه: يُحسب مباشرة)
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

// نجوم ثابتة من seed (نفس البيانات تعطي نفس الخريطة)
export function stars(seed = 7, count = 42) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () => ({
    x: rnd() * W, y: rnd() * SEA_TOP - 20, r: 0.6 + rnd() * 1.3, o: 0.4 + rnd() * 0.6,
  }));
}
