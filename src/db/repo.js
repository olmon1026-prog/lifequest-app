// العمليات على البيانات: إضافة/تعديل/إنجاز/تراجع/أرشفة/حذف + تسجيل الأحداث والاكتمال المشتق
import { put, del, getOne, bulkWrite } from './db.js';
import { uuid } from '../core/ids.js';
import { todayStr , goalPeriod } from '../core/dates.js';
import { deriveCompletion, hasCycle } from '../core/progress.js';
import { xpForComplete } from '../core/xp.js';
import { store, emit } from '../store.js';

function findItem(id) { return store.state.items.find(i => i.id === id); }

export async function addItem(fields) {
  const now = Date.now();
  const item = {
    id: uuid(),
    type: fields.type || 'task',
    title: String(fields.title || '').slice(0, 120),
    notes: fields.notes || '',
    parentId: fields.parentId || null,
    status: 'todo',
    priority: fields.priority || 1,
    due: fields.due || null,
    period: fields.period || null,
    exercise: fields.exercise || 'auto',
    area: fields.area || null,
    order: fields.order !== undefined ? fields.order : nextOrder(fields.parentId || null),
    createdAt: now, updatedAt: now, completedAt: null, archivedAt: null,
    source: fields.source || null,
  };
  store.state.items.push(item);
  await put('items', item);
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
  Object.assign(item, fields, { updatedAt: Date.now() });
  await put('items', item);
  const changed = deriveCompletion(store.state.items);
  await persistChanged(changed);
  emit();
  return item;
}

export async function completeItem(id) {
  const item = findItem(id);
  if (!item || item.status === 'done') return;
  item.status = 'done';
  item.completedAt = Date.now();
  item.updatedAt = Date.now();
  const ev = {
    id: uuid(), ts: Date.now(), day: todayStr(),
    kind: 'complete', itemId: item.id, itemType: item.type,
    xp: xpForComplete(item),
  };
  store.state.events.push(ev);
  const changed = deriveCompletion(store.state.items);
  const bonusEvents = [];
  for (const c of changed) {
    if (c.to === 'done') {
      const bev = {
        id: uuid(), ts: Date.now(), day: todayStr(),
        kind: 'bonus', itemId: c.item.id, itemType: c.item.type,
        xp: xpForComplete(c.item),
      };
      bonusEvents.push(bev);
      store.state.events.push(bev);
    }
  }
  await bulkWrite(['items', 'events'], (s) => {
    s.items.put(item);
    s.events.put(ev);
    for (const c of changed) s.items.put(c.item);
    for (const b of bonusEvents) s.events.put(b);
  });
  emit();
  return { item, bonusEvents };
}

export async function uncompleteItem(id) {
  const item = findItem(id);
  if (!item || item.status !== 'done') return;
  // لو أب مكتمل اشتقاقيًا، التراجع يتم على أبنائه
  item.status = 'todo';
  item.completedAt = null;
  item.updatedAt = Date.now();
  const ev = {
    id: uuid(), ts: Date.now(), day: todayStr(),
    kind: 'uncomplete', itemId: item.id, itemType: item.type,
    xp: -xpForComplete(item),
  };
  store.state.events.push(ev);
  const changed = deriveCompletion(store.state.items);
  await bulkWrite(['items', 'events'], (s) => {
    s.items.put(item);
    s.events.put(ev);
    for (const c of changed) s.items.put(c.item);
  });
  emit();
}

export async function archiveItem(id, archive = true) {
  const item = findItem(id);
  if (!item) return;
  item.archivedAt = archive ? Date.now() : null;
  item.updatedAt = Date.now();
  await put('items', item);
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
  emit();
}

async function persistChanged(changed) {
  for (const c of changed) await put('items', c.item);
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
