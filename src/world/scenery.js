// بناء الطبقات الثابتة لعالم قرية القمر بأسلوب بكسل احترافي.
// المقاسات: الباب ≈ قامة سامي (الشخصية ~٥٠px). المراجع: SLYNYRD (ماء متحرك)،
// Nasha's Haunted Lighthouse (تنقيط وإضاءة ليلية)، أعراف Stardew لنسب القرى.
import { W, H, SKY_H, SEA_TOP, SHORE, LEFT_CLIFF, RIGHT_CLIFF, LIGHTHOUSE, MOON,
         VILLAGE_HOUSES, SAMI_HOUSE, ABANDONED_HOUSE, CHERRY_TREE, FOREST_EDGE,
         DESTINATIONS, pathPoint, rng } from './layout.js';

export const PAL = {
  night: {
    skyTop: '#030614', skyMid: '#0B1838', skyLow: '#1A3E63',
    mountFar: '#0C1A38', mountNear: '#12294A',
    seaDeep: '#061A34', seaA: '#0C2C50', seaB: '#0A2444', crest: '#2E6E8E', crestHi: '#7FB8CC',
    sandA: '#4A4258', sandB: '#38324A', sandEdge: '#5E5470',
    grassA: '#1C3A44', grassB: '#142C34', grassHi: '#2A5560',
    rockA: '#1E2A44', rockB: '#141E34', rockHi: '#33466A',
    pathA: '#4A3E50', pathB: '#3C3244', pathEdge: '#2A2434', stone: '#5E5468',
    wallA: '#3B4A66', wallB: '#2E3A54', wallC: '#46587A',
    roofA: '#167A7A', roofB: '#0F5A5C', roofC: '#1E8E8A',
    winLit: '#FFC857', winDark: '#0B1838',
    trunk: '#4A3244', leafA: '#7E5A78', leafB: '#5E4460', leafHi: '#A87E9E',
    moon: '#F2FBF2', moonCrater: '#C9E4DC',
    fog: 'rgba(20,50,90,.22)',
  },
  dawn: {
    skyTop: '#2A2A55', skyMid: '#5A4A7E', skyLow: '#D8836A',
    mountFar: '#3A3A62', mountNear: '#4A4470',
    seaDeep: '#1E2E4E', seaA: '#3A4E72', seaB: '#2C3E60', crest: '#6E7A9A', crestHi: '#E0B090',
    sandA: '#8A6B5E', sandB: '#6E554E', sandEdge: '#A8846E',
    grassA: '#3A5A50', grassB: '#2C463E', grassHi: '#4E7A66',
    rockA: '#4E4460', rockB: '#3A3348', rockHi: '#6E5E80',
    pathA: '#7A6258', pathB: '#685249', pathEdge: '#4E3E38', stone: '#96807A',
    wallA: '#7A6E80', wallB: '#5E5468', wallC: '#96889A',
    roofA: '#B85A4A', roofB: '#96463A', roofC: '#D0705A',
    winLit: '#FFC857', winDark: '#2A2438',
    trunk: '#5A3A3A', leafA: '#9A6A7A', leafB: '#7A5468', leafHi: '#C08A9A',
    moon: '#F6E8D8', moonCrater: '#D8C4B4',
    fog: 'rgba(216,131,106,.12)',
  },
  day: {
    skyTop: '#3E7EB8', skyMid: '#6AA8CC', skyLow: '#BFE4E4',
    mountFar: '#5E8AAC', mountNear: '#7AA8BC',
    seaDeep: '#165E80', seaA: '#2E8EAE', seaB: '#227494', crest: '#5AB4CC', crestHi: '#D8F0F0',
    sandA: '#D8BC8A', sandB: '#C0A070', sandEdge: '#EAD2A0',
    grassA: '#4E8A62', grassB: '#3C704E', grassHi: '#6AAA7C',
    rockA: '#8A7E72', rockB: '#6E6258', rockHi: '#B0A494',
    pathA: '#C8AE82', pathB: '#B49870', pathEdge: '#8A7458', stone: '#D8C49A',
    wallA: '#E8E0CE', wallB: '#CBC0AA', wallC: '#F4EEDF',
    roofA: '#C8412F', roofB: '#9E3222', roofC: '#E05846',
    winLit: '#BFE4E4', winDark: '#24405C',
    trunk: '#6E4A3A', leafA: '#E8A8BC', leafB: '#C8849C', leafHi: '#F8CCDA',
    moon: '#FFF6E0', moonCrater: '#EADFC0',
    fog: 'rgba(230,240,240,.16)',
  },
  dusk: {
    skyTop: '#1A2450', skyMid: '#6E3E6E', skyLow: '#E08A52',
    mountFar: '#2A2A52', mountNear: '#3E3260',
    seaDeep: '#222246', seaA: '#464070', seaB: '#32305C', crest: '#7A6A96', crestHi: '#F0B880',
    sandA: '#9A705E', sandB: '#7A584C', sandEdge: '#B88A70',
    grassA: '#3A5448', grassB: '#2C4038', grassHi: '#527A62',
    rockA: '#54486A', rockB: '#3E3652', rockHi: '#76688E',
    pathA: '#84685C', pathB: '#72564E', pathEdge: '#54403A', stone: '#A08878',
    wallA: '#8A7688', wallB: '#6E5C6E', wallC: '#A894A4',
    roofA: '#B8503E', roofB: '#923C2E', roofC: '#D46854',
    winLit: '#FFC857', winDark: '#241E34',
    trunk: '#5E3E3E', leafA: '#B87E92', leafB: '#96647A', leafHi: '#DCA2B4',
    moon: '#FBEEDD', moonCrater: '#E0CBB2',
    fog: 'rgba(224,138,82,.12)',
  },
};

