// بناء الطبقات الثابتة لمشهد قرية القمر بأسلوب بكسل (مستوحى من مراجع بكسل احترافية):
// تدرجات + حبك بالتنقيط (dither)، حواف مضاءة بالقمر، نوافذ عنبرية على كحلي بارد.
import { W, H, SKY_H, SEA_TOP, SHORE, LEFT_CLIFF, RIGHT_CLIFF, LIGHTHOUSE, MOON,
         VILLAGE_HOUSES, SAMI_HOUSE, ABANDONED_HOUSE, CHERRY_TREE, DESTINATIONS,
         pathPoint, rng } from './layout.js';

// لوحة ليل مضبوطة يدويًا (الكحلي الرسمي أساسها)
export const PAL = {
  night: {
    skyTop: '#030614', skyMid: '#0B1838', skyLow: '#1A3E63',
    mountFar: '#0C1A38', mountNear: '#12294A',
    seaA: '#0C2C50', seaB: '#081F3E', seaLine: '#1E5E7E',
    sandA: '#4A4258', sandB: '#38324A', sandEdge: '#5E5470',
    grassA: '#1C3A44', grassB: '#142C34', grassHi: '#2A5560',
    rockA: '#1E2A44', rockB: '#141E34', rockHi: '#33466A',
    pathA: '#3A3448', pathEdge: '#52485E',
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
    seaA: '#2E4A6E', seaB: '#223A5C', seaLine: '#C98A6A',
    sandA: '#8A6B5E', sandB: '#6E554E', sandEdge: '#A8846E',
    grassA: '#3A5A50', grassB: '#2C463E', grassHi: '#4E7A66',
    rockA: '#4E4460', rockB: '#3A3348', rockHi: '#6E5E80',
    pathA: '#6E5A52', pathEdge: '#8A7062',
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
    seaA: '#2E8EAE', seaB: '#1E6E92', seaLine: '#BFE4E4',
    sandA: '#D8BC8A', sandB: '#C0A070', sandEdge: '#EAD2A0',
    grassA: '#4E8A62', grassB: '#3C704E', grassHi: '#6AAA7C',
    rockA: '#8A7E72', rockB: '#6E6258', rockHi: '#B0A494',
    pathA: '#C0A87E', pathEdge: '#D8C096',
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
    seaA: '#3E3A66', seaB: '#2A2A50', seaLine: '#E0A06A',
    sandA: '#9A705E', sandB: '#7A584C', sandEdge: '#B88A70',
    grassA: '#3A5448', grassB: '#2C4038', grassHi: '#527A62',
    rockA: '#54486A', rockB: '#3E3652', rockHi: '#76688E',
    pathA: '#7A6258', pathEdge: '#967A6A',
    wallA: '#8A7688', wallB: '#6E5C6E', wallC: '#A894A4',
    roofA: '#B8503E', roofB: '#923C2E', roofC: '#D46854',
    winLit: '#FFC857', winDark: '#241E34',
    trunk: '#5E3E3E', leafA: '#B87E92', leafB: '#96647A', leafHi: '#DCA2B4',
    moon: '#FBEEDD', moonCrater: '#E0CBB2',
    fog: 'rgba(224,138,82,.12)',
  },
};

// تنقيط بكسل: نقاط 2×2 بشكل رقعة شطرنج بين لونين
export function dither(ctx, x, y, w, h, color, density = 0.5) {
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += 2)
    for (let xx = x + (yy % 4 === 0 ? 0 : 2); xx < x + w; xx += 4)
      if (((xx * 7 + yy * 13) % 100) / 100 < density) ctx.fillRect(xx, yy, 2, 2);
}

// مضلع مبكسل بحواف صلبة
export function poly(ctx, pts, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath(); ctx.fill();
}

// جبال بعيدة مسننة بحواف مضيئة
export function mountains(ctx, P, layer = 0, seed = 5) {
  const rnd = rng(seed + layer * 31);
  const base = SKY_H, amp = layer ? 58 : 84, step = layer ? 26 : 34;
  const col = layer ? P.mountNear : P.mountFar;
  const pts = [[-10, base]];
  let x = -10;
  while (x < W + 10) { pts.push([x, base - 20 - rnd() * amp]); x += step * (0.6 + rnd() * 0.8); }
  pts.push([W + 10, base]);
  poly(ctx, pts, col);
  // إضاءة حافة علوية خافتة
  ctx.fillStyle = layer ? 'rgba(207,245,234,.10)' : 'rgba(207,245,234,.06)';
  for (let i = 1; i < pts.length - 1; i++) ctx.fillRect(pts[i][0] - 1, pts[i][1] - 2, 3, 2);
}

