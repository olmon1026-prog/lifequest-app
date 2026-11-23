// تبويب المزيد: استيراد/تصدير/إعدادات/إحصائيات موجزة
import { store, emit } from '../store.js';
import { topbarHTML } from './topbar.js';
import { totalXP, levelProgress, levelTitle } from '../core/xp.js';
import { bestStreak } from '../core/streak.js';
import { arNum, todayStr } from '../core/dates.js';
import { exportBackup, parseBackup, download } from '../core/exporter.js';
import { planMerge, planReplace, materialize } from '../core/importer.js';
import { setSetting } from '../db/repo.js';
import { bulkWrite, clear } from '../db/db.js';
import { uuid } from '../core/ids.js';
import { toast } from './sheet.js';
import { rerender } from './router.js';

export function renderMore(app, state) {
  const xp = totalXP(state.events);
  const lp = levelProgress(xp);
  const best = bestStreak(state.events);
  const lastBackup = state.settings.lastBackupAt;

  app.innerHTML = `
    ${topbarHTML(state)}
    <div style="padding:14px 16px 4px"><h1>المزيد</h1>
      <div class="muted">كل بياناتك على جهازك</div>
    </div>
    <div class="card" style="display:flex;align-items:center;gap:12px">
      <div style="width:52px;height:52px;border-radius:14px;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:26px">🧑‍🚀</div>
      <div style="flex:1">
        <div style="font-weight:bold">المغامر · ${levelTitle(lp.level)}</div>
        <div class="muted">أفضل سلسلة ${arNum(best)} ${best <= 2 ? 'يوم' : 'أيام'}</div>
      </div>
      <div class="lv-badge">LV ${arNum(lp.level)}</div>
    </div>
    <div style="padding:12px 16px 2px;font-weight:bold;font-size:14px">البيانات</div>
    <div class="card" style="padding:0">
      <button class="row" id="import-btn">📥 <div><b>استيراد خطة</b><div class="muted">من نموذج ذكاء اصطناعي (JSON)</div></div></button>
      <button class="row" id="export-btn">💾 <div><b>تصدير نسخة احتياطية</b><div class="muted">${lastBackup ? 'آخر نسخة: ' + arNum(lastBackup) : 'ملف على جهازك'}</div></div></button>
      <button class="row" id="restore-btn">♻️ <div><b>استعادة نسخة احتياطية</b><div class="muted">تستبدل كل البيانات الحالية</div></div></button>
    </div>
    <div style="padding:12px 16px 2px;font-weight:bold;font-size:14px">التطبيق</div>
    <div class="card" style="padding:0">
      <button class="row" id="settings-btn">⚙️ <div><b>الإعدادات</b><div class="muted">الصوت · بداية الأسبوع: ${state.settings.weekStart === 0 ? 'الأحد' : 'السبت'}</div></div></button>
      <div class="row" style="opacity:.5">📊 <div><b>الإحصائيات</b><div class="muted">قريبًا</div></div></div>
      <div class="row" style="opacity:.5">🏆 <div><b>الإنجازات</b><div class="muted">قريبًا</div></div></div>
    </div>
    <div class="muted" style="text-align:center;padding:16px">LifeQuest · يعمل بدون إنترنت · <button id="force-update" style="text-decoration:underline;color:var(--teal)">تحديث إجباري</button></div>
    <input type="file" id="file-input" accept=".json,application/json" style="display:none">
  `;

  app.querySelectorAll('.row').forEach(r => {
    r.style.cssText += ';display:flex;gap:12px;align-items:center;width:100%;text-align:right;padding:13px 14px;font-size:15px;border-bottom:1px solid #EDF3F1';
  });
  app.querySelectorAll('.row:last-child').forEach(r => r.style.borderBottom = 'none');

  app.querySelector('#export-btn').onclick = () => {
    const txt = exportBackup(store.state);
    download(`lifequest-backup-${todayStr()}.json`, txt);
    setSetting('lastBackupAt', todayStr());
    toast('تم تصدير النسخة الاحتياطية ✓');
  };

  const fileInput = app.querySelector('#file-input');
  let mode = null;
  fileInput.onchange = async () => {
    const f = fileInput.files[0];
    if (!f) return;
    const text = await f.text();
    if (mode === 'import') importFlow(text);
    else if (mode === 'restore') restoreFlow(text);
    fileInput.value = '';
  };
  app.querySelector('#import-btn').onclick = () => { mode = 'import'; fileInput.click(); };
  app.querySelector('#restore-btn').onclick = () => { mode = 'restore'; fileInput.click(); };
  app.querySelector('#settings-btn').onclick = () => settingsSheet(app);
  app.querySelector('#force-update').onclick = async () => {
    const regs = await navigator.serviceWorker?.getRegistrations?.() || [];
    for (const r of regs) await r.update();
    location.reload();
  };
}