// تنقيط بكسل: رقعة شطرنج 2×2
export function dither(ctx, x, y, w, h, color, density = 0.5) {
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += 2)
    for (let xx = x + (yy % 4 === 0 ? 0 : 2); xx < x + w; xx += 4)
      if (((xx * 7 + yy * 13) % 100) / 100 < density) ctx.fillRect(xx, yy, 2, 2);
}

export function poly(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath(); ctx.fill();
}

// جبال بعيدة مسننة بحواف مضيئة
export function mountains(ctx, P, layer = 0, seed = 5) {
  const rnd = rng(seed + layer * 31);
  const base = SKY_H, amp = layer ? 52 : 76, step = layer ? 30 : 40;
  poly(ctx, [[-10, base]], P.mountFar); // يُستبدل بالمسار الكامل
  const pts = [[-10, base]];
  let x = -10;
  while (x < W + 10) { pts.push([x, base - 16 - rnd() * amp]); x += step * (0.6 + rnd() * 0.8); }
  pts.push([W + 10, base]);
  poly(ctx, pts, layer ? P.mountNear : P.mountFar);
  ctx.fillStyle = layer ? 'rgba(207,245,234,.10)' : 'rgba(207,245,234,.06)';
  for (let i = 1; i < pts.length - 1; i++) ctx.fillRect(pts[i][0] - 1, pts[i][1] - 2, 3, 2);
}

// البحر (الطبقة الثابتة): جسم متدرج + صفوف هلالات متكسرة بأطوال متنوعة (تقنية SLYNYRD)
export function sea(ctx, P, seed = 31) {
  const g = ctx.createLinearGradient(0, SEA_TOP, 0, SHORE + 30);
  g.addColorStop(0, P.seaA); g.addColorStop(0.75, P.seaB); g.addColorStop(1, P.seaDeep);
  ctx.fillStyle = g; ctx.fillRect(0, SEA_TOP, W, SHORE + 30 - SEA_TOP);
  const rnd = rng(seed);
  // صفوف هلالات: كل صف أعمق = أقصر وأبطأ إيقاعًا. الصفوف المتحركة في renderer.
  for (let row = 0; row < 9; row++) {
    const yy = SEA_TOP + 10 + row * 13;
    ctx.fillStyle = row % 3 === 0 ? P.crest : P.seaDeep;
    let x = -10 + rnd() * 20;
    while (x < W + 10) {
      const w = 14 + rnd() * 26;
      ctx.fillRect(x, yy + (rnd() > 0.5 ? 1.5 : 0), w, 2);
      x += w + 10 + rnd() * 30;
    }
  }
}

