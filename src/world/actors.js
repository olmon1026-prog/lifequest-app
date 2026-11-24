// ممثلو المشهد: سامي وبندق — موضع، هدف، وضعية، اتجاه. بلا DOM، تُدار من world.js.
import { drawFrame, drawPose } from './sprites.js';

export class Actor {
  constructor(name, x, y, scale = 2) {
    this.name = name;
    this.x = x; this.y = y;
    this.tx = x; this.ty = y;
    this.scale = scale;
    this.pose = 'idle';   // idle|walk|sit|sleep|read|work
    this.facing = 'left';
    this.frame = 0;
    this.speed = 0.0382;  // بكسل/م.ث — مقاس من السبرايت نفسه: أقصى اتساع قدمين ٥٢px (خطوة)،
    // الدورة ١٦ إطارًا = خطوتان = ١٠٤px × مقياس ٠٫٥ = ٥٢px/١٣٦٠م.ث ≈ ٠٫٠٣٨٢ (تعليق سابق ادعى ٩٦px بلا قياس)
    this.hop = 0;
    this.onArrive = null;
    this.visible = true;   // false داخل البيت
    this.alpha = 1;        // يتلاشى عند الدخول
    this.targetAlpha = 1;  // هدف التلاشي التدريجي
  }
  fadeTo(a) { this.targetAlpha = a; }
  goTo(x, y, onArrive = null) { this.tx = x; this.ty = y; this.onArrive = onArrive; }
  get moving() { return Math.hypot(this.tx - this.x, this.ty - this.y) > 1.5; }
  update(dt, time) {
    if (this.moving) {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(d, this.speed * dt);
      this.x += dx / d * step; this.y += dy / d * step;
      this.facing = dx < 0 ? 'left' : 'right';
      this.frame += dt / 85;  // ٨٥م.ث/إطار ضمن نطاق ٨٠–١٢٥ لدورات المشي (LibreSprite)
      if (!this.moving && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); }
    } else {
      this.frame = 0;
    }
    if (this.hop > 0) this.hop = Math.max(0, this.hop - dt);
    if (this.alpha !== this.targetAlpha) {
      const d = Math.sign(this.targetAlpha - this.alpha) * dt / 380;
      this.alpha = Math.abs(this.targetAlpha - this.alpha) <= Math.abs(d)
        ? this.targetAlpha : this.alpha + d;
      if (this.alpha === 0 && this.targetAlpha === 0) this.visible = false;
    }
  }
  draw(ctx, sheet, time) {
    if (!sheet || !this.visible) return;
    ctx.save(); ctx.globalAlpha = this.alpha;
    const hopY = this.hop > 0 ? Math.abs(Math.sin(this.hop / 90)) * 13 : 0;
    const y = this.y - hopY;
    // ظل خفيف
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + 1, 12 * this.scale / 2, 3.5, 0, 0, 7); ctx.fill();
    if (this.moving) drawFrame(ctx, sheet, Math.floor(this.frame), this.x, y, this.scale, this.facing);
    else drawPose(ctx, sheet, this.pose, 0, this.x, y, this.scale, this.facing, time);
    ctx.restore();
  }
}
