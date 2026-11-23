// XP مشتق من سجل الأحداث (D-006) + سقف يومي 300 للمهام/الفرعية (المكافآت خارج السقف).
export const XP_VALUES = { task: { 1: 10, 2: 20, 3: 30 }, subtask: 5 };
export const BONUS = { stage: 25, project: 50, goal_week: 50, goal_month: 100, goal_year: 250 };
export const DAILY_CAP = 300;

export function xpForComplete(item) {
  if (item.type === 'subtask') return XP_VALUES.subtask;
  if (item.type === 'task') return XP_VALUES.task[item.priority || 1] || 10;
  return BONUS[item.type] || 0;
}

// مجموع XP من سجل الأحداث (المكافآت bonus لا تخضع للسقف، complete/uncomplete للمهام والفرعية تخضع)
export function totalXP(events) {
  // طبّق السقف اليومي على complete/uncomplete غير bonus
  const byDay = new Map();
  let sum = 0;
  const sorted = [...events].sort((a, b) => a.ts - b.ts);
  for (const ev of sorted) {
    if (ev.kind === 'bonus') { sum += ev.xp; continue; }
    const day = ev.day;
    if (!byDay.has(day)) byDay.set(day, 0);
    let daySum = byDay.get(day);
    let v = ev.xp;
    if (v > 0) {
      const room = Math.max(0, DAILY_CAP - daySum);
      v = Math.min(v, room);
    }
    daySum += v;
    byDay.set(day, daySum);
    sum += v;
  }
  return Math.max(0, sum);
}

// المستوى: الحد التراكمي للوصول إلى L هو 50×L×(L−1)
export function levelFor(xp) {
  let L = 1;
  while (50 * (L + 1) * L <= xp) L++;
  return L;
}
export function levelProgress(xp) {
  const L = levelFor(xp);
  const base = 50 * L * (L - 1);
  const next = 50 * (L + 1) * L;
  return { level: L, base, next, inLevel: xp - base, span: next - base };
}
export function levelTitle(L) {
  if (L >= 10) return 'محترف';
  if (L >= 5) return 'منتظم';
  return 'مبتدئ';
}
