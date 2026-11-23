// التحقق من صيغة lifequest-plan الإصدار 1 (file-format §8أ + §8ج)
import { isValidDate, isValidTime, weekStartOf } from './dates.js';

export const TYPES = ['goal_year', 'goal_month', 'goal_week', 'project', 'stage', 'task', 'subtask'];
const SUPPORTED_SCHEMA = [1];
const LIMITS = { fileBytes: 2 * 1024 * 1024, items: 2000, depth: 6 };

export function validatePlan(text) {
  const errors = [], warnings = [];
  let data;
  try { data = JSON.parse(text); }
  catch { return { ok: false, errors: [{ code: 'E001', msg: 'الملف مش JSON صالح. تأكد إنه نص JSON كامل.' }], warnings }; }

  if (data.format !== 'lifequest-plan') {
    return { ok: false, errors: [{ code: 'E002', msg: 'صيغة الملف غير معروفة (المطلوب lifequest-plan).' }], warnings };
  }
  if (!Number.isInteger(data.schemaVersion)) {
    errors.push({ code: 'E002', msg: 'رقم إصدار الصيغة ناقص.' });
  } else if (!SUPPORTED_SCHEMA.includes(data.schemaVersion)) {
    if (data.schemaVersion > Math.max(...SUPPORTED_SCHEMA)) {
      return { ok: false, errors: [{ code: 'E003', msg: 'الملف بصيغة أحدث من التطبيق. حدّث التطبيق أولًا.' }], warnings };
    }
  }
  const plan = data.plan;
  if (!plan || !plan.id || !plan.title) {
    errors.push({ code: 'E004', msg: 'بيانات الخطة ناقصة: plan.id و plan.title مطلوبان.' });
  } else if (!/^[A-Za-z0-9_-]{3,64}$/.test(plan.id)) {
    errors.push({ code: 'E004', msg: 'معرّف الخطة لازم يكون 3–64 حرف أو رقم أو - أو _.' });
  }
  const items = data.items;
  if (!Array.isArray(items)) {
    errors.push({ code: 'E010', msg: 'قائمة العناصر items ناقصة.' });
    return { ok: false, errors, warnings };
  }
  if (items.length > LIMITS.items) {
    errors.push({ code: 'E019', msg: `عدد العناصر أكبر من الحد (${LIMITS.items}).` });
  }

  const seen = new Set();
  const byId = new Map();
  for (const [i, it] of items.entries()) {
    const where = `عنصر رقم ${i + 1}`;
    if (!it || typeof it !== 'object') { errors.push({ code: 'E010', msg: `${where}: مش كائن صالح.` }); continue; }
    if (!it.id) { errors.push({ code: 'E010', msg: `${where}: المعرّف id ناقص.` }); continue; }
    if (seen.has(it.id)) { errors.push({ code: 'E010', msg: `المعرّف "${it.id}" مكرر.` }); continue; }
    seen.add(it.id); byId.set(it.id, it);
    if (!TYPES.includes(it.type)) errors.push({ code: 'E011', msg: `"${it.id}": نوع غير معروف (${it.type}).` });
    if (!it.title || String(it.title).trim() === '' || String(it.title).length > 120)
      errors.push({ code: 'E012', msg: `"${it.id}": العنوان فارغ أو أطول من 120 حرف.` });
    if (it.notes && String(it.notes).length > 2000) errors.push({ code: 'E012', msg: `"${it.id}": الملاحظات أطول من 2000 حرف.` });
    if (it.priority !== undefined && ![1, 2, 3].includes(it.priority))
      errors.push({ code: 'E015', msg: `"${it.id}": الأولوية لازم تكون 1 أو 2 أو 3.` });
    if (it.status !== undefined && !['todo', 'doing', 'done'].includes(it.status))
      errors.push({ code: 'E011', msg: `"${it.id}": حالة غير معروفة (${it.status}).` });
    if (it.due !== undefined && it.due !== null) {
      if (!it.due.date || !isValidDate(it.due.date)) errors.push({ code: 'E016', msg: `"${it.id}": تاريخ الموعد بصيغة غلط (YYYY-MM-DD).` });
      else if (!isValidTime(it.due.time)) errors.push({ code: 'E016', msg: `"${it.id}": وقت الموعد بصيغة غلط (HH:MM).` });
    }
    if (it.type === 'subtask') {
      const p = it.parentId ? byId.get(it.parentId) || items.find(x => x.id === it.parentId) : null;
      if (!it.parentId || !p || !['task', 'subtask'].includes(p.type))
        errors.push({ code: 'E018', msg: `"${it.id}": الفرعية لازم يكون لها أب مهمة أو فرعية.` });
    }
    if (['goal_year', 'goal_month', 'goal_week'].includes(it.type)) {
      const pr = it.period;
      const okP = pr && (
        (it.type === 'goal_year' && Number.isInteger(pr.year)) ||
        (it.type === 'goal_month' && Number.isInteger(pr.year) && Number.isInteger(pr.month) && pr.month >= 1 && pr.month <= 12) ||
        (it.type === 'goal_week' && pr.weekOf && isValidDate(pr.weekOf))
      );
      if (!okP) errors.push({ code: 'E017', msg: `"${it.id}": period ناقص أو لا يناسب نوع الهدف.` });
    }
    if (it.parentId !== undefined && it.parentId !== null && !byId.has(it.parentId) && !items.some(x => x.id === it.parentId))
      errors.push({ code: 'E013', msg: `"${it.id}": الأب parentId غير موجود في الملف.` });
  }
  // دورات
  for (const it of items) {
    let cur = it, guard = new Set([it.id]), depth = 0;
    while (cur && cur.parentId) {
      if (guard.has(cur.parentId)) { errors.push({ code: 'E014', msg: `"${it.id}": دورة أب/ابن.` }); break; }
      guard.add(cur.parentId);
      cur = byId.get(cur.parentId);
      if (++depth > LIMITS.depth) { errors.push({ code: 'E019', msg: `"${it.id}": عمق الشجرة أكبر من ${LIMITS.depth}.` }); break; }
    }
  }
  return { ok: errors.length === 0, errors, warnings, plan, items };
}

// تحويل عناصر الملف لصيغة قاعدة البيانات (period → key)
export function normalizeItems(items, planId, weekStart = 6) {
  const now = Date.now();
  return items.map(it => {
    const out = {
      id: null, // يُملأ بـ UUID عند الإدراج
      type: it.type,
      title: String(it.title).slice(0, 120),
      notes: it.notes ? String(it.notes).slice(0, 2000) : '',
      parentId: null, // يُحل من معرفات الملف
      status: it.status || 'todo',
      priority: it.priority || 1,
      due: it.due ? { date: it.due.date, time: it.due.time || null } : null,
      period: null,
      exercise: it.exercise || 'auto',
      area: it.area || null,
      order: 0,
      createdAt: now, updatedAt: now,
      completedAt: it.status === 'done' ? now : null,
      archivedAt: null,
      source: { planId, itemId: it.id },
      _fileParentId: it.parentId || null, // معرف الأب داخل الملف، يُحل عند الإدراج ثم يُحذف
    };
    if (it.type === 'goal_year') out.period = { kind: 'year', key: String(it.period.year) };
    if (it.type === 'goal_month') out.period = { kind: 'month', key: `${it.period.year}-${String(it.period.month).padStart(2, '0')}` };
    if (it.type === 'goal_week') out.period = { kind: 'week', key: weekStartOf(it.period.weekOf, weekStart) };
    return out;
  });
}
