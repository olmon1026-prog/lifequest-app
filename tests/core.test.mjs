// اختبارات المنطق النقي بـ Node (D-014)
import assert from 'node:assert/strict';
import { todayStr, addDays, weekStartOf, isValidDate, quickDate, toStr, goalPeriod } from '../src/core/dates.js';
import { buildChildrenMap, progressOf, deriveCompletion, hasCycle } from '../src/core/progress.js';
import { totalXP, levelFor, levelProgress, xpForComplete, DAILY_CAP } from '../src/core/xp.js';
import { currentStreak, bestStreak } from '../src/core/streak.js';
import { validatePlan, normalizeItems } from '../src/core/schema.js';
import { planMerge, planReplace, materialize } from '../src/core/importer.js';
import { heroT, destinationProgress, destinationState, pathPoint } from '../src/world/layout.js';

let passed = 0;
function t(name, fn) { fn(); passed++; console.log('✓', name); }
const mk = (o) => ({ id: 'x', type: 'task', title: 't', parentId: null, status: 'todo', priority: 1, archivedAt: null, ...o });

// التواريخ
t('weekStartOf يبدأ السبت', () => {
  assert.equal(weekStartOf('2026-11-24', 6), '2026-11-21'); // الثلاثاء → السبت السابق
  assert.equal(weekStartOf('2026-11-21', 6), '2026-11-21');
  assert.equal(weekStartOf('2026-11-20', 6), '2026-11-14'); // الجمعة → السبت السابق
});
t('isValidDate', () => {
  assert.ok(isValidDate('2026-02-28'));
  assert.ok(!isValidDate('2026-13-01'));
  assert.ok(!isValidDate('abc'));
});
t('quickDate weekEnd = الجمعة', () => {
  assert.equal(quickDate('weekEnd', '2026-11-24', 6), '2026-11-27');
  assert.equal(quickDate('nextWeek', '2026-11-24', 6), '2026-11-28');
});

// التقدم
t('ورقة منجزة = 1 وغير منجزة = 0', () => {
  const items = [mk({ id: 'a', status: 'done' }), mk({ id: 'b' })];
  const cm = buildChildrenMap(items);
  assert.equal(progressOf(items[0], cm), 1);
  assert.equal(progressOf(items[1], cm), 0);
});
t('متوسط موزون بالأولوية', () => {
  const items = [
    mk({ id: 'p' }),
    mk({ id: 'c1', parentId: 'p', status: 'done', priority: 1 }),
    mk({ id: 'c2', parentId: 'p', priority: 3 }),
  ];
  const cm = buildChildrenMap(items);
  assert.ok(Math.abs(progressOf(items[0], cm) - 0.25) < 1e-9);
});
t('غير المرتبط لا يؤثر (T6)', () => {
  const items = [mk({ id: 'p' }), mk({ id: 'c', parentId: 'p' }), mk({ id: 'free', status: 'done' })];
  const cm = buildChildrenMap(items);
  assert.equal(progressOf(items[0], cm), 0);
});
t('hasCycle', () => {
  const items = [mk({ id: 'a', parentId: 'b' }), mk({ id: 'b', parentId: 'c' }), mk({ id: 'c' })];
  assert.ok(hasCycle(items, 'c', 'a'));
  assert.ok(!hasCycle(items, 'c', null));
});
t('الاكتمال المشتق: الأب يكتمل ويعود (T5/T8)', () => {
  const items = [mk({ id: 'p' }), mk({ id: 'c1', parentId: 'p', status: 'done' }), mk({ id: 'c2', parentId: 'p' })];
  let ch = deriveCompletion(items);
  assert.equal(items[0].status, 'todo');
  items[2].status = 'done';
  ch = deriveCompletion(items);
  assert.equal(items[0].status, 'done');
  assert.ok(ch.some(c => c.item.id === 'p' && c.to === 'done'));
  items[2].status = 'todo';
  deriveCompletion(items);
  assert.equal(items[0].status, 'todo');
});
t('سلسلة سنوي←شهري←أسبوعي←مهمة←فرعية ترفع كل مستوى', () => {
  const items = [
    mk({ id: 'y', type: 'goal_year' }),
    mk({ id: 'm', type: 'goal_month', parentId: 'y' }),
    mk({ id: 'w', type: 'goal_week', parentId: 'm' }),
    mk({ id: 't1', parentId: 'w' }),
    mk({ id: 's1', type: 'subtask', parentId: 't1', status: 'done' }),
  ];
  const cm = buildChildrenMap(items);
  assert.equal(progressOf(items[4], cm), 1);
  assert.equal(progressOf(items[3], cm), 1);
  assert.ok(progressOf(items[2], cm) > 0);
  assert.ok(progressOf(items[0], cm) > 0);
});

