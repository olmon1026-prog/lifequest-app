// رسم مشهد قرية القمر على الكانفس (ألوان من tokens والنموذج المعتمد)
import { W, H, SEA_TOP, SAND_TOP, DESTINATIONS, pathPoint, stars } from './layout.js';

const STARFIELD = stars(7);

export function drawScene(ctx, w, h, time = 0) {
  const sx = w / W, sy = h / H;
  ctx.save();
  ctx.scale(sx, sy);

  // السماء
  const sky = ctx.createLinearGradient(0, 0, 0, SEA_TOP + 60);
  sky.addColorStop(0, '#050A20');
  sky.addColorStop(0.55, '#0B1A4A');
  sky.addColorStop(0.85, '#17408A');
  sky.addColorStop(1, '#2C8CA0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, SEA_TOP + 60);

  // النجوم (وميض خفيف)
  for (const s of STARFIELD) {
    const tw = 0.55 + 0.45 * Math.sin(time / 700 + s.x * 3.1 + s.y);
    ctx.globalAlpha = s.o * tw;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(s.x, s.y, s.r, s.r);
  }
  ctx.globalAlpha = 1;

  // القمر وهالته
  const mx = 285, my = 105, mr = 42;
  const glow = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 2.6);
  glow.addColorStop(0, 'rgba(207,245,234,.5)');
  glow.addColorStop(1, 'rgba(207,245,234,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);
  const moon = ctx.createRadialGradient(mx - 8, my - 8, 4, mx, my, mr);
  moon.addColorStop(0, '#FFFFF2');
  moon.addColorStop(1, '#D4F2EA');
  ctx.fillStyle = moon;
  ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(160,200,200,.35)';
  ctx.beginPath(); ctx.arc(mx - 12, my - 8, 7, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(mx + 12, my + 12, 5, 0, 7); ctx.fill();

  // البحر
  const sea = ctx.createLinearGradient(0, SEA_TOP, 0, SAND_TOP + 40);
  sea.addColorStop(0, '#2C8CA0');
  sea.addColorStop(1, '#0C2C5A');
  ctx.fillStyle = sea;
  ctx.fillRect(0, SEA_TOP, W, SAND_TOP + 40 - SEA_TOP);
  // لمعة القمر على الماء
  ctx.fillStyle = 'rgba(244,255,248,.5)';
  for (let i = 0; i < 7; i++) {
    const lw = 60 - i * 7;
    ctx.globalAlpha = 0.55 - i * 0.06;
    ctx.fillRect(mx - lw / 2 + Math.sin(time / 500 + i) * 4, SEA_TOP + 10 + i * 14, lw, 3);
  }
  ctx.globalAlpha = 1;

  // الرمال
  const sand = ctx.createLinearGradient(0, SAND_TOP, 0, H);
  sand.addColorStop(0, '#C9A876');
  sand.addColorStop(1, '#8A6B4A');
  ctx.fillStyle = sand;
  ctx.fillRect(0, SAND_TOP, W, H - SAND_TOP);
  // الطريق المتعرج
  ctx.strokeStyle = '#E8D5A8';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = 0; t <= 1.001; t += 0.05) {
    const p = pathPoint(t);
    t === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // الوجهات
  for (const d of DESTINATIONS) drawDestination(ctx, d, time);

  ctx.restore();
}

function drawDestination(ctx, d, time) {
  const { x, y, kind } = d;
  ctx.save();
  ctx.translate(x, y);
  switch (kind) {
    case 'lighthouse': {
      ctx.fillStyle = '#EEF7F5'; ctx.fillRect(-11, -80, 22, 80);
      ctx.fillStyle = '#C8412F';
      ctx.fillRect(-11, -70, 22, 10); ctx.fillRect(-11, -48, 22, 10); ctx.fillRect(-11, -26, 22, 10);
      ctx.fillStyle = '#0E2238'; ctx.fillRect(-8, -95, 16, 15);
      const pulse = 0.5 + 0.5 * Math.sin(time / 600);
      ctx.fillStyle = `rgba(255,200,87,${0.5 + pulse * 0.5})`;
      ctx.beginPath(); ctx.arc(0, -88, 6 + pulse * 2, 0, 7); ctx.fill();
      const beam = ctx.createLinearGradient(0, -88, -110, -60);
      beam.addColorStop(0, 'rgba(255,200,87,.35)'); beam.addColorStop(1, 'rgba(255,200,87,0)');
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(-115, -70); ctx.lineTo(-115, -46); ctx.closePath(); ctx.fill();
      break;
    }
    case 'workshop': {
      ctx.fillStyle = '#4B6472'; ctx.fillRect(-28, -34, 56, 34);
      ctx.fillStyle = '#0E2238'; ctx.fillRect(-32, -42, 64, 10);
      ctx.fillStyle = '#FFC857'; ctx.fillRect(-20, -26, 12, 12); ctx.fillRect(8, -26, 12, 12);
      ctx.fillStyle = '#1a1c2c'; ctx.fillRect(-6, -20, 12, 20);
      break;
    }
    case 'beach': {
      ctx.fillStyle = '#C8412F';
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-26, 0); ctx.lineTo(26, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#EEF7F5';
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(-9, 0); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8A6B4A'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.stroke();
      break;
    }
    case 'house': {
      ctx.fillStyle = '#CFF5EA'; ctx.fillRect(-24, -30, 48, 30);
      ctx.fillStyle = '#167A7A';
      ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(0, -52); ctx.lineTo(30, -30); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFC857'; ctx.fillRect(-16, -22, 10, 10); ctx.fillRect(7, -22, 10, 10);
      ctx.fillStyle = '#0E2238'; ctx.fillRect(-5, -18, 11, 18);
      break;
    }
    case 'market': {
      ctx.fillStyle = '#8A6B4A'; ctx.fillRect(-26, -26, 52, 26);
      ctx.fillStyle = '#FFC857'; ctx.fillRect(-30, -36, 60, 12);
      ctx.fillStyle = '#C8412F';
      for (let i = 0; i < 4; i++) ctx.fillRect(-30 + i * 15, -36, 7.5, 12);
      ctx.fillStyle = '#7FE0CF'; ctx.fillRect(-18, -18, 10, 8); ctx.fillRect(8, -18, 10, 8);
      break;
    }
  }
  ctx.restore();
}
