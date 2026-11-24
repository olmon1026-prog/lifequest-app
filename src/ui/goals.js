// تبويب الأهداف: سنة/شهر/أسبوع، شجرة قابلة للطي بشريط تقدم (§10)
import { icon } from './icons.js';
import { store } from '../store.js';
import { topbarHTML } from './topbar.js';
import { buildChildrenMap, progressOf } from '../core/progress.js';
import { todayStr, weekStartOf, arNum, monthName, goalPeriod } from '../core/dates.js';
import { openAddSheet, openEditSheet } from './sheet.js';

let scope = 'month'; // year | month | week

export function renderGoals(app, state) {
  const today = todayStr();
  const weekStart = state.settings.weekStart ?? 6;
  const keys = {
    year: today.slice(0, 4),
    month: today.slice(0, 7),
    week: weekStartOf(today, weekStart),
  };
  const goalTypes = { year: 'goal_year', month: 'goal_month', week: 'goal_week' };
  // أهداف أُضيفت بلا فترة (خارج شاشة الإضافة) تظهر فورًا بدل انتظار إعادة التحميل —
  // إصلاح معروض فقط؛ التثبيت في القاعدة يتم عند الإقلاع عبر repairGoalPeriods.
  for (const it of state.items) {
    const gp = goalPeriod(it.type, today, weekStart);
    if (gp && (!it.period || !it.period.key)) it.period = gp;
  }
  const roots = state.items.filter(i => !i.archivedAt &&
    i.type === goalTypes[scope] && i.period && i.period.key === keys[scope]);
  // مشاريع بلا أب هدف ضمن النطاق تظهر أيضًا (مستوى الشهر/الأسبوع)
  const extra = scope !== 'year' ? state.items.filter(i => !i.archivedAt && !i.parentId &&
    ['project'].includes(i.type)) : [];

  const childrenMap = buildChildrenMap(state.items);
  const scopeLabel = { year: `سنة ${arNum(keys.year)}`, month: `أهداف ${monthName(+keys.month.slice(0,4), +keys.month.slice(5))}`, week: 'أهداف الأسبوع' }[scope];

  app.innerHTML = `
    ${topbarHTML(state)}
    <div style="padding:14px 16px 4px"><h1>الأهداف</h1></div>
    <div style="display:flex;gap:8px;padding:8px 16px">
      ${[['year', 'سنة'], ['month', 'شهر'], ['week', 'أسبوع']].map(([k, l]) =>
        `<button class="chip ${scope === k ? 'sel' : ''}" data-scope="${k}">${l}</button>`).join('')}
    </div>
    <div style="padding:6px 16px 0"><h2>${scopeLabel}</h2>
      <span class="muted">${arNum(roots.length)} ${roots.length === 1 ? 'هدف' : 'أهداف'}</span>
    </div>
    <div id="tree"></div>
    <button class="fab" id="fab" aria-label="إضافة">+</button>
  `;
  app.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => { scope = b.dataset.scope; renderGoals(app, state); });
  app.querySelector('#fab').onclick = () => openAddSheet({ type: goalTypes[scope] });

  const tree = app.querySelector('#tree');
  if (!roots.length && !extra.length) {
    tree.innerHTML = `<div class="empty"><div class="big">${icon('target', 40)}</div>لا أهداف في هذا النطاق. اضغط + وأضف هدفًا.</div>`;
    return;
  }
  for (const r of [...roots, ...extra]) tree.appendChild(nodeEl(r, childrenMap, 0));
}

function nodeEl(item, childrenMap, depth) {
  const wrap = document.createElement('div');
  const p = progressOf(item, childrenMap);
  const pct = Math.round(p * 100);
  const children = (childrenMap.get(item.id) || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const typeBadge = { goal_year: 'هدف', goal_month: 'هدف', goal_week: 'هدف', project: 'مشروع', stage: 'مرحلة', task: 'مهمة', subtask: 'فرعية' }[item.type];
  const row = document.createElement('div');
  row.className = 'card';
  row.style.marginRight = (16 + depth * 14) + 'px';
  row.style.padding = '10px 12px';
  row.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px">
      ${children.length ? `<button class="fold" style="font-size:12px;width:22px">▾</button>` : '<span style="width:22px"></span>'}
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;${item.status === 'done' ? 'text-decoration:line-through;color:var(--sub)' : ''}">${esc(item.title)}</div>
        <div class="muted" style="font-size:11px">${typeBadge}</div>
      </div>
      ${item.type !== 'task' && item.type !== 'subtask' && item.status !== 'done'
        ? `<button class="addkid" data-add="${item.id}" style="font-size:11px;padding:4px 8px;border:1px solid var(--teal);color:var(--teal);border-radius:10px;background:#fff;white-space:nowrap">+ مهمة</button>`
        : ''}
      <div style="font-weight:bold;font-size:13px;color:var(--teal)">${arNum(pct)}٪</div>
    </div>
    <div style="height:6px;background:#E3EDEA;border-radius:3px;margin-top:8px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${item.status === 'done' ? 'var(--amber)' : 'var(--teal)'}"></div>
    </div>`;
  row.onclick = (e) => { if (!e.target.classList.contains('fold')) openEditSheet(item); };
  const addkid = row.querySelector('.addkid');
  if (addkid) addkid.onclick = (e) => { e.stopPropagation(); openAddSheet({ parentId: item.id, type: 'task' }); };
  wrap.appendChild(row);
  const kids = document.createElement('div');
  for (const c of children) kids.appendChild(nodeEl(c, childrenMap, depth + 1));
  wrap.appendChild(kids);
  const fold = row.querySelector('.fold');
  if (fold) fold.onclick = () => {
    const hidden = kids.style.display === 'none';
    kids.style.display = hidden ? '' : 'none';
    fold.textContent = hidden ? '▾' : '◂';
  };
  return wrap;
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
