// هندسة الكاميرا اليدوية — دوال نقية بلا DOM حتى تُختبر بـ Node.
import { W, H, VIEW_W, VIEW_H } from './layout.js';
export const HUD_PAD = 64; // الشريط العلوي + السفلي (نفس usableTop/usableBottom في viewOffY)

export const coverScale = (bw, bh) => Math.max(bw / VIEW_W, bh / VIEW_H);
export const followOffX = (bw, scale) => (bw - VIEW_W * scale) / 2;
// مركز نافذة التتبع بالعالم = camXi + VIEW_W/2 دائمًا (حتى لو offX سالب)
export const followCenterX = (camXi) => camXi + VIEW_W / 2;

// أصغر زوم: العالم كله بين شريطي الـHUD
export function fitZoomFor(bw, bh, scale) {
  const usableH = Math.max(bh - 2 * HUD_PAD, bh * 0.5);
  return Math.min(1, Math.min(bw / W, usableH / H) / scale);
}
export function clampView(v, bw, bh, scale) {
  v.zoom = Math.max(fitZoomFor(bw, bh, scale), Math.min(1, v.zoom));
  const vsc = scale * v.zoom, visW = bw / vsc, visH = bh / vsc;
  v.cx = visW >= W ? W / 2 : Math.min(W - visW / 2, Math.max(visW / 2, v.cx));
  v.cy = visH >= H ? H / 2 : Math.min(H - visH / 2, Math.max(visH / 2, v.cy));
  return v;
}
export const worldToScreen = (v, bw, bh, scale, x, y) =>
  ({ x: bw / 2 + (x - v.cx) * scale * v.zoom, y: bh / 2 + (y - v.cy) * scale * v.zoom });
export const screenToWorld = (v, bw, bh, scale, sx, sy) =>
  ({ x: v.cx + (sx - bw / 2) / (scale * v.zoom), y: v.cy + (sy - bh / 2) / (scale * v.zoom) });
// قرصة حول (mx,my): النقطة تحت الإصبعين ثابتة — من حالة view فقط (لا كاش إطار)
export function pinchView(v, bw, bh, scale, mx, my, ratio) {
  const z1 = Math.max(fitZoomFor(bw, bh, scale), Math.min(1, v.zoom * ratio));
  if (z1 === v.zoom) return v;
  const p = screenToWorld(v, bw, bh, scale, mx, my);
  v.zoom = z1;
  const sc1 = scale * z1;
  v.cx = p.x - (mx - bw / 2) / sc1; v.cy = p.y - (my - bh / 2) / sc1;
  return v;
}
