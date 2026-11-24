// عارض قرية القمر: طبقتان ثابتتان مخبأتان (بعيدة بشلل/قريبة) + طبقة حية.
// الكاميرا تتبع سامي؛ الطبقة البعيدة تتحرك بعامل 0.35 لعمق حقيقي.
import { W, H, VIEW_W, VIEW_H, SKY_H, SEA_TOP, SHORE, MOON, BUILDINGS, SAMI_HOUSE,
         CHERRY_TREE, SAMI_DOORWAY, LIGHTHOUSE, ROCK_SPOTS, pathPoint, stars, fireflies, rng } from './layout.js';
import { PAL, dither, poly, mountains, sea, house, ruinedHouse, cliff, lighthouse,
         cherryTree, beachHut, workshop, market, road, forestEdge, doorway } from './scenery.js';

const STARFIELD = stars(7);

// أصول المباني المولّدة: {sprite: {night: Image, day: Image}} — احتياطيها الرسم الكودي
const IMGS = {};
export async function preloadBuildings() {
  const names = [...new Set([...BUILDINGS.map(b => b.sprite), 'sami-open', 'lighthouse', 'tree', 'rocks'])];
  await Promise.all(names.flatMap(n => ['night', 'day'].map(async v => {
    try {
      await new Promise(res => {
        const im = new Image();
        im.onload = () => { (IMGS[n] ||= {})[v] = im; res(); };
        im.onerror = () => res();
        im.src = `assets/buildings/${n}-${v}.png`;
      });
    } catch { /* نسخة مفقودة: يستخدم الاحتياطي */ }
  })));
}
const variantOf = phase => (phase === 'day' || phase === 'dawn') ? 'day' : 'night';
function buildingSprite(name, phase) {
  const e = IMGS[name];
  return e ? (e[variantOf(phase)] || e.night || e.day) : null;
}
// يرسم أصل مبنى بخط أساس y وعرض w، ويرجع ارتفاعه؛ null لو لا أصل
function drawBuilding(ctx, b, phase) {
  const im = buildingSprite(b.sprite, phase);
  if (!im) return null;
  const h = b.w * im.naturalHeight / im.naturalWidth;
  ctx.drawImage(im, b.x - b.w / 2, b.y - h, b.w, h);
  return h;
}
const FLIES = fireflies(21);
const farCache = new Map(), nearCache = new Map();

// الطبقة البعيدة: سماء + نجوم + قمر + جبال + بحر (تتحرك بشلل 0.35)
function farLayer(phase) {
  if (farCache.has(phase)) return farCache.get(phase);
  const P = PAL[phase];
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const day = phase === 'day';

  const sky = ctx.createLinearGradient(0, 0, 0, SKY_H);
  sky.addColorStop(0, P.skyTop); sky.addColorStop(0.6, P.skyMid); sky.addColorStop(1, P.skyLow);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, SKY_H);
  if (!day) for (const s of STARFIELD) {
    ctx.globalAlpha = s.o; ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(s.x, s.y, s.r, s.r);
    if (s.spark) { ctx.globalAlpha = s.o * 0.6; ctx.fillRect(s.x - 2, s.y, 1, 1); ctx.fillRect(s.x + 2, s.y, 1, 1); ctx.fillRect(s.x, s.y - 2, 1, 1); ctx.fillRect(s.x, s.y + 2, 1, 1); }
  }
  ctx.globalAlpha = 1;

  const mx = day ? 620 : MOON.x, my = day ? 64 : MOON.y, mr = day ? 26 : MOON.r;
  const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 2.8);
  glow.addColorStop(0, day ? 'rgba(255,246,220,.5)' : 'rgba(207,245,234,.4)');
  glow.addColorStop(1, 'rgba(207,245,234,0)');
  ctx.fillStyle = glow; ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  ctx.fillStyle = P.moon; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
  if (!day) {
    ctx.fillStyle = P.moonCrater;
    ctx.beginPath(); ctx.arc(mx - 10, my - 6, 6, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 9, my + 10, 4.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + 4, my - 12, 3, 0, 7); ctx.fill();
  }

  mountains(ctx, P, 0); mountains(ctx, P, 1);
  ctx.fillStyle = P.fog; ctx.fillRect(0, SKY_H - 22, W, 22);
  sea(ctx, P);
  // عمود انعكاس القمر الثابت (الوميض حي)
  if (!day) {
    ctx.fillStyle = 'rgba(207,245,234,.16)';
    for (let i = 0; i < 10; i++) {
      const w = 20 + i * 7;
      ctx.fillRect(MOON.x - w / 2 + (i % 2) * 4, SEA_TOP + 8 + i * 12, w, 2);
    }
  }
  farCache.set(phase, { cv });
  return farCache.get(phase);
}

