// التواريخ نصوص محلية YYYY-MM-DD بلا تحويل UTC (D-010). الأسبوع يبدأ السبت افتراضيًا.
export function todayStr(d = new Date()) {
  return toStr(d);
}
export function toStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}
// بداية الأسبوع المحتوي للتاريخ s. weekStart: 0=أحد..6=سبت (الافتراضي 6)
export function weekStartOf(s, weekStart = 6) {
  const d = parseDate(s);
  const diff = (d.getDay() - weekStart + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toStr(d);
}
export function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseDate(s);
  return toStr(d) === s;
}
export function isValidTime(s) {
  if (s === null || s === undefined) return true;
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(':').map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}
// الاختيارات السريعة للموعد (dates سريعة)
export function quickDate(kind, today, weekStart = 6) {
  switch (kind) {
    case 'today': return today;
    case 'tomorrow': return addDays(today, 1);
    case 'weekEnd': { // نهاية الأسبوع = الجمعة (آخر يوم قبل بداية الأسبوع الجديد)
      const ws = weekStartOf(today, weekStart);
      return addDays(ws, 6);
    }
    case 'nextWeek': {
      const ws = weekStartOf(today, weekStart);
      return addDays(ws, 7);
    }
    case 'none': return null;
    default: return null;
  }
}
const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function dayName(s) { return AR_DAYS[parseDate(s).getDay()]; }
export function monthName(y, m) { return AR_MONTHS[m - 1]; }
export function fmtDateAr(s) {
  const d = parseDate(s);
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}
// أرقام عربية للعرض
export function arNum(n) {
  return String(n).replace(/[0-9]/g, c => '٠١٢٣٤٥٦٧٨٩'[+c]);
}
