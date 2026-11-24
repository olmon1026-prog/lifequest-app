// اختبارات repo.js الحقيقية في Node عبر IndexedDB زائف في الذاكرة:
// تحقق الأب عند الإنشاء، توازن مكافآت الاكتمال المشتق (لا مزرعة XP)،
// والتراجع الكامل عن الذاكرة والقاعدة عند فشل معاملة الكتابة.
import assert from 'node:assert/strict';

// ── IndexedDB زائف: نفس سطح db.js (معاملات غير متزامنة + حقن فشل) ──
const DATA = { items: new Map(), events: new Map(), world: new Map(), settings: new Map(), snapshots: new Map() };
let failNext = null; // الخطأ الذي تفشل به المعاملة القادمة
function req(result) { const r = { result }; setTimeout(() => r.onsuccess && r.onsuccess(), 0); return r; }
function storeApi(name) {
  const m = DATA[name];
  const keyPath = name === 'settings' ? 'key' : 'id';
  return {
    put: (v) => { if (!failNext) m.set(v[keyPath], structuredClone(v)); return req(v); },
    delete: (k) => { if (!failNext) m.delete(k); return req(true); },
    get: (k) => req(m.get(k)),
    getAll: () => req([...m.values()]),
    clear: () => { if (!failNext) m.clear(); return req(true); },
    index: () => ({ getAll: () => req([]) }),
  };
}
globalThis.indexedDB = {
  open() {
    const r = {};
    setTimeout(() => {
      r.result = {
        createObjectStore: () => ({ createIndex: () => {} }),
        transaction(stores) {
          const t = { objectStore: (n) => storeApi(n), error: null };
          setTimeout(() => {
            if (failNext) { t.error = failNext; failNext = null; t.onerror && t.onerror(); }
            else t.oncomplete && t.oncomplete();
          }, 0);
          return t;
        },
      };
      r.onupgradeneeded && r.onupgradeneeded({ oldVersion: 0 });
      r.onsuccess && r.onsuccess();
    }, 0);
    return r;
  },
};

const { openDB } = await import('../src/db/db.js');
const { store } = await import('../src/store.js');
const repo = await import('../src/db/repo.js');
const { totalXP, xpForComplete } = await import('../src/core/xp.js');

await openDB();

let passed = 0;
function t(name, fn) { return Promise.resolve(fn()).then(() => { passed++; console.log('✓', name); }); }
const mk = (o) => ({ id: 'x', type: 'task', title: 't', parentId: null, status: 'todo', priority: 1,
  due: null, period: null, exercise: 'auto', area: null, order: 1,
  createdAt: 1, updatedAt: 1, completedAt: null, archivedAt: null, source: null, ...o });
function seed(items) {
  store.state.items = items;
  store.state.events = [];
  DATA.items.clear(); DATA.events.clear();
  for (const i of items) DATA.items.set(i.id, structuredClone(i));
}
const mem = () => store.state.items;
const evs = () => store.state.events;

// ١) أب غير موجود يُرفض قبل أي تغيير
await t('addItem يرفض أبًا غير موجود بلا أثر', async () => {
  seed([]);
  await assert.rejects(() => repo.addItem({ title: 'a', parentId: 'ghost' }), /الأب غير موجود/);
  assert.equal(mem().length, 0);
  assert.equal(DATA.items.size, 0);
});

// ٢) أب مؤرشف يُرفض
await t('addItem يرفض أبًا مؤرشفًا', async () => {
  seed([mk({ id: 'g', type: 'goal_month', archivedAt: 5 })]);
  await assert.rejects(() => repo.addItem({ title: 'a', parentId: 'g' }), /مؤرشف/);
  assert.equal(mem().length, 1);
});

// ٣) إضافة صحيحة تُخزَّن في الذاكرة والقاعدة وترتيب متزايد
await t('addItem صحيح: ذاكرة + قاعدة + order', async () => {
  seed([mk({ id: 'g', type: 'goal_month' })]);
  const a = await repo.addItem({ title: 'أولى', parentId: 'g' });
  const b = await repo.addItem({ title: 'ثانية', parentId: 'g' });
  assert.equal(DATA.items.get(a.id).title, 'أولى');
  assert.ok(b.order > a.order);
});

// ٤) إكمال آخر ابن: الأب يُكمل اشتقاقيًا + مكافأة موجبة
await t('اكتمال مشتق: مكافأة الأب تُسجَّل', async () => {
  seed([mk({ id: 'p', type: 'project' }), mk({ id: 'c', parentId: 'p' })]);
  await repo.completeItem('c');
  assert.equal(mem().find(i => i.id === 'p').status, 'done');
  const bonus = evs().filter(e => e.kind === 'bonus' && e.itemId === 'p');
  assert.equal(bonus.length, 1);
  assert.equal(bonus[0].xp, xpForComplete({ type: 'project' }));
});