// بيت بكسل بنسب حقيقية: الباب ≈ ٠٫٥ من الجدار والشخصية تمر منه
export function house(ctx, P, o, phase, doorOpen = false) {
  const { x, y, w } = o;
  const h = Math.round(w * 0.7), roofH = Math.round(w * 0.5);
  const wall = [P.wallA, P.wallB, P.wallC][o.tone || 0];
  // جدار بملمس حجري خفيف
  ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
  dither(ctx, x - w / 2, y - h, w, 8, 'rgba(0,0,0,.18)', 0.5);
  dither(ctx, x - w / 2, y - h + 10, w, h - 10, 'rgba(255,255,255,.05)', 0.25);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2, y - 4, w, 4);
  // سقف
  const roof = o.roof || 'gable';
  if (roof === 'gable') poly(ctx, [[x - w / 2 - 6, y - h], [x, y - h - roofH], [x + w / 2 + 6, y - h]], P.roofA);
  else if (roof === 'hip') poly(ctx, [[x - w / 2 - 6, y - h], [x - w / 4, y - h - roofH], [x + w / 4, y - h - roofH], [x + w / 2 + 6, y - h]], P.roofA);
  else poly(ctx, [[x - w / 2 - 6, y - h - roofH * 0.4], [x + w / 2 + 6, y - h - roofH], [x + w / 2 + 6, y - h]], P.roofA);
  // بلاطات السقف
  ctx.fillStyle = P.roofB;
  for (let i = 1; i < 4; i++) {
    const ry = y - h - (roofH * i) / 4;
    const rw = (w + 12) * (1 - i / 4.4);
    ctx.fillRect(x - rw / 2, ry, rw, 2);
  }
  ctx.fillStyle = P.roofC; ctx.fillRect(x - w / 2 - 6, y - h - 2, w + 12, 3);
  // نوافذ مضيئة ليلًا
  const lit = o.lit && (phase === 'night' || phase === 'dusk');
  const winCol = lit ? P.winLit : P.winDark;
  const wy = y - h + Math.round(h * 0.24), ws = Math.max(10, Math.round(w * 0.13));
  ctx.fillStyle = winCol;
  ctx.fillRect(x - w / 2 + 8, wy, ws, ws); ctx.fillRect(x + w / 2 - 8 - ws, wy, ws, ws);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x - w / 2 + 8 + ws / 2 - 1, wy, 2, ws); ctx.fillRect(x + w / 2 - 8 - ws + ws / 2 - 1, wy, 2, ws);
  ctx.fillRect(x - w / 2 + 8, wy + ws / 2 - 1, ws, 2); ctx.fillRect(x + w / 2 - 8 - ws, wy + ws / 2 - 1, ws, 2);
  if (lit) {
    ctx.fillStyle = 'rgba(255,200,87,.14)';
    ctx.fillRect(x - w / 2 + 4, wy - 4, ws + 8, ws + 8); ctx.fillRect(x + w / 2 - 12 - ws, wy - 4, ws + 8, ws + 8);
  }
  // الباب ≈ قامة الشخصية؛ يفتح عند دخول سامي
  const dw = Math.round(w * 0.2), dh = Math.round(h * 0.62);
  if (doorOpen) {
    ctx.fillStyle = '#05080F'; ctx.fillRect(x - dw / 2, y - dh, dw, dh); // فتحة مظلمة
    ctx.fillStyle = P.winDark; ctx.fillRect(x - dw / 2 - 4, y - dh, 4, dh); // مصراع مفتوح
    ctx.fillStyle = 'rgba(255,200,87,.35)'; ctx.fillRect(x - dw / 2 + 2, y - dh + 3, dw - 6, 4); // ضوء من الداخل
  } else {
    ctx.fillStyle = P.winDark; ctx.fillRect(x - dw / 2, y - dh, dw, dh);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - dw / 2, y - dh, dw, 3);
    ctx.fillStyle = 'rgba(255,200,87,.8)'; ctx.fillRect(x + dw / 2 - 5, y - dh / 2, 3, 3); // مقبض
  }
  // عتبة ومدخنة
  ctx.fillStyle = P.pathEdge; ctx.fillRect(x - dw / 2 - 3, y - 3, dw + 6, 3);
  if (o.tone !== 2) { ctx.fillStyle = P.roofB; ctx.fillRect(x + w / 4, y - h - roofH + 4, 9, 18); ctx.fillStyle = P.rockHi; ctx.fillRect(x + w / 4 - 1, y - h - roofH + 2, 11, 3); }
  return { chimneyX: x + w / 4 + 4, chimneyY: y - h - roofH + 2, lit, doorH: dh };
}