// بيت بكسل عام: جدار + سقف + نوافذ + باب + مدخنة
export function house(ctx, P, o, phase) {
  const { x, y, w } = o;
  const h = Math.round(w * 0.62), roofH = Math.round(w * 0.4);
  const wall = [P.wallA, P.wallB, P.wallC][o.tone || 0];
  // جدار
  ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h);
  dither(ctx, x - w / 2, y - h, w, 6, 'rgba(0,0,0,.18)', 0.5);           // ظل تحت السقف
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - w / 2, y - 3, w, 3); // قاعدة
  // سقف
  const roof = o.roof || 'gable';
  ctx.fillStyle = P.roofA;
  if (roof === 'gable') poly(ctx, [[x - w / 2 - 4, y - h], [x, y - h - roofH], [x + w / 2 + 4, y - h]], P.roofA);
  else if (roof === 'hip') poly(ctx, [[x - w / 2 - 4, y - h], [x - w / 4, y - h - roofH], [x + w / 4, y - h - roofH], [x + w / 2 + 4, y - h]], P.roofA);
  else poly(ctx, [[x - w / 2 - 4, y - h - roofH * 0.4], [x + w / 2 + 4, y - h - roofH], [x + w / 2 + 4, y - h]], P.roofA);
  ctx.fillStyle = P.roofC; ctx.fillRect(x - w / 2 - 4, y - h - 2, w + 8, 2); // حافة مضاءة
  // نوافذ: مضاءة عنبريًا ليلًا إن كان البيت حيًا
  const lit = o.lit && (phase === 'night' || phase === 'dusk');
  const winCol = lit ? P.winLit : P.winDark;
  const wy = y - h + Math.round(h * 0.3);
  ctx.fillStyle = winCol;
  ctx.fillRect(x - w / 2 + 6, wy, 8, 8); ctx.fillRect(x + w / 2 - 14, wy, 8, 8);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.fillRect(x - w / 2 + 9, wy, 2, 8); ctx.fillRect(x + w / 2 - 11, wy, 2, 8);
  if (lit) { // توهج خفيف حول النوافذ المضاءة
    ctx.fillStyle = 'rgba(255,200,87,.14)';
    ctx.fillRect(x - w / 2 + 3, wy - 3, 14, 14); ctx.fillRect(x + w / 2 - 17, wy - 3, 14, 14);
  }
  // باب
  ctx.fillStyle = P.winDark; ctx.fillRect(x - 5, y - 16, 10, 16);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - 5, y - 16, 10, 2);
  // مدخنة
  if (o.tone !== 2) { ctx.fillStyle = P.roofB; ctx.fillRect(x + w / 4, y - h - roofH + 2, 6, 12); }
  return { chimneyX: x + w / 4 + 3, chimneyY: y - h - roofH + 2, lit };
}

// بيت مهجور: سقف مكسور، شباك مظلم، نباتات
export function ruinedHouse(ctx, P, o) {
  const { x, y, w } = o; const h = Math.round(w * 0.6);
  ctx.fillStyle = P.wallB; ctx.fillRect(x - w / 2, y - h, w, h);
  dither(ctx, x - w / 2, y - h, w, h, 'rgba(0,0,0,.3)', 0.35);
  poly(ctx, [[x - w / 2 - 3, y - h], [x - w / 6, y - h - 12], [x + 2, y - h - 5], [x + w / 2 + 3, y - h]], P.roofB); // سقف منهار
  ctx.fillStyle = '#05080F'; ctx.fillRect(x - 8, y - h + 8, 9, 9); ctx.fillRect(x + 4, y - 14, 8, 14);
  ctx.fillStyle = P.grassHi;
  for (let i = 0; i < 5; i++) ctx.fillRect(x - w / 2 + i * 8, y - 4 - (i % 2) * 3, 2, 4 + (i % 2) * 3);
}

