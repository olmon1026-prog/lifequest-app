// محرك الحياة — منطق نقي بلا DOM. ثلاث طبقات: روتين يومي (ساعة الهاتف)،
// طابور مشاهد الإنجاز (٨–١٥ ثانية)، أحداث خفيفة عشوائية. لا إنجازات وهمية:
// لا مشهد إنجاز إلا من حدث complete حقيقي، والأحداث المستقلة لا تمنح XP أبدًا.

// قرار «عدد المشاهد اليومية»: ٥ مشاهد كاملة كحد أقصى، والزيادة تُلخَّص في شريط «ما حدث اليوم».
// الأساس (سجّل في التقرير): أبحاث إيقاع المكافآت في تصميم الألعاب — «Snacking not Feasting»
// (CHI PLAY 2019) توزيع اللحظات على اليوم بدل التكديس، و«Daily Quests or Daily Pests»
// (PACM HCI) المكافآت اليومية تفيد الالتزام لكن التكرار القسري يسبب إرهاقًا، وأدبيات
// الجدولة المتغيرة تحذر من الإغراق. ٥ مشاهد × نحو ١٢ ثانية ≈ دقيقة استعراض في اليوم:
// قريبة من الفعل (تقوّي العادة) بلا تحويل سامي إلى آلة تجري (قاعدة الملف نفسه).
export const MAX_LIVE_SCENES = 5;
export const SCENE_MIN_MS = 8000;
export const SCENE_MAX_MS = 15000;

// وجهة المهمة (الخيار الثالث المعتمد): نوع ثابت لبعض المجالات، والباقي يختار النظام.
export const AREA_DESTINATION = {
  health: 'health',     // الصحة → الشاطئ
  learning: 'learning', // التعلم → المنارة
  work: 'work',         // العمل → الورشة
  home: 'home',         // البيت → بيت سامي
  money: 'money',       // المال → السوق
};
// مهمة بلا مجال: وجهة افتراضية بالتناوب الحتمي حسب معرف الحدث (لا عشوائية غير قابلة للإعادة)
const FALLBACK_CYCLE = ['home', 'square', 'work', 'health', 'learning'];

