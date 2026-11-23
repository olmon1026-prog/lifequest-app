// الترحيلات: مصفوفة دوال مرقّمة، لا تُعدَّل دالة قديمة أبدًا (data-model §6)
// الإصدار 1: إنشاء المخازن الخمسة وفهارسها
export const migrations = [
  function v1(db) {
    const items = db.createObjectStore('items', { keyPath: 'id' });
    items.createIndex('parentId', 'parentId');
    items.createIndex('status', 'status');
    items.createIndex('type', 'type');
    items.createIndex('due.date', 'due.date');
    items.createIndex('period.key', 'period.key');
    items.createIndex('source.planId', 'source.planId');

    const events = db.createObjectStore('events', { keyPath: 'id' });
    events.createIndex('day', 'day');
    events.createIndex('itemId', 'itemId');
    events.createIndex('ts', 'ts');

    db.createObjectStore('world', { keyPath: 'id' });
    db.createObjectStore('settings', { keyPath: 'key' });
    db.createObjectStore('snapshots', { keyPath: 'id' });
  },
];