// بيت مهجور: سقف منهار، شباك مظلم، نباتات متسلقة
export function ruinedHouse(ctx, P, o) {
  const { x, y, w } = o; const h = Math.round(w * 0.66);
  ctx.fillStyle = P.wallB; ctx.fillRect(x - w / 2, y - h, w, h);
  dither(ctx, x - w / 2, y - h, w, h, 'rgba(0,0,0,.3)', 0.35);
  poly(ctx, [[x - w / 2 - 4, y - h], [x - w / 6, y - h - 18], [x + 4, y - h - 8], [x + w / 2 + 4, y - h]], P.roofB);
  ctx.fillStyle = '#05080F';
  ctx.fillRect(x - w / 3, y - h + 12, 13, 13); ctx.fillRect(x + 6, y - 22, 12, 22);
  ctx.fillStyle = P.grassHi;
  for (let i = 0; i < 7; i++) ctx.fillRect(x - w / 2 + i * 11, y - 6 - (i % 2) * 4, 2, 6 + (i % 2) * 4);
  dither(ctx, x - w / 2, y - h, 8, h, P.grassA, 0.5); // نبات متسلق
}

// الجرف الصخري
export function cliff(ctx, P, side) {
  const L = side === 'left';
  const top = L ? LEFT_CLIFF.top : RIGHT_CLIFF.top;
  const base = L ? LEFT_CLIFF.base : RIGHT_CLIFF.base;
  const edge = L ? LEFT_CLIFF.right : RIGHT_CLIFF.left;
  const x0 = L ? -6 : edge, x1 = L ? edge : W + 6;
  poly(ctx, [[x0, top], [x1, top], [x1, base], [x0, base]], P.rockA);
  const rnd = rng(L ? 11 : 13);
  for (let i = 0; i < (x1 - x0) / 12; i++) {
    const fx = x0 + rnd() * (x1 - x0 - 16), fy = top + 10 + rnd() * (base - top - 24);
    ctx.fillStyle = rnd() > 0.5 ? P.rockB : P.rockHi;
    poly(ctx, [[fx, fy], [fx + 9 + rnd() * 12, fy + 3], [fx + 5, fy + 12 + rnd() * 9]], ctx.fillStyle);
  }
  ctx.fillStyle = P.rockHi; ctx.fillRect(x0, top, x1 - x0, 3);
  ctx.fillStyle = P.grassA; ctx.fillRect(x0, top - 4, x1 - x0, 5);
  const rnd2 = rng(L ? 7 : 9);
  ctx.fillStyle = P.grassHi;
  for (let gx = x0 + 2; gx < x1 - 2; gx += 5) if (rnd2() > 0.4) ctx.fillRect(gx, top - 7 - rnd2() * 3, 2, 5);
}

