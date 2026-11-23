// التقدم (data-model §7): ورقة = 1 إن done، وإلا متوسط موزون للأبناء بوزن الأولوية.
// حارس دورات. المؤرشف يُتجاهل. غير المرتبط لا يؤثر.
export function buildChildrenMap(items) {
  const map = new Map();
  for (const it of items) {
    if (it.archivedAt) continue;
    if (!it.parentId) continue;
    if (!map.has(it.parentId)) map.set(it.parentId, []);
    map.get(it.parentId).push(it);
  }
  return map;
}

export function progressOf(item, childrenMap, visiting = new Set()) {
  if (item.status === 'done') return 1;
  const children = (childrenMap.get(item.id) || []);
  if (children.length === 0) return 0;
  if (visiting.has(item.id)) return 0; // حارس دورة
  visiting.add(item.id);
  let wsum = 0, psum = 0;
  for (const c of children) {
    const w = c.priority || 1;
    wsum += w;
    psum += w * progressOf(c, childrenMap, visiting);
  }
  visiting.delete(item.id);
  return wsum === 0 ? 0 : psum / wsum;
}

// الاكتمال المشتق (D-005): أب بأبناء كلهم done يصبح done، ويرجع todo لو رجع ابن.
// يرجع قائمة العناصر التي تغيّرت حالتها (لتسجيل أحداث المكافأة).
export function deriveCompletion(items) {
  const childrenMap = buildChildrenMap(items);
  const changed = [];
  // من الأوراق للجذور: كرر حتى الاستقرار (العمق ≤ 6)
  for (let round = 0; round < 8; round++) {
    let any = false;
    for (const it of items) {
      const children = childrenMap.get(it.id) || [];
      if (children.length === 0) continue;
      const allDone = children.every(c => c.status === 'done');
      if (allDone && it.status !== 'done') {
        it.status = 'done'; it.completedAt = Date.now(); it.updatedAt = Date.now();
        changed.push({ item: it, to: 'done' }); any = true;
      } else if (!allDone && it.status === 'done' && it.completedAt && children.some(c => c.status !== 'done')) {
        it.status = 'todo'; it.completedAt = null; it.updatedAt = Date.now();
        changed.push({ item: it, to: 'todo' }); any = true;
      }
    }
    if (!any) break;
  }
  return changed;
}

export function hasCycle(items, itemId, newParentId) {
  const byId = new Map(items.map(i => [i.id, i]));
  let cur = newParentId;
  const guard = new Set([itemId]);
  while (cur) {
    if (guard.has(cur)) return true;
    guard.add(cur);
    const p = byId.get(cur);
    cur = p ? p.parentId : null;
  }
  return false;
}
