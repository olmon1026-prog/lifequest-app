// تسجيل الـ Service Worker ومعالجة التحديثات (constraints-rules §13)
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }
      });
    });
  }).catch(() => {});
  // أول تثبيت للـ SW لا يستدعي reload — الصفحة أصلاً أحدث نسخة من الشبكة؛ إعادة التحميل وقتها قد تضيّع إدخالًا جاريًا
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    location.reload();
  });
}

function showUpdateBanner(reg) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.pointerEvents = 'auto';
  el.innerHTML = 'نسخة جديدة متاحة. <button style="color:var(--amber);font-weight:bold;text-decoration:underline">حدّث الآن</button>';
  el.querySelector('button').onclick = () => {
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
  root.appendChild(el);
}