function importFlow(text) {
  const state = store.state;
  const weekStart = state.settings.weekStart ?? 6;
  const m = planMerge(state.items, text, weekStart);
  if (!m.ok) {
    toast(m.errors[0].msg, true, 5000);
    return;
  }
  const typeNames = { goal_year: 'هدف سنوي', goal_month: 'هدف شهري', goal_week: 'هدف أسبوعي', project: 'مشروع', stage: 'مرحلة', task: 'مهمة', subtask: 'فرعية' };
  const counts = Object.entries(m.counts).map(([t, c]) => `${arNum(c)} ${typeNames[t]}`).join(' · ') || 'لا شيء جديد';
  showConfirm(`
    <h2>معاينة الاستيراد</h2>
    <p style="margin:8px 0"><b>${esc(m.plan.title)}</b></p>
    <p class="muted" style="margin-bottom:8px">سيُضاف: ${counts}</p>
    ${m.toSkip.length ? `<p class="muted">سيُتخطى (موجود مسبقًا): ${arNum(m.toSkip.length)}</p>` : ''}
    ${m.warnings.length ? `<p class="muted" style="color:var(--warn)">${m.warnings.map(w => esc(w.msg)).join('<br>')}</p>` : ''}
  `, [
    { label: 'دمج', primary: true, action: async () => {
      const rows = materialize(m.toAdd, m.toSkip, state.items);
      await applyImport(rows, []);
      toast(`أُضيفت ${arNum(rows.length)} عناصر ✓`);
    } },
    { label: 'استبدال الخطة', danger: true, action: async () => {
      const r = planReplace(store.state.items, text, weekStart);
      await snapshot('replace-' + r.plan.id);
      const rows = materialize(r.toAdd, r.toSkip, store.state.items);
      await applyImport(rows, r.toDelete.map(i => i.id));
      toast(`استُبدلت الخطة: حُذف ${arNum(r.deleteCount)} وأُضيف ${arNum(rows.length)} ✓`);
    } },
  ]);
}

async function applyImport(rows, deleteIds) {
  store.state.items = store.state.items.filter(i => !deleteIds.includes(i.id));
  store.state.items.push(...rows);
  await bulkWrite(['items'], (s) => {
    for (const id of deleteIds) s.items.delete(id);
    for (const r of rows) s.items.put(r);
  });
  emit();
}

async function snapshot(reason) {
  const data = JSON.stringify({ items: store.state.items, events: store.state.events });
  const snaps = [{ id: uuid(), ts: Date.now(), reason, itemCount: store.state.items.length, data }];
  await bulkWrite(['snapshots'], (s) => { for (const sn of snaps) s.snapshots.put(sn); });
}

