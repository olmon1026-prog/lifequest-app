// التصدير: نسخة احتياطية كاملة (file-format §8ب) وتصدير خطة (§8أ)
export function exportBackup(state) {
  return JSON.stringify({
    format: 'lifequest-backup',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: {
      items: state.items,
      events: state.events,
      world: state.world || {},
      settings: Object.entries(state.settings).map(([key, value]) => ({ key, value })),
    },
  }, null, 2);
}

export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); }
  catch { return { ok: false, error: 'الملف مش JSON صالح.' }; }
  if (data.format !== 'lifequest-backup') return { ok: false, error: 'ده مش ملف نسخة احتياطية من LifeQuest.' };
  if (data.schemaVersion !== 1) return { ok: false, error: 'إصدار النسخة غير مدعوم. حدّث التطبيق.' };
  if (!data.data || !Array.isArray(data.data.items)) return { ok: false, error: 'محتوى النسخة ناقص.' };
  return { ok: true, data: data.data };
}

export function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
