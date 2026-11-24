// بناء الطبقات الثابتة لعالم قرية القمر بأسلوب بكسل احترافي.
// المقاسات: الباب ≈ قامة سامي (الشخصية ~٥٠px). المراجع: SLYNYRD (ماء متحرك)،
// Nasha's Haunted Lighthouse (تنقيط وإضاءة ليلية)، أعراف Stardew لنسب القرى.
import { W, H, SKY_H, SEA_TOP, SHORE, LEFT_CLIFF, RIGHT_CLIFF, LIGHTHOUSE, MOON,
         CHERRY_TREE, FOREST_EDGE, DESTINATIONS, pathPoint, rng } from './layout.js';

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
        wallD: '#26334C', timber: '#2A2030', plinth: '#2E3A52', roofEave: '#0B4446',
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
        wallD: '#4E4558', timber: '#4E3636', plinth: '#565060', roofEave: '#7A382E',
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
        wallD: '#B0A48C', timber: '#7A5A44', plinth: '#A99A80', roofEave: '#7E2A1C',
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
        wallD: '#5C4E5E', timber: '#523838', plinth: '#5E5466', roofEave: '#74342A',
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

// دمج لونين hex بنسبة t نحو الثاني (للمنظور الجوي)
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

// جبال بعيدة مسننة بحواف مضيئة — منظور جوي رقمي: كل مستوى يُمزج نحو لون ضباب الأفق
// (pixeli قاعدة ٨: مزج ٠/٢٥/٥٠٪ لكل مستوى — تطبيقنا: بعيد ٥٠٪ نحو skyLow، قريب ٢٥٪)
export function mountains(ctx, P, layer = 0, seed = 5) {
  const rnd = rng(seed + layer * 31);
  const base = SKY_H, amp = layer ? 52 : 76, step = layer ? 30 : 40;
  const pts = [[-10, base]];
  let x = -10;
  while (x < W + 10) { pts.push([x, base - 16 - rnd() * amp]); x += step * (0.6 + rnd() * 0.8); }
  pts.push([W + 10, base]);
  const col = mix(layer ? P.mountNear : P.mountFar, P.skyLow, layer ? 0.25 : 0.5);
  poly(ctx, pts, col);
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
export function house(ctx, P, o, phase) {
  const { x, y, w } = o;
  const h = Math.round(w * 0.62), roofH = Math.round(w * 0.44);
  const wall = [P.wallA, P.wallB, P.wallC][o.tone || 0];
  const L = x - w / 2, R = x + w / 2, T = y - 7 - h; // جدار فوق قاعدة 7px

  // أرضية مهترئة حول البيت تربطه بالموقع (قاعدة: connection to the earth)
  ctx.fillStyle = P.pathA; ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.ellipse(x, y + 2, w / 2 + 12, 8, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  dither(ctx, L - 10, y - 3, w + 20, 8, P.pathEdge, 0.3);

  // القاعدة الحجرية (plinth)
  ctx.fillStyle = P.plinth; ctx.fillRect(L - 2, y - 7, w + 4, 7);
  dither(ctx, L - 2, y - 7, w + 4, 7, P.rockB, 0.4);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(L - 2, y - 2, w + 4, 2);

  // الجدار بحد أغمق منه بدرجة (لا أسود صريح)
  ctx.fillStyle = wall; ctx.fillRect(L, T, w, h);
  ctx.strokeStyle = P.wallD; ctx.lineWidth = 2;
  ctx.strokeRect(L + 1, T + 1, w - 2, h + 6);
  dither(ctx, L, T, w, h, 'rgba(255,255,255,.05)', 0.2);
  dither(ctx, L, y - 20, w, 13, 'rgba(0,0,0,.14)', 0.35); // ظل سفلي
  // عوارض خشبية: زاويتان + تاج تحت السقف
  ctx.fillStyle = P.timber;
  ctx.fillRect(L, T, 4, h); ctx.fillRect(R - 4, T, 4, h);
  ctx.fillRect(L, T, w, 4);

  // ظل الأفاريز على الجدار (عمق من الإضاءة)
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(L - 2, T - 2, w + 4, 5);

  // سقف جملوني واحد الميل لكل القرية + خطوط بلاط + حافة مضيئة
  poly(ctx, [[L - 8, T - 3], [x, T - 3 - roofH], [R + 8, T - 3]], P.roofA);
  ctx.strokeStyle = P.roofEave; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(L - 8, T - 3); ctx.lineTo(x, T - 3 - roofH); ctx.lineTo(R + 8, T - 3); ctx.stroke();
  ctx.strokeStyle = P.roofB; ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) {
    const ry = T - 3 - (roofH * i) / 4, rw = (w + 16) * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(x - rw / 2, ry); ctx.lineTo(x + rw / 2, ry); ctx.stroke();
  }
  ctx.fillStyle = P.roofC; ctx.fillRect(x - 5, T - 6 - roofH, 10, 5); // تاج القمة

  // نوافذ بإطار خشبي وعتبة؛ مضيئة ليلًا بهالة
  const lit = o.lit && (phase === 'night' || phase === 'dusk');
  const ws = Math.max(10, Math.round(w * 0.12));
  const wy = T + Math.round(h * 0.28);
  for (const wx of [L + Math.round(w * 0.16), R - Math.round(w * 0.16) - ws]) {
    ctx.fillStyle = P.timber; ctx.fillRect(wx - 2, wy - 2, ws + 4, ws + 4);
    ctx.fillStyle = lit ? P.winLit : P.winDark; ctx.fillRect(wx, wy, ws, ws);
    ctx.fillStyle = P.timber;
    ctx.fillRect(wx + ws / 2 - 1, wy, 2, ws); ctx.fillRect(wx, wy + ws / 2 - 1, ws, 2);
    ctx.fillRect(wx - 3, wy + ws + 2, ws + 6, 2); // عتبة
    if (lit) { ctx.fillStyle = 'rgba(255,200,87,.15)'; ctx.fillRect(wx - 5, wy - 5, ws + 10, ws + 10); }
  }

  // الباب مغلق دائمًا في الطبقة الثابتة؛ الفتح المتحرك يرسمه doorway()
  const dw = Math.round(w * 0.2), dh = Math.round(h * 0.62);
  ctx.fillStyle = P.wallD; ctx.fillRect(x - dw / 2 - 3, y - 7 - dh - 3, dw + 6, dh + 6); // إطار غائص
  ctx.fillStyle = P.winDark; ctx.fillRect(x - dw / 2, y - 7 - dh, dw, dh);
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1;
  for (let px = x - dw / 2 + 5; px < x + dw / 2; px += 6) { ctx.beginPath(); ctx.moveTo(px, y - 7 - dh + 2); ctx.lineTo(px, y - 9); ctx.stroke(); }
  ctx.fillStyle = P.timber; ctx.fillRect(x - dw / 2 - 4, y - 7 - dh - 6, dw + 8, 3); // عتبة علوية
  ctx.fillStyle = 'rgba(255,200,87,.85)'; ctx.fillRect(x + dw / 2 - 6, y - 7 - dh / 2 - 1, 3, 3); // مقبض
  ctx.fillStyle = P.plinth; ctx.fillRect(x - dw / 2 - 4, y - 4, dw + 8, 4); // درجة

  // مدخنة بتاج حجري
  if (o.tone !== 1) {
    ctx.fillStyle = P.plinth; ctx.fillRect(x + w / 4, T - roofH + 8, 10, 22);
    ctx.fillStyle = P.rockHi; ctx.fillRect(x + w / 4 - 1, T - roofH + 6, 12, 3);
    ctx.strokeStyle = P.wallD; ctx.lineWidth = 1; ctx.strokeRect(x + w / 4 + 0.5, T - roofH + 8.5, 9, 21);
  }
  return { chimneyX: x + w / 4 + 5, chimneyY: T - roofH + 4, lit,
           door: { x, y: y - 7, w: dw, h: dh } };
}

// فتح الباب المتحرك (طبقة حية فوق الثابتة): t من 0 مغلق إلى 1 مفتوح
export function doorway(ctx, P, d, t, phase) {
  if (t <= 0.01) return;
  const night = phase !== 'day';
  // فتحة داكنة تتسع
  ctx.fillStyle = `rgba(4,6,12,${0.4 + 0.6 * t})`;
  ctx.fillRect(d.x - d.w / 2, d.y - d.h, d.w, d.h);
  // توهج داخلي دافئ
  if (night) {
    const g = ctx.createRadialGradient(d.x, d.y - d.h * 0.55, 1, d.x, d.y - d.h * 0.55, d.h);
    g.addColorStop(0, `rgba(255,190,90,${0.5 * t})`); g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g; ctx.fillRect(d.x - d.h, d.y - d.h * 1.8, d.h * 2, d.h * 2);
  }
  // مصراع مفصلي يدور للخارج (متوازي أضلاع يضيق مع الفتح)
  const sw = Math.round(d.w * 0.9 * t);
  if (sw > 1) {
    poly(ctx, [[d.x - d.w / 2, d.y - d.h], [d.x - d.w / 2 - sw * 0.45, d.y - d.h + 4],
               [d.x - d.w / 2 - sw * 0.45, d.y - 1], [d.x - d.w / 2, d.y - 1]], '#1A2438');
    ctx.fillStyle = 'rgba(255,255,255,.07)';
    ctx.fillRect(d.x - d.w / 2 - sw * 0.45, d.y - d.h + 4, 2, d.h - 5);
  }
  // بقعة ضوء تنسكب على الأرض
  if (night) {
    ctx.fillStyle = `rgba(255,200,87,${0.16 * t})`;
    poly(ctx, [[d.x - d.w / 2, d.y], [d.x + d.w / 2, d.y], [d.x + d.w, d.y + 14], [d.x - d.w, d.y + 14]], ctx.fillStyle);
  }
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
  const h = 132, wB = 44, wT = 26;
  // صخرة القاعدة
  poly(ctx, [[x - 30, baseY + 6], [x - 22, baseY - 6], [x + 24, baseY - 6], [x + 32, baseY + 6]], P.rockB);
  ctx.fillStyle = P.rockHi; ctx.fillRect(x - 22, baseY - 8, 46, 3);

  // جسم البرج المدبب بحد أغمق من الجدار (منظور واحد، إضاءة من اليسار)
  poly(ctx, [[x - wB / 2, baseY - 6], [x - wT / 2, baseY - 6 - h], [x + wT / 2, baseY - 6 - h], [x + wB / 2, baseY - 6]], P.wallC);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  poly(ctx, [[x + wT / 2 - 5, baseY - 6 - h], [x + wT / 2, baseY - 6 - h], [x + wB / 2, baseY - 6], [x + wB / 2 - 8, baseY - 6]], ctx.fillStyle);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - wB / 2 + 2, baseY - 8 - h + 4, 3, h - 2);
  dither(ctx, x - wB / 2, baseY - 6 - h, wB, h, 'rgba(0,0,0,.10)', 0.25);

  // حزامان أحمران يتبعان التدبب
  const wAt = (yy) => wB - (wB - wT) * ((baseY - 6 - yy) / h);
  for (const [fy, bh] of [[baseY - 44, 12], [baseY - 92, 11]]) {
    const ww = wAt(fy);
    ctx.fillStyle = P.roofA; ctx.fillRect(x - ww / 2, fy, ww, bh);
    ctx.fillStyle = P.roofEave; ctx.fillRect(x - ww / 2, fy, ww, 2);
  }

  // المدخل بقوس ودرجة
  ctx.fillStyle = P.winDark; ctx.fillRect(x - 6, baseY - 28, 12, 22);
  ctx.fillRect(x - 5, baseY - 31, 10, 3);
  ctx.strokeStyle = P.wallD; ctx.lineWidth = 2; ctx.strokeRect(x - 6, baseY - 28, 12, 22);
  ctx.fillStyle = P.plinth; ctx.fillRect(x - 8, baseY - 7, 16, 3);

  // شباكان ضيقان بإطار
  for (const wy of [baseY - 62, baseY - 110]) {
    const ww = wAt(wy);
    ctx.fillStyle = P.wallD; ctx.fillRect(x - 4, wy, 8, 11);
    ctx.fillStyle = P.winDark; ctx.fillRect(x - 3, wy + 1, 6, 9);
  }

  // شرفة بحاجز + ظل سفلي
  const gy = baseY - 6 - h;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(x - wT / 2 - 6, gy, wT + 12, 3);
  ctx.fillStyle = P.rockB; ctx.fillRect(x - wT / 2 - 8, gy - 5, wT + 16, 6);
  ctx.fillStyle = P.rockHi; ctx.fillRect(x - wT / 2 - 8, gy - 5, wT + 16, 2);
  ctx.fillStyle = P.rockB;
  for (let i = 0; i <= 7; i++) ctx.fillRect(x - wT / 2 - 8 + i * ((wT + 16) / 7), gy - 14, 2, 9);
  ctx.fillRect(x - wT / 2 - 8, gy - 14, wT + 16, 2);

  // غرفة المصباح: زجاج بقواطع
  const lampOn = lamp > 0 && phase !== 'day';
  ctx.fillStyle = P.rockB; ctx.fillRect(x - 10, gy - 32, 20, 18);
  ctx.fillStyle = lampOn ? P.winLit : '#0A1226'; ctx.fillRect(x - 8, gy - 30, 16, 14);
  ctx.fillStyle = P.rockB;
  ctx.fillRect(x - 1, gy - 30, 2, 14); ctx.fillRect(x - 8, gy - 24, 16, 2);
  // قبة وقضيب
  poly(ctx, [[x - 11, gy - 32], [x, gy - 44], [x + 11, gy - 32]], P.roofA);
  ctx.fillStyle = P.roofEave; ctx.fillRect(x - 11, gy - 34, 22, 2);
  ctx.fillStyle = P.roofB; ctx.fillRect(x - 1, gy - 50, 2, 7);
  ctx.fillRect(x - 3, gy - 52, 6, 2);

  if (lampOn) {
    const g = ctx.createRadialGradient(x, gy - 23, 2, x, gy - 23, lamp === 2 ? 46 : 22);
    g.addColorStop(0, 'rgba(255,200,87,.55)'); g.addColorStop(1, 'rgba(255,200,87,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 48, gy - 70, 96, 96);
  }
  return { lampX: x, lampY: gy - 23 };
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
    const w = 19 + Math.sin(t * 9) * 3.5 + rnd() * 3;
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
