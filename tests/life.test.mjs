// اختبارات محرك الحياة ومشاهد القصة (منطق نقي، D-014)
import assert from 'node:assert/strict';
import { dayPhase, routineFor, destinationFor, sceneDurationMs, planScenes,
         newCompleteEvents, nextStoryScene, CHAPTER1, MAX_LIVE_SCENES,
         SCENE_MIN_MS, SCENE_MAX_MS } from '../src/world/life.js';

let passed = 0;
function t(name, fn) { fn(); passed++; console.log('✓', name); }
const D = (h, m = 0) => new Date(2026, 10, 24, h, m);

t('dayPhase: فجر 5-7، نهار 7-17، غسق 17-19، ليل الباقي', () => {
  assert.equal(dayPhase(D(5)), 'dawn'); assert.equal(dayPhase(D(6, 59)), 'dawn');
  assert.equal(dayPhase(D(7)), 'day'); assert.equal(dayPhase(D(16, 59)), 'day');
  assert.equal(dayPhase(D(17)), 'dusk'); assert.equal(dayPhase(D(18, 59)), 'dusk');
  assert.equal(dayPhase(D(19)), 'night'); assert.equal(dayPhase(D(0)), 'night');
  assert.equal(dayPhase(D(4, 59)), 'night');
});

t('routineFor: نشاط وموضع صالحان في كل ساعة', () => {
  for (let h = 0; h < 24; h++) {
    const r = routineFor(D(h));
    assert.ok(['sleep', 'idle', 'walk', 'read', 'sit', 'work'].includes(r.activity), `ساعة ${h}`);
    assert.ok(typeof r.spot === 'string' && r.spot.length > 0);
    assert.ok(typeof r.label === 'string' && r.label.length > 0);
  }
  assert.equal(routineFor(D(2)).activity, 'sleep');
});

t('destinationFor: المجالات الخمسة لها أماكنها الثابتة', () => {
  assert.equal(destinationFor({ area: 'health' }), 'health');
  assert.equal(destinationFor({ area: 'learning' }), 'learning');
  assert.equal(destinationFor({ area: 'work' }), 'work');
  assert.equal(destinationFor({ area: 'home' }), 'home');
  assert.equal(destinationFor({ area: 'money' }), 'money');
});

t('destinationFor: بلا مجال = بديل حتمي لنفس المعرف (قابل لإعادة الإنتاج)', () => {
  const a = destinationFor(null, 'ev-123');
  assert.equal(a, destinationFor(null, 'ev-123'));
  assert.notEqual(a, undefined);
});

t('sceneDurationMs: دائمًا بين 8 و15 ثانية (زمن منطقي)', () => {
  for (const p of [1, 2, 3]) for (const ty of ['task', 'stage', 'project']) {
    const d = sceneDurationMs({ priority: p, type: ty });
    assert.ok(d >= SCENE_MIN_MS && d <= SCENE_MAX_MS, `${p}/${ty} = ${d}`);
  }
  assert.ok(sceneDurationMs({ priority: 3, type: 'project' }) > sceneDurationMs({ priority: 1, type: 'task' }));
});

const ev = (i, ts) => ({ id: 'e' + i, kind: 'complete', itemId: 'i' + i,
  ts: ts ?? Date.parse(`2026-11-24T10:0${i}:00Z`), day: '2026-11-24' });
const item = (i, extra = {}) => ({ id: 'i' + i, title: 'مهمة ' + i, area: 'work', priority: 1, type: 'task', ...extra });

t('planScenes: حتى 5 مشاهد حية والزيادة للملخص، بلا حذف لأي إنجاز', () => {
  const events = Array.from({ length: 9 }, (_, i) => ev(i));
  const items = events.map((_, i) => item(i));
  const { live, digest } = planScenes(events, items);
  assert.equal(live.length, MAX_LIVE_SCENES);
  assert.equal(digest.length, 9 - MAX_LIVE_SCENES);
  assert.equal(live.length + digest.length, 9);
  // الترتيب زمني
  assert.ok(live.every((s, i) => i === 0 || s.at >= live[i - 1].at));
  // كل مشهد له وجهة ومدة وعنوان
  for (const s of [...live, ...digest]) {
    assert.ok(s.destination && s.durationMs >= SCENE_MIN_MS && s.title);
  }
});

