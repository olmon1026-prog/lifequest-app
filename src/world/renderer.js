// عارض قرية القمر: طبقة ثابتة مخبأة لكل طور + طبقة حية (نجوم، بحر، دخان، يراعات، توهج الطريق).
import { W, H, SKY_H, SEA_TOP, SHORE, LIGHTHOUSE, MOON, VILLAGE_HOUSES, SAMI_HOUSE,
         ABANDONED_HOUSE, CHERRY_TREE, pathPoint, stars, fireflies, rng } from './layout.js';
import { PAL, dither, poly, mountains, house, ruinedHouse, cliff, lighthouse,
         cherryTree, beachHut, workshop, market } from './scenery.js';

const STARFIELD = stars(7);
const FLIES = fireflies(21);
const staticCache = new Map(); // phase -> offscreen canvas

function staticLayer(phase) {
  if (staticCache.has(phase)) return staticCache.get(phase);
  const P = PAL[phase];
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const night = phase === 'night', day = phase === 'day';

  // السماء
  const sky = ctx.createLinearGradient(0, 0, 0, SKY_H);
  sky.addColorStop(0, P.skyTop); sky.addColorStop(0.6, P.skyMid); sky.addColorStop(1, P.skyLow);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, SKY_H);
  // النجوم (الأساس الثابت؛ الوميض حي)
  if (!day) for (const s of STARFIELD) {
    ctx.globalAlpha = s.o; ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(s.x, s.y, s.r, s.r);
    if (s.spark) { ctx.globalAlpha = s.o * 0.6; ctx.fillRect(s.x - 2, s.y, 1, 1); ctx.fillRect(s.x + 2, s.y, 1, 1); ctx.fillRect(s.x, s.y - 2, 1, 1); ctx.fillRect(s.x, s.y + 2, 1, 1); }
  }
  ctx.globalAlpha = 1;

  // القمر/الشمس + الهالة
  const mx = day ? 300 : MOON.x, my = day ? 70 : MOON.y, mr = day ? 26 : MOON.r;
  const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.8);
  glow.addColorStop(0, day ? 'rgba(255,246,220,.5)' : 'rgba(207,245,234,.4)');
  glow.addColorStop(1, 'rgba(207,245,234,0)');
  ctx.fillStyle = glow; ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  ctx.fillStyle = P.moon; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
  if (!day) { // فوهات
    ctx.fillStyle = P.moonCrater;
    ctx.beginPath(); ctx.arc(mx - 10, my - 6, 6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 9, my + 10, 4.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 4, my - 12, 3, 0, 7); ctx.fill();
  }

  // الجبال البعيدة بطبقتين + ضباب أسفلها
  mountains(ctx, P, 0); mountains(ctx, P, 1);
  ctx.fillStyle = P.fog; ctx.fillRect(0, SKY_H - 22, W, 22);

  // البحر: جسم + صفوف تنقيط أفقية
  const sea = ctx.createLinearGradient(0, SEA_TOP, 0, SHORE + 26);
  sea.addColorStop(0, P.seaA); sea.addColorStop(1, P.seaB);
  ctx.fillStyle = sea; ctx.fillRect(0, SEA_TOP, W, SHORE + 26 - SEA_TOP);
  ctx.fillStyle = P.seaLine;
  const rnd = rng(31);
  for (let yy = SEA_TOP + 6; yy < SHORE + 20; yy += 7)
    for (let xx = 0; xx < W; xx += 14 + rnd() * 20)
      ctx.fillRect(xx, yy, 6 + rnd() * 10, 1.5);

  // الأرض: منحدر من الشاطئ إلى قاعدة الجرف الأيمن + حبيبات
  poly(ctx, [[-6, SHORE + 8], [60, SHORE - 2], [150, SHORE + 16], [240, SHORE + 2],
             [310, SHORE - 14], [396, SHORE - 26], [396, H + 6], [-6, H + 6]], P.grassB);
  poly(ctx, [[-6, SHORE + 14], [60, SHORE + 4], [150, SHORE + 22], [240, SHORE + 8],
             [310, SHORE - 8], [396, SHORE - 20], [396, SHORE + 60], [-6, SHORE + 60]], P.sandA);
  dither(ctx, 0, SHORE + 6, W, 26, P.sandEdge, 0.25);
  dither(ctx, 0, SHORE + 40, W, H - SHORE - 40, 'rgba(0,0,0,.12)', 0.18);
  // شعيرات عشب
  const rndG = rng(77);
  ctx.fillStyle = P.grassHi;
  for (let i = 0; i < 90; i++) {
    const gx = rndG() * W, gy = SHORE + 30 + rndG() * (H - SHORE - 40);
    ctx.fillRect(gx, gy, 2, 3 + rndG() * 3);
  }

  // الجرفان
  cliff(ctx, P, 'left'); cliff(ctx, P, 'right');

  // القرية على المنحدر
  const chimneys = [];
  for (const h of VILLAGE_HOUSES) {
    const r = house(ctx, P, h, phase);
    if (r.lit) chimneys.push(r);
  }
  house(ctx, P, { ...SAMI_HOUSE, roof: 'gable', tone: 2, lit: true }, phase);
  ruinedHouse(ctx, P, ABANDONED_HOUSE);
  workshop(ctx, P, phase); market(ctx, P, phase); beachHut(ctx, P, phase);

  // شجرة الكرز
  cherryTree(ctx, P);

  // الطريق: فرشاة ترابية + حصى حواف
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = P.pathEdge; ctx.lineWidth = 16;
  strokePath(ctx, 0, 1);
  ctx.strokeStyle = P.pathA; ctx.lineWidth = 12;
  strokePath(ctx, 0, 1);
  const rndP = rng(99);
  ctx.fillStyle = P.pathEdge;
  for (let t = 0; t < 1; t += 0.04) {
    const p = pathPoint(t);
    if (rndP() > 0.5) ctx.fillRect(p.x + (rndP() - 0.5) * 10, p.y + (rndP() - 0.5) * 8, 2, 2);
  }

  // أعمدة فوانيس على الطريق (العنبر للإنجاز/الإضاءة فقط)
  for (const t of [0.18, 0.46, 0.74]) {
    const p = pathPoint(t);
    ctx.fillStyle = '#2A2438'; ctx.fillRect(p.x + 9, p.y - 18, 3, 18);
    ctx.fillStyle = night || phase === 'dusk' ? '#FFC857' : '#3A3448';
    ctx.fillRect(p.x + 8, p.y - 23, 5, 6);
  }

  staticCache.set(phase, { cv, chimneys });
  return staticCache.get(phase);
}

