// مشاهد الفصل الأول «القرية التي نسيت النور» — تُعرض مرة واحدة لكل مشهد.
// الحفظ في localStorage (تقدم سردي خفيف، لا بيانات مهام).
import { CHAPTER1 } from './life.js';

const KEY = 'lq-story-v1';

export function loadStory(storage = globalThis.localStorage) {
  try { return JSON.parse(storage?.getItem(KEY) || '{}'); } catch { return {}; }
}
export function markStory(id, storage = globalThis.localStorage) {
  const s = loadStory(storage);
  s[id] = new Date().toISOString();
  try { storage?.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}
export { CHAPTER1 };