// XP
t('xpForComplete', () => {
  assert.equal(xpForComplete(mk({ type: 'task', priority: 3 })), 30);
  assert.equal(xpForComplete(mk({ type: 'subtask' })), 5);
  assert.equal(xpForComplete(mk({ type: 'goal_year' })), 250);
});
t('totalXP مع سقف يومي وتراجع', () => {
  const ev = [];
  let ts = 1000;
  for (let i = 0; i < 40; i++) ev.push({ ts: ts++, day: '2026-11-24', kind: 'complete', xp: 10 });
  ev.push({ ts: ts++, day: '2026-11-24', kind: 'uncomplete', xp: -10 });
  ev.push({ ts: ts++, day: '2026-11-24', kind: 'bonus', xp: 100 });
  assert.equal(totalXP(ev), DAILY_CAP - 10 + 100);
});
t('المستويات', () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(100), 2);
  assert.equal(levelFor(299), 2);
  assert.equal(levelFor(300), 3);
  assert.equal(levelFor(600), 4);
  const lp = levelProgress(420);
  assert.equal(lp.level, 3); assert.equal(lp.inLevel, 120); assert.equal(lp.span, 300);
});

// السلسلة
t('السلسلة الحالية وأفضل سلسلة', () => {
  const ev = [
    { day: '2026-11-21', kind: 'complete', xp: 10 },
    { day: '2026-11-22', kind: 'complete', xp: 10 },
    { day: '2026-11-22', kind: 'uncomplete', xp: -10 },
    { day: '2026-11-22', kind: 'complete', xp: 10 },
    { day: '2026-11-23', kind: 'complete', xp: 10 },
  ];
  assert.equal(currentStreak(ev, '2026-11-24'), 3);
  assert.equal(currentStreak(ev, '2026-11-26'), 0);
  assert.equal(bestStreak(ev), 3);
});

// التحقق من صيغة الخطة
const goodPlan = JSON.stringify({
  format: 'lifequest-plan', schemaVersion: 1,
  plan: { id: 'plan-test-1', title: 'خطة' },
  items: [
    { id: 'y1', type: 'goal_year', title: 'سنة', parentId: null, period: { year: 2026 } },
    { id: 't1', type: 'task', title: 'مهمة', parentId: 'y1', priority: 2, due: { date: '2026-12-02', time: '07:00' } },
    { id: 's1', type: 'subtask', title: 'فرعية', parentId: 't1' },
  ],
});
t('ملف سليم يمر', () => {
  const v = validatePlan(goodPlan);
  assert.ok(v.ok, JSON.stringify(v.errors));
});
t('E001 JSON مكسور', () => assert.equal(validatePlan('{broken').errors[0].code, 'E001'));
t('E002 format غلط', () => assert.equal(validatePlan('{"format":"x"}').errors[0].code, 'E002'));
t('E003 إصدار أحدث', () => assert.equal(validatePlan(JSON.stringify({ format: 'lifequest-plan', schemaVersion: 99, plan: { id: 'abc', title: 't' }, items: [] })).errors[0].code, 'E003'));
t('E013 أب مفقود', () => {
  const v = validatePlan(JSON.stringify({ format: 'lifequest-plan', schemaVersion: 1, plan: { id: 'abc', title: 't' }, items: [{ id: 'a', type: 'task', title: 'x', parentId: 'ghost' }] }));
  assert.ok(v.errors.some(e => e.code === 'E013'));
});
t('E014 دورة', () => {
  const v = validatePlan(JSON.stringify({ format: 'lifequest-plan', schemaVersion: 1, plan: { id: 'abc', title: 't' }, items: [
    { id: 'a', type: 'task', title: 'x', parentId: 'b' },
    { id: 'b', type: 'task', title: 'y', parentId: 'a' },
  ] }));
  assert.ok(v.errors.some(e => e.code === 'E014'));
});
t('E018 فرعية بلا أب مهمة', () => {
  const v = validatePlan(JSON.stringify({ format: 'lifequest-plan', schemaVersion: 1, plan: { id: 'abc', title: 't' }, items: [{ id: 's', type: 'subtask', title: 'x', parentId: null }] }));
  assert.ok(v.errors.some(e => e.code === 'E018'));
});

// الاستيراد
t('الدمج لا يكرر (T14) والاستبدال يمس خطته فقط (T16)', () => {
  const v1 = validatePlan(goodPlan);
  const norm = normalizeItems(v1.items, 'plan-test-1', 6);
  const rows = materialize(norm, [], []);
  // أول استيراد
  let m = planMerge(rows, goodPlan, 6);
  assert.equal(m.toAdd.length, 0); // الكل موجود → تخطي
  assert.equal(m.toSkip.length, 3);
  // استبدال لا يمس عناصر يدوية
  const manual = mk({ id: 'manual-1', title: 'يدوية' });
  const r = planReplace([...rows, manual], goodPlan, 6);
  assert.equal(r.deleteCount, 3);
  assert.ok(!r.toDelete.some(i => i.id === 'manual-1'));
});
t('materialize يحل الآباء', () => {
  const v1 = validatePlan(goodPlan);
  const norm = normalizeItems(v1.items, 'plan-test-1', 6);
  const rows = materialize(norm, [], []);
  const byId = new Map(rows.map(r => [r.source.itemId, r]));
  assert.equal(byId.get('t1').parentId, byId.get('y1').id);
  assert.equal(byId.get('s1').parentId, byId.get('t1').id);
});
t('period week يُحسب من أي تاريخ داخل الأسبوع', () => {
  const v1 = validatePlan(JSON.stringify({
    format: 'lifequest-plan', schemaVersion: 1, plan: { id: 'abc', title: 't' },
    items: [{ id: 'w', type: 'goal_week', title: 'w', parentId: null, period: { weekOf: '2026-11-26' } }],
  }));
  const norm = normalizeItems(v1.items, 'abc', 6);
  assert.equal(norm[0].period.key, '2026-11-21');
});

