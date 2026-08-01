import {
  daysInMonth, monthLabel, weekBuckets, dateForDay, monthId as buildMonthId,
} from '../shared/dates.js';
import {
  getEntriesForMonth, saveEntry, getMonthMeta, saveMonthMeta,
  getSettings, saveSettings, exportAllData, importAllData, clearMonth,
} from '../shared/storage.js';
import {
  computeScore, computeFlags, aggregate, bestAndFocusHabit,
} from '../shared/scoring.js';
import { HABIT_KEYS, HABIT_LABELS, FEELING_KEYS, FEELING_LABELS } from '../shared/constants.js';

const now = new Date();
let viewYear = now.getFullYear();
let viewMonth = now.getMonth();

let monthEntries = {}; // date ISO -> entry
let monthMeta = { weekHighlights: ['', '', '', ''], feeling: {}, focusNext: '' };
let settings = { targetWeight: null };

const saveTimers = new Map();
function debouncedSaveEntry(dateISO, entry) {
  clearTimeout(saveTimers.get(dateISO));
  saveTimers.set(dateISO, setTimeout(() => saveEntry(dateISO, entry), 300));
}

let metaSaveTimer = null;
function debouncedSaveMeta(id, partial) {
  Object.assign(monthMeta, partial);
  clearTimeout(metaSaveTimer);
  metaSaveTimer = setTimeout(() => saveMonthMeta(id, monthMeta), 300);
}

function orderedDayEntries() {
  const total = daysInMonth(viewYear, viewMonth);
  const list = [];
  for (let day = 1; day <= total; day++) {
    const date = dateForDay(viewYear, viewMonth, day);
    list.push(monthEntries[date] || null);
  }
  return list;
}

function findWeight(list, fromStart) {
  const seq = fromStart ? list : [...list].reverse();
  for (const e of seq) {
    if (e && typeof e.weight === 'number') return e.weight;
  }
  return null;
}

function renderHeader() {
  document.getElementById('month-label').textContent = monthLabel(viewYear, viewMonth);
  document.getElementById('target-weight').value = settings.targetWeight ?? '';
}

function renderTable() {
  const tbody = document.getElementById('entries-body');
  tbody.innerHTML = '';
  const total = daysInMonth(viewYear, viewMonth);
  const frag = document.createDocumentFragment();

  for (let day = 1; day <= total; day++) {
    const date = dateForDay(viewYear, viewMonth, day);
    const entry = monthEntries[date] || {};
    const flags = computeFlags(entry);
    const score = computeScore(entry);
    const weekday = new Date(viewYear, viewMonth, day).toLocaleDateString(undefined, { weekday: 'short' });

    const tr = document.createElement('tr');
    tr.dataset.date = date;
    tr.innerHTML = `
      <td class="date-cell">${day}<br /><small>${weekday}</small></td>
      <td><input type="number" step="0.1" min="0" data-field="weight" value="${entry.weight ?? ''}" /></td>
      <td class="${flags.steps ? 'habit-met' : ''}"><input type="number" step="100" min="0" data-field="steps" value="${entry.steps ?? ''}" /></td>
      <td class="${flags.dinner ? 'habit-met' : ''}"><input type="checkbox" data-field="dinner" ${entry.dinner ? 'checked' : ''} /></td>
      <td class="${flags.protein ? 'habit-met' : ''}"><input type="number" step="1" min="0" data-field="protein" value="${entry.protein ?? ''}" /></td>
      <td class="${flags.veg ? 'habit-met' : ''}"><input type="checkbox" data-field="veg" ${entry.veg ? 'checked' : ''} /></td>
      <td class="${flags.water ? 'habit-met' : ''}"><input type="number" step="0.1" min="0" data-field="water" value="${entry.water ?? ''}" /></td>
      <td class="${flags.sleep ? 'habit-met' : ''}"><input type="number" step="0.5" min="0" data-field="sleep" value="${entry.sleep ?? ''}" /></td>
      <td class="score-cell ${score === HABIT_KEYS.length ? 'complete' : ''}" data-role="score">${score}/${HABIT_KEYS.length}</td>
      <td><input type="text" data-field="notes" value="${(entry.notes ?? '').replace(/"/g, '&quot;')}" placeholder="Notes" /></td>
    `;
    frag.appendChild(tr);
  }
  tbody.appendChild(frag);
}

function updateRowVisuals(tr, entry) {
  const flags = computeFlags(entry);
  for (const key of HABIT_KEYS) {
    const input = tr.querySelector(`[data-field="${key}"]`);
    if (input) input.closest('td').classList.toggle('habit-met', !!flags[key]);
  }
  const score = computeScore(entry);
  const scoreCell = tr.querySelector('[data-role="score"]');
  scoreCell.textContent = `${score}/${HABIT_KEYS.length}`;
  scoreCell.classList.toggle('complete', score === HABIT_KEYS.length);
}

