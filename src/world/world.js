// تبويب العالم: قرية القمر الحية — عالم 820×640 بكاميرا تتبع سامي + محرك حياة.
import { store } from '../store.js';
import { topbarHTML } from '../ui/topbar.js';
import { W, H, VIEW_W, VIEW_H, DESTINATIONS, SPOTS, SAMI_DOOR, pathPoint, nearestPathT,
         cameraFor, destinationProgress, destinationState, heroT } from './layout.js';
import { drawScene, preloadBuildings } from './renderer.js';
import { loadSheet } from './sprites.js';
import { Actor } from './actors.js';
import { dayPhase, routineFor, planScenes, newCompleteEvents, nextStoryScene, shouldRestAtHome } from './life.js';
import { loadStory, markStory } from './story.js';
import { sounds, unlockAudio, setMuted, vibrate } from './sound.js';
import { openAddSheet } from '../ui/sheet.js';
import { arNum, todayStr } from '../core/dates.js';
import { showDestinationCard } from './destcard.js';

let raf = null, sheets = null;
const sami = new Actor('sami', SPOTS.square.x, SPOTS.square.y, 0.5);   // ~٥٠px ≈ قامة الباب
const bondok = new Actor('bondok', SPOTS.square.x + 30, SPOTS.square.y + 12, 0.38);
bondok.speed = 0.048; // مطابق لخطوته: دورة ٨ إطارات × ٨٥م.ث ≈ ٣٦px

// حالة المحرك عبر إعادة الرسم
const engine = {
  queue: [], active: null, phaseEnds: 0, digest: [], wanderAt: 0,
  lastShown: JSON.parse(globalThis.localStorage?.getItem('lq-engine-v1') || 'null'),
  resting: false, doorT: 0, doorTarget: 0, enterAt: 0, camX: 0,
};
function saveEngine() {
  try { localStorage.setItem('lq-engine-v1', JSON.stringify(engine.lastShown)); } catch {}
}

const ACTIVITY_BY_DEST = { health: 'work', learning: 'read', work: 'work', home: 'work', money: 'work' };
const ACTIVITY_LABEL = { health: 'يتمرن على الشاطئ', learning: 'يقرأ عند المنارة', work: 'يعمل في الورشة', home: 'يرتّب بيته', money: 'يجهّز بضاعة السوق', square: 'في الساحة' };