// العالم
t('heroT يتبع الإنجاز فقط (T9)', () => {
  assert.equal(heroT([]), 0.06);
  const items = [mk({ id: 'a', status: 'done' }), mk({ id: 'b' }), mk({ id: 'c' }), mk({ id: 'd' })];
  assert.ok(Math.abs(heroT(items) - (0.06 + 0.22)) < 1e-9);
});
t('destinationProgress', () => {
  const items = [mk({ id: 'a', area: 'health', status: 'done' }), mk({ id: 'b', area: 'health' })];
  const p = destinationProgress(items, 'health');
  assert.deepEqual([p.done, p.total], [1, 2]);
  assert.equal(destinationState(p).key, 'open');
  assert.equal(destinationState(destinationProgress(items, 'money')).key, 'locked');
});
t('pathPoint داخل الحدود', () => {
  for (let t = 0; t <= 1; t += 0.1) {
    const p = pathPoint(t);
    assert.ok(p.x >= 0 && p.x <= 820 && p.y >= 0 && p.y <= 640);
  }
});


// التحذيرات W001–W005 (file-format §8)
const warnPlan = (items) => JSON.stringify({ format: 'lifequest-plan', schemaVersion: 1, plan: { id: 'plan-warn', title: 'خطة تحذيرات' }, items });
t('W001 حقل غير معروف', () => {
  const v = validatePlan(warnPlan([{ id: 'a', type: 'task', title: 'x', fooBar: 1 }]));
  assert.ok(v.ok);
  assert.ok(v.warnings.some(w => w.code === 'W001'));
});
t('W002 أب بنوع غير معتاد', () => {
  const v = validatePlan(warnPlan([
    { id: 'g', type: 'goal_year', title: 'سنة', period: { year: 2026 } },
    { id: 'p', type: 'stage', title: 'مرحلة', parentId: 'g' },
  ]));
  assert.ok(v.ok);
  assert.ok(v.warnings.some(w => w.code === 'W002'));
});
t('W003 تكرار داخل الملف', () => {
  const v = validatePlan(warnPlan([
    { id: 'a', type: 'task', title: 'نفس العنوان' },
    { id: 'b', type: 'task', title: 'نفس العنوان' },
  ]));
  assert.ok(v.ok);
  assert.ok(v.warnings.some(w => w.code === 'W003'));
});
t('W003 ضد الموجود في التطبيق (planMerge)', () => {
  const existing = [mk({ id: 'e1', title: 'مهمة قديمة', archivedAt: null })];
  const file = warnPlan([{ id: 'n1', type: 'task', title: 'مهمة قديمة' }]);
  const m = planMerge(existing, file, 6);
  assert.ok(m.ok);
  assert.ok(m.warnings.some(w => w.code === 'W003'));
});
t('W004 موعد أقدم من سنة', () => {
  const old = addDays(todayStr(), -400);
  const v = validatePlan(warnPlan([{ id: 'a', type: 'task', title: 'x', due: { date: old, time: null } }]));
  assert.ok(v.ok);
  assert.ok(v.warnings.some(w => w.code === 'W004'));
});
t('W005 عنصر منجز بلا XP', () => {
  const v = validatePlan(warnPlan([{ id: 'a', type: 'task', title: 'x', status: 'done' }]));
  assert.ok(v.ok);
  assert.ok(v.warnings.some(w => w.code === 'W005'));
});
t('ملف نظيف بلا تحذيرات زائفة', () => {
  const v = validatePlan(goodPlan);
  assert.ok(v.ok);
  assert.deepEqual(v.warnings, []);
});

t('goalPeriod: مفتاح الفترة يطابق فلتر شجرة الأهداف', () => {
  assert.deepEqual(goalPeriod('goal_year', '2026-11-24'), { kind: 'year', key: '2026' });
  assert.deepEqual(goalPeriod('goal_month', '2026-11-24'), { kind: 'month', key: '2026-11' });
  assert.deepEqual(goalPeriod('goal_week', '2026-11-24', 6), { kind: 'week', key: weekStartOf('2026-11-24', 6) });
  assert.deepEqual(goalPeriod('goal_week', '2026-11-24', 1), { kind: 'week', key: weekStartOf('2026-11-24', 1) });
  assert.equal(goalPeriod('task', '2026-11-24'), null);
  assert.equal(goalPeriod('subtask', '2026-11-24'), null);
});

console.log(`\n${passed} اختبارًا نجح كلها ✅`);