function renderWeeklyCards() {
  const wrap = document.getElementById('weekly-cards');
  wrap.innerHTML = '';
  const buckets = weekBuckets(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);

  buckets.forEach((bucket) => {
    const days = bucket.days.filter((d) => d <= total);
    if (!days.length) return;
    const entries = days.map((d) => monthEntries[dateForDay(viewYear, viewMonth, d)] || null);
    const agg = aggregate(entries);

    const card = document.createElement('div');
    card.className = 'week-card';
    card.innerHTML = `
      <h3>${bucket.label}</h3>
      <div class="week-stat"><span>Avg Weight</span><b>${fmt(agg.avgWeight, 1, 'kg')}</b></div>
      <div class="week-stat"><span>Avg Steps</span><b>${fmt(agg.avgSteps, 0, '')}</b></div>
      <div class="week-stat"><span>Avg Protein</span><b>${fmt(agg.avgProtein, 0, 'g')}</b></div>
      <div class="week-stat"><span>Avg Water</span><b>${fmt(agg.avgWater, 1, 'L')}</b></div>
      <div class="week-stat"><span>Avg Sleep</span><b>${fmt(agg.avgSleep, 1, 'h')}</b></div>
      <div class="week-stat"><span>Goal Achieved</span><b>${agg.daysGoalAchieved}/${days.length}</b></div>
      <textarea data-week-index="${bucket.index}" placeholder="Highlights...">${monthMeta.weekHighlights?.[bucket.index] ?? ''}</textarea>
    `;
    wrap.appendChild(card);
  });
}

function fmt(value, decimals, unit) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}${unit ? ' ' + unit : ''}`;
}

function renderMonthlySummary() {
  const list = orderedDayEntries();
  const total = daysInMonth(viewYear, viewMonth);
  const agg = aggregate(list);
  const startingWeight = findWeight(list, true);
  const endingWeight = findWeight(list, false);
  const change = (startingWeight !== null && endingWeight !== null) ? endingWeight - startingWeight : null;
  const { best, focus } = bestAndFocusHabit(list);

  const rows = [
    ['Starting Weight', fmt(startingWeight, 1, 'kg')],
    ['Ending Weight', fmt(endingWeight, 1, 'kg')],
    ['Total Change', change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`],
    ['Days Goal Achieved', `${agg.daysGoalAchieved} / ${total}`],
    ['Average Steps', fmt(agg.avgSteps, 0, '')],
    ['Average Sleep', fmt(agg.avgSleep, 1, 'h')],
  ];

  const dl = document.getElementById('monthly-summary-list');
  dl.innerHTML = rows.map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join('');

  const bestHabitEl = document.getElementById('best-habit');
  bestHabitEl.textContent = best ? HABIT_LABELS[best] : '—';

  const focusTextarea = document.getElementById('focus-next');
  focusTextarea.placeholder = focus ? `Try improving: ${HABIT_LABELS[focus]}` : 'What will you work on next month?';
  if (document.activeElement !== focusTextarea) {
    focusTextarea.value = monthMeta.focusNext || '';
  }

  renderChart(list);
  renderGoalProgress(startingWeight, endingWeight);
}

function renderChart(list) {
  const points = [];
  list.forEach((entry, idx) => {
    if (entry && typeof entry.weight === 'number') points.push({ day: idx + 1, weight: entry.weight });
  });

  const wrap = document.getElementById('chart-wrap');
  if (points.length < 2) {
    wrap.innerHTML = '<p style="font-size:12px;color:var(--muted);">Log your weight on at least two days to see your trend.</p>';
    return;
  }

  const width = 560;
  const height = 220;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const total = list.length;

  const weights = points.map((p) => p.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.15;
  min -= pad; max += pad;

  const x = (day) => padL + ((day - 1) / (total - 1)) * (width - padL - padR);
  const y = (w) => padT + (1 - (w - min) / (max - min)) * (height - padT - padB);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.day).toFixed(1)} ${y(p.weight).toFixed(1)}`).join(' ');
  const gridLines = 4;
  let grid = '';
  for (let i = 0; i <= gridLines; i++) {
    const val = min + ((max - min) * i) / gridLines;
    const yy = y(val).toFixed(1);
    grid += `<line x1="${padL}" y1="${yy}" x2="${width - padR}" y2="${yy}" stroke="#eee" stroke-width="1" />`;
    grid += `<text x="${padL - 6}" y="${Number(yy) + 3}" font-size="9" fill="#888" text-anchor="end">${val.toFixed(0)}</text>`;
  }

  const dots = points.map((p) => `<circle cx="${x(p.day).toFixed(1)}" cy="${y(p.weight).toFixed(1)}" r="3" fill="#2563eb" />`).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${grid}
      <path d="${path}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      ${dots}
    </svg>
  `;
}

