// LifeQuest — نقطة الدخول
import { icon } from './ui/icons.js';
import { initRouter } from './ui/router.js';
import { openDB } from './db/db.js';
import { repairGoalPeriods } from './db/repo.js';
import { store } from './store.js';
import { registerSW } from './sw-register.js';

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout after ' + ms + 'ms')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

async function boot() {
  try {
    await withTimeout(openDB(), 3000);
    await withTimeout(store.load(), 3000);
    await repairGoalPeriods().catch(() => 0); // إصلاح أهداف قديمة بلا فترة
  } catch (err) {
    // Export file is canonical (docs); app stays usable in-memory if IndexedDB is unavailable.
    store.state.ready = true;
    console.error('boot fell back to memory mode', err);
  }
  initRouter();
  registerSW();
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

boot().catch(err => {
  console.error(err);
  const app = document.getElementById('app');
  app.innerHTML = '<div class="empty"><div class="big">' + icon('warn', 40) + '</div>حصل خطأ في التشغيل. جرّب تحديث الصفحة.</div>';
});
