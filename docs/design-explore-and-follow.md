# قرارات تصميم: استكشاف العالم وتتبع بندق والإضافة داخل الأهداف (p33–p34)

بناءً على ملاحظات عبدو ٢٠٢٦-١١-٢٤ وطلبه تصميمًا مبحوثًا قبل التنفيذ.

## ١) إضافة مهمة داخل هدف/مشروع/مرحلة
النمط المتبنى: الإضافة من الحاوية المعروضة نفسها (زر «+ مهمة» على كل صف حاوية)، لا من قائمة عامة بعيدة.
المصادر:
- Todoist sub-tasks: https://www.todoist.com/help/todoist/features/use-sub-tasks-in-todoist-kMamDo
- Todoist Quick Add: https://www.todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz
- TickTick Multilevel Tasks: https://help.ticktick.com/articles/7055782219767349248

## ٢) تتبع بندق لسامي
النمط المتبنى: أثر التنقل (breadcrumb trail) — المرافق يمشي على مواضع القائد المسجلة فيضمن ألا يعبر عائقًا لم يعبره القائد، بدل استهداف إزاحة ثابتة قد تقع داخل مبنى. مع فحص القطعة المستقيمة (segClear) قبل استخدامها.
المصادر:
- https://gamedev.stackexchange.com/questions/74043/how-do-i-make-a-character-follow-behind-another
- https://iaen.es/en/devlog/gotic/sheep-follow-breadcrumb-trail-godot/

## ٣) استكشاف العالم (زوم/سحب)
النمط المتبنى: وضع خريطة كامل (تصغير حتى ملاءمة العالم) بدل خريطة مصغرة منفصلة — أبسط على شاشة صغيرة وأوضح؛ مع سحب حر وقرصة بمرساة المنتصف وزر «عودة لسامي». الكاميرا فقط: لا تحكم بالشخصية (قاعدة القصة). المشاهد والراحة تفرض وضع التتبع.
المصادر:
- MDN Pinch zoom gestures: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
- Minimap Viewport Projection: https://invisible-ux.vercel.app/mechanics/minimap-viewport-projection
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Using_Pointer_Events

## قيود معروفة
- لا momentum بعد رفع الإصبع (توقف فوري) — قرار بساطة v1.
- القرصة مختبرة بأحداث CDP اصطناعية لا بأصابع حقيقية.