function renderGoalProgress(startingWeight, currentWeight) {
  const pctLabel = document.getElementById('goal-progress-pct');
  const fill = document.getElementById('goal-progress-fill');
  const target = settings.targetWeight;

  if (target === null || target === undefined || startingWeight === null || currentWeight === null || startingWeight === target) {
    pctLabel.textContent = 'Set a target + log your weight';
    fill.style.width = '0%';
    return;
  }

  const totalDistance = Math.abs(startingWeight - target);
  const covered = Math.abs(startingWeight - currentWeight);
  const pct = Math.max(0, Math.min(100, (covered / totalDistance) * 100));
  pctLabel.textContent = `${pct.toFixed(0)}%`;
  fill.style.width = `${pct}%`;
}

function renderFeelings() {
  const wrap = document.getElementById('feelings-list');
  wrap.innerHTML = '';
  FEELING_KEYS.forEach((key) => {
    const value = monthMeta.feeling?.[key] || 0;
    const row = document.createElement('div');
    row.className = 'feeling-row';
    const stars = Array.from({ length: 5 }, (_, i) => {
      const filled = i < value;
      return `<button type="button" class="star-btn ${filled ? 'filled' : ''}" data-feeling="${key}" data-value="${i + 1}">★</button>`;
    }).join('');
    row.innerHTML = `<span>${FEELING_LABELS[key]}</span><span class="stars">${stars}</span>`;
    wrap.appendChild(row);
  });
}

async function loadMonth() {
  const id = buildMonthId(viewYear, viewMonth);
  const [entries, meta] = await Promise.all([
    getEntriesForMonth(viewYear, viewMonth),
    getMonthMeta(id),
  ]);
  monthEntries = entries;
  monthMeta = { weekHighlights: ['', '', '', ''], feeling: {}, focusNext: '', ...meta };
  renderAll();
}

function renderAll() {
  renderHeader();
  renderTable();
  renderWeeklyCards();
  renderMonthlySummary();
  renderFeelings();
}

// --- Event wiring -----------------------------------------------------

document.getElementById('prev-month').addEventListener('click', () => {
  viewMonth -= 1;
  if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
  loadMonth();
});

document.getElementById('next-month').addEventListener('click', () => {
  viewMonth += 1;
  if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
  loadMonth();
});

document.getElementById('target-weight').addEventListener('change', async (e) => {
  settings.targetWeight = e.target.value ? Number(e.target.value) : null;
  await saveSettings(settings);
  renderMonthlySummary();
});

document.getElementById('entries-body').addEventListener('input', (e) => {
  const field = e.target.dataset.field;
  if (!field) return;
  const tr = e.target.closest('tr');
  const date = tr.dataset.date;
  const entry = monthEntries[date] || { date };

  if (e.target.type === 'checkbox') entry[field] = e.target.checked;
  else if (field === 'notes') entry[field] = e.target.value;
  else entry[field] = e.target.value === '' ? null : Number(e.target.value);

  monthEntries[date] = entry;
  updateRowVisuals(tr, entry);
  debouncedSaveEntry(date, entry);
  renderWeeklyCards();
  renderMonthlySummary();
});

document.getElementById('entries-body').addEventListener('change', (e) => {
  if (e.target.type === 'checkbox') e.target.dispatchEvent(new Event('input', { bubbles: true }));
});

document.getElementById('weekly-cards').addEventListener('input', (e) => {
  const idx = e.target.dataset.weekIndex;
  if (idx === undefined) return;
  const highlights = [...(monthMeta.weekHighlights || ['', '', '', ''])];
  highlights[idx] = e.target.value;
  debouncedSaveMeta(buildMonthId(viewYear, viewMonth), { weekHighlights: highlights });
});

document.getElementById('focus-next').addEventListener('input', (e) => {
  debouncedSaveMeta(buildMonthId(viewYear, viewMonth), { focusNext: e.target.value });
});

document.getElementById('feelings-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.star-btn');
  if (!btn) return;
  const key = btn.dataset.feeling;
  const value = Number(btn.dataset.value);
  const feeling = { ...(monthMeta.feeling || {}) };
  feeling[key] = feeling[key] === value ? 0 : value; // click again to clear
  debouncedSaveMeta(buildMonthId(viewYear, viewMonth), { feeling });
  renderFeelings();
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
    await loadMonth();
    alert('Import complete.');
  } catch (err) {
    alert(`Import failed: ${err.message}`);
  }
  e.target.value = '';
});

document.getElementById('print-btn').addEventListener('click', () => window.print());

document.getElementById('clear-month').addEventListener('click', async () => {
  const label = monthLabel(viewYear, viewMonth);
  if (!confirm(`Clear all entries for ${label}? This cannot be undone.`)) return;
  await clearMonth(viewYear, viewMonth);
  await loadMonth();
});

// --- Init ---------------------------------------------------------------

(async function init() {
  settings = await getSettings();
  await loadMonth();
})();