t('planScenes: 3 إنجازات = 3 مشاهد حية ولا ملخص', () => {
  const { live, digest } = planScenes([ev(0), ev(1), ev(2)], [item(0), item(1), item(2)]);
  assert.equal(live.length, 3); assert.equal(digest.length, 0);
});

t('newCompleteEvents: فقط أحداث complete بعد آخر معروض ومن نفس اليوم', () => {
  const events = [
    { id: 'a', kind: 'complete', itemId: 'x', ts: Date.parse('2026-11-24T09:00Z'), day: '2026-11-24' },
    { id: 'b', kind: 'create', itemId: 'y', ts: Date.parse('2026-11-24T09:30Z'), day: '2026-11-24' },
    { id: 'c', kind: 'complete', itemId: 'z', ts: Date.parse('2026-11-24T10:00Z'), day: '2026-11-24' },
    { id: 'd', kind: 'complete', itemId: 'w', ts: Date.parse('2026-11-23T22:00Z'), day: '2026-11-23' }, // أمس
  ];
  assert.deepEqual(newCompleteEvents(events, null, '2026-11-24').map(e => e.id), ['a', 'c']);
  assert.deepEqual(newCompleteEvents(events, 'a', '2026-11-24').map(e => e.id), ['c']);
  assert.deepEqual(newCompleteEvents(events, 'c', '2026-11-24'), []);
});

t('انحدار: فلتر اليوم يعمل على المخطط الحقيقي (ts/day بلا at) — كان ميتًا في الإنتاج', () => {
  // قبل الإصلاح كان الفلتر يقرأ e.at غير الموجود، فتتسلل إنجازات الأيام القديمة
  // لطابور اليوم عند أول تشغيل (lastShown = null).
  const events = [
    { id: 'old1', kind: 'complete', itemId: 'x', ts: Date.parse('2026-11-20T09:00Z'), day: '2026-11-20' },
    { id: 'old2', kind: 'complete', itemId: 'y', ts: Date.parse('2026-11-21T09:00Z'), day: '2026-11-21' },
    { id: 'now1', kind: 'complete', itemId: 'z', ts: Date.parse('2026-11-24T09:00Z'), day: '2026-11-24' },
  ];
  assert.deepEqual(newCompleteEvents(events, null, '2026-11-24').map(e => e.id), ['now1']);
});

t('انحدار: planScenes يرتب زمنيًا بـ ts حتى لو الدخل مخلوط', () => {
  // قبل الإصلاح كان المقارن String(at) ولا يرجع 0 أبدًا — ترتيب غير مضمون.
  const a = { id: 'a', kind: 'complete', itemId: 'x', ts: 3000, day: '2026-11-24' };
  const b = { id: 'b', kind: 'complete', itemId: 'y', ts: 1000, day: '2026-11-24' };
  const c = { id: 'c', kind: 'complete', itemId: 'z', ts: 2000, day: '2026-11-24' };
  const items = [item(0), item(1), item(2)];
  const { live } = planScenes([a, b, c], items);
  assert.deepEqual(live.map(s => s.eventId), ['b', 'c', 'a']);
  assert.deepEqual(live.map(s => s.at), [1000, 2000, 3000]);
});

t('احتياط: أحداث قديمة بصيغة at النصية لا تزال تعمل', () => {
  const events = [
    { id: 'p', kind: 'complete', itemId: 'x', at: '2026-11-23T22:00' },
    { id: 'q', kind: 'complete', itemId: 'y', at: '2026-11-24T09:00' },
  ];
  assert.deepEqual(newCompleteEvents(events, null, '2026-11-24').map(e => e.id), ['q']);
  const { live } = planScenes(events, [item(0), item(1)]);
  assert.deepEqual(live.map(s => s.eventId), ['p', 'q']);
});

