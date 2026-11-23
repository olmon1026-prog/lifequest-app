// تبويب العالم: قرية القمر الحية — مشهد بكسل + محرك حياة (روتين + مشاهد إنجاز + قصة).
import { store } from '../store.js';
import { topbarHTML } from '../ui/topbar.js';
import { W, H, DESTINATIONS, SPOTS, pathPoint, destinationProgress, destinationState, heroT } from './layout.js';
import { drawScene } from './renderer.js';
import { loadSheet } from './sprites.js';
import { Actor } from './actors.js';
import { dayPhase, routineFor, planScenes, newCompleteEvents, nextStoryScene, MAX_LIVE_SCENES } from './life.js';
import { loadStory, markStory } from './story.js';
import { sounds, unlockAudio, setMuted, vibrate } from './sound.js';
import { openAddSheet } from '../ui/sheet.js';
import { arNum, fmtDateAr, todayStr } from '../core/dates.js';

let raf = null, sheets = null;
const sami = new Actor('sami', SPOTS.square.x, SPOTS.square.y, 1);
const bondok = new Actor('bondok', SPOTS.square.x + 30, SPOTS.square.y + 12, 0.7);
bondok.speed = 0.07;

// حالة المحرك عبر إعادة الرسم
const engine = {
  queue: [], active: null, phaseEnds: 0, step: null,
  lastShown: JSON.parse(globalThis.localStorage?.getItem('lq-engine-v1') || 'null'),
  digest: [], wanderAt: 0,
};
function saveEngine() {
  try { localStorage.setItem('lq-engine-v1', JSON.stringify(engine.lastShown)); } catch {}
}

const ACTIVITY_BY_DEST = { health: 'work', learning: 'read', work: 'work', home: 'work', money: 'work' };
const ACTIVITY_LABEL = { health: 'يتمرن على الشاطئ', learning: 'يقرأ عند المنارة', work: 'يعمل في الورشة', home: 'يرتّب بيته', money: 'يجهّز بضاعة السوق', square: 'في الساحة' };

