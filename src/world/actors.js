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
    this.speed = 0.055;   // بكسل/مللي ثانية تقريبًا
    this.hop = 0;
    this.onArrive = null;
    this.visible = true;   // false داخل البيت
    this.alpha = 1;        // يتلاشى عند الدخول
  }
  goTo(x, y, onArrive = null) { this.tx = x; this.ty = y; this.onArrive = onArrive; }
  get moving() { return Math.hypot(this.tx - this.x, this.ty - this.y) > 1.5; }
  update(dt, time) {
    if (this.moving) {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      const step = Math.min(d, this.speed * dt);
      this.x += dx / d * step; this.y += dy / d * step;
      this.facing = dx < 0 ? 'left' : 'right';
      this.frame += dt / 95;
      if (!this.moving && this.onArrive) { const f = this.onArrive; this.onArrive = null; f(); }
    } else {
      this.frame = 0;
    }
    if (this.hop > 0) this.hop = Math.max(0, this.hop - dt);
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
