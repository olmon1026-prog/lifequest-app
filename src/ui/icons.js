// أيقونات SVG مضمونة العرض (بأسلوب مرجع التصميم: حد 2، أطراف مستديرة).
// لا إيموجي في واجهة التطبيق: الإيموجي يعتمد على خط الجهاز وقد يظهر مربعًا فارغًا.
const P = {
  world:  '<path d="M3 19l5-9 4 6 3-4 6 7z"/>',
  today:  '<path d="M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0M8.5 12l2.5 2.5 4.5-5"/>',
  goals:  '<path d="M6 21V4M6 5h11l-2 4 2 4H6"/>',
  more:   '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  moon:   '<path d="M20 13A8 8 0 1 1 11 4a6.5 6.5 0 0 0 9 9z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  warn:   '<path d="M12 4L2.5 20h19zM12 10v4M12 17.5h.01"/>',
  fire:   '<path d="M12 22a6 6 0 0 0 6-6c0-3-2-5-3-7-1 1-2 2-2 4 0-2-2-5-4-6 0 3-3 5-3 9a6 6 0 0 0 6 6z"/>',
  import: '<path d="M12 3v11M7 9l5 5 5-5M4 21h16"/>',
  save:   '<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7"/>',
  restore:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  stats:  '<path d="M5 20v-6M11 20V6M17 20v-9M3 20h18"/>',
  hero:   '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>',
  gear:   '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  archive:'<path d="M3 4h18v4H3zM4 8v12h16V8M10 12h4"/>',
  trash:  '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
};
export function icon(name, size = 22) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
