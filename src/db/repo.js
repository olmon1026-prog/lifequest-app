// العمليات على البيانات: إضافة/تعديل/إنجاز/تراجع/أرشفة/حذف + تسجيل الأحداث والاكتمال المشتق
import { put, del, getOne, bulkWrite } from './db.js';
import { uuid } from '../core/ids.js';
import { todayStr , goalPeriod } from '../core/dates.js';
import { deriveCompletion, hasCycle } from '../core/progress.js';
import { xpForComplete } from '../core/xp.js';
import { validateNewItemParent } from '../core/item-rules.js';
import { store, emit } from '../store.js';

function findItem(id) { return store.state.items.find(i => i.id === id); }

// لقطة ضحلة لكل العناصر — للتراجع الكامل عن تغييرات الذاكرة لو فشلت معاملة الكتابة
// (كانت الذاكرة تُحدَّث قبل نجاح المعاملة فتتباين مع القاعدة عند أي فشل)
function snapshotItems() { return store.state.items.map(i => [i, { ...i }]); }
function rollback(backup, evLen) {
  const keep = new Set(backup.map(([ref]) => ref));
  store.state.items = store.state.items.filter(i => keep.has(i));
  for (const [ref, copy] of backup) {
    for (const k of Object.keys(ref)) delete ref[k];
    Object.assign(ref, copy);
  }
  store.state.events.length = evLen;
  emit();
}

// أحداث الاكتمال المشتق (D-006): ‎+مكافأة عند الإكمال المشتق و−عند فتحه التلقائي —
// بلا العكس يصبح فتح/إعادة إكمال ابن مزرعة مكافآت بلا إنجاز
function derivedEvents(changed) {
  return changed.map(c => ({
    id: uuid(), ts: Date.now(), day: todayStr(),
    kind: 'bonus', itemId: c.item.id, itemType: c.item.type,
    xp: (c.to === 'done' ? 1 : -1) * xpForComplete(c.item),
  }));
}

