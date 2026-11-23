// الاستيراد: دمج أو استبدال (file-format §8د)
import { validatePlan, normalizeItems } from './schema.js';
import { uuid } from './ids.js';

// يبني خطة دمج: ما سيُضاف وما سيُتخطى (موجود بنفس planId+itemId)
export function planMerge(existingItems, fileText, weekStart = 6) {
  const v = validatePlan(fileText);
  if (!v.ok) return { ok: false, errors: v.errors, warnings: v.warnings };
  const planId = v.plan.id;
  const existing = new Map(
    existingItems.filter(i => i.source && i.source.planId === planId)
      .map(i => [i.source.itemId, i])
  );
  const norm = normalizeItems(v.items, planId, weekStart);
  const warnings = [...v.warnings];
  // W003: عنوان بنفس النوع موجود فعلًا في التطبيق (من خطة أخرى أو يدوي)
  const existingSigs = new Map();
  for (const e of existingItems) {
    if (e.archivedAt) continue;
    if (e.source && e.source.planId === planId) continue; // تكرار نفس الخطة يُعالج بالتخطي
    existingSigs.set(`${e.type}|${String(e.title || '').trim()}`, e.id);
  }
  for (const it of norm) {
    const sig = `${it.type}|${String(it.title || '').trim()}`;
    if (existingSigs.has(sig))
      warnings.push({ code: 'W003', msg: `"${it.title}": موجود فعلًا في التطبيق بنفس النوع — تأكد إنه مش تكرار.` });
  }
  const toAdd = [], toSkip = [];
  for (const it of norm) {
    // العنصر الموجود مسبقًا من نفس الخطة يُتخطى (لا ننزّل done أبدًا)
    if (existing.has(it.source.itemId)) toSkip.push(it);
    else toAdd.push(it);
  }
  return {
    ok: true, plan: v.plan, warnings,
    toAdd, toSkip, counts: countByType(toAdd),
    existingCount: existing.size,
  };
}

// خطة استبدال: يحذف عناصر نفس الخطة فقط ويضيف الجديد
export function planReplace(existingItems, fileText, weekStart = 6) {
  const m = planMerge(existingItems, fileText, weekStart);
  if (!m.ok) return m;
  const toDelete = existingItems.filter(i => i.source && i.source.planId === m.plan.id);
  return { ...m, toDelete, deleteCount: toDelete.length };
}

function countByType(items) {
  const c = {};
  for (const it of items) c[it.type] = (c[it.type] || 0) + 1;
  return c;
}

// تحويل العناصر المُطبَّعة لصفوف قاعدة بيانات: UUID جديد + حل parentId من معرفات الملف.
// العناصر التي أباها موجود مسبقًا (متخطى) تُربط بصف الأب الحالي.
export function materialize(toAdd, toSkip, existingItems) {
  const idByFile = new Map(); // معرف الملف → id قاعدة البيانات
  for (const it of toAdd) idByFile.set(it.source.itemId, uuid());
  const existingBySource = new Map(
    existingItems.filter(i => i.source).map(i => [i.source.planId + '/' + i.source.itemId, i])
  );
  const planId = toAdd.length ? toAdd[0].source.planId : (toSkip.length ? toSkip[0].source.planId : null);
  const rows = [];
  for (const it of toAdd) {
    const row = { ...it };
    delete row._fileParentId;
    row.id = idByFile.get(it.source.itemId);
    const fp = it._fileParentId;
    if (fp) {
      if (idByFile.has(fp)) row.parentId = idByFile.get(fp);
      else {
        const ex = existingBySource.get(planId + '/' + fp);
        row.parentId = ex ? ex.id : null;
      }
    }
    rows.push(row);
  }
  return rows;
}
