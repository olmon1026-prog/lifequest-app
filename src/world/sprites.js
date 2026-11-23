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