// الجرف الصخري بأوجه مظللة وحواف عشبية
export function cliff(ctx, P, side) {
  const L = side === 'left';
  const top = L ? LEFT_CLIFF.top : RIGHT_CLIFF.top;
  const base = L ? LEFT_CLIFF.base : RIGHT_CLIFF.base;
  const edge = L ? LEFT_CLIFF.right : RIGHT_CLIFF.left;
  const x0 = L ? -6 : edge, x1 = L ? edge : W + 6;
  poly(ctx, [[x0, top], [x1, top], [x1, base], [x0, base]], P.rockA);
  // أوجه صخرية مائلة
  const rnd = rng(L ? 11 : 13);
  for (let i = 0; i < 12; i++) {
    const fx = x0 + rnd() * (x1 - x0 - 14), fy = top + 8 + rnd() * (base - top - 20);
    ctx.fillStyle = rnd() > 0.5 ? P.rockB : P.rockHi;
    poly(ctx, [[fx, fy], [fx + 8 + rnd() * 10, fy + 3], [fx + 4, fy + 10 + rnd() * 8]], ctx.fillStyle);
  }
  // حافة علوية مضاءة + عشب
  ctx.fillStyle = P.rockHi; ctx.fillRect(x0, top, x1 - x0, 3);
  ctx.fillStyle = P.grassA; ctx.fillRect(x0, top - 3, x1 - x0, 4);
  const rnd2 = rng(L ? 7 : 9);
  ctx.fillStyle = P.grassHi;
  for (let gx = x0 + 2; gx < x1 - 2; gx += 5) if (rnd2() > 0.4) ctx.fillRect(gx, top - 5 - rnd2() * 3, 2, 4);
}

// المنارة بمراحلها: جدر حجري مبكسل + شرفة + مصباح. lamp: 0 مظلمة، 1 خافتة، 2 كاملة
export function lighthouse(ctx, P, phase, lamp) {
  const { x, baseY } = LIGHTHOUSE;
  const w = 22, h = 88;
  // الجسم المدبب بصفوف حجر
  ctx.fillStyle = P.wallC;
  poly(ctx, [[x - w / 2 - 3, baseY], [x - w / 2, baseY - h], [x + w / 2, baseY - h], [x + w / 2 + 3, baseY]], P.wallC);
  ctx.fillStyle = P.roofA;
  for (let i = 0; i < 4; i++) { // أحزمة تيل
    const yy = baseY - 14 - i * 20;
    ctx.fillRect(x - w / 2 - 2 + i, yy, w + 4 - i * 2, 6);
  }
  dither(ctx, x - w / 2, baseY - h, w, h, 'rgba(0,0,0,.16)', 0.4);
  // نوافذ صغيرة
  ctx.fillStyle = P.winDark;
  ctx.fillRect(x - 3, baseY - 30, 6, 8); ctx.fillRect(x - 3, baseY - 52, 6, 8);
  // الشرفة والمصباح
  ctx.fillStyle = P.rockB; ctx.fillRect(x - w / 2 - 5, baseY - h - 8, w + 10, 8);
  for (let i = 0; i < 6; i++) ctx.fillRect(x - w / 2 - 5 + i * 5, baseY - h - 14, 2, 6);
  const lampOn = lamp > 0 && (phase === 'night' || phase === 'dusk' || phase === 'dawn');
  ctx.fillStyle = lampOn ? P.winLit : '#0A1226';
  ctx.fillRect(x - 6, baseY - h - 24, 12, 12);
  poly(ctx, [[x - 8, baseY - h - 24], [x, baseY - h - 32], [x + 8, baseY - h - 24]], P.roofB);
  if (lampOn) {
    const g = ctx.createRadialGradient(x, baseY - h - 18, 2, x, baseY - h - 18, lamp === 2 ? 30 : 14);
    g.addColorStop(0, 'rgba(255,200,87,.55)'); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 32, baseY - h - 50, 64, 64);
  }
  return { lampX: x, lampY: baseY - h - 18 };
}

