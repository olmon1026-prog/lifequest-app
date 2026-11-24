// الشاشة السفلية لإضافة/تعديل عنصر (PROJECT_MEMORY §10)
import { icon } from './icons.js';
import { addItem, updateItem, archiveItem, deleteItem, countDescendants } from '../db/repo.js';
import { quickDate, todayStr, fmtDateAr, goalPeriod, weekStartOf, monthName, arNum } from '../core/dates.js';
import { store } from '../store.js';

const TYPE_LABELS = { task: 'مهمة', subtask: 'فرعية', stage: 'مرحلة', project: 'مشروع', goal_week: 'هدف أسبوعي', goal_month: 'هدف شهري', goal_year: 'هدف سنوي' };
const NEW_WORD = { task: 'جديدة', subtask: 'جديدة', stage: 'جديدة', project: 'جديد', goal_week: 'جديد', goal_month: 'جديد', goal_year: 'جديد' };
const PRI_XP = { 1: '+١٠ XP', 2: '+٢٠ XP', 3: '+٣٠ XP' };
const GOAL_TYPES = ['goal_year', 'goal_month', 'goal_week'];
function isGoalType(t) { return GOAL_TYPES.includes(t); }

export function openAddSheet(preset = {}) {
  const root = document.getElementById('sheet-root');
  const today = todayStr();
  const state = {
    title: '', type: preset.type || 'task', parentId: preset.parentId || null,
    priority: preset.priority || 1, dueKind: preset.dueDate ? (preset.dueDate === today ? 'today' : null) : (isGoalType(preset.type) ? 'none' : 'today'), area: preset.area || null,
    dueDate: preset.dueDate || null, dueTime: null, notes: '',
    keepOpen: true,
  };

  function close() {
    root.innerHTML = '';
    history.back();
  }
  history.pushState({ sheet: true }, '');
  window.onpopstate = () => { root.innerHTML = ''; window.onpopstate = null; };

  function parentOptions() {
    const items = store.state.items.filter(i => !i.archivedAt && i.status !== 'done' &&
      ['goal_year', 'goal_month', 'goal_week', 'project', 'stage', 'task'].includes(i.type));
    return items.map(i => `<option value="${i.id}" ${state.parentId === i.id ? 'selected' : ''}>${esc(labelOf(i))}</option>`).join('');
  }
  function labelOf(i) {
    const parts = [i.title];
    let p = i.parentId && store.state.items.find(x => x.id === i.parentId);
    if (p) parts.unshift(p.title);
    return parts.join(' ‹ ');
  }

  const isGoal = () => isGoalType(state.type);

  function periodHint() {
    if (!isGoal()) return '';
    const ws = store.state.settings.weekStart ?? 6;
    if (state.type === 'goal_year') return `هيتحفظ في أهداف سنة ${arNum(today.slice(0, 4))}`;
    if (state.type === 'goal_month') return `هيتحفظ في أهداف شهر ${monthName(+today.slice(0, 4), +today.slice(5, 7))} ${arNum(today.slice(0, 4))}`;
    return `هيتحفظ في أهداف أسبوع يبدأ ${fmtDateAr(weekStartOf(today, ws))}`;
  }

  function render() {
    root.innerHTML = `
      <div class="sheet-overlay"></div>
      <div class="sheet" role="dialog" aria-label="${preset.editId ? 'تعديل' : TYPE_LABELS[state.type] + ' ' + NEW_WORD[state.type]}">
        <h2>${preset.editId ? 'تعديل' : TYPE_LABELS[state.type] + ' ' + NEW_WORD[state.type]}</h2>
        <div class="field"><label>العنوان</label>
          <input type="text" id="f-title" maxlength="120" value="${esc(state.title)}" placeholder="ماذا تريد أن تنجز؟" autofocus>
        </div>
        ${isGoal() ? `<div class="muted" id="f-period-hint" style="font-size:12px;margin:-4px 0 10px">${periodHint()}</div>` : ''}
        <div class="field" id="f-due-wrap" style="${isGoal() ? 'display:none' : ''}"><label>الموعد</label>
          <div class="chip-row" id="f-duekinds">
            ${[['today', 'اليوم'], ['tomorrow', 'غدًا'], ['weekEnd', 'نهاية الأسبوع'], ['nextWeek', 'الأسبوع القادم'], ['none', 'بدون']].map(([k, l]) =>
              `<button class="chip ${state.dueKind === k ? 'sel' : ''}" data-k="${k}">${l}</button>`).join('')}
          </div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <input type="date" id="f-date" value="${state.dueDate || ''}" style="flex:1;padding:9px;border:2px solid #D5E2E0;border-radius:10px">
            <input type="time" id="f-time" value="${state.dueTime || ''}" style="width:110px;padding:9px;border:2px solid #D5E2E0;border-radius:10px">
          </div>
        </div>
        <div class="field"><label>النوع</label>
          <div class="chip-row" id="f-types">
            ${Object.entries(TYPE_LABELS).map(([k, l]) =>
              `<button class="chip ${state.type === k ? 'sel' : ''}" data-t="${k}">${l}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>ينتمي إلى</label>
          <select id="f-parent"><option value="">بدون (عنصر مستقل)</option>${parentOptions()}</select>
        </div>
        <div class="field"><label>الأولوية</label>
          <div class="chip-row" id="f-pris">
            ${[1, 2, 3].map(p => `<button class="chip ${state.priority === p ? 'sel' : ''}" data-p="${p}">${['', '١ · عادية', '٢ · مهمة', '٣ · عاجلة'][p]} (${PRI_XP[p]})</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>المجال (يربطه ببيت في العالم)</label>
          <div class="chip-row" id="f-areas">
            ${[['', 'عام'], ['health', 'صحة'], ['learning', 'تعلّم'], ['work', 'عمل'], ['home', 'بيت'], ['money', 'فلوس']].map(([k, l]) =>
              `<button class="chip ${(state.area || '') === k ? 'sel' : ''}" data-a="${k}">${l}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>تفاصيل (اختياري)</label>
          <textarea id="f-notes" rows="2" maxlength="2000">${esc(state.notes)}</textarea>
        </div>
        <button class="btn" id="f-save">${preset.editId ? 'حفظ التعديلات' : 'حفظ وإضافة التالي'}</button>
        <button class="btn secondary" id="f-saveclose">حفظ وإغلاق</button>
        ${preset.editId ? `
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn secondary" id="f-archive" style="flex:1">${icon('archive', 16)} أرشفة</button>
          <button class="btn secondary" id="f-delete" style="flex:1;color:var(--warn);border-color:var(--warn)">${icon('trash', 16)} حذف</button>
        </div>` : ''}
      </div>`;

    root.querySelector('.sheet-overlay').onclick = close;
    root.querySelector('#f-title').oninput = e => state.title = e.target.value;
    root.querySelector('#f-title').onkeydown = e => { if (e.key === 'Enter') save(state.keepOpen); };
    root.querySelector('#f-notes').oninput = e => state.notes = e.target.value;
    root.querySelector('#f-date').onchange = e => { state.dueDate = e.target.value || null; if (state.dueDate) { state.dueKind = null; markChips('#f-duekinds', 'k', null); } };
    root.querySelector('#f-time').onchange = e => state.dueTime = e.target.value || null;
    root.querySelector('#f-parent').onchange = e => state.parentId = e.target.value || null;
    root.querySelector('#f-duekinds').onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      state.dueKind = b.dataset.k;
      const d = quickDate(state.dueKind, today, store.state.settings.weekStart ?? 6);
      state.dueDate = d;
      root.querySelector('#f-date').value = d || '';
      markChips('#f-duekinds', 'k', state.dueKind);
    };
    root.querySelector('#f-types').onclick = e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      const wasGoal = isGoal();
      state.type = b.dataset.t; markChips('#f-types', 't', state.type);
      // تنقّل بين أنواع الأهداف: حدّث تلميح الفترة فورًا (لا إعادة رسم كاملة)
      if (isGoal() && wasGoal) { const h = root.querySelector('#f-period-hint'); if (h) h.textContent = periodHint(); }
      if (isGoal() !== wasGoal) {
        if (isGoal()) { state.dueKind = 'none'; state.dueDate = null; state.dueTime = null; }
        else if (!state.dueDate) { state.dueKind = 'today'; state.dueDate = quickDate('today', today, store.state.settings.weekStart ?? 6); }
        render(); // يعيد رسم حقل الموعد والتلميح مع الحفاظ على state
        const ti = root.querySelector('#f-title'); if (ti) { ti.value = state.title; ti.focus(); }
        const no = root.querySelector('#f-notes'); if (no) no.value = state.notes;
      }
    };
    root.querySelector('#f-pris').onclick = e => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      state.priority = +b.dataset.p; markChips('#f-pris', 'p', state.priority);
    };
    root.querySelector('#f-areas').onclick = e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      state.area = b.dataset.a || null; markChips('#f-areas', 'a', b.dataset.a);
    };
    root.querySelector('#f-save').onclick = () => save(true);
    root.querySelector('#f-saveclose').onclick = () => save(false);
    if (preset.editId) {
      root.querySelector('#f-archive').onclick = async () => {
        await archiveItem(preset.editId, true);
        toast('اتأرشفت ✓');
        close();
      };
      root.querySelector('#f-delete').onclick = () => {
        const kids = countDescendants(preset.editId).size;
        showSheetConfirm(
          kids > 0
            ? `حذف "${esc(state.title)}"؟ عنده ${kids} عناصر مرتبطة. الأحداث والـ XP المكتسب مش بيتحذفوا.`
            : `حذف "${esc(state.title)}" نهائيًا؟ الأحداث والـ XP المكتسب مش بيتحذفوا.`,
          kids > 0
            ? [
                { label: 'حذف الكل مع الأبناء', danger: true, action: async () => { await deleteItem(preset.editId); toast('اتحذفت'); close(); } },
                { label: 'حذف وفك ارتباط الأبناء', action: async () => { await deleteItem(preset.editId, { detachChildren: true }); toast('اتحذفت والأبناء اتفكوا'); close(); } },
              ]
            : [
                { label: 'حذف نهائي', danger: true, action: async () => { await deleteItem(preset.editId); toast('اتحذفت'); close(); } },
              ]
        );
      };
    }
  }

  function showSheetConfirm(html, actions) {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-overlay';
    wrap.style.zIndex = 70;
    wrap.innerHTML = `<div class="sheet" style="z-index:71" role="alertdialog">
      <p style="margin-bottom:12px">${html}</p>
      ${actions.map((a, i) => `<button class="btn ${a.danger ? '' : 'secondary'}" data-i="${i}" ${a.danger ? 'style="background:var(--warn);color:#fff"' : ''}>${a.label}</button>`).join('')}
      <button class="btn secondary" data-i="-1">إلغاء</button>
    </div>`;
    wrap.onclick = e => {
      const b = e.target.closest('[data-i]');
      if (!b) { if (e.target === wrap) wrap.remove(); return; }
      const i = +b.dataset.i;
      wrap.remove();
      if (i >= 0) actions[i].action();
    };
    root.appendChild(wrap);
  }

  function markChips(sel, attr, val) {
    root.querySelectorAll(sel + ' .chip').forEach(c =>
      c.classList.toggle('sel', c.dataset[attr] === String(val)));
  }

  async function save(keepOpen) {
    if (!state.title.trim()) { toast('اكتب العنوان أولًا', true); return; }
    const fields = {
      title: state.title.trim(), type: state.type, parentId: state.parentId,
      priority: state.priority, notes: state.notes, area: state.area,
      due: state.dueDate ? { date: state.dueDate, time: state.dueTime } : null,
    };
    const gp = goalPeriod(state.type, today, store.state.settings.weekStart ?? 6);
    if (gp) fields.period = gp;
    if (preset.editId) {
      await updateItem(preset.editId, fields);
      close();
    } else {
      await addItem(fields);
      toast('أُضيفت ✓');
      if (keepOpen) { state.title = ''; state.notes = ''; render(); }
      else close();
    }
  }

  render();
}

export function openEditSheet(item) {
  openAddSheet({
    editId: item.id, type: item.type, parentId: item.parentId,
    dueDate: item.due ? item.due.date : null,
    priority: item.priority || 1, area: item.area || null,
  });
  // املأ الحقول بعد أول render
  setTimeout(() => {
    const root = document.getElementById('sheet-root');
    if (!root.querySelector('#f-title')) return;
    root.querySelector('#f-title').value = item.title;
    root.querySelector('#f-title').dispatchEvent(new Event('input'));
    root.querySelector('#f-notes').value = item.notes || '';
    root.querySelector('#f-notes').dispatchEvent(new Event('input'));
    root.querySelector('#f-date').value = item.due ? item.due.date : '';
    root.querySelector('#f-time').value = (item.due && item.due.time) || '';
    root.querySelector('#f-time').dispatchEvent(new Event('change'));
    root.querySelectorAll('#f-pris .chip').forEach(c => c.classList.toggle('sel', +c.dataset.p === item.priority));
  }, 0);
}

export function toast(msg, warn = false, timeout = 2600) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast' + (warn ? ' warn' : '');
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