export async function renderWorld(app, state) {
  window.__world = { sami, bondok, engine, startAchievement }; // مقبض اختبار حركي (CDP)
  setMuted(state.settings.sound === false);
  const phase = dayPhase(new Date());
  document.body.dataset.worldPhase = phase; // الشريط السفلي يتبع وقت المشهد
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
  const scale = Math.max(box.width / VIEW_W, box.height / VIEW_H); // تغطية لا احتواء
  // منطقة HUD آمنة: خط سير البطل (حتى باب البيت y≈630) لا ينزل تحت شريط «المهمة التالية» مهما كان مقاس الشاشة
  const offX = (box.width - VIEW_W * scale) / 2;
  const offY = Math.min((box.height - VIEW_H * scale) / 2, box.height - 56 - 630 * scale);

  if (!sheets) {
    try {
      const sm = await loadSheet('assets/characters/sami/walk-side.png', await (await fetch('assets/characters/sami/walk-side.json')).json());
      const bd = await loadSheet('assets/characters/bondok/walk-side.png', await (await fetch('assets/characters/bondok/walk-side.json')).json());
      sheets = { sami: sm, bondok: bd };
    } catch { sheets = { sami: null, bondok: null }; }
    await preloadBuildings();
  }

  // لافتات الوجهات: تُبنى مرة وتُزاح مع الكاميرا كل إطار
  const labels = app.querySelector('#labels');
  labels.innerHTML = '';
  const labelEls = [];
  for (const d of DESTINATIONS) {
    const p = destinationProgress(state.items, d.id);
    const st = destinationState(p);
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:88px;text-align:center;
      background:rgba(14,34,56,.85);color:${st.key === 'locked' ? '#8FA8B8' : '#CFF5EA'};
      border:2px solid ${st.key === 'done' ? '#FFC857' : st.key === 'open' ? '#7FE0CF' : '#33475C'};
      border-radius:10px;padding:3px 4px;font-size:11px;pointer-events:auto;cursor:pointer`;
    el.innerHTML = `<div style="font-weight:bold">${d.name}</div>
      <div style="font-size:10px;opacity:.9">${p.ratio === null ? st.label : `${arNum(p.done)}/${arNum(p.total)} · ${st.label}`}</div>`;
    el.onclick = () => { unlockAudio(); sounds.click(); showDestinationCard(app, d, p, st, state); };
    labels.appendChild(el);
    labelEls.push({ el, d });
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
      padding:8px 12px;color:#CFF5EA;font-size:13px;text-align:center">لا مهام بعد — اضغط + وابدأ رحلتك</div>`;
  }
  app.querySelector('#fab').onclick = () => { unlockAudio(); openAddSheet({ dueDate: tStr }); };

  // طابور المشاهد من الإنجازات الجديدة (لا مشهد بلا حدث complete حقيقي)
  if (engine.lastShown?.day !== tStr) engine.digest = [];
  const completions = state.events.filter(e => e.kind === 'complete').length;
  const fresh = newCompleteEvents(state.events, engine.lastShown?.eventId ?? null, tStr);
  if (fresh.length) {
    const { live, digest } = planScenes(fresh, state.items);
    engine.queue.push(...live.map(s => ({ type: 'achievement', ...s })));
    engine.digest.push(...digest);
    engine.lastShown = { eventId: fresh[fresh.length - 1].id, day: tStr };
    saveEngine();
  }

  const dg = app.querySelector('#digest');
  if (engine.digest.length) {
    dg.innerHTML = `<div style="background:rgba(14,34,56,.88);border:2px solid #7FE0CF;border-radius:10px;
      padding:5px 10px;color:#CFF5EA;font-size:11px">ما حدث اليوم: <b style="color:#FFC857">${arNum(engine.digest.length)}</b> إنجاز إضافي</div>`;
  } else dg.innerHTML = '';

  const story = loadStory();
  const storyNext = nextStoryScene(story, { completions, phase });

  if (raf) cancelAnimationFrame(raf);
  let last = performance.now();
  const loop = (now) => {
    if (!document.body.contains(canvas)) { raf = null; return; }
    const w0 = performance.now(); // قياس زمن العمل الفعلي داخل الإطار (ليس إيقاع vsync)
    const dt = Math.min(50, now - last); last = now;
    const reduce = store.state.settings.reduceMotion;

    // الأولوية: مشهد قصصي مستحق ثم طابور الإنجازات ثم الروتين/الراحة
    if (!engine.active && storyNext && !engine.queue.length) startStory(storyNext, state);
    if (!engine.active && engine.queue.length) startAchievement(engine.queue.shift());
    tickEngine(now, dt);
    tickBondok(now, dt);

    sami.update(dt, now); bondok.update(dt, now);

    // الكاميرا تتبع سامي بنعومة، ثم تُلتقط لبكسل صحيح (قاعدة فن البكسل: لا عينات كسرية)
    const targetCam = cameraFor(sami.visible ? sami.x : SAMI_DOOR.x);
    engine.camX += (targetCam - engine.camX) * Math.min(1, dt / 300);
    engine.camXi = Math.round(engine.camX);

    // حركة الباب السلسة نحو هدفها
    if (engine.doorT !== engine.doorTarget) {
      const dd = Math.sign(engine.doorTarget - engine.doorT) * dt / 260;
      engine.doorT = Math.abs(engine.doorTarget - engine.doorT) <= Math.abs(dd)
        ? engine.doorTarget : engine.doorT + dd;
    }

    const env = {
      phase, heroT: heroT(state.items), reduceMotion: reduce,
      lamp: story.c1s5 ? 1 : 0, flicker: engine.flicker && now < engine.flicker,
      camX: engine.camXi, doorT: engine.doorT,
    };
    drawScene(ctx, box.width, box.height, now, env, 'back');
    ctx.save(); ctx.translate(offX - engine.camXi * scale, offY); ctx.scale(scale, scale);
    if (sheets) {
      bondok.draw(ctx, sheets.bondok, now);
      sami.draw(ctx, sheets.sami, now);
    }
    ctx.restore();
    drawScene(ctx, box.width, box.height, now, env, 'front');

    // وهج الوجهة أثناء لحظة الإنجاز: تغذية راجعة مرئية فورية تقرأ بلا شرح (مصدر Habitica/Octalysis)
    if (engine.active?.kind === 'achievement' && engine.active.step === 'act' && engine.active.dest) {
      const d = engine.active.dest;
      const pulse = reduce ? 0.3 : 0.25 + 0.15 * Math.sin(now / 300);
      const gx = offX + (d.x - engine.camXi) * scale, gy = offY + d.y * scale;
      const g = ctx.createRadialGradient(gx, gy - 30 * scale, 4, gx, gy - 30 * scale, 64 * scale);
      g.addColorStop(0, `rgba(255,200,87,${pulse})`);
      g.addColorStop(1, 'rgba(255,200,87,0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - 64 * scale, gy - 94 * scale, 128 * scale, 128 * scale);
    }

    // إزاحة اللافتات مع الكاميرا
    const actorRects = [sami, bondok].filter(a => a.visible && a.alpha > 0.3).map(a => {
      const ax = offX + (a.x - engine.camXi) * scale, ay = offY + a.y * scale;
      const ah = (sheets?.[a.name]?.frameHeight || 80) * a.scale * scale;
      const aw = (sheets?.[a.name]?.frameWidth || 50) * a.scale * scale / 2;
      return { l: ax - aw - 6, r: ax + aw + 6, t: ay - ah - 6, b: ay + 4 };
    });
    // التنبيهات العائمة فوق المشهد (ملخص اليوم أسفل اليسار، شريحة حالة سامي أعلى اليمين):
    // اللافتة تُرفع فوقها كما تُرفع فوق رؤوس الممثلين — لا تغطيها ولا تُغطى بها
    const overlayRects = [];
    for (const sel of ['#digest', '#sami-doing']) {
      const o = app.querySelector(sel);
      if (o && o.innerHTML && o.offsetHeight > 0)
        overlayRects.push({ l: o.offsetLeft - 4, r: o.offsetLeft + o.offsetWidth + 4, t: o.offsetTop, b: o.offsetTop + o.offsetHeight });
    }
    for (const { el, d } of labelEls) {
      const lx = offX + (d.x - engine.camXi) * scale, ly = offY + d.y * scale;
      const clamped = Math.max(48, Math.min(box.width - 48, lx)); // اللافتة تبقى كاملة داخل الشاشة أفقيًا
      const hudTop = nt && nt.offsetTop ? nt.offsetTop : box.height - 56; // قياس فعلي لسطح شريط «المهمة التالية»
      const lh = el.offsetHeight || 34;
      let topY = Math.max(60, Math.min(hudTop - lh - 2, ly - lh - 6)); // فوق نقطة الوجهة، تحت الشريط العلوي، وخارج منطقة HUD
      for (const rc of [...actorRects, ...overlayRects]) { // ولا تغطي سامي/بندق ولا التنبيهات العائمة — تُرفع فوقها
        if (clamped + 44 > rc.l && clamped - 44 < rc.r && topY + lh > rc.t && topY < rc.b)
          topY = Math.max(60, rc.t - lh - 2); // لا تختفي تحت الشريط العلوي حتى عند الرفع
      }
      el.style.left = (clamped - 44) + 'px';
      el.style.top = topY + 'px';
      el.style.display = (lx < -120 || lx > box.width + 120) ? 'none' : '';
    }

    // شريحة نشاط سامي
    const chip = app.querySelector('#sami-doing');
    if (chip) {
      const txt = engine.resting ? 'يستريح في بيته' : (engine.active?.label || routineFor(new Date()).label);
      if (chip.dataset.v !== txt) {
        chip.dataset.v = txt;
        chip.innerHTML = `<span style="background:rgba(14,34,56,.85);border:1px solid #33475C;border-radius:9px;
          padding:3px 9px;color:#CFF5EA;font-size:11px">سامي: ${txt}</span>`;
      }
    }
    (engine.workMs ??= []).push(Math.round((performance.now() - w0) * 100) / 100);
    if (engine.workMs.length > 900) engine.workMs.shift();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

// ——— المشاهد ———
function startAchievement(s) {
  leaveHome();
  const dest = DESTINATIONS.find(d => d.id === s.destination) || DESTINATIONS[3];
  engine.active = { kind: 'achievement', scene: s, dest, label: ACTIVITY_LABEL[dest.id] || 'ينجز مهمة', step: 'go' };
  sami.goTo(dest.spot.x, dest.spot.y, () => {
    engine.active.step = 'act';
    sami.pose = ACTIVITY_BY_DEST[dest.id] || 'work';
    engine.phaseEnds = performance.now() + Math.max(4000, s.durationMs - 4000);
  });
}

function startStory(s, state) {
  leaveHome();
  engine.active = { kind: 'story', scene: s, label: `الفصل الأول: ${s.name}`, step: 'go' };
  switch (s.scene) {
    case 'arrival':
      sami.x = 30; sami.y = 630; bondok.x = -10; bondok.y = 640;
      sami.visible = true; bondok.visible = true;
      chainWalk(sami, [pathPoint(0.08), pathPoint(0.25), SPOTS.square], () => { engine.active.step = 'act'; sami.pose = 'idle'; engine.phaseEnds = performance.now() + 3500; });
      break;
    case 'firstTask': {
      const mid = pathPoint(0.5);
      sami.goTo(mid.x, mid.y, () => { engine.active.step = 'act'; sami.pose = 'work'; engine.phaseEnds = performance.now() + 8000; });
      break;
    }
    case 'abandoned':
      sami.goTo(614, 630, () => { engine.active.step = 'act'; sami.pose = 'read'; engine.phaseEnds = performance.now() + 8000; });
      break;
    case 'notebook':
      sami.goTo(SPOTS.tree.x + 10, SPOTS.tree.y, () => {
        engine.active.step = 'act'; sami.pose = 'read';
        bondok.goTo(SPOTS.tree.x - 22, SPOTS.tree.y + 8, () => { bondok.pose = 'sit'; });
        engine.phaseEnds = performance.now() + 9000;
      });
      break;
    case 'nightHint':
      engine.active.step = 'act';
      engine.flicker = performance.now() + 1200;
      engine.phaseEnds = performance.now() + 8000;
      break;
  }
}

function chainWalk(actor, points, done) {
  const [p, ...rest] = points;
  if (!p) return done();
  actor.goTo(p.x, p.y, () => chainWalk(actor, rest, done));
}

// الراحة في البيت بدقة: بندق يصل أولًا، سامي يقف أمام الباب، الباب ينفتح بسلاسة،
// يدخلان متلاشيين ويختفيان تمامًا، ثم يُغلق الباب. لا أثر لهما طوال الراحة.
function goRestHome() {
  engine.resting = 'entering';
  bondok.goTo(SAMI_DOOR.x + 4, SAMI_DOOR.y + 2, () => {
    sami.goTo(SAMI_DOOR.x, SAMI_DOOR.y + 3, () => {
      engine.doorTarget = 1;
      engine.enterAt = performance.now() + 420; // بعد اكتمال فتح الباب
    });
  });
}

// يخرج من البيت عند حدث جديد: الباب ينفتح، يطلع سامي ثم بندق، الباب يقفل وراءهما
function leaveHome() {
  if (!engine.resting) return;
  engine.resting = 'leaving';
  engine.doorTarget = 1;
  sami.x = SAMI_DOOR.x; sami.y = SAMI_DOOR.y - 4;
  sami.visible = true; sami.alpha = 0; sami.pose = 'idle'; sami.fadeTo(1);
  sami.goTo(SAMI_DOOR.x + 2, SAMI_DOOR.y + 18);
  bondok.x = SAMI_DOOR.x; bondok.y = SAMI_DOOR.y - 2;
  bondok.visible = true; bondok.alpha = 0; bondok.fadeTo(1);
  bondok.goTo(SAMI_DOOR.x + 18, SAMI_DOOR.y + 12, () => {
    engine.doorTarget = 0;
    engine.resting = false;
  });
}

function tickEngine(now) {
  const a = engine.active;
  if (a) {
    if (a.step === 'act' && now >= engine.phaseEnds) {
      if (a.kind === 'story') markStory(a.scene.id);
      sami.hop = 700; bondok.hop = 500;
      sounds.celebrate(); vibrate([40, 60, 40]);
      engine.active = null; sami.pose = 'idle';
      // بعد أي مشهد إنجاز: ارجع البيت واستريح (فكرة المستخدم المعتمدة)
      if (a.kind === 'achievement' && !engine.queue.length) goRestHome();
    }
    return;
  }
  if (engine.resting === 'entering' && engine.enterAt && now >= engine.enterAt) {
    engine.enterAt = 0;
    sami.fadeTo(0); bondok.fadeTo(0); // يتلاشيان داخل البيت
    engine.resting = 'fading';
  }
  if (engine.resting === 'fading' && sami.alpha === 0 && bondok.alpha === 0) {
    engine.resting = true; // اختفيا تمامًا
    engine.doorTarget = 0; // الباب يقفل
  }
  if (engine.resting) return; // مستريح: لا روتين يحركه حتى يخرج
  const r = routineFor(new Date());
  const spot = SPOTS[r.spot];
  // هل الأنسب الراحة في البيت الآن؟ (لا أحداث، والروتين في نطاق البيت)
  if (!sami.moving && shouldRestAtHome({ active: null, queueLength: engine.queue.length, routineSpot: r.spot })
      && Math.hypot(spot.x - sami.x, spot.y - sami.y) < 60 && sami.pose !== 'sleep') {
    // قريب من البيت أصلًا في روتين هادئ: ابقَ في وضعيتك، لا ندخل إلا ليلًا أو عند «يدوّن»
    if (r.activity === 'read' || r.activity === 'sleep') goRestHome();
    return;
  }
  if (!sami.moving && Math.hypot(spot.x - sami.x, spot.y - sami.y) > 8) sami.goTo(spot.x, spot.y);
  else if (!sami.moving && sami.pose !== r.activity) sami.pose = r.activity;
}

function tickBondok(now) {
  if (bondok.moving) return;
  if (engine.resting) return; // بندق داخل البيت مع سامي — لا يظهر إطلاقًا
  if (sami.pose === 'sleep') { bondok.pose = 'sleep'; return; }
  if (bondok.pose === 'sleep') bondok.pose = 'idle';
  const d = Math.hypot(sami.x - bondok.x, sami.y - bondok.y);
  if (d > 80) { bondok.pose = 'idle'; bondok.goTo(sami.x + 20, sami.y + 7); return; }
  if (now > engine.wanderAt && !engine.active) {
    engine.wanderAt = now + 7000 + Math.random() * 8000;
    if (Math.random() < 0.35) bondok.pose = bondok.pose === 'sit' ? 'idle' : 'sit';
    else bondok.goTo(bondok.x + (Math.random() - 0.5) * 90, bondok.y + (Math.random() - 0.5) * 40);
  }
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