export function destinationFor(item, eventId = '') {
  if (item && item.area && AREA_DESTINATION[item.area]) return AREA_DESTINATION[item.area];
  let h = 0;
  for (const c of String(eventId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK_CYCLE[h % FALLBACK_CYCLE.length];
}

// مرحلة اليوم من ساعة الهاتف (قرار محسوم: الليل والنهار يتبعان ساعة الهاتف)
export function dayPhase(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

// الروتين اليومي: نشاط سامي الافتراضي وموضعه حسب الساعة. مفاتيح المواضع من SPOTS في layout.
// الأنشطة التي تحتاج فيديو (جلوس/نوم/قراءة) مؤقتة بالكود حتى تصل أصولها (ملف القصة §٠).
export function routineFor(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 23 || h < 5.5)  return { activity: 'sleep', spot: 'door',      label: 'نائم' };
  if (h < 7)               return { activity: 'idle',  spot: 'door',      label: 'يستيقظ' };
  if (h < 9)               return { activity: 'walk',  spot: 'beach',     label: 'نزهة الصباح' };
  if (h < 12)              return { activity: 'read',  spot: 'lighthouse',label: 'يقرأ دفتر الحارس' };
  if (h < 14)              return { activity: 'sit',   spot: 'square',    label: 'راحة الظهيرة' };
  if (h < 17)              return { activity: 'walk',  spot: 'overlook',  label: 'يتفقد القرية' };
  if (h < 20)              return { activity: 'idle',  spot: 'tree',      label: 'سهرة تحت الشجرة' };
  return                          { activity: 'read',  spot: 'door',      label: 'يدوّن قبل النوم' };
}

// مشهد إنجاز واحد: زمن منطقي ٨–١٥ ثانية حسب وزن العنصر (أولوية/نوع)
export function sceneDurationMs(item) {
  const w = (item?.priority || 1) + (item?.type === 'project' ? 2 : item?.type === 'stage' ? 1 : 0);
  const t = SCENE_MIN_MS + (Math.min(4, Math.max(0, w - 1)) / 4) * (SCENE_MAX_MS - SCENE_MIN_MS);
  return Math.round(t / 500) * 500;
}

// مخطط الحدث الحقيقي (repo.js): ts رقم (مللي ثانية) و day نص 'YYYY-MM-DD'.
// ندعم at النصي القديم كاحتياط حتى لا تسقط بيانات قديمة، لكن المخطط الحقيقي هو ts/day.
const tsOf = (e) => typeof e.ts === 'number' ? e.ts : (typeof e.at === 'string' ? Date.parse(e.at) || 0 : 0);
const dayOf = (e) => typeof e.day === 'string' ? e.day : (typeof e.at === 'string' ? e.at.slice(0, 10) : null);
const byTime = (a, b) => (tsOf(a) - tsOf(b)) || (String(a.id) < String(b.id) ? -1 : 1);

// تخطيط مشاهد اليوم من أحداث الإنجاز الحقيقية (kind='complete') المرتبة زمنيًا.
// يعيد: live (حتى MAX_LIVE_SCENES) + digest (الباقي للتلخيص) — لا حذف لإنجاز.
export function planScenes(completeEvents, items, { maxLive = MAX_LIVE_SCENES } = {}) {
  const byId = new Map(items.map(i => [i.id, i]));
  const sorted = [...completeEvents].sort(byTime);
  const live = [], digest = [];
  for (const ev of sorted) {
    const item = byId.get(ev.itemId) || null;
    const scene = {
      eventId: ev.id,
      itemId: ev.itemId,
      title: item?.title || ev.title || 'إنجاز',
      destination: destinationFor(item, ev.id),
      durationMs: sceneDurationMs(item),
      // XP المسجل فعليًا لهذا الحدث (من سجل الإكمال نفسه) — يُعرض في لحظة المشهد،
      // ولا يُعرض رقم إن غاب أو كان صفرًا (إشارة بلا رقم)
      xp: typeof ev.xp === 'number' && ev.xp > 0 ? ev.xp : null,
      at: tsOf(ev),
    };
    (live.length < maxLive ? live : digest).push(scene);
  }
  return { live, digest };
}

// أحداث الإنجاز التي لم تُعرض بعد اليوم (مقارنة بآخر حدث عُرض)
export function newCompleteEvents(events, lastShownEventId, dayStr) {
  let passedLast = lastShownEventId == null;
  const out = [];
  const completes = events.filter(e => e.kind === 'complete').sort(byTime);
  for (const e of completes) {
    if (!passedLast) {
      if (e.id === lastShownEventId) passedLast = true;
      continue;
    }
    const d = dayOf(e);
    if (dayStr && d && d !== dayStr) continue; // نستبعد فقط ما نعرف يقينًا أنه ليوم آخر
    out.push(e);
  }
  return out;
}

// الفصل الأول «القرية التي نسيت النور»: خمسة مشاهد بشروط تقدم واضحة، تُعرض مرة واحدة لكل مشهد.
export const CHAPTER1 = [
  { id: 'c1s1', name: 'الوصول',        scene: 'arrival',   condition: { kind: 'always' } },
  { id: 'c1s2', name: 'أول مهمة',      scene: 'firstTask', condition: { kind: 'completions', count: 1 } },
  { id: 'c1s3', name: 'البيت المهجور', scene: 'abandoned', condition: { kind: 'completions', count: 3 } },
  { id: 'c1s4', name: 'دفتر الحارس',   scene: 'notebook',  condition: { kind: 'completions', count: 5 } },
  { id: 'c1s5', name: 'الليل',         scene: 'nightHint', condition: { kind: 'nightAfterCompletion' } },
];

// المشهد التالي المستحق من الفصل الأول: flags = {c1s1: true, ...}، stats = {completions, phase}
export function nextStoryScene(flags, stats) {
  for (const s of CHAPTER1) {
    if (flags[s.id]) continue;
    const c = s.condition;
    if (c.kind === 'always') return s;
    if (c.kind === 'completions' && stats.completions >= c.count) return s;
    if (c.kind === 'nightAfterCompletion' && stats.phase === 'night' && stats.completions >= 1) return s;
    return null; // الترتيب ثابت: لا قفز فوق مشهد لم يحن شرطه
  }
  return null;
}

// مراحل مصباح المنارة (ملف القصة §نظام المباني: ٧ مراحل مرتبطة بالأهداف الكبرى لا بالمهام
// اليومية، و§ربط الإنجازات: هدف شهري = مرحلة من المنارة). المستويات المدعومة في الرسم ٠/١/٢:
// ٠ مظلمة قبل مشهد «الليل» (c1s5)، ١ ضوء ضعيف بعده، ٢ شعاع كامل حين تكتمل كل أهداف الشهر
// الحالي — إنجاز حقيقي من بيانات الأهداف، لا إنجاز وهمي. هدف بلا فترة يُعامل كهدف الشهر
// الحالي (نفس دلالة repairGoalPeriods).
export function lighthouseLamp(storyFlags, items, today) {
  if (!storyFlags?.c1s5) return 0;
  const key = today.slice(0, 7);
  const goals = (items || []).filter(i => !i.archivedAt && i.type === 'goal_month' &&
    (i.period ? i.period.key === key : true));
  if (goals.length && goals.every(g => g.status === 'done')) return 2;
  return 1;
}

// الاستراحة في البيت (فكرة المستخدم المعتمدة): بعد انتهاء مشهد إنجاز وغياب أي حدث
// قادم، يرجع سامي بيته ويدخل ويستريح. يخرج عند: مشهد جديد في الطابور، أو روتين
// يتطلب مكانًا آخر (نزهة الصباح مثلًا). زمن منطقي: الراحة ليست مشهدًا ولا تمنح شيئًا.
export function shouldRestAtHome({ active, queueLength, routineSpot }) {
  if (active || queueLength > 0) return false;
  return routineSpot === 'door' || routineSpot === 'tree' || routineSpot === 'square';
}
