// الشريط العلوي المشترك: مستوى + XP + سلسلة
import { icon } from './icons.js';
import { totalXP, levelProgress, levelTitle } from '../core/xp.js';
import { currentStreak } from '../core/streak.js';
import { arNum } from '../core/dates.js';

export function topbarHTML(state) {
  const xp = totalXP(state.events);
  const lp = levelProgress(xp);
  const streak = currentStreak(state.events);
  const pct = Math.round(100 * lp.inLevel / lp.span);
  return `
  <div class="topbar">
    <div class="lv-badge">LV ${arNum(lp.level)}</div>
    <div class="xpbar">
      <div class="lbl">${levelTitle(lp.level)} · ${arNum(lp.inLevel)} / ${arNum(lp.span)} XP</div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    </div>
    ${streak > 0 ? `<div class="streak">${icon('fire', 14)} ${arNum(streak)} ${streak === 1 ? 'يوم' : streak === 2 ? 'يومان' : streak <= 10 ? 'أيام' : 'يومًا'}</div>` : ''}
  </div>`;
}
