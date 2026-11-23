// غلاف IndexedDB (D-002) — قاعدة lifequest الإصدار 1، خمسة مخازن (data-model §6)
import { migrations } from './migrations.js';

const DB_NAME = 'lifequest';
const DB_VERSION = migrations.length;
let db = null;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = req.result;
      const oldV = e.oldVersion;
      for (let v = oldV; v < migrations.length; v++) migrations[v](d);
    };
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    const out = fn(s);
    if (out && out.onsuccess !== undefined) {
      out.onsuccess = () => { result = out.result; };
    }
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const getAll = (store) => tx(store, 'readonly', s => s.getAll());
export const getOne = (store, key) => tx(store, 'readonly', s => s.get(key));
export const put = (store, val) => tx(store, 'readwrite', s => s.put(val));
export const del = (store, key) => tx(store, 'readwrite', s => s.delete(key));
export const clear = (store) => tx(store, 'readwrite', s => s.clear());
export const byIndex = (store, index, key) =>
  tx(store, 'readonly', s => s.index(index).getAll(key));

// معاملة مجمعة على عدة مخازن (للاستيراد والتراجع الذري)
export function bulkWrite(stores, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, 'readwrite');
    fn(Object.fromEntries(stores.map(n => [n, t.objectStore(n)])));
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