// شجرة الكرز: جذع ملتوٍ + مظلة مبكسلة بحافة مضيئة من جهة القمر
export function cherryTree(ctx, P) {
  const { x, y } = CHERRY_TREE;
  ctx.save(); ctx.translate(x, y); ctx.scale(CHERRY_TREE.scale || 1, CHERRY_TREE.scale || 1); ctx.translate(-x, -y);
  ctx.fillStyle = P.trunk;
  poly(ctx, [[x - 4, y], [x - 3, y - 34], [x + 4, y - 34], [x + 6, y]], P.trunk);
  poly(ctx, [[x - 3, y - 30], [x - 16, y - 44], [x - 13, y - 46], [x, y - 34]], P.trunk);
  poly(ctx, [[x + 3, y - 32], [x + 14, y - 42], [x + 16, y - 39], [x + 4, y - 30]], P.trunk);
  const blobs = [[0, -52, 30], [-20, -44, 18], [20, -46, 17], [-6, -64, 20], [12, -62, 16]];
  for (const [bx, by, r] of blobs) {
    ctx.fillStyle = P.leafB; ctx.fillRect(x + bx - r, y + by - r * 0.7, r * 2, r * 1.4);
    ctx.fillStyle = P.leafA; ctx.fillRect(x + bx - r + 3, y + by - r * 0.7 + 3, r * 2 - 6, r * 1.4 - 6);
  }
  // إضاءة قمرية على أطراف المظلة (يسارًا جهة القمر)
  ctx.fillStyle = P.leafHi;
  for (const [bx, by, r] of blobs) ctx.fillRect(x + bx - r + 2, y + by - r * 0.7 + 2, 6, 3);
  dither(ctx, x - 30, y - 70, 60, 40, P.leafHi, 0.12);
  ctx.restore();
}

// كوخ الشاطئ (وجهة الصحة): مظلة قش + حصيرة
export function beachHut(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'health');
  const { x, y } = d;
  poly(ctx, [[x - 16, y], [x, y - 22], [x + 16, y]], '#8A6B4A');
  poly(ctx, [[x - 18, y - 2], [x, y - 24], [x + 18, y - 2]], '#A8845C');
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 1, y - 2, 2, 12);
  ctx.fillStyle = P.sandEdge; ctx.fillRect(x - 10, y + 8, 22, 6); // حصيرة
  ctx.fillStyle = P.roofA; ctx.fillRect(x - 8, y + 9, 4, 4); ctx.fillRect(x + 2, y + 9, 4, 4);
}

// الورشة (وجهة العمل): سقيفة + سندان وأدوات
export function workshop(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'work');
  const { x, y } = d;
  ctx.fillStyle = P.wallB; ctx.fillRect(x - 18, y - 24, 36, 24);
  poly(ctx, [[x - 22, y - 24], [x, y - 36], [x + 22, y - 24]], P.roofB);
  ctx.fillStyle = P.winLit && (phase === 'night' || phase === 'dusk') ? P.winLit : P.winDark;
  ctx.fillRect(x - 12, y - 18, 8, 8);
  ctx.fillStyle = P.rockB; ctx.fillRect(x + 2, y - 20, 12, 4); // طاولة عمل
  ctx.fillStyle = P.rockHi; ctx.fillRect(x + 4, y - 24, 4, 4); // أدوات
  ctx.fillRect(x + 10, y - 24, 3, 4);
}

// السوق (وجهة المال): دكان بمظلة مخططة وبضائع
export function market(ctx, P, phase) {
  const d = DESTINATIONS.find(d => d.id === 'money');
  const { x, y } = d;
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 16, y - 18, 32, 18);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? P.roofA : '#EEF7F5'; ctx.fillRect(x - 18 + i * 8, y - 26, 8, 8); }
  ctx.fillStyle = '#8A6B4A'; ctx.fillRect(x - 18, y - 26, 2, 26); ctx.fillRect(x + 16, y - 26, 2, 26);
  ctx.fillStyle = '#C9A05C'; ctx.fillRect(x - 12, y - 10, 8, 6); ctx.fillRect(x - 2, y - 10, 8, 6); // صناديق
  const lit = phase === 'night' || phase === 'dusk';
  ctx.fillStyle = lit ? '#FFC857' : P.winDark; ctx.fillRect(x + 8, y - 22, 4, 6); // فانوس
  if (lit) { ctx.fillStyle = 'rgba(255,200,87,.18)'; ctx.fillRect(x + 5, y - 25, 10, 12); }
}
