# LifeQuest

تطبيق شخصي لإدارة الحياة والأهداف والمهام — يعمل بدون إنترنت (PWA) على أندرويد، واجهة عربية RTL، عالم بكسل آرت ثنائي الأبعاد.

- الشخصية: سامي (والكلب بندق لاحقًا) تتحرك على خريطة «قرية القمر» حسب الإنجاز الحقيقي.
- بلا build وبلا مكتبات وقت التشغيل: HTML/CSS/JS (ES Modules) + IndexedDB + Canvas/DOM + Service Worker.
- الاستيراد والتصدير بصيغة JSON مسطحة (استيراد خطط من نماذج الذكاء الاصطناعي بدون API).

## التطوير
- الاختبارات: `node tests/*.test.mjs`
- الأيقونات: `python3 tools/make_icons.py`
- النشر: GitHub Pages عبر `.github/workflows/pages.yml` (يستبدل `__BUILD__` برقم الـ commit عبر `tools/stamp_build.py`).
