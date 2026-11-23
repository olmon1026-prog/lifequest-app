// تحميل ورقات الإطارات PNG وتشغيلها على كانفس
const cache = new Map();

export async function loadSheet(url, meta) {
  if (cache.has(url)) return cache.get(url);
  const img = new Image();
  const p = new Promise((res, rej) => {
    img.onload = () => res({ img, ...meta });
    img.onerror = rej;
  });
  img.src = url;
  cache.set(url, p);
  return p;
}

// يرسم الإطار الحالي على السياق. facing 'left' يقلب أفقيًا.
export function drawFrame(ctx2, sheet, frame, x, feetY, scale = 2, facing = 'right') {
  const { img, frameWidth: fw, frameHeight: fh, anchor } = sheet;
  const f = frame % sheet.frames;
  ctx2.save();
  ctx2.imageSmoothingEnabled = false;
  const dx = x - anchor.pivotX * scale;
  const dy = feetY - anchor.feetY * scale;
  if (facing === 'left') {
    ctx2.translate(dx + fw * scale, dy);
    ctx2.scale(-1, 1);
    ctx2.drawImage(img, f * fw, 0, fw, fh, 0, 0, fw * scale, fh * scale);
  } else {
    ctx2.drawImage(img, f * fw, 0, fw, fh, dx, dy, fw * scale, fh * scale);
  }
  ctx2.restore();
}

// أوضاع مؤقتة مبنية بالكود من إطار المشي (ملف القصة §٠) حتى تصل فيديوهات الأصول:
// وقوف بتنفس، جلوس، نوم، قراءة/كتابة، عمل، احتفال (قفزة يطبقها المُستدعي).
export function drawPose(ctx, sheet, pose, frame, x, feetY, scale = 2, facing = 'right', time = 0) {
  const { img, frameWidth: fw, frameHeight: fh, anchor } = sheet;
  const dx = x - anchor.pivotX * scale, dy = feetY - anchor.feetY * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const flip = facing === 'left';
  const drawRaw = (f, sy = 1) => {
    ctx.save();
    ctx.translate(dx + (flip ? fw * scale : 0), dy + fh * scale * (1 - sy));
    ctx.scale(flip ? -1 : 1, sy);
    ctx.drawImage(img, (f % sheet.frames) * fw, 0, fw, fh, 0, 0, fw * scale, fh * scale);
    ctx.restore();
  };
  switch (pose) {
    case 'idle': { // وقوف مع تنفس ورمشة تقريبية
      drawRaw(0, 1 + 0.018 * Math.sin(time / 480));
      break;
    }
    case 'sit': { // جلوس مؤقت: انخفاض مع ضغط خفيف للجزء السفلي
      drawRaw(0, 0.82);
      break;
    }
    case 'sleep': { // نوم مؤقت: استلقاء جانبي مع تنفس بطيء
      ctx.translate(x, feetY - 4);
      ctx.rotate(-Math.PI / 2);
      const s = 1 + 0.02 * Math.sin(time / 900);
      ctx.scale(1, s);
      if (flip) ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, fw, fh, -anchor.pivotX * scale, -anchor.feetY * scale, fw * scale, fh * scale);
      break;
    }
    case 'read': { // قراءة/كتابة: وقوف + دفتر عنبري أمام الصدر
      drawRaw(0);
      const bx = x + (flip ? -26 : 10) * (scale / 2), by = feetY - 52 * (scale / 2);
      ctx.fillStyle = '#FFC857';
      ctx.fillRect(bx, by, 14 * (scale / 2), 10 * (scale / 2));
      ctx.fillStyle = '#0B1838';
      ctx.fillRect(bx + 2, by + 2, 14 * (scale / 2) - 4, 10 * (scale / 2) - 4);
      ctx.fillStyle = '#CFF5EA';
      ctx.fillRect(bx + 3, by + 3, 14 * (scale / 2) - 6, 2);
      ctx.fillRect(bx + 3, by + 6, 14 * (scale / 2) - 8, 2);
      break;
    }
    case 'work': { // عمل: إطاران بطيئان + اهتزاز جهد
      const f = Math.floor(time / 350) % 2;
      drawRaw(f, 1 + 0.03 * Math.sin(time / 175));
      break;
    }
    default:
      drawRaw(frame);
  }
  ctx.restore();
}
