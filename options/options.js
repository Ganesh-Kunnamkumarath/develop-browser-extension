import { getSettings, saveSettings, exportAllData, importAllData } from '../shared/storage.js';

let settings;

const els = {
  dailyEnabled: document.getElementById('daily-enabled'),
  dailyTime: document.getElementById('daily-time'),
  weeklyEnabled: document.getElementById('weekly-enabled'),
  weeklyDay: document.getElementById('weekly-day'),
  weeklyTime: document.getElementById('weekly-time'),
  monthlyEnabled: document.getElementById('monthly-enabled'),
  monthlyTime: document.getElementById('monthly-time'),
  targetWeight: document.getElementById('target-weight'),
  saveToast: document.getElementById('save-toast'),
};

function fillForm() {
  els.dailyEnabled.checked = settings.reminders.daily.enabled;
  els.dailyTime.value = settings.reminders.daily.time;
  els.weeklyEnabled.checked = settings.reminders.weekly.enabled;
  els.weeklyDay.value = String(settings.reminders.weekly.day);
  els.weeklyTime.value = settings.reminders.weekly.time;
  els.monthlyEnabled.checked = settings.reminders.monthly.enabled;
  els.monthlyTime.value = settings.reminders.monthly.time;
  els.targetWeight.value = settings.targetWeight ?? '';
}

function readForm() {
  return {
    ...settings,
    targetWeight: els.targetWeight.value ? Number(els.targetWeight.value) : null,
    reminders: {
      daily: { enabled: els.dailyEnabled.checked, time: els.dailyTime.value || '20:00' },
      weekly: { enabled: els.weeklyEnabled.checked, day: Number(els.weeklyDay.value), time: els.weeklyTime.value || '18:00' },
      monthly: { enabled: els.monthlyEnabled.checked, time: els.monthlyTime.value || '09:00' },
    },
  };
}

let toastTimer = null;
function showToast() {
  els.saveToast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.saveToast.classList.remove('visible'), 1400);
}

async function persist() {
  settings = readForm();
  await saveSettings(settings);
  showToast();
}

document.querySelector('main').addEventListener('change', (e) => {
  if (e.target.id === 'import-json') return;
  persist();
});

document.getElementById('export-json').addEventListener('click', async () => {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-json').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    await importAllData(data);
    settings = await getSettings();
    fillForm();
    showToast();
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
  e.target.value = '';
});

(async function init() {
  settings = await getSettings();
  fillForm();
})();