function restoreFlow(text) {
  const v = parseBackup(text);
  if (!v.ok) { toast(v.error, true, 4000); return; }
  showConfirm(`
    <h2>استعادة نسخة احتياطية</h2>
    <p class="muted" style="margin:8px 0">ستستبدل كل البيانات الحالية بمحتوى النسخة (${arNum(v.data.items.length)} عنصر و${arNum((v.data.events || []).length)} حدث). سيُحفظ snapshot تلقائي قبل الاستعادة.</p>
  `, [
    { label: 'استعادة', danger: true, action: async () => {
      await snapshot('restore');
      store.state.items = v.data.items;
      store.state.events = v.data.events || [];
      store.state.world = v.data.world && v.data.world.id ? v.data.world : store.state.world;
      const settings = Array.isArray(v.data.settings) ? v.data.settings : [];
      await bulkWrite(['items', 'events', 'settings'], (s) => {
        s.items.clear(); s.events.clear();
        for (const i of v.data.items) s.items.put(i);
        for (const e of (v.data.events || [])) s.events.put(e);
        for (const st of settings) s.settings.put(st);
      });
      for (const st of settings) store.state.settings[st.key] = st.value;
      emit();
      toast('تمت الاستعادة ✓');
    } },
  ]);
}

function settingsSheet(app) {
  const root = document.getElementById('sheet-root');
  const s = store.state.settings;
  root.innerHTML = `
    <div class="sheet-overlay"></div>
    <div class="sheet">
      <h2>الإعدادات</h2>
      <div class="field"><label>الصوت</label>
        <div class="chip-row" id="s-sound">
          <button class="chip ${s.sound !== false ? 'sel' : ''}" data-v="1">مفعّل</button>
          <button class="chip ${s.sound === false ? 'sel' : ''}" data-v="0">صامت</button>
        </div>
      </div>
      <div class="field"><label>الاهتزاز</label>
        <div class="chip-row" id="s-haptics">
          <button class="chip ${s.haptics !== false ? 'sel' : ''}" data-v="1">مفعّل</button>
          <button class="chip ${s.haptics === false ? 'sel' : ''}" data-v="0">مغلق</button>
        </div>
      </div>
      <div class="field"><label>تقليل الحركة</label>
        <div class="chip-row" id="s-motion">
          <button class="chip ${!s.reduceMotion ? 'sel' : ''}" data-v="0">حركة كاملة</button>
          <button class="chip ${s.reduceMotion ? 'sel' : ''}" data-v="1">حركة أقل</button>
        </div>
      </div>
      <div class="field"><label>بداية الأسبوع</label>
        <div class="chip-row" id="s-week">
          <button class="chip ${(s.weekStart ?? 6) === 6 ? 'sel' : ''}" data-v="6">السبت</button>
          <button class="chip ${s.weekStart === 0 ? 'sel' : ''}" data-v="0">الأحد</button>
        </div>
      </div>
      <button class="btn" id="s-close">تم</button>
    </div>`;
  const close = () => { root.innerHTML = ''; rerender(); };
  root.querySelector('.sheet-overlay').onclick = close;
  root.querySelector('#s-close').onclick = close;
  const bind = (id, key, invert) => {
    root.querySelector(id).onclick = e => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      let v = b.dataset.v;
      if (key === 'sound' || key === 'haptics') setSetting(key, v === '1');
      else if (key === 'reduceMotion') setSetting(key, v === '1');
      else if (key === 'weekStart') setSetting(key, +v);
      root.querySelectorAll(id + ' .chip').forEach(c => c.classList.toggle('sel', c === b));
    };
  };
  bind('#s-sound', 'sound'); bind('#s-haptics', 'haptics'); bind('#s-motion', 'reduceMotion'); bind('#s-week', 'weekStart');
}

function showConfirm(html, buttons) {
  const root = document.getElementById('sheet-root');
  root.innerHTML = `
    <div class="sheet-overlay"></div>
    <div class="sheet">${html}<div id="cf-btns" style="margin-top:14px"></div></div>`;
  const close = () => root.innerHTML = '';
  root.querySelector('.sheet-overlay').onclick = close;
  const holder = root.querySelector('#cf-btns');
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.className = 'btn' + (b.primary ? '' : ' secondary');
    if (b.danger) btn.style.background = 'var(--warn)', btn.style.color = '#fff';
    btn.textContent = b.label;
    btn.onclick = async () => { close(); await b.action(); rerender(); };
    holder.appendChild(btn);
  }
  const cancel = document.createElement('button');
  cancel.className = 'btn secondary';
  cancel.textContent = 'إلغاء';
  cancel.onclick = close;
  holder.appendChild(cancel);
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
