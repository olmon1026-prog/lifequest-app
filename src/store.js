// الحالة المركزية: pub/sub بسيط (D-001 بدون مكتبات)
const listeners = new Set();

export const store = {
  state: {
    items: [],        // كل العناصر (شجرة parentId)
    events: [],       // سجل الأحداث (مصدر XP)
    world: null,      // صف العالم
    settings: {},     // الإعدادات
    ready: false,
  },
  async load() {
    const { getAll } = await import('./db/db.js');
    const [items, events, world, settings] = await Promise.all([
      getAll('items'), getAll('events'), getAll('world'), getAll('settings'),
    ]);
    this.state.items = items;
    this.state.events = events;
    this.state.world = world[0] || null;
    this.state.settings = Object.fromEntries(settings.map(s => [s.key, s.value]));
    // افتراضي تقليل الحركة يتبع تفضيل نظام التشغيل ما لم يختر المستخدم صراحة من الإعدادات (إتاحة)
    if (this.state.settings.reduceMotion === undefined)
      this.state.settings.reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.state.ready = true;
    emit();
  },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};

export function emit() {
  for (const fn of listeners) fn(store.state);
}