// الطبقة القريبة: أرض + جرفان + قرية + طريق + شجرة + غابة
function nearLayer(phase, front = false) {
  const key = phase + (front ? ':front' : ':back');
  if (nearCache.has(key)) return nearCache.get(key);
  const P = PAL[phase];
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  if (!front) {
  // الأرض: منحدر من الشاطئ إلى قاعدة الجرف الشرقي
  poly(ctx, [[-6, SHORE + 10], [120, SHORE - 2], [300, SHORE + 18], [480, SHORE + 4],
             [610, SHORE - 12], [826, SHORE - 24], [826, H + 6], [-6, H + 6]], P.grassB);
  // شريط الرمال عند الشاطئ
  poly(ctx, [[-6, SHORE + 16], [120, SHORE + 6], [300, SHORE + 24], [480, SHORE + 10],
             [610, SHORE - 6], [826, SHORE - 18], [826, SHORE + 52], [-6, SHORE + 52]], P.sandA);
  dither(ctx, 0, SHORE + 8, W, 22, P.sandEdge, 0.25);
  dither(ctx, 0, SHORE + 54, W, H - SHORE - 54, 'rgba(0,0,0,.12)', 0.18);
  // شعيرات عشب
  const rndG = rng(77);
  ctx.fillStyle = P.grassHi;
  for (let i = 0; i < 200; i++) {
    const gx = rndG() * W, gy = SHORE + 40 + rndG() * (H - SHORE - 50);
    ctx.fillRect(gx, gy, 2, 3 + rndG() * 3);
  }

  forestEdge(ctx, P);
  cliff(ctx, P, 'left'); cliff(ctx, P, 'right');

  // الطريق أولًا ثم البيوت فوق حوافه العليا
  road(ctx, P);
  }

  // مبانٍ مولّدة مرتبة بالعمق (الأبعد أولًا) مع بقعة أرض مهترئة تربطها بالموقع
  const chimneys = [];
  const fallback = {
    housea: b => house(ctx, P, { ...b, tone: 0, lit: true }, phase),
    houseb: b => house(ctx, P, { ...b, tone: 1, lit: true }, phase),
    stone:  b => house(ctx, P, { ...b, tone: 2, lit: true }, phase),
    sami:   b => house(ctx, P, { ...b, tone: 2, lit: true }, phase),
    ruined: b => ruinedHouse(ctx, P, b),
    workshop: b => workshop(ctx, P, phase),
    market: b => market(ctx, P, phase),
    beachhut: b => beachHut(ctx, P, phase),
  };
  for (const b of [...BUILDINGS].filter(b => !!b.front === front).sort((a, z) => a.y - z.y)) {
    ctx.fillStyle = P.pathA; ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, b.w / 2 + 10, 7, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    const h = drawBuilding(ctx, b, phase);
    if (h === null) fallback[b.sprite]?.(b);
    if (b.smoke) {
      const hh = h ?? b.w * 0.75;
      chimneys.push({ chimneyX: b.x + b.smoke[0] * b.w, chimneyY: b.y + b.smoke[1] * hh });
    }
  }
  const treeSpr = buildingSprite('tree', phase);
  if (treeSpr) { const tw = 110; ctx.drawImage(treeSpr, CHERRY_TREE.x - tw / 2, CHERRY_TREE.y - tw * (treeSpr.height / treeSpr.width), tw, tw * (treeSpr.height / treeSpr.width)); }
  else cherryTree(ctx, P);

  // صخور مولّدة على الجرفين
  const rockSpr = buildingSprite('rocks', phase);
  for (const s of ROCK_SPOTS) {
    if (rockSpr) { const rh = s.w * (rockSpr.height / rockSpr.width); ctx.drawImage(rockSpr, s.x - s.w / 2, s.y - rh, s.w, rh); }
    else { ctx.fillStyle = P.rock ?? '#5A5568'; ctx.fillRect(s.x - s.w / 2, s.y - s.w * 0.5, s.w, s.w * 0.5); }
  }

  // أعمدة فوانيس على الطريق
  for (const t of [0.15, 0.42, 0.68, 0.88]) {
    const p = pathPoint(t);
    ctx.fillStyle = '#2A2438'; ctx.fillRect(p.x + 11, p.y - 26, 3, 26);
    ctx.fillStyle = (phase === 'night' || phase === 'dusk') ? '#FFC857' : '#3A3448';
    ctx.fillRect(p.x + 10, p.y - 32, 5, 7);
  }

  nearCache.set(key, { cv, chimneys });
  return nearCache.get(key);
}

