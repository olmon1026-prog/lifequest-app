// تحقق المستودع عند إنشاء عنصر جديد: الأب (لو وُجد) لازم يكون موجودًا وغير مؤرشف —
// أب غير موجود يصنع يتيمًا لا يظهر في أي شجرة، وأب مؤرشف يُخفي الابن معه.
// ملاءمة نوع الأب تبقى تحذيرًا فقط (W002 في schema.js) — لا قيود أنواع جديدة هنا.
export function validateNewItemParent(items, parentId) {
  if (!parentId) return;
  const parent = items.find(i => i.id === parentId);
  if (!parent) throw new Error('العنصر الأب غير موجود.');
  if (parent.archivedAt) throw new Error('لا يمكن الإضافة تحت عنصر مؤرشف.');
}
