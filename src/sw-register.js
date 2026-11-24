// تسجيل الـ Service Worker ومعالجة التحديثات (constraints-rules §13)
// قاعدة الأمان: لا إعادة تحميل أبدًا وشاشة الإضافة/التعديل مفتوحة — إدخال المستخدم أولى من التحديث.
// الاكتشاف يحدث بالفحص الصريح عند العودة للتطبيق، والتفعيل عند الفتح أو الخفاء،
// لكن إعادة التحميل نفسها تُؤجَّل إلى لافتة إن كانت هناك شاشة مفتوحة (سواء في هذا التبويب أو تبويب آخر فعّل التحديث).
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  const sheetOpen = () => !!document.getElementById('sheet-root')?.firstElementChild;
  navigator.serviceWorker.register('sw.js').then(reg => {
    // نسخة منتظرة من جلسة سابقة (لم تُضغط لافتتها): تُفعَّل فورًا عند الفتح —
    // وإلا بقي العميل على نسخة قديمة بلا أي تنبيه (الكود القديم لا يعيد إظهار اللافتة لنسخة منتظرة)
    if (reg.waiting && navigator.serviceWorker.controller) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateBanner(reg);
        }
      });
    });
    // العودة للتطبيق: فحص تحديث صريح (لا نعتمد على فحص التنقل وحده — قد لا يعيد طلب sw.js).
    // المغادرة والتحديث منتظر: فعّله الآن؛ إعادة التحميل نفسها محمية ببوابة الشاشة المفتوحة.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        reg.update().catch(() => {});
      }
    });
  }).catch(() => {});
  // أول تثبيت للـ SW لا يستدعي reload — الصفحة أصلاً أحدث نسخة من الشبكة
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    // شاشة مفتوحة = إدخال غير محفوظ محتمل: لا reload، أظهر اللافتة بدلًا منها (زرها يعيد التحميل يدويًا)
    if (sheetOpen()) {
      refreshing = false;
      navigator.serviceWorker.getRegistration().then(reg => { if (reg) showUpdateBanner(reg); });
      return;
    }
    location.reload();
  });
}

function showUpdateBanner(reg) {
  const root = document.getElementById('toast-root');
  if (root.querySelector('.toast.sw-update')) return; // لافتة واحدة فقط
  const sheetOpen = () => !!document.getElementById('sheet-root')?.firstElementChild;
  const el = document.createElement('div');
  el.className = 'toast sw-update';
  el.style.pointerEvents = 'auto';
  el.innerHTML = 'نسخة جديدة متاحة. <button style="color:var(--amber);font-weight:bold;text-decoration:underline">حدّث الآن</button>';
  const btn = el.querySelector('button');
  let armed = false;
  btn.onclick = () => {
    // شاشة مفتوحة بإدخال غير محفوظ: أول ضغطة تحذير فقط، الثانية تأكيد صريح — لا ضياع مسودة بضغطة واحدة
    if (sheetOpen() && !armed) {
      armed = true;
      btn.textContent = 'هيتقفل اللي بتكتبه — اضغط تاني للتأكيد';
      return;
    }
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    else location.reload(); // التفعيل حدث أصلًا (وصلنا من controllerchange) — بقي فقط التحميل
  };
  root.appendChild(el);
}
