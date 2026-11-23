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

const ev = (i, at) => ({ id: 'e' + i, kind: 'complete', itemId: 'i' + i, at: at || `2026-11-24T10:0${i}:00` });
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
    { id: 'a', kind: 'complete', itemId: 'x', at: '2026-11-24T09:00' },
    { id: 'b', kind: 'create', itemId: 'y', at: '2026-11-24T09:30' },
    { id: 'c', kind: 'complete', itemId: 'z', at: '2026-11-24T10:00' },
    { id: 'd', kind: 'complete', itemId: 'w', at: '2026-11-23T22:00' }, // أمس
  ];
  assert.deepEqual(newCompleteEvents(events, null, '2026-11-24').map(e => e.id), ['a', 'c']);
  assert.deepEqual(newCompleteEvents(events, 'a', '2026-11-24').map(e => e.id), ['c']);
  assert.deepEqual(newCompleteEvents(events, 'c', '2026-11-24'), []);
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
