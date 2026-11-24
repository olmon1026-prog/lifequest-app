import assert from 'node:assert/strict';
import { Actor } from '../src/world/actors.js';

// نسخة مطابقة من chainWalk في world.js
function chainWalk(actor, points, done) {
  const [p, ...rest] = points;
  if (!p) return done();
  actor.goTo(p.x, p.y, () => chainWalk(actor, rest, done));
}
const run = (a, ms, dt = 16) => { for (let t = 0; t < ms; t += dt) a.update(dt, t); };

{ // هدف على ≤1.5px لازم يستدعي onArrive مرة واحدة
  const a = new Actor('t', 100, 100); let fired = 0;
  a.goTo(100.9, 100.4, () => fired++); run(a, 64);
  assert.equal(fired, 1, 'onArrive لم تُستدعَ للهدف القريب');
}
{ // مشهدان متتاليان لنفس الوجهة: سامي واقف أصلًا على spot
  const a = new Actor('t', 560, 506); a.goTo(560, 506); run(a, 64);
  let started = false; a.goTo(560, 506, () => { started = true; }); run(a, 64);
  assert.ok(started, 'المشهد الثاني يتجمّد في step=go');
}
{ // سلسلة أول نقطة فيها قريبة (حالة بندق عند أقرب نقطة أثر)
  const a = new Actor('t', 100, 100); let done = false;
  chainWalk(a, [{ x: 100.5, y: 100 }, { x: 160, y: 100 }], () => { done = true; });
  run(a, 4000);
  assert.ok(done && Math.abs(a.x - 160) <= 1.5, 'السلسلة وقفت');
}
{ // سلوك سليم: مسافة عادية ⇒ استدعاء واحد فقط
  const a = new Actor('t', 0, 0); let n = 0; a.goTo(40, 0, () => n++); run(a, 4000);
  assert.equal(n, 1);
}
{ // تحقق إضافي: الاتجاه لا يتقلب مع حركة شبه رأسية
  const a = new Actor('t', 100, 100); a.goTo(104, 200); run(a, 200);
  assert.equal(a.facing, 'left');
  a.goTo(200, 110); run(a, 200); assert.equal(a.facing, 'right');
}
console.log('✓ actors.test');
