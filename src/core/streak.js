// السلسلة: اليوم يُحسب لو فيه إنجاز صافٍ واحد على الأقل (complete ناقص uncomplete > 0)
import { addDays, todayStr } from './dates.js';

export function dayNet(events) {
  const net = new Map();
  for (const ev of events) {
    if (ev.kind !== 'complete' && ev.kind !== 'uncomplete') continue;
    net.set(ev.day, (net.get(ev.day) || 0) + (ev.kind === 'complete' ? 1 : -1));
  }
  return net;
}

export function currentStreak(events, today = todayStr()) {
  const net = dayNet(events);
  let streak = 0;
  let d = today;
  // لو النهارده مفيش إنجاز لسه، السلسلة القائمة تبدأ من أمس
  if (!(net.get(d) > 0)) d = addDays(d, -1);
  while (net.get(d) > 0) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export function bestStreak(events) {
  const net = dayNet(events);
  const days = [...net.keys()].filter(d => net.get(d) > 0).sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = (prev && addDays(prev, 1) === d) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}
