// بطاقة الوجهة (LQ-035): التقدم والمتبقي وأقرب موعد وزر التفاصيل
import { openAddSheet } from '../ui/sheet.js';
import { arNum, fmtDateAr } from '../core/dates.js';

// بطاقة الوجهة (LQ-035)
export function showDestinationCard(app, d, p, st, state) {
  app.querySelector('#dest-card')?.remove();
  const linked = state.items.filter(i => !i.archivedAt && i.area === d.id &&
    ['task', 'subtask', 'project', 'stage'].includes(i.type));
  const remaining = linked.filter(i => i.status !== 'done');
  const nextDue = remaining.filter(i => i.due && i.due.date).sort((a, b) => (a.due.date < b.due.date ? -1 : 1))[0];
  const pct = p.ratio === null ? null : Math.round(p.ratio * 100);
  const wrap = document.createElement('div');
  wrap.id = 'dest-card';
  wrap.style.cssText = 'position:absolute;inset:0;z-index:8;background:rgba(4,10,24,.55);display:flex;align-items:flex-end';
  wrap.innerHTML = `
    <div style="background:var(--panel);color:var(--foam);width:100%;border-radius:18px 18px 0 0;padding:16px 18px 20px;box-shadow:0 -6px 24px rgba(0,0,0,.4)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="color:#fff">${d.name}</h2>
        <button id="dc-close" style="color:var(--foam);font-size:20px;padding:4px 8px">✕</button>
      </div>
      ${pct === null
        ? '<div class="muted" style="color:#8FA8B8;margin-bottom:10px">مغلق — اربط مهام بهذا المجال من شاشة الإضافة عشان يتفتح.</div>'
        : `<div style="height:10px;background:#061022;border-radius:5px;overflow:hidden;margin-bottom:8px">
             <div style="height:100%;width:${pct}%;background:${st.key === 'done' ? 'var(--amber)' : 'var(--mint)'}"></div>
           </div>
           <div style="display:flex;gap:14px;font-size:13px;margin-bottom:10px;color:#CFF5EA">
             <span>التقدم: <b>${arNum(pct)}٪</b></span>
             <span>المتبقي: <b>${arNum(remaining.length)}</b> من ${arNum(p.total)}</span>
           </div>`}
      ${nextDue ? `<div style="font-size:12px;color:#8FA8B8;margin-bottom:12px">أقرب موعد: ${fmtDateAr(nextDue.due.date)} — ${esc(nextDue.title)}</div>` : ''}
      <button id="dc-open" class="btn" style="width:100%">${pct === null ? 'أضف مهمة لهذا المجال' : 'افتح التفاصيل في الأهداف'}</button>
    </div>`;
  wrap.onclick = e => { if (e.target === wrap) wrap.remove(); };
  wrap.querySelector('#dc-close').onclick = () => wrap.remove();
  wrap.querySelector('#dc-open').onclick = () => {
    wrap.remove();
    if (pct === null) openAddSheet({ area: d.id });
    else location.hash = '#/goals';
  };
  app.querySelector('#labels').parentElement.appendChild(wrap);
}