// المنارة أكبر وبمراحل: جدر حجري + أحزمة + شرفة + مصباح. lamp: 0/1/2
export function lighthouse(ctx, P, phase, lamp) {
  const { x, baseY } = LIGHTHOUSE;
  const w = 34, h = 128;
  poly(ctx, [[x - w / 2 - 5, baseY], [x - w / 2 + 2, baseY - h], [x + w / 2 - 2, baseY - h], [x + w / 2 + 5, baseY]], P.wallC);
  ctx.fillStyle = P.roofA;
  for (let i = 0; i < 4; i++) {
    const yy = baseY - 20 - i * 28;
    ctx.fillRect(x - w / 2 - 3 + i, yy, w + 6 - i * 2, 8);
  }
  dither(ctx, x - w / 2, baseY - h, w, h, 'rgba(0,0,0,.16)', 0.4);
  // مدخل
  ctx.fillStyle = P.winDark; ctx.fillRect(x - 7, baseY - 24, 14, 24);
  ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x - 7, baseY - 24, 14, 3);
  // نوافذ
  ctx.fillStyle = P.winDark;
  ctx.fillRect(x - 4, baseY - 56, 8, 10); ctx.fillRect(x - 4, baseY - 88, 8, 10);
  // الشرفة والمصباح
  ctx.fillStyle = P.rockB; ctx.fillRect(x - w / 2 - 6, baseY - h - 10, w + 12, 10);
  for (let i = 0; i < 8; i++) ctx.fillRect(x - w / 2 - 6 + i * 6, baseY - h - 18, 2, 8);
  const lampOn = lamp > 0 && phase !== 'day';
  ctx.fillStyle = lampOn ? P.winLit : '#0A1226';
  ctx.fillRect(x - 8, baseY - h - 34, 16, 16);
  poly(ctx, [[x - 11, baseY - h - 34], [x, baseY - h - 46], [x + 11, baseY - h - 34]], P.roofB);
  ctx.fillStyle = P.roofB; ctx.fillRect(x - 1, baseY - h - 52, 2, 7);
  if (lampOn) {
    const g = ctx.createRadialGradient(x, baseY - h - 26, 2, x, baseY - h - 26, lamp === 2 ? 44 : 20);
    g.addColorStop(0, 'rgba(255,200,87,.55)'); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 46, baseY - h - 72, 92, 92);
  }
  return { lampX: x, lampY: baseY - h - 26 };
}

// شجرة الكرز
export function cherryTree(ctx, P) {
  const { x, y } = CHERRY_TREE;
  ctx.save(); ctx.translate(x, y); ctx.scale(CHERRY_TREE.scale || 1, CHERRY_TREE.scale || 1); ctx.translate(-x, -y);
  ctx.fillStyle = P.trunk;
  poly(ctx, [[x - 5, y], [x - 4, y - 40], [x + 5, y - 40], [x + 8, y]], P.trunk);
  poly(ctx, [[x - 4, y - 36], [x - 20, y - 52], [x - 16, y - 55], [x, y - 40]], P.trunk);
  poly(ctx, [[x + 4, y - 38], [x + 18, y - 50], [x + 20, y - 46], [x + 5, y - 36]], P.trunk);
  const blobs = [[0, -62, 36], [-24, -52, 22], [24, -55, 21], [-7, -76, 24], [15, -74, 19]];
  for (const [bx, by, r] of blobs) {
    ctx.fillStyle = P.leafB; ctx.fillRect(x + bx - r, y + by - r * 0.7, r * 2, r * 1.4);
    ctx.fillStyle = P.leafA; ctx.fillRect(x + bx - r + 4, y + by - r * 0.7 + 4, r * 2 - 8, r * 1.4 - 8);
  }
  ctx.fillStyle = P.leafHi;
  for (const [bx, by, r] of blobs) ctx.fillRect(x + bx - r + 3, y + by - r * 0.7 + 3, 8, 4);
  dither(ctx, x - 36, y - 84, 72, 48, P.leafHi, 0.12);
  ctx.restore();
}

// ظلال غابة عند المدخل الغربي
export function forestEdge(ctx, P) {
  const rnd = rng(41);
  for (let x = -6; x < FOREST_EDGE; x += 22) {
    const h = 60 + rnd() * 50;
    ctx.fillStyle = P.mountNear;
    poly(ctx, [[x, SHORE + 160], [x + 11, SHORE + 160 - h], [x + 22, SHORE + 160]], P.mountNear);
    poly(ctx, [[x + 3, SHORE + 160 - h * 0.5], [x + 11, SHORE + 160 - h * 1.2], [x + 19, SHORE + 160 - h * 0.5]], P.grassB);
  }
}

// كوخ الشاطئ (الصحة)
export function beachHut(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'health');
  const { x, y } = d;
  poly(ctx, [[x - 24, y], [x, y - 34], [x + 24, y]], '#8A6B4A');
  poly(ctx, [[x - 27, y - 3], [x, y - 37], [x + 27, y - 3]], '#A8845C');
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 2, y - 3, 3, 18);
  ctx.fillStyle = P.sandEdge; ctx.fillRect(x - 16, y + 12, 34, 9);
  ctx.fillStyle = P.roofA; ctx.fillRect(x - 12, y + 13, 6, 6); ctx.fillRect(x + 3, y + 13, 6, 6);
}

