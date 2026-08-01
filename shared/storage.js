import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

function get(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function set(items) {
  return new Promise((resolve) => chrome.storage.local.set(items, resolve));
}

export async function getSettings() {
  const { [STORAGE_KEYS.SETTINGS]: settings } = await get(STORAGE_KEYS.SETTINGS);
  if (!settings) return structuredClone(DEFAULT_SETTINGS);
  return {
    ...structuredClone(DEFAULT_SETTINGS),
    ...settings,
    reminders: {
      ...structuredClone(DEFAULT_SETTINGS.reminders),
      ...(settings.reminders || {}),
    },
  };
}

export async function saveSettings(settings) {
  await set({ [STORAGE_KEYS.SETTINGS]: settings });
}

export async function getAllEntries() {
  const { [STORAGE_KEYS.ENTRIES]: entries } = await get(STORAGE_KEYS.ENTRIES);
  return entries || {};
}

export async function getEntry(dateISO) {
  const entries = await getAllEntries();
  return entries[dateISO] || null;
}

export async function saveEntry(dateISO, partial) {
  const entries = await getAllEntries();
  const merged = { ...(entries[dateISO] || { date: dateISO }), ...partial, date: dateISO };
  entries[dateISO] = merged;
  await set({ [STORAGE_KEYS.ENTRIES]: entries });
  return merged;
}

export async function getEntriesForMonth(year, month) {
  const entries = await getAllEntries();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  const result = {};
  for (const [date, entry] of Object.entries(entries)) {
    if (date.startsWith(prefix)) result[date] = entry;
  }
  return result;
}

export async function getAllMonths() {
  const { [STORAGE_KEYS.MONTHS]: months } = await get(STORAGE_KEYS.MONTHS);
  return months || {};
}

export async function getMonthMeta(id) {
  const months = await getAllMonths();
  return months[id] || { weekHighlights: ['', '', '', ''], feeling: {}, focusNext: '' };
}

export async function saveMonthMeta(id, partial) {
  const months = await getAllMonths();
  months[id] = { ...(months[id] || {}), ...partial };
  await set({ [STORAGE_KEYS.MONTHS]: months });
  return months[id];
}

export async function getReminderState() {
  const { [STORAGE_KEYS.REMINDER_STATE]: state } = await get(STORAGE_KEYS.REMINDER_STATE);
  return state || { daily: null, weekly: null, monthly: null };
}

export async function saveReminderState(state) {
  await set({ [STORAGE_KEYS.REMINDER_STATE]: state });
}

export async function exportAllData() {
  const [entries, months, settings] = await Promise.all([getAllEntries(), getAllMonths(), getSettings()]);
  return { exportedAt: new Date().toISOString(), entries, months, settings };
}

export async function importAllData(data) {
  const payload = {};
  if (data.entries) payload[STORAGE_KEYS.ENTRIES] = data.entries;
  if (data.months) payload[STORAGE_KEYS.MONTHS] = data.months;
  if (data.settings) payload[STORAGE_KEYS.SETTINGS] = data.settings;
  await set(payload);
}

export async function clearMonth(year, month) {
  const entries = await getAllEntries();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  for (const date of Object.keys(entries)) {
    if (date.startsWith(prefix)) delete entries[date];
  }
  const months = await getAllMonths();
  delete months[`${year}-${String(month + 1).padStart(2, '0')}`];
  await set({ [STORAGE_KEYS.ENTRIES]: entries, [STORAGE_KEYS.MONTHS]: months });
}