export async function renderWorld(app, state) {
  setMuted(state.settings.sound === false);
  const phase = dayPhase(new Date());
  app.innerHTML = `
    <div style="position:relative;height:100%;background:#0B1838;overflow:hidden">
      <canvas id="world-canvas" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
      <div style="position:absolute;top:0;right:0;left:0;z-index:5">${topbarHTML(state)}</div>
      <div id="labels" style="position:absolute;inset:0;pointer-events:none;z-index:4"></div>
      <div id="sami-doing" style="position:absolute;top:64px;right:14px;z-index:5"></div>
      <div id="digest" style="position:absolute;left:14px;bottom:64px;z-index:5"></div>
      <div id="next-task" style="position:absolute;right:14px;left:14px;bottom:10px;z-index:5"></div>
      <button class="fab" id="fab" aria-label="إضافة مهمة" style="bottom:auto;top:64px">+</button>
    </div>`;

  const canvas = app.querySelector('#world-canvas');
  const ctx = canvas.getContext('2d');
  const box = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  ctx.scale(dpr, dpr);
  const scale = Math.min(box.width / W, box.height / H);
  const offX = (box.width - W * scale) / 2, offY = (box.height - H * scale) / 2;

  if (!sheets) {
    try {
      const sm = await loadSheet('assets/characters/sami/walk-side.png', await (await fetch('assets/characters/sami/walk-side.json')).json());
      const bd = await loadSheet('assets/characters/bondok/walk-side.png', await (await fetch('assets/characters/bondok/walk-side.json')).json());
      sheets = { sami: sm, bondok: bd };
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
    el.style.cssText = `position:absolute;left:${lx - 44}px;top:${ly + 8}px;width:88px;text-align:center;
      background:rgba(14,34,56,.85);color:${st.key === 'locked' ? '#8FA8B8' : '#CFF5EA'};
      border:2px solid ${st.key === 'done' ? '#FFC857' : st.key === 'open' ? '#7FE0CF' : '#33475C'};
      border-radius:10px;padding:3px 4px;font-size:11px;pointer-events:auto;cursor:pointer`;
    el.innerHTML = `<div style="font-weight:bold">${d.name}</div>
      <div style="font-size:10px;opacity:.9">${p.ratio === null ? st.label : `${arNum(p.done)}/${arNum(p.total)} · ${st.label}`}</div>`;
    el.onclick = () => { unlockAudio(); sounds.click(); showDestinationCard(app, d, p, st, state); };
    labels.appendChild(el);
  }

  // شريط المهمة التالية
  const tStr = todayStr();
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

  // بناء طابور المشاهد من الإنجازات الجديدة (لا مشهد بلا حدث complete حقيقي)
  if (engine.lastShown?.day !== tStr) engine.digest = []; // يوم جديد = ملخص جديد
  const completions = state.events.filter(e => e.kind === 'complete').length;
  const fresh = newCompleteEvents(state.events, engine.lastShown?.eventId ?? null, tStr);
  if (fresh.length) {
    const { live, digest } = planScenes(fresh, state.items);
    engine.queue.push(...live.map(s => ({ type: 'achievement', ...s })));
    engine.digest.push(...digest);
    engine.lastShown = { eventId: fresh[fresh.length - 1].id, day: tStr };
    saveEngine();
  }

  // شريط «ما حدث اليوم» للزيادة عن ٥ مشاهد
  const dg = app.querySelector('#digest');
  if (engine.digest.length) {
    dg.innerHTML = `<div style="background:rgba(14,34,56,.88);border:2px solid #7FE0CF;border-radius:10px;
      padding:5px 10px;color:#CFF5EA;font-size:11px">ما حدث اليوم: <b style="color:#FFC857">${arNum(engine.digest.length)}</b> إنجاز إضافي ✨</div>`;
  } else dg.innerHTML = '';

  const story = loadStory();
  const storyNext = nextStoryScene(story, { completions, phase });

  if (raf) cancelAnimationFrame(raf);
  let last = performance.now();
  const loop = (now) => {
    if (!document.body.contains(canvas)) { raf = null; return; }
    const dt = Math.min(50, now - last); last = now;
    const reduce = store.state.settings.reduceMotion;

    // ١) مشهد قصصي مستحق يتقدم على الطابور
    if (!engine.active && storyNext && !engine.queue.length) startStory(storyNext, state);
    // ٢) التالي من طابور الإنجازات
    if (!engine.active && engine.queue.length) startAchievement(engine.queue.shift());
    // ٣) المحرك
    tickEngine(now, dt, state);
    // بندق: يتبع سامي عن بُعد أو يتجول
    tickBondok(now, dt);

    sami.update(dt, now); bondok.update(dt, now);

    const env = {
      phase, heroT: heroT(state.items), reduceMotion: reduce,
      lamp: story.c1s5 ? 1 : 0, flicker: engine.flicker && now < engine.flicker,
    };
    drawScene(ctx, box.width, box.height, now, env);
    ctx.save(); ctx.translate(offX, offY); ctx.scale(scale, scale);
    if (sheets) {
      bondok.draw(ctx, sheets.bondok, now);
      sami.draw(ctx, sheets.sami, now);
    }
    ctx.restore();

    // شريحة نشاط سامي
    const chip = app.querySelector('#sami-doing');
    if (chip) {
      const txt = engine.active?.label || routineFor(new Date()).label;
      if (chip.dataset.v !== txt) {
        chip.dataset.v = txt;
        chip.innerHTML = `<span style="background:rgba(14,34,56,.85);border:1px solid #33475C;border-radius:9px;
          padding:3px 9px;color:#CFF5EA;font-size:11px">سامي: ${txt}</span>`;
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

// ——— المشاهد ———
function startAchievement(s) {
  const dest = DESTINATIONS.find(d => d.id === s.destination) || DESTINATIONS[3];
  engine.active = { kind: 'achievement', scene: s, label: ACTIVITY_LABEL[dest.id] || 'ينجز مهمة', step: 'go' };
  sami.goTo(dest.spot.x, dest.spot.y, () => {
    engine.active.step = 'act';
    sami.pose = ACTIVITY_BY_DEST[dest.id] || 'work';
    engine.phaseEnds = performance.now() + Math.max(4000, s.durationMs - 4000); // المشي جزء من الزمن
  });
}

function startStory(s, state) {
  unlockAudioSilent();
  engine.active = { kind: 'story', scene: s, label: `الفصل الأول: ${s.name}`, step: 'go' };
  switch (s.scene) {
    case 'arrival':
      sami.x = W + 30; sami.y = H - 40; bondok.x = W + 70; bondok.y = H - 20;
      chainWalk(sami, [pathPoint(0.12), pathPoint(0.3), SPOTS.square], () => { engine.active.step = 'act'; sami.pose = 'idle'; engine.phaseEnds = performance.now() + 3500; });
      break;
    case 'firstTask': {
      const mid = pathPoint(0.45);
      sami.goTo(mid.x, mid.y, () => { engine.active.step = 'act'; sami.pose = 'work'; engine.phaseEnds = performance.now() + 8000; });
      break;
    }
    case 'abandoned':
      sami.goTo(236, 528, () => { engine.active.step = 'act'; sami.pose = 'read'; engine.phaseEnds = performance.now() + 8000; });
      break;
    case 'notebook':
      sami.goTo(SPOTS.tree.x + 8, SPOTS.tree.y, () => {
        engine.active.step = 'act'; sami.pose = 'read';
        bondok.goTo(SPOTS.tree.x - 18, SPOTS.tree.y + 6, () => { bondok.pose = 'sit'; });
        engine.phaseEnds = performance.now() + 9000;
      });
      break;
    case 'nightHint':
      engine.active.step = 'act';
      engine.flicker = performance.now() + 1200; // وميض واحد تلميحًا
      engine.phaseEnds = performance.now() + 8000;
      break;
  }
}

function chainWalk(actor, points, done) {
  const [p, ...rest] = points;
  if (!p) return done();
  actor.goTo(p.x, p.y, () => chainWalk(actor, rest, done));
}

function tickEngine(now) {
  const a = engine.active;
  if (a) {
    if (a.step === 'act' && now >= engine.phaseEnds) {
      if (a.kind === 'story') markStory(a.scene.id);
      sami.hop = 700; bondok.hop = 500;
      sounds.celebrate(); vibrate([40, 60, 40]);
      engine.active = null; sami.pose = 'idle';
    }
    return;
  }
  // روتين اليوم: يقود الموضع والوضعية حين لا مشاهد
  const r = routineFor(new Date());
  const spot = SPOTS[r.spot];
  if (!sami.moving && Math.hypot(spot.x - sami.x, spot.y - sami.y) > 8) sami.goTo(spot.x, spot.y);
  else if (!sami.moving && sami.pose !== r.activity) sami.pose = r.activity;
}

function tickBondok(now) {
  if (bondok.moving) return;
  if (sami.pose === 'sleep') { bondok.pose = 'sleep'; return; }
  if (bondok.pose === 'sleep') bondok.pose = 'idle';
  const d = Math.hypot(sami.x - bondok.x, sami.y - bondok.y);
  if (d > 70) { bondok.pose = 'idle'; bondok.goTo(sami.x + 26, sami.y + 10); return; }
  if (now > engine.wanderAt && !engine.active) { // تجول حر خفيف (حدث مستقل بلا إنجاز)
    engine.wanderAt = now + 7000 + Math.random() * 8000;
    if (Math.random() < 0.35) bondok.pose = bondok.pose === 'sit' ? 'idle' : 'sit';
    else bondok.goTo(bondok.x + (Math.random() - 0.5) * 90, bondok.y + (Math.random() - 0.5) * 40);
  }
}

function unlockAudioSilent() { /* فتح الصوت يتم مع أول لمسة (R6) */ }

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// بطاقة الوجهة (LQ-035)
function showDestinationCard(app, d, p, st, state) {
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