// الورشة (العمل): مبنى أوسع + طاولة وأدوات
export function workshop(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'work');
  const { x, y } = d;
  ctx.fillStyle = P.wallB; ctx.fillRect(x - 34, y - 46, 68, 46);
  dither(ctx, x - 34, y - 46, 68, 46, 'rgba(0,0,0,.15)', 0.3);
  poly(ctx, [[x - 40, y - 46], [x, y - 72], [x + 40, y - 46]], P.roofB);
  ctx.fillStyle = P.roofC; ctx.fillRect(x - 40, y - 48, 80, 3);
  const lit = phase === 'night' || phase === 'dusk';
  ctx.fillStyle = lit ? P.winLit : P.winDark;
  ctx.fillRect(x - 26, y - 36, 13, 13);
  ctx.fillStyle = '#05080F'; ctx.fillRect(x + 4, y - 30, 18, 30); // مدخل مفتوح
  ctx.fillStyle = P.rockB; ctx.fillRect(x - 8, y - 12, 26, 6);   // طاولة عمل
  ctx.fillStyle = P.rockHi; ctx.fillRect(x - 4, y - 18, 6, 6); ctx.fillRect(x + 8, y - 19, 5, 7);
}

// السوق (المال): دكان بمظلة مخططة وصناديق وفانوس
export function market(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'money');
  const { x, y } = d;
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 26, y - 30, 52, 30);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? P.roofA : '#EEF7F5'; ctx.fillRect(x - 30 + i * 10, y - 42, 10, 12); }
  poly(ctx, [[x - 30, y - 30], [x - 30, y - 26], [x + 30, y - 26], [x + 30, y - 30]], 'rgba(0,0,0,.2)');
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 30, y - 42, 3, 42); ctx.fillRect(x + 27, y - 42, 3, 42);
  ctx.fillStyle = '#C9A05C'; ctx.fillRect(x - 20, y - 16, 12, 10); ctx.fillRect(x - 4, y - 16, 12, 10);
  ctx.fillStyle = '#7FB069'; ctx.fillRect(x - 18, y - 20, 8, 5); ctx.fillStyle = '#C8412F'; ctx.fillRect(x - 2, y - 20, 8, 5);
  const lit = phase === 'night' || phase === 'dusk';
  ctx.fillStyle = lit ? '#FFC857' : P.winDark; ctx.fillRect(x + 14, y - 38, 6, 9);
  if (lit) { ctx.fillStyle = 'rgba(255,200,87,.18)'; ctx.fillRect(x + 10, y - 42, 14, 17); }
}

// الطريق الطبيعي: تراب مدموس بحواف غير منتظمة وحصى وعشب متسلل (لا شريط متجانس)
export function road(ctx, P, t0 = 0, t1 = 1) {
  const rnd = rng(99);
  // جسم الطريق بجرعات متدرجة العرض
  for (let t = t0; t <= t1 + 0.001; t += 0.012) {
    const p = pathPoint(t);
    const w = 15 + Math.sin(t * 9) * 3 + rnd() * 3;
    ctx.fillStyle = P.pathEdge;
    ctx.fillRect(p.x - w / 2 - 3, p.y - 4, w + 6, 9);
    ctx.fillStyle = rnd() > 0.25 ? P.pathA : P.pathB;
    ctx.fillRect(p.x - w / 2, p.y - 3.5, w, 8);
  }
  // حصى وبقع
  const rnd2 = rng(199);
  for (let t = t0; t < t1; t += 0.02) {
    const p = pathPoint(t);
    if (rnd2() > 0.55) { ctx.fillStyle = P.stone; ctx.fillRect(p.x + (rnd2() - 0.5) * 14, p.y + (rnd2() - 0.5) * 6, 2, 2); }
    if (rnd2() > 0.75) { ctx.fillStyle = P.pathEdge; ctx.fillRect(p.x + (rnd2() - 0.5) * 16, p.y + (rnd2() - 0.5) * 7, 3, 2); }
    if (rnd2() > 0.85) { ctx.fillStyle = P.grassHi; ctx.fillRect(p.x + (rnd2() - 0.5) * 20, p.y - 4, 2, 4); } // عشب على الأطراف
  }
}