t('لا إنجازات وهمية: الأحداث غير complete لا تنتج مشاهد', () => {
  const events = [{ id: 'a', kind: 'create' }, { id: 'b', kind: 'uncomplete' }, { id: 'c', kind: 'delete' }];
  assert.deepEqual(newCompleteEvents(events, null, '2026-11-24'), []);
});

t('الفصل الأول: الترتيب ثابت والشروط متدرجة', () => {
  assert.equal(CHAPTER1.length, 5);
  // بداية: الوصول دائمًا أولًا
  assert.equal(nextStoryScene({}, { completions: 0, phase: 'day' }).id, 'c1s1');
  // بعد الوصول بلا إنجازات: لا شيء
  assert.equal(nextStoryScene({ c1s1: 1 }, { completions: 0, phase: 'day' }), null);
  // أول إنجاز يفتح «أول مهمة»
  assert.equal(nextStoryScene({ c1s1: 1 }, { completions: 1, phase: 'day' }).id, 'c1s2');
  // لا قفز: c1s3 محجوب حتى لو 5 إنجازات وc1s2 لم تُعرض
  assert.equal(nextStoryScene({ c1s1: 1 }, { completions: 5, phase: 'day' }).id, 'c1s2');
  assert.equal(nextStoryScene({ c1s1: 1, c1s2: 1 }, { completions: 3, phase: 'day' }).id, 'c1s3');
  assert.equal(nextStoryScene({ c1s1: 1, c1s2: 1, c1s3: 1 }, { completions: 5, phase: 'day' }).id, 'c1s4');
  // الليل لا يُعرض نهارًا ولا قبل أول إنجاز
  assert.equal(nextStoryScene({ c1s1: 1, c1s2: 1, c1s3: 1, c1s4: 1 }, { completions: 1, phase: 'day' }), null);
  assert.equal(nextStoryScene({ c1s1: 1, c1s2: 1, c1s3: 1, c1s4: 1 }, { completions: 1, phase: 'night' }).id, 'c1s5');
  // اكتمال الفصل
  assert.equal(nextStoryScene({ c1s1: 1, c1s2: 1, c1s3: 1, c1s4: 1, c1s5: 1 }, { completions: 9, phase: 'night' }), null);
});

console.log(`\n${passed} اختبار محرك حياة ناجح`);

import { shouldRestAtHome } from '../src/world/life.js';
import { cameraFor, nearestPathT, W, VIEW_W } from '../src/world/layout.js';

t('الراحة في البيت: لا أثناء مشهد أو طابور، وتتطلب روتينًا هادئًا قرب البيت', () => {
  assert.equal(shouldRestAtHome({ active: {}, queueLength: 0, routineSpot: 'door' }), false);
  assert.equal(shouldRestAtHome({ active: null, queueLength: 2, routineSpot: 'door' }), false);
  assert.equal(shouldRestAtHome({ active: null, queueLength: 0, routineSpot: 'door' }), true);
  assert.equal(shouldRestAtHome({ active: null, queueLength: 0, routineSpot: 'beach' }), false);
  assert.equal(shouldRestAtHome({ active: null, queueLength: 0, routineSpot: 'square' }), true);
});

t('الكاميرا: داخل حدود العالم دائمًا وتتمركز على الهدف', () => {
  assert.equal(cameraFor(0), 0);
  assert.equal(cameraFor(-50), 0);
  assert.equal(cameraFor(W), W - VIEW_W);
  assert.equal(cameraFor(W + 100), W - VIEW_W);
  assert.equal(cameraFor(W / 2), W / 2 - VIEW_W / 2);
});

t('nearestPathT: أقرب نقطة طريق منطقية', () => {
  const t = nearestPathT(414, 522); // الساحة على الطريق
  assert.ok(t > 0.3 && t < 0.7, `t=${t}`);
  const tEnd = nearestPathT(702, 228); // قاعدة المنارة
  assert.ok(tEnd > 0.9, `tEnd=${tEnd}`);
});
