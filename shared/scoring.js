import { HABIT_KEYS, NUMERIC_HABITS, BOOLEAN_HABITS } from './constants.js';

// Whether a given habit is "met" for a day entry.
export function habitMet(entry, key) {
  if (!entry) return false;
  if (BOOLEAN_HABITS.includes(key)) return !!entry[key];
  const goal = NUMERIC_HABITS[key]?.goal ?? Infinity;
  const val = entry[key];
  return typeof val === 'number' && val >= goal;
}

export function computeFlags(entry) {
  const flags = {};
  for (const key of HABIT_KEYS) flags[key] = habitMet(entry, key);
  return flags;
}

export function computeScore(entry) {
  if (!entry) return 0;
  return HABIT_KEYS.reduce((sum, key) => sum + (habitMet(entry, key) ? 1 : 0), 0);
}

export function hasEntry(entry) {
  if (!entry) return false;
  return HABIT_KEYS.some((k) => entry[k] !== undefined && entry[k] !== null && entry[k] !== false)
    || (typeof entry.weight === 'number')
    || !!(entry.notes && entry.notes.trim());
}

function average(values) {
  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// entries: array of { date, ...entryFields } for the days in range (missing days may be undefined).
export function aggregate(entries) {
  const present = entries.filter(Boolean);
  const daysGoalAchieved = present.filter((e) => computeScore(e) === HABIT_KEYS.length).length;
  const loggedDays = present.filter(hasEntry).length;

  return {
    avgWeight: average(present.map((e) => e.weight)),
    avgSteps: average(present.map((e) => e.steps)),
    avgProtein: average(present.map((e) => e.protein)),
    avgWater: average(present.map((e) => e.water)),
    avgSleep: average(present.map((e) => e.sleep)),
    daysGoalAchieved,
    loggedDays,
    totalDays: entries.length,
  };
}

// Which habit has the best / worst completion rate across a set of entries.
export function habitRates(entries) {
  const present = entries.filter(hasEntry);
  const rates = {};
  for (const key of HABIT_KEYS) {
    if (!present.length) {
      rates[key] = null;
      continue;
    }
    const met = present.filter((e) => habitMet(e, key)).length;
    rates[key] = met / present.length;
  }
  return rates;
}

export function bestAndFocusHabit(entries) {
  const rates = habitRates(entries);
  const scored = Object.entries(rates).filter(([, v]) => v !== null);
  if (!scored.length) return { best: null, focus: null };
  scored.sort((a, b) => b[1] - a[1]);
  return { best: scored[0][0], focus: scored[scored.length - 1][0] };
}

// Current streak of consecutive fully-completed days (6/6), walking backwards from `fromDate`.
export function currentStreak(getEntryForDate, fromDate) {
  let streak = 0;
  const cursor = new Date(fromDate);
  // If today isn't complete yet, don't break an existing streak from yesterday's count-so-far;
  // just start counting from the most recent complete day.
  for (let i = 0; i < 3660; i++) {
    const entry = getEntryForDate(cursor);
    if (entry && computeScore(entry) === HABIT_KEYS.length) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Today not complete yet: check yesterday onward instead of stopping the whole streak at zero.
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}
