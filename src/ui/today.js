// تبويب اليوم: متأخر · اليوم · قادم · بدون موعد (§10) مع تراجع ٥ ثوانٍ
import { icon } from './icons.js';
import { store } from '../store.js';
import { topbarHTML } from './topbar.js';
import { todayStr, addDays, fmtDateAr, arNum, weekStartOf } from '../core/dates.js';
import { completeItem, uncompleteItem } from '../db/repo.js';
import { openAddSheet, openEditSheet, toast } from './sheet.js';
import { buildChildrenMap, progressOf } from '../core/progress.js';
import { totalXP } from '../core/xp.js';

const DEST_LABELS = { health: 'بيت الصحة', learning: 'بيت التعلّم', work: 'بيت العمل', home: 'البيت', money: 'السوق' };

export function renderToday(app, state) {
  const today = todayStr();
  const allItems = state.items.filter(i => !i.archivedAt && ['task', 'subtask'].includes(i.type));
  const byIdAll = new Map(allItems.map(i => [i.id, i]));
  // الفرعية ذات الأب الموجود تُعرض متداخلة تحته، لا كصف مستقل (LQ-026)
  const hasShownParent = (i) => i.type === 'subtask' && i.parentId && byIdAll.has(i.parentId) &&
    ['task', 'subtask'].includes(byIdAll.get(i.parentId).type);
  const items = allItems.filter(i => !hasShownParent(i));
  const overdue = [], dueToday = [], upcoming = [], noDate = [];
  for (const it of items) {
    if (it.status === 'done') continue;
    const d = it.due && it.due.date;
    if (!d) noDate.push(it);
    else if (d < today) overdue.push(it);
    else if (d === today) dueToday.push(it);
    else upcoming.push(it);
  }
  overdue.sort(byDate); dueToday.sort(byPri); upcoming.sort(byDate); noDate.sort(byPri);

  const doneToday = state.items.filter(i => !i.archivedAt && i.status === 'done' &&
    ['task', 'subtask'].includes(i.type) && i.completedAt && todayStr(new Date(i.completedAt)) === today)
    .filter(i => !hasShownParent(i));
  const todayTotal = dueToday.length + overdue.length + doneToday.length;
  const xpToday = totalXP(state.events.filter(e => e.day === today));

  const weekStart = state.settings.weekStart ?? 6;
  const ws = weekStartOf(today, weekStart);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  app.innerHTML = `
    ${topbarHTML(state)}
    <div style="padding:14px 16px 4px">
      <h1>اليوم</h1>
      <div class="muted">${fmtDateAr(today)}</div>
    </div>
    <div style="display:flex;gap:4px;padding:10px 16px">
      ${weekDays.map(d => `
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:10px;${d === today ? 'background:var(--amber);font-weight:bold' : 'background:#fff'}">
          <div style="font-size:10px;color:${d === today ? '#1a1c2c' : 'var(--sub)'}">${['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'][new Date(d + 'T12:00').getDay() === 6 ? 6 : new Date(d + 'T12:00').getDay()]}</div>
          <div style="font-size:14px">${arNum(+d.slice(8))}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      <h3>تقدّم اليوم</h3>
      <div class="muted">${arNum(doneToday.length)} من ${arNum(todayTotal)} مهام منجزة · +${arNum(xpToday)} XP (الحد ${arNum(300)})</div>
      <div style="height:8px;background:#E3EDEA;border-radius:4px;margin-top:8px;overflow:hidden">
        <div style="height:100%;width:${todayTotal ? Math.round(100 * doneToday.length / todayTotal) : 0}%;background:var(--teal)"></div>
      </div>
    </div>
    <div id="sections"></div>
    <button class="fab" id="fab" aria-label="إضافة مهمة">+</button>
  `;

  const sections = app.querySelector('#sections');
  const sec = (title, list, cls = '') => {
    if (!list.length) return;
    const h = document.createElement('div');
    h.innerHTML = `<div style="padding:12px 16px 2px;font-weight:bold;font-size:14px" class="${cls}">${title} · ${arNum(list.length)}</div>`;
    sections.appendChild(h);
    for (const it of list) {
    sections.appendChild(taskRow(it, state));
    appendSubs(it, 1);
  }
  };
  function appendSubs(parent, depth) {
    if (depth > 5) return;
    const subs = allItems.filter(i => i.parentId === parent.id && i.type === 'subtask');
    for (const sub of subs) {
      const row = taskRow(sub, state);
      row.style.marginRight = (depth * 22) + 'px';
      row.style.opacity = '0.95';
      row.querySelector('.title').style.fontSize = '13px';
      sections.appendChild(row);
      appendSubs(sub, depth + 1);
    }
  }
  sec('متأخر', overdue);
  sec('اليوم', dueToday);
  sec('قادم', upcoming);
  sec('بدون موعد', noDate);
  if (doneToday.length) {
    const h = document.createElement('div');
    h.innerHTML = `<div style="padding:12px 16px 2px;font-weight:bold;font-size:14px;color:var(--teal)">أُنجزت اليوم · ${arNum(doneToday.length)}</div>`;
    sections.appendChild(h);
    for (const it of doneToday) {
      sections.appendChild(taskRow(it, state));
      appendSubs(it, 1);
    }
  }
  if (!items.filter(i => i.status !== 'done').length && !doneToday.length) {
    sections.innerHTML = `<div class="empty"><div class="big">${icon('moon', 40)}</div>لا مهام بعد. اضغط + وأضف أول مهمة.</div>`;
  }

  app.querySelector('#fab').onclick = () => openAddSheet({ dueDate: today });
}

function taskRow(it, state) {
  const el = document.createElement('div');
  el.className = 'task-row' + (it.status === 'done' ? ' done' : '');
  const parent = it.parentId && state.items.find(x => x.id === it.parentId);
  const due = it.due && it.due.date;
  const today = todayStr();
  el.innerHTML = `
    <div class="pri pri-${it.priority || 1}"></div>
    <button class="check" aria-label="إنجاز">${it.status === 'done' ? '✓' : ''}</button>
    <div class="body">
      <div class="title">${esc(it.title)}</div>
      <div class="meta">${[due && due !== today ? (due < today ? 'متأخر · ' : '') + fmtDateAr(due) : '', parent ? esc(parent.title) : ''].filter(Boolean).join(' · ')}</div>
    </div>`;
  el.querySelector('.check').onclick = async () => {
    if (it.status === 'done') {
      await uncompleteItem(it.id);
    } else {
      await completeItem(it.id);
      undoBar(it);
    }
  };
  el.querySelector('.body').onclick = () => openEditSheet(it);
  return el;
}

let undoTimer = null;
function undoBar(it) {
  const root = document.getElementById('toast-root');
  if (undoTimer) { clearTimeout(undoTimer); }
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.pointerEvents = 'auto';
  el.innerHTML = `أُنجزت «${esc(it.title)}» <button style="color:var(--amber);font-weight:bold;text-decoration:underline">تراجع</button>`;
  el.querySelector('button').onclick = async () => {
    clearTimeout(undoTimer);
    el.remove();
    await uncompleteItem(it.id);
  };
  root.appendChild(el);
  undoTimer = setTimeout(() => el.remove(), 5000);
}

function byDate(a, b) { return (a.due?.date || '9999') < (b.due?.date || '9999') ? -1 : 1; }
function byPri(a, b) { return (b.priority || 1) - (a.priority || 1); }
function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
