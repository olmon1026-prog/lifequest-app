// أصوات مولّدة بـ Web Audio (بلا ملفات) — لا تعمل قبل أول لمسة (R6)
let ctx = null, unlocked = false, muted = false;

export function setMuted(m) { muted = m; }

export function unlockAudio() {
  if (unlocked) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    unlocked = true;
  } catch { /* لا صوت */ }
}

function beep(freq, dur, type = 'square', gain = 0.04, when = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur);
}

export const sounds = {
  complete() { beep(660, .12); beep(880, .18, 'square', .04, .1); },
  subtask() { beep(520, .1); },
  celebrate() { [523, 659, 784, 1047].forEach((f, i) => beep(f, .16, 'square', .05, i * .11)); },
  click() { beep(440, .06, 'square', .02); },
};

export function vibrate(pattern = 30) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}
