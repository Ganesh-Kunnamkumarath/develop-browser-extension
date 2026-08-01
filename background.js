import { HABIT_KEYS } from "./shared/constants.js";
import { currentMonthId, todayISO, weekIdForDate } from "./shared/dates.js";
import { computeScore } from "./shared/scoring.js";
import {
  getEntry,
  getReminderState,
  getSettings,
  saveReminderState,
} from "./shared/storage.js";

const ALARM_NAME = "reminder-tick";
const CHECK_INTERVAL_MINUTES = 60;

function ensureAlarm() {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm)
      chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: CHECK_INTERVAL_MINUTES,
      });
  });
}

chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function sameBucket(now, hhmm) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    Math.floor(nowMinutes / CHECK_INTERVAL_MINUTES) ===
    Math.floor(toMinutes(hhmm) / CHECK_INTERVAL_MINUTES)
  );
}

function notify(id, title, message) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title,
    message,
    priority: 1,
  });
}

async function checkReminders() {
  const settings = await getSettings();
  const state = await getReminderState();
  const now = new Date();
  let changed = false;

  const { daily, weekly, monthly } = settings.reminders;

  if (daily.enabled && sameBucket(now, daily.time)) {
    const today = todayISO();
    if (state.daily !== today) {
      const entry = await getEntry(today);
      const score = computeScore(entry);
      if (!entry || score < HABIT_KEYS.length) {
        notify(
          "daily-reminder",
          "Log today's health tracker",
          "A few habits are still unchecked for today.",
        );
      }
      state.daily = today;
      changed = true;
    }
  }

  if (
    weekly.enabled &&
    now.getDay() === weekly.day &&
    sameBucket(now, weekly.time)
  ) {
    const weekId = weekIdForDate(now);
    if (state.weekly !== weekId) {
      notify(
        "weekly-reminder",
        "Weekly check-in time",
        "Review this week's averages and jot down your highlights.",
      );
      state.weekly = weekId;
      changed = true;
    }
  }

  if (monthly.enabled && now.getDate() === 1 && sameBucket(now, monthly.time)) {
    const mId = currentMonthId();
    if (state.monthly !== mId) {
      notify(
        "monthly-reminder",
        "New month, new goals",
        "Review last month's summary and set a fresh target.",
      );
      state.monthly = mId;
      changed = true;
    }
  }

  if (changed) await saveReminderState(state);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) checkReminders();
});

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard/dashboard.html"),
  });
});
