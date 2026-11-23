// تبويب العالم: قرية القمر — كانفس بملء الشاشة + لافتات DOM + بطل يتبع الإنجاز
import { store } from '../store.js';
import { topbarHTML } from '../ui/topbar.js';
import { W, H, DESTINATIONS, pathPoint, destinationProgress, destinationState, heroT } from './layout.js';
import { drawScene } from './renderer.js';
import { loadSheet, drawFrame } from './sprites.js';
import { sounds, unlockAudio, setMuted, vibrate } from './sound.js';
import { openAddSheet } from '../ui/sheet.js';
import { arNum } from '../core/dates.js';

let raf = null;
let sheets = null;
let hero = { t: 0, targetT: 0, frame: 0, facing: 'right', celebrating: 0 };
let lastCompleteCount = 0;

export async function renderWorld(app, state) {
  setMuted(state.settings.sound === false);
  app.innerHTML = `
    <div style="position:relative;height:100%;background:#0B1838;overflow:hidden">
      <canvas id="world-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div style="position:absolute;top:0;right:0;left:0;z-index:5">${topbarHTML(state)}</div>
      <div id="labels" style="position:absolute;inset:0;pointer-events:none;z-index:4"></div>
      <div id="next-task" style="position:absolute;right:14px;left:14px;bottom:10px;z-index:5"></div>
      <button class="fab" id="fab" aria-label="إضافة مهمة" style="bottom:auto;top:64px">+</button>
    </div>`;

  const canvas = app.querySelector('#world-canvas');
  const ctx = canvas.getContext('2d');
  const box = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = box.width * dpr;
  canvas.height = box.height * dpr;
  ctx.scale(dpr, dpr);
  const scale = Math.min(box.width / W, box.height / H);
  const offX = (box.width - W * scale) / 2, offY = (box.height - H * scale) / 2;

  if (!sheets) {
    try {
      const sami = await loadSheet('assets/characters/sami/walk-side.png', await (await fetch('assets/characters/sami/walk-side.json')).json());
      const bondok = await loadSheet('assets/characters/bondok/walk-side.png', await (await fetch('assets/characters/bondok/walk-side.json')).json());
      sheets = { sami, bondok };
    } catch { sheets = { sami: null, bondok: null }; }
  }

  // لافتات الوجهات
  const labels = app.querySelector('#labels');
  labels.innerHTML = '';
  for (const d of DESTINATIONS) {
    const p = destinationProgress(state.items, d.id);
    const st = destinationState(p);
    const el = document.createElement('div');
    const lx = offX + d.x * scale, ly = offY + d.y * scale;
    el.style.cssText = `position:absolute;left:${lx - 46}px;top:${ly + 6}px;width:92px;text-align:center;
      background:rgba(14,34,56,.85);color:${st.key === 'locked' ? '#8FA8B8' : '#CFF5EA'};
      border:2px solid ${st.key === 'done' ? '#FFC857' : st.key === 'open' ? '#7FE0CF' : '#33475C'};
      border-radius:10px;padding:3px 4px;font-size:11px;pointer-events:auto;cursor:pointer`;
    el.innerHTML = `<div style="font-weight:bold">${d.name}</div>
      <div style="font-size:10px;opacity:.9">${p.ratio === null ? st.label : `${arNum(p.done)}/${arNum(p.total)} · ${st.label}`}</div>`;
    el.onclick = () => { unlockAudio(); sounds.click(); location.hash = '#/goals'; };
    labels.appendChild(el);
  }

  // المهمة التالية (أقرب مهمة غير منجزة)
  const today = new Date();
  const tStr = today.toISOString().slice(0, 10);
  const next = state.items.filter(i => !i.archivedAt && i.status !== 'done' && i.type === 'task')
    .sort((a, b) => ((a.due?.date || '9999') < (b.due?.date || '9999') ? -1 : 1))[0];
  const nt = app.querySelector('#next-task');
  if (next) {
    const doneCount = state.items.filter(i => !i.archivedAt && ['task', 'subtask'].includes(i.type) && i.status === 'done').length;
    const totalCount = state.items.filter(i => !i.archivedAt && ['task', 'subtask'].includes(i.type)).length;
    nt.innerHTML = `<div style="background:rgba(14,34,56,.9);border:2px solid #33475C;border-radius:12px;
      padding:8px 12px;color:#CFF5EA;font-size:13px;display:flex;justify-content:space-between;align-items:center">
      <span>المهمة التالية: <b>${esc(next.title)}</b></span>
      <b style="color:#FFC857">${arNum(doneCount)} / ${arNum(totalCount)}</b></div>`;
  } else {
    nt.innerHTML = `<div style="background:rgba(14,34,56,.9);border:2px solid #33475C;border-radius:12px;
      padding:8px 12px;color:#CFF5EA;font-size:13px;text-align:center">لا مهام بعد — اضغط + وابدأ رحلتك 🌙</div>`;
  }

  app.querySelector('#fab').onclick = () => { unlockAudio(); openAddSheet({ dueDate: tStr }); };

  // حالة البطل
  hero.targetT = heroT(state.items);
  if (hero.t === 0) hero.t = hero.targetT; // فتح التطبيق لا يحرّكه
  const completedNow = state.events.filter(e => e.kind === 'complete').length;
  if (completedNow > lastCompleteCount && lastCompleteCount !== 0) {
    hero.celebrating = 90; // ~1.5 ثانية احتفال
    sounds.celebrate();
    vibrate([40, 60, 40]);
  }
  lastCompleteCount = completedNow;

  if (raf) cancelAnimationFrame(raf);
  let last = performance.now();
  const loop = (now) => {
    if (!document.body.contains(canvas)) { raf = null; return; }
    const dt = Math.min(50, now - last); last = now;
    const reduce = store.state.settings.reduceMotion;
    const moving = Math.abs(hero.targetT - hero.t) > 0.002;
    if (moving && !reduce) {
      hero.t += Math.sign(hero.targetT - hero.t) * dt * 0.00008;
      hero.frame += dt / 100;
    } else {
      hero.t = hero.targetT;
      hero.frame = 0;
    }
    if (hero.celebrating > 0) { hero.celebrating--; hero.frame += dt / 60; }

    drawScene(ctx, box.width, box.height, now);
    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);
    if (sheets && sheets.sami) {
      const p = pathPoint(hero.t);
      const hop = hero.celebrating > 0 ? Math.abs(Math.sin(hero.celebrating / 6)) * 14 : 0;
      const fr = Math.floor(hero.frame) % sheets.sami.frames;
      drawFrame(ctx, sheets.sami, fr, p.x, p.y - hop, 1, 'left');
      if (sheets.bondok) {
        const dp = pathPoint(Math.max(0, hero.t - 0.045));
        const bfr = Math.floor(hero.frame * 1.2) % sheets.bondok.frames;
        drawFrame(ctx, sheets.bondok, bfr, dp.x + 34, dp.y - hop * 0.6, 0.7, 'left');
      }
    }
    ctx.restore();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