// الإطار الكامل. env: {phase, heroT, lamp, flicker, reduceMotion, camX, doorT, beamAngle}
// stage: 'full' (افتراضي) | 'back' (حتى قبل الممثلين) | 'front' (المباني الأمامية والمؤثرات)
export function drawScene(ctx, w, h, time = 0, env = {}, stage = 'full') {
  if (stage === 'front') return drawFrontStage(ctx, w, h, time, env);
  if (stage === 'back') return drawBackStage(ctx, w, h, time, env);
  drawBackStage(ctx, w, h, time, env);
  drawFrontStage(ctx, w, h, time, env);
}

function drawFrontStage(ctx, w, h, time, env) {
  const phase = env.phase || 'night';
  const P = PAL[phase];
  const camX = env.camX || 0;
  const night = phase === 'night';
  const still = env.reduceMotion;
  const s = Math.max(w / VIEW_W, h / VIEW_H); // تغطية كاملة بلا حواف فارغة؛ القص المتناظر يُبقي البطل بالمنتصف
  ctx.save();
  ctx.translate(Math.round((w - VIEW_W * s) / 2), Math.round((h - VIEW_H * s) / 2));
  ctx.scale(s, s);
  ctx.beginPath(); ctx.rect(0, 0, VIEW_W, H); ctx.clip(); // لا تسرّب للمؤثرات خارج إطار المشهد
  ctx.imageSmoothingEnabled = false;
  const camXi = Math.round(camX); // التقاط الكاميرا لبكسل صحيح: لا اهتزاز عينات

  // المباني الأمامية (الصف الجنوبي): تغطي من يمر خلفها
  const { cv: nearF } = nearLayer(phase, true);
  ctx.drawImage(nearF, camXi, 0, VIEW_W, H, 0, 0, VIEW_W, H);

  // باب بيت سامي المتحرك: تلاشٍ إلى نسخة «الباب المفتوح» المولّدة (احتياطي: رسم كودي)
  if (env.doorT > 0.01) {
    const openIm = buildingSprite('sami-open', phase);
    ctx.save(); ctx.translate(-camXi, 0); ctx.globalAlpha = env.doorT;
    if (openIm) {
      const hh = SAMI_HOUSE.w * openIm.naturalHeight / openIm.naturalWidth;
      ctx.drawImage(openIm, SAMI_HOUSE.x - SAMI_HOUSE.w / 2, SAMI_HOUSE.y - hh, SAMI_HOUSE.w, hh);
    } else doorway(ctx, P, SAMI_DOORWAY, env.doorT, phase);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  drawEffects(ctx, phase, P, time, env, camX, night, still);
  ctx.restore();
}

function drawBackStage(ctx, w, h, time, env) {
  const phase = env.phase || 'night';
  const P = PAL[phase];
  const camX = env.camX || 0;
  const { cv: far } = farLayer(phase);
  const { cv: near, chimneys } = nearLayer(phase, false);
  const s = Math.max(w / VIEW_W, h / VIEW_H); // تغطية كاملة بلا حواف فارغة؛ القص المتناظر يُبقي البطل بالمنتصف
  ctx.save();
  ctx.translate(Math.round((w - VIEW_W * s) / 2), Math.round((h - VIEW_H * s) / 2));
  ctx.scale(s, s);
  ctx.beginPath(); ctx.rect(0, 0, VIEW_W, H); ctx.clip(); // لا تسرّب للمؤثرات خارج إطار المشهد
  ctx.imageSmoothingEnabled = false;

  // بعيد بشلل
  const par = Math.round(camX * 0.35);
  ctx.drawImage(far, par, 0, VIEW_W, H, 0, 0, VIEW_W, H);
  const night = phase === 'night', day = phase === 'day';
  const still = env.reduceMotion;

  // سحب منسابة (بشلل أخف)
  if (!still) {
    ctx.fillStyle = night ? 'rgba(20,40,80,.5)' : 'rgba(255,255,255,.35)';
    const drift = (x, y, sp) => {
      const cx = ((time / sp + x) % (VIEW_W + 240)) - 120;
      ctx.fillRect(cx, y, 44, 8); ctx.fillRect(cx + 8, y - 6, 26, 6); ctx.fillRect(cx + 14, y + 7, 20, 4);
    };
    drift(0, 46, 90); drift(220, 92, 140);
  }

  // صفوف أمواج متحركة فوق البحر (تقنية SLYNYRD: هلالات تنساب بسرعات مختلفة)
  if (!still) {
    for (let row = 0; row < 5; row++) {
      const yy = SEA_TOP + 18 + row * 24;
      const sp = 30 + row * 14;
      const dir = row % 2 ? 1 : -1;
      ctx.fillStyle = row % 2 ? P.crest : P.crestHi;
      ctx.globalAlpha = 0.5 - row * 0.06;
      for (let k = 0; k < 7; k++) {
        const base = (k * 140 + dir * time / sp) % (W + 80);
        const xx = ((base % (W + 80)) + (W + 80)) % (W + 80) - 40 - par;
        if (xx > -50 && xx < VIEW_W + 10) ctx.fillRect(xx, yy + Math.sin(time / 600 + k) * 1.5, 22 + row * 6, 2);
      }
    }
    ctx.globalAlpha = 1;
    // ومضات انعكاس القمر الحية
    if (!day) {
      for (let i = 0; i < 7; i++) {
        const lw = 34 - i * 3.5;
        ctx.globalAlpha = 0.4 - i * 0.05;
        ctx.fillStyle = P.moon;
        ctx.fillRect(MOON.x - par - lw / 2 + Math.sin(time / 470 + i * 1.7) * 6, SEA_TOP + 12 + i * 14, lw, 2.5);
      }
      ctx.globalAlpha = 1;
    }
  }

  // قريب (الطبقة الخلفية: أرض وطريق ومبانٍ شمالية)
  ctx.drawImage(near, camX, 0, VIEW_W, H, 0, 0, VIEW_W, H);

  // دخان المداخن
  if (!still) {
    ctx.fillStyle = night ? 'rgba(200,220,235,.30)' : 'rgba(240,240,240,.5)';
    for (const c of chimneys) {
      for (let i = 0; i < 3; i++) {
        const ph = (time / 1600 + i * 0.33 + c.chimneyX * 0.01) % 1;
        ctx.globalAlpha = 0.35 * (1 - ph);
        ctx.fillRect(c.chimneyX - camX - 2 + Math.sin(ph * 5) * 3, c.chimneyY - ph * 30, 4 + ph * 4, 4 + ph * 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  // المنارة + مصباحها (حية لأن وميضها يتغير) — أصل مولّد مع احتياطي كودي
  const lampOn = (env.flicker || (env.lamp ?? 1) > 0) && phase !== 'day';
  const lhIm = buildingSprite('lighthouse', phase);
  let lampP;
  if (lhIm) {
    const lhH = 176, lhW = lhH * lhIm.naturalWidth / lhIm.naturalHeight;
    ctx.save(); ctx.translate(-camX, 0);
    ctx.drawImage(lhIm, LIGHTHOUSE.x - lhW / 2, LIGHTHOUSE.baseY + 6 - lhH, lhW, lhH);
    lampP = { lampX: LIGHTHOUSE.x, lampY: LIGHTHOUSE.baseY + 6 - lhH + 40 };
    if (lampOn) {
      const g = ctx.createRadialGradient(lampP.lampX, lampP.lampY, 2, lampP.lampX, lampP.lampY, (env.lamp ?? 1) === 2 ? 46 : 22);
      g.addColorStop(0, 'rgba(255,200,87,.55)'); g.addColorStop(1, 'rgba(255,200,87,0)');
      ctx.fillStyle = g; ctx.fillRect(lampP.lampX - 48, lampP.lampY - 48, 96, 96);
    }
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(-camX, 0);
    lampP = lighthouse(ctx, P, phase, env.flicker ? 1 : (env.lamp ?? 1));
    ctx.restore();
  }
  lampP.lampX -= camX;

  if ((env.lamp ?? 0) >= 2 && (night || phase === 'dusk')) {
    const ang = env.beamAngle ?? (time / 2600);
    const bx = Math.cos(ang), by = Math.sin(ang) * 0.25;
    ctx.save(); ctx.translate(lampP.lampX - camX, lampP.lampY);
    for (const ddir of [1, -1]) {
      const g = ctx.createLinearGradient(0, 0, ddir * 190 * Math.abs(bx) || ddir * 60, by * 190);
      g.addColorStop(0, 'rgba(255,220,140,.30)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.lineTo(ddir * 190 * bx, by * 190 - 16); ctx.lineTo(ddir * 190 * bx, by * 190 + 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // توهج الطريق العنبري حتى موضع التقدم
  const ht = Math.max(0, Math.min(1, env.heroT ?? 0));
  if (ht > 0.02) {
    const pulse = still ? 0.8 : 0.65 + 0.35 * Math.sin(time / 700);
    ctx.save();
    ctx.strokeStyle = `rgba(255,200,87,${0.22 * pulse})`; ctx.lineWidth = 26; strokePath(ctx, 0, ht, camX);
    ctx.strokeStyle = `rgba(255,214,120,${0.5 * pulse})`; ctx.lineWidth = 9; strokePath(ctx, 0, ht, camX);
    for (let t = 0.02; t < ht; t += 0.05) {
      const p = pathPoint(t);
      const a = (0.25 + 0.5 * (t / ht)) * pulse;
      ctx.fillStyle = `rgba(255,224,150,${a})`;
      ctx.fillRect(p.x - camX - 1.5, p.y - 1.5, 3, 3);
    }
    const tip = pathPoint(ht);
    const g = ctx.createRadialGradient(tip.x - camX, tip.y, 2, tip.x - camX, tip.y, 28);
    g.addColorStop(0, `rgba(255,214,120,${0.5 * pulse})`); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(tip.x - camX - 28, tip.y - 28, 56, 56);
    ctx.restore();
  }

  // أضواء الفوانيس ليلًا
  if (night || phase === 'dusk') for (const t of [0.15, 0.42, 0.68, 0.88]) {
    const p = pathPoint(t);
    const g = ctx.createRadialGradient(p.x - camX + 12, p.y - 28, 1, p.x - camX + 12, p.y - 28, 18);
    g.addColorStop(0, 'rgba(255,200,87,.4)'); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(p.x - camX - 6, p.y - 46, 36, 36);
  }

  ctx.restore();
}

// المؤثرات الأمامية: شعاع المنارة + يراعات + بتلات + تظليل الحواف
function drawEffects(ctx, phase, P, time, env, camX, night, still) {
  if ((env.lamp ?? 0) >= 2 && (night || phase === 'dusk')) {
    const lampP = env._lampP || { lampX: 0, lampY: 0 }; // lampX بإحداثيات الشاشة مسبقًا
    const ang = env.beamAngle ?? (time / 2600);
    const bx = Math.cos(ang), by = Math.sin(ang) * 0.25;
    ctx.save(); ctx.translate(lampP.lampX, lampP.lampY);
    for (const ddir of [1, -1]) {
      const g = ctx.createLinearGradient(0, 0, ddir * 190 * Math.abs(bx) || ddir * 60, by * 190);
      g.addColorStop(0, 'rgba(255,220,140,.30)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, -3);
      ctx.lineTo(ddir * 190 * bx, by * 190 - 16); ctx.lineTo(ddir * 190 * bx, by * 190 + 16);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // يراعات الليل
  if (night && !still) {
    for (const f of FLIES) {
      const fx = f.cx + Math.cos(time / 1000 * f.speed + f.phase) * f.r - camX;
      const fy = f.cy + Math.sin(time / 1300 * f.speed + f.phase * 2) * f.r * 0.6;
      if (fx < -5 || fx > VIEW_W + 5) continue;
      const a = 0.25 + 0.75 * Math.abs(Math.sin(time / 600 + f.phase * 3));
      ctx.fillStyle = `rgba(190,255,170,${a * 0.9})`;
      ctx.fillRect(fx, fy, 2, 2);
      ctx.fillStyle = `rgba(190,255,170,${a * 0.25})`;
      ctx.fillRect(fx - 1.5, fy - 1.5, 5, 5);
    }
  }

  // بتلات كرز
  if (!still) {
    ctx.fillStyle = P.leafHi;
    for (let i = 0; i < 7; i++) {
      const ph = (time / 6000 + i * 0.14) % 1;
      const bx = CHERRY_TREE.x - 24 + ph * 100 + Math.sin(ph * 9 + i) * 8 - camX;
      const by = CHERRY_TREE.y - 88 + ph * 100;
      ctx.globalAlpha = 0.85 * (1 - ph * 0.7);
      ctx.fillRect(bx, by, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
  }

  if (night) {
    const v = ctx.createRadialGradient(VIEW_W / 2, H * 0.45, H * 0.32, VIEW_W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(3,6,18,.34)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, VIEW_W, H);
  }

  ctx.restore();
}

function strokePath(ctx, t0, t1, camX = 0) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let t = t0; t <= t1 + 0.001; t += 0.02) {
    const p = pathPoint(t);
    t === t0 ? ctx.moveTo(p.x - camX, p.y) : ctx.lineTo(p.x - camX, p.y);
  }
  ctx.stroke();
}

export function invalidateStatic() { farCache.clear(); nearCache.clear(); }