// ٥) فتح الابن يعكس مكافأة الأب المشتقة — لا مزرعة XP عبر دورات فتح/إكمال
await t('٣ دورات فتح/إكمال = صافي XP دورة واحدة', async () => {
  seed([mk({ id: 'p', type: 'project' }), mk({ id: 'c', parentId: 'p' })]);
  await repo.completeItem('c');
  const xpOnce = totalXP(evs());
  for (let k = 0; k < 3; k++) { await repo.uncompleteItem('c'); await repo.completeItem('c'); }
  assert.equal(totalXP(evs()), xpOnce, 'المكافآت المشتقة يجب أن تتوازن');
  // مكافأة موجبة واحدة فعّالة: الأحداث +/− متساوية العدد بعدد الدورات
  const b = evs().filter(e => e.kind === 'bonus' && e.itemId === 'p').map(e => e.xp);
  assert.equal(b.reduce((a, x) => a + x, 0), xpForComplete({ type: 'project' }));
});

// ٦) ابن جديد يفتح أبًا مكتملًا اشتقاقيًا ويعكس مكافأته
await t('إضافة ابن تحت أب مكتمل اشتقاقيًا تفتحه وتعكس المكافأة', async () => {
  seed([mk({ id: 'p', type: 'project' }), mk({ id: 'c', parentId: 'p' })]);
  await repo.completeItem('c'); // الأب يكتمل اشتقاقيًا + مكافأة
  assert.equal(mem().find(i => i.id === 'p').status, 'done');
  const xpBefore = totalXP(evs());
  await repo.addItem({ title: 'جديدة', parentId: 'p' });
  const p = mem().find(i => i.id === 'p');
  assert.equal(p.status, 'todo', 'الأب المشتق ينفتح عند إضافة ابن غير منجز');
  const neg = evs().filter(e => e.kind === 'bonus' && e.itemId === 'p' && e.xp < 0);
  assert.ok(neg.length >= 1, 'حدث bonus سالب عند الفتح');
  assert.equal(totalXP(evs()), xpBefore - xpForComplete({ type: 'project' }));
});

// ٧) الأب المكتمل يدويًا لا ينقلب بإضافة ابن (قرار المستخدم محفوظ)
await t('إكمال يدوي للأب لا يُقلب بإضافة ابن', async () => {
  seed([mk({ id: 'p', type: 'project', status: 'done', completedAt: 2, autoDone: false })]);
  await repo.addItem({ title: 'جديدة', parentId: 'p' });
  assert.equal(mem().find(i => i.id === 'p').status, 'done');
});

// ٨) فشل المعاملة: الذاكرة والقاعدة كأن شيئًا لم يكن + إعادة المحاولة تنجح
await t('فشل الكتابة يسترجع الذاكرة بالكامل', async () => {
  seed([mk({ id: 'c' })]);
  const ev0 = evs().length;
  failNext = new Error('QuotaExceeded');
  await assert.rejects(() => repo.completeItem('c'));
  const c = mem().find(i => i.id === 'c');
  assert.equal(c.status, 'todo', 'الحالة رجعت');
  assert.equal(c.completedAt, null);
  assert.equal(evs().length, ev0, 'لا أحداث يتيمة في الذاكرة');
  assert.equal(DATA.events.size, 0, 'لا أحداث في القاعدة');
  assert.equal(DATA.items.get('c').status, 'todo');
  await repo.completeItem('c'); // إعادة المحاولة بعد زوال العطل
  assert.equal(mem().find(i => i.id === 'c').status, 'done');
  assert.equal(DATA.events.size, 1);
});

// ٩) فشل addItem بعد فتح اشتقاقي: الأب يعود مكتملًا والابن يُزال
await t('فشل addItem يسترجع الفتح الاشتقاقي أيضًا', async () => {
  seed([mk({ id: 'p', type: 'project', status: 'done', completedAt: 2, autoDone: true }),
        mk({ id: 'c', parentId: 'p', status: 'done', completedAt: 2 })]);
  failNext = new Error('IOError');
  await assert.rejects(() => repo.addItem({ title: 'x', parentId: 'p' }));
  assert.equal(mem().length, 2, 'الابن الجديد أُزيل من الذاكرة');
  assert.equal(mem().find(i => i.id === 'p').status, 'done', 'الأب عاد مكتملًا');
  assert.equal(mem().find(i => i.id === 'p').autoDone, true);
  assert.equal(DATA.items.size, 2);
});

console.log(`✓ repo.test — ${passed} اختبارات`);