function strokePath(ctx, t0, t1) {
  ctx.beginPath();
  for (let t = t0; t <= t1 + 0.001; t += 0.02) {
    const p = pathPoint(t);
    t === t0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

// الإطار الكامل. env: {phase, heroT, lamp (0/1/2), beamAngle, flicker, reduceMotion}
export function drawScene(ctx, w, h, time = 0, env = {}) {
  const phase = env.phase || 'night';
  const P = PAL[phase];
  const { cv, chimneys } = staticLayer(phase);
  const sx = w / W, sy = h / H;
  ctx.save(); ctx.scale(sx, sy);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0);
  const night = phase === 'night', day = phase === 'day';
  const still = env.reduceMotion;

  // وميض النجوم
  if (!day && !still) for (let i = 0; i < STARFIELD.length; i += 3) {
    const s = STARFIELD[i];
    const tw = 0.3 + 0.7 * Math.abs(Math.sin(time / 900 + i));
    ctx.globalAlpha = tw * s.o; ctx.fillStyle = '#FFF';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // سحب خفيفة تنساب
  if (!still) {
    ctx.fillStyle = night ? 'rgba(20,40,80,.5)' : 'rgba(255,255,255,.35)';
    const cx1 = ((time / 90) % (W + 220)) - 110, cx2 = ((time / 140 + 200) % (W + 260)) - 130;
    cloud(ctx, cx1, 52); cloud(ctx, cx2, 96);
  }

  // لمعة القمر على البحر + تلألؤ الصفوف
  const mx = day ? 300 : MOON.x;
  if (!still) {
    for (let i = 0; i < 8; i++) {
      const lw = (day ? 40 : 56) - i * 5;
      ctx.globalAlpha = (day ? 0.25 : 0.5) - i * 0.045;
      ctx.fillStyle = P.moon;
      ctx.fillRect(mx - lw / 2 + Math.sin(time / 480 + i * 1.7) * 5, SEA_TOP + 8 + i * 12, lw, 2.5);
    }
    ctx.globalAlpha = 1;
  }

  // دخان المداخن من بيوت القرية الحية + بيت سامي
  if (!still) {
    ctx.fillStyle = night ? 'rgba(200,220,235,.30)' : 'rgba(240,240,240,.5)';
    for (const c of [...chimneys, { chimneyX: SAMI_HOUSE.x + 11, chimneyY: SAMI_HOUSE.y - 58 }]) {
      for (let i = 0; i < 3; i++) {
        const ph = (time / 1600 + i * 0.33 + c.chimneyX * 0.01) % 1;
        ctx.globalAlpha = 0.35 * (1 - ph);
        ctx.fillRect(c.chimneyX - 2 + Math.sin(ph * 5) * 3, c.chimneyY - ph * 26, 4 + ph * 4, 4 + ph * 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  // زبد الموج على خط الشاطئ
  if (!still) {
    ctx.fillStyle = 'rgba(238,247,245,.5)';
    for (let i = 0; i < 6; i++) {
      const ph = (time / 2400 + i * 0.17) % 1;
      ctx.globalAlpha = 0.5 * Math.sin(ph * Math.PI);
      ctx.fillRect(30 + i * 60 + Math.sin(i * 7) * 14, SHORE + 6 + Math.sin(ph * 6 + i) * 3, 26, 2);
    }
    ctx.globalAlpha = 1;
  }

  // المنارة + مصباحها + الشعاع
  const lampP = lighthouse(ctx, P, phase, env.flicker ? 1 : (env.lamp ?? 1));
  if ((env.lamp ?? 0) >= 2 && (night || phase === 'dusk')) {
    const ang = env.beamAngle ?? (time / 2600);
    const bx = Math.cos(ang), by = Math.sin(ang) * 0.25;
    ctx.save(); ctx.translate(lampP.lampX, lampP.lampY);
    for (const dir of [1, -1]) {
      const g = ctx.createLinearGradient(0, 0, dir * 190 * Math.abs(bx) || dir * 60, by * 190);
      g.addColorStop(0, 'rgba(255,220,140,.30)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.lineTo(dir * 190 * bx, by * 190 - 16); ctx.lineTo(dir * 190 * bx, by * 190 + 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // توهج الطريق العنبري حتى موضع سامي (التقدم الحقيقي)
  const ht = Math.max(0, Math.min(1, env.heroT ?? 0));
  if (ht > 0.02) {
    const pulse = still ? 0.8 : 0.65 + 0.35 * Math.sin(time / 700);
    ctx.save();
    ctx.strokeStyle = `rgba(255,200,87,${0.26 * pulse})`; ctx.lineWidth = 24; strokePath(ctx, 0, ht);
    ctx.strokeStyle = `rgba(255,214,120,${0.55 * pulse})`; ctx.lineWidth = 8; strokePath(ctx, 0, ht);
    // نقاط ضوء متدرجة
    for (let t = 0.02; t < ht; t += 0.055) {
      const p = pathPoint(t);
      const a = (0.25 + 0.5 * (t / ht)) * pulse;
      ctx.fillStyle = `rgba(255,224,150,${a})`;
      ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
    }
    // هالة عند رأس التقدم
    const tip = pathPoint(ht);
    const g = ctx.createRadialGradient(tip.x, tip.y, 2, tip.x, tip.y, 26);
    g.addColorStop(0, `rgba(255,214,120,${0.5 * pulse})`); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(tip.x - 26, tip.y - 26, 52, 52);
    ctx.restore();
  }

  // أضواء الفوانيس ليلًا
  if (night || phase === 'dusk') for (const t of [0.18, 0.46, 0.74]) {
    const p = pathPoint(t);
    const g = ctx.createRadialGradient(p.x + 10, p.y - 20, 1, p.x + 10, p.y - 20, 16);
    g.addColorStop(0, 'rgba(255,200,87,.4)'); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(p.x - 6, p.y - 36, 32, 32);
  }

  // يراعات الليل حول الشجرة والمنحدر
  if (night && !still) {
    for (const f of FLIES) {
      const fx = f.cx + Math.cos(time / 1000 * f.speed + f.phase) * f.r;
      const fy = f.cy + Math.sin(time / 1300 * f.speed + f.phase * 2) * f.r * 0.6;
      const a = 0.25 + 0.75 * Math.abs(Math.sin(time / 600 + f.phase * 3));
      ctx.fillStyle = `rgba(190,255,170,${a * 0.9})`;
      ctx.fillRect(fx, fy, 2, 2);
      ctx.fillStyle = `rgba(190,255,170,${a * 0.25})`;
      ctx.fillRect(fx - 1.5, fy - 1.5, 5, 5);
    }
  }

  // بتلات كرز منساقة
  if (!still) {
    ctx.fillStyle = P.leafHi;
    for (let i = 0; i < 7; i++) {
      const ph = (time / 6000 + i * 0.14) % 1;
      const bx = CHERRY_TREE.x - 20 + ph * 90 + Math.sin(ph * 9 + i) * 8;
      const by = CHERRY_TREE.y - 66 + ph * 90;
      ctx.globalAlpha = 0.85 * (1 - ph * 0.7);
      ctx.fillRect(bx, by, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  }

  // تظليل حواف (فينييت) خفيف ليلًا
  if (night) {
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.32, W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(3,6,18,.34)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function cloud(ctx, x, y) {
  ctx.fillRect(x, y, 44, 8); ctx.fillRect(x + 8, y - 6, 26, 6); ctx.fillRect(x + 14, y + 7, 20, 4);
}

// لإعادة بناء الطبقة الثابتة عند تغير الطور
export function invalidateStatic() { staticCache.clear(); }
