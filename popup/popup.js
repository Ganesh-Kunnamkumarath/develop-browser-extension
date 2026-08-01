import { todayISO } from '../shared/dates.js';
import { getEntry, saveEntry, getAllEntries } from '../shared/storage.js';
import { computeScore, computeFlags, currentStreak } from '../shared/scoring.js';
import { HABIT_KEYS } from '../shared/constants.js';

const form = document.getElementById('entry-form');
const scoreBadge = document.getElementById('score-badge');
const streakText = document.getElementById('streak-text');
const todayLabel = document.getElementById('today-label');

const today = todayISO();
let saveTimer = null;

function readForm() {
  const fd = new FormData(form);
  return {
    weight: fd.get('weight') ? Number(fd.get('weight')) : null,
    steps: fd.get('steps') ? Number(fd.get('steps')) : null,
    protein: fd.get('protein') ? Number(fd.get('protein')) : null,
    water: fd.get('water') ? Number(fd.get('water')) : null,
    sleep: fd.get('sleep') ? Number(fd.get('sleep')) : null,
    dinner: fd.get('dinner') === 'on',
    veg: fd.get('veg') === 'on',
    notes: fd.get('notes') || '',
  };
}

function fillForm(entry) {
  if (!entry) return;
  for (const [key, value] of Object.entries(entry)) {
    const el = form.elements[key];
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = !!value;
    else if (value !== null && value !== undefined) el.value = value;
  }
}

function updateHighlights(entry) {
  const flags = computeFlags(entry);
  for (const key of HABIT_KEYS) {
    const wrap = form.querySelector(`[data-habit="${key}"]`);
    if (wrap) wrap.classList.toggle('habit-met', !!flags[key]);
  }
  const score = computeScore(entry);
  scoreBadge.textContent = `${score}/${HABIT_KEYS.length}`;
  scoreBadge.classList.toggle('complete', score === HABIT_KEYS.length);
}

async function refreshStreak() {
  const entries = await getAllEntries();
  // Use local-date keys, not UTC, to match how entries are stored.
  const lookupLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return entries[`${y}-${m}-${d}`];
  };
  const streak = currentStreak(lookupLocal, new Date());
  streakText.textContent = streak > 0
    ? `${streak}-day streak`
    : 'No streak yet';
}

async function persist() {
  const entry = readForm();
  await saveEntry(today, entry);
  updateHighlights(entry);
  refreshStreak();
}

form.addEventListener('input', () => {
  updateHighlights(readForm());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 350);
});

form.addEventListener('change', (e) => {
  if (e.target.type === 'checkbox') persist();
});

document.getElementById('open-settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('open-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

(async function init() {
  todayLabel.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const entry = await getEntry(today);
  fillForm(entry || {});
  updateHighlights(entry || {});
  refreshStreak();
})();