export async function addItem(fields) {
  const parentId = fields.parentId || null;
  validateNewItemParent(store.state.items, parentId); // قبل أي تغيير حالة
  const now = Date.now();
  const item = {
    id: uuid(),
    type: fields.type || 'task',
    title: String(fields.title || '').slice(0, 120),
    notes: fields.notes || '',
    parentId,
    status: 'todo',
    priority: fields.priority || 1,
    due: fields.due || null,
    period: fields.period || null,
    exercise: fields.exercise || 'auto',
    area: fields.area || null,
    order: fields.order !== undefined ? fields.order : nextOrder(parentId),
    createdAt: now, updatedAt: now, completedAt: null, archivedAt: null,
    source: fields.source || null,
  };
  const backup = snapshotItems();
  const evLen = store.state.events.length;
  store.state.items.push(item);
  // ابن جديد غير منجز يفتح أبًا مكتملًا اشتقاقيًا (D-005) — وتُسجَّل أحداث العكس
  const changed = deriveCompletion(store.state.items);
  const devs = derivedEvents(changed);
  store.state.events.push(...devs);
  try {
    await bulkWrite(['items', 'events'], (s) => {
      s.items.put(item);
      for (const c of changed) s.items.put(c.item);
      for (const e of devs) s.events.put(e);
    });
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
  return item;
}

function nextOrder(parentId) {
  const siblings = store.state.items.filter(i => i.parentId === parentId && !i.archivedAt);
  return siblings.length ? Math.max(...siblings.map(s => s.order || 0)) + 1 : 1;
}

export async function updateItem(id, fields) {
  const item = findItem(id);
  if (!item) return null;
  if ('parentId' in fields && fields.parentId !== item.parentId) {
    if (fields.parentId && hasCycle(store.state.items, id, fields.parentId)) {
      throw new Error('لا يمكن نقل العنصر تحت أحد أبنائه (دورة).');
    }
  }
  const backup = snapshotItems();
  const evLen = store.state.events.length;
  Object.assign(item, fields, { updatedAt: Date.now() });
  const changed = deriveCompletion(store.state.items);
  const devs = derivedEvents(changed);
  store.state.events.push(...devs);
  try {
    await bulkWrite(['items', 'events'], (s) => {
      s.items.put(item);
      for (const c of changed) s.items.put(c.item);
      for (const e of devs) s.events.put(e);
    });
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
  return item;
}

export async function completeItem(id) {
  const item = findItem(id);
  if (!item || item.status === 'done') return;
  const backup = snapshotItems(); // اللقطة قبل أي تعديل — وإلا استرجع التراجع الحالة المعدَّلة
  const evLen = store.state.events.length;
  item.status = 'done';
  item.completedAt = Date.now();
  item.updatedAt = Date.now();
  item.autoDone = false; // إكمال يدوي: لا يعكسه deriveCompletion مهما كان حال الأبناء
  const ev = {
    id: uuid(), ts: Date.now(), day: todayStr(),
    kind: 'complete', itemId: item.id, itemType: item.type,
    xp: xpForComplete(item),
  };
  store.state.events.push(ev);
  const changed = deriveCompletion(store.state.items);
  const devs = derivedEvents(changed);
  store.state.events.push(...devs);
  try {
    await bulkWrite(['items', 'events'], (s) => {
      s.items.put(item);
      s.events.put(ev);
      for (const c of changed) s.items.put(c.item);
      for (const e of devs) s.events.put(e);
    });
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
  return { item, bonusEvents: devs.filter(e => e.xp > 0) };
}

export async function uncompleteItem(id) {
  const item = findItem(id);
  if (!item || item.status !== 'done') return;
  // لو أب مكتمل اشتقاقيًا، التراجع يتم على أبنائه
  const backup = snapshotItems();
  const evLen = store.state.events.length;
  item.status = 'todo';
  item.completedAt = null;
  item.updatedAt = Date.now();
  item.autoDone = false;
  const ev = {
    id: uuid(), ts: Date.now(), day: todayStr(),
    kind: 'uncomplete', itemId: item.id, itemType: item.type,
    xp: -xpForComplete(item),
  };
  store.state.events.push(ev);
  const changed = deriveCompletion(store.state.items);
  const devs = derivedEvents(changed); // عكس مكافآت الآباء المنفتحين تلقائيًا
  store.state.events.push(...devs);
  try {
    await bulkWrite(['items', 'events'], (s) => {
      s.items.put(item);
      s.events.put(ev);
      for (const c of changed) s.items.put(c.item);
      for (const e of devs) s.events.put(e);
    });
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
}

export async function archiveItem(id, archive = true) {
  const item = findItem(id);
  if (!item) return;
  const backup = snapshotItems();
  const evLen = store.state.events.length;
  item.archivedAt = archive ? Date.now() : null;
  item.updatedAt = Date.now();
  try {
    await put('items', item);
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
}

export function countDescendants(id) {
  const out = new Set();
  let grew = true;
  while (grew) {
    grew = false;
    for (const it of store.state.items) {
      if (it.parentId && (it.parentId === id || out.has(it.parentId)) && !out.has(it.id)) {
        out.add(it.id); grew = true;
      }
    }
  }
  return out;
}

export async function deleteItem(id, { detachChildren = false } = {}) {
  // الأحداث لا تُحذف (data-model §7). حذف الأب يعرض خيارين (LQ-011):
  // حذف الأبناء معه (الافتراضي) أو فك ارتباطهم (parentId=null).
  const backup = snapshotItems();
  const evLen = store.state.events.length;
  try {
    if (detachChildren) {
      const detached = [];
      for (const it of store.state.items) {
        if (it.parentId === id) { it.parentId = null; it.updatedAt = Date.now(); detached.push(it); }
      }
      store.state.items = store.state.items.filter(i => i.id !== id);
      await bulkWrite(['items'], (s) => {
        s.items.delete(id);
        for (const d of detached) s.items.put(d);
      });
      emit();
      return;
    }
    const toDelete = new Set([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const it of store.state.items) {
        if (it.parentId && toDelete.has(it.parentId) && !toDelete.has(it.id)) {
          toDelete.add(it.id); grew = true;
        }
      }
    }
    store.state.items = store.state.items.filter(i => !toDelete.has(i.id));
    await bulkWrite(['items'], (s) => {
      for (const d of toDelete) s.items.delete(d);
    });
  } catch (e) { rollback(backup, evLen); throw e; }
  emit();
}

export async function setSetting(key, value) {
  store.state.settings[key] = value;
  await put('settings', { key, value });
  emit();
}

export async function getWorldRow() {
  if (!store.state.world) {
    store.state.world = { id: 'main', heroName: 'سامي', outfit: 'default', dogName: 'بندق', unlocked: [] };
    await put('world', store.state.world);
  }
  return store.state.world;
}

// أهداف حفظها المستخدم قبل إصلاح حفظ الفترة كانت بلا period فلم تظهر في الشجرة — نسبتها للفترة الحالية
export async function repairGoalPeriods() {
  const today = todayStr();
  const ws = store.state.settings.weekStart ?? 6;
  let fixed = 0;
  for (const it of store.state.items) {
    const gp = goalPeriod(it.type, today, ws);
    if (gp && (!it.period || it.period.key !== gp.key && !it.period.key)) {
      it.period = gp; it.updatedAt = Date.now();
      await put('items', it); fixed++;
    }
  }
  if (fixed) emit();
  return fixed;
}
