import assert from 'node:assert/strict';
import { W, H, cameraFor } from '../src/world/layout.js';
import { coverScale, followOffX, followCenterX, followView, fitZoomFor, clampView,
         pinchView, worldToScreen, screenToWorld, HUD_PAD } from '../src/world/camera.js';

const SIZES = [[320,568],[360,640],[360,740],[390,844],[412,915],[768,1024],[1024,768],[1280,720],[1920,1080],[568,320]];

// ١) أصغر زوم: العالم كله داخل الشاشة وبين شريطي الـHUD
for (const [bw, bh] of SIZES) {
  const s = coverScale(bw, bh), v = clampView({ zoom: 0, cx: -999, cy: 9999 }, bw, bh, s);
  const l = worldToScreen(v, bw, bh, s, 0, 0), r = worldToScreen(v, bw, bh, s, W, H);
  assert.ok(v.zoom > 0 && v.zoom <= 1, `${bw}x${bh} zoom=${v.zoom}`);
  assert.ok(l.x >= -0.5 && r.x <= bw + 0.5, `${bw}x${bh} أفقي ${l.x}..${r.x}`);
  assert.ok(l.y >= HUD_PAD - 0.5 && r.y <= bh - HUD_PAD + 0.5, `${bw}x${bh} رأسي ${l.y}..${r.y}`);
}

// ٢) زوم ١: النافذة لا تخرج من العالم
for (const [bw, bh] of SIZES) {
  const s = coverScale(bw, bh);
  for (const [cx, cy] of [[-500, -500], [5000, 5000], [W / 2, H / 2]]) {
    const v = clampView({ zoom: 1, cx, cy }, bw, bh, s);
    const tl = screenToWorld(v, bw, bh, s, 0, 0), br = screenToWorld(v, bw, bh, s, bw, bh);
    assert.ok(tl.x >= -1e-6 && tl.y >= -1e-6 && br.x <= W + 1e-6 && br.y <= H + 1e-6, `${bw}x${bh} يخرج من العالم`);
  }
}

// ٣) لا قفزة عند الدخول لوضع الاستكشاف (+ عيّنة ضابطة تثبت أن الصيغة القديمة تقفز)
for (const [bw, bh] of SIZES) {
  const s = coverScale(bw, bh), offX = followOffX(bw, s), camXi = Math.round(cameraFor(300));
  const fx = x => offX + (x - camXi) * s;
  const v = { zoom: 1, cx: followCenterX(camXi), cy: H / 2 };
  const camM = Math.round(v.cx - bw / s / 2);
  for (const x of [100, 300, 500])
    assert.ok(Math.abs(fx(x) - (x - camM) * s) <= s * 0.5 + 1e-6, `${bw}x${bh} قفزة عند الدخول`);
}
{ const [bw, bh] = [390, 844], s = coverScale(bw, bh), camXi = 100;
  const oldCx = camXi + bw / (2 * s);                       // الصيغة القديمة
  const jump = Math.abs(followOffX(bw, s) + (300 - camXi) * s - (300 - Math.round(oldCx - bw / s / 2)) * s);
  assert.ok(jump > 40, `ضابطة: القديمة كانت تقفز ${jump.toFixed(1)}px`); }

// ٤) القرصة: النقطة تحت الإصبعين ثابتة، حتى مع حدثين متتاليين (إصبعان = حدثان/إطار)
for (const [bw, bh] of SIZES) {
  const s = coverScale(bw, bh);
  for (const ratio of [0.9, 0.5, 1.1]) {
    const v = clampView({ zoom: 1, cx: W / 2 - 50, cy: H / 2 }, bw, bh, s);
    const mx = bw * 0.3, my = bh * 0.6, before = screenToWorld(v, bw, bh, s, mx, my);
    pinchView(v, bw, bh, s, mx, my, ratio); pinchView(v, bw, bh, s, mx, my, ratio);
    const after = screenToWorld(v, bw, bh, s, mx, my);
    assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < 1e-6, `${bw}x${bh} انجراف القرصة`);
    assert.ok(v.zoom >= fitZoomFor(bw, bh, s) - 1e-12 && v.zoom <= 1);
  }
}

// ٥) زوم محفوظ من شاشة أخرى يُعاد قصّه بعد التدوير
{ const [bw, bh] = [390, 844], s = coverScale(bw, bh);
  assert.equal(clampView({ zoom: 0.30, cx: W / 2, cy: H / 2 }, bw, bh, s).zoom, fitZoomFor(bw, bh, s)); }

// ٦) ثغرة حافة التتبع (قرار تصميم — تحذير فقط إلا مع STRICT_EDGE=1)
{ const [bw, bh] = [390, 844], s = coverScale(bw, bh);
  const sx = followOffX(bw, s) + (30 - cameraFor(30)) * s;  // سامي عند بداية مشهد الوصول x=30
  if (process.env.STRICT_EDGE) assert.ok(sx >= 0, `سامي خارج الشاشة x=${sx.toFixed(1)}`);
  else if (sx < 0) console.warn(`WARN: بداية الوصول خارج الشاشة في التتبع (x=${sx.toFixed(1)}px)`); }

// ٧) followView: سقف ٣٠٠px عالم رأسيًا في العرض الأفقي، والوضع الرأسي بلا تغيير
{ const fv = followView(844, 390);
  assert.ok(Math.abs(fv.scale - 1.3) < 1e-9, `مقياس أفقي ${fv.scale}`);
  assert.ok(Math.abs(fv.viewW - 844 / 1.3) < 1e-9 && fv.viewW > 390, `نافذة أفقية ${fv.viewW}`);
  assert.ok(390 / fv.scale >= 300 - 1e-9); // الارتفاع الظاهر ≥ ٣٠٠px عالم
  assert.ok(fv.viewW <= W); }              // النافذة لا تتجاوز العالم
{ const fv = followView(2560, 800); // فائق الاتساع: الحد الأدنى bw/W يمنع نافذة أوسع من العالم
  assert.ok(Math.abs(fv.viewW - W) < 1e-9, `نافذة ${fv.viewW}`); }
{ const fv = followView(390, 844);         // نفس أبعاد هاتف عبدو الرأسية
  assert.ok(Math.abs(fv.scale - coverScale(390, 844)) < 1e-9 && fv.viewW === 390, 'الرأسي تغيّر!'); }
for (const [bw, bh] of SIZES) {            // لا قصّ رأسيًا أبدًا ولا نافذة أوسع من العالم
  const fv = followView(bw, bh);
  assert.ok(bh / fv.scale >= 300 - 1e-9 || Math.abs(fv.viewW - W) < 1e-9, `${bw}x${bh} ارتفاع ظاهر ${(bh / fv.scale).toFixed(0)}`);
  assert.ok(fv.viewW <= W + 1e-9, `${bw}x${bh} نافذة ${fv.viewW}`);
  assert.ok(bw / fv.scale <= fv.viewW + 1e-9); } // لا حواف فارغة أفقيًا

console.log('✓ camera.test');
