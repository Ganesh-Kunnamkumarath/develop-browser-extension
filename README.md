# Health Tracker — Browser Extension

A Manifest V3 (Chrome/Edge/Brave) extension version of the printable "Health Tracker" habit sheet: daily logging, auto-scored daily/weekly/monthly attendance, a weight progress chart, and update reminders.

## Load it (developer mode)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Click the puzzle-piece icon in the toolbar and pin **Health Tracker** so it stays visible.

After editing any file, click the reload icon on the extension's card in `chrome://extensions` to pick up changes.

## What's where

- `popup/` — the toolbar popup: today's inputs, live score, streak, links to the dashboard and settings.
- `dashboard/` — the full tracker: month table, weekly check-in cards, monthly summary, progress chart, "how I felt" ratings, export/import/print.
- `options/` — settings page: daily/weekly/monthly reminder toggles, target weight, data export/import.
- `background.js` — service worker; checks reminder conditions every 60 minutes and fires a notification when due.
- `shared/` — data model, scoring math, and `chrome.storage.local` helpers used by all three surfaces.

## Data model

Each day is stored under its ISO date (`YYYY-MM-DD`) with: `weight`, `steps`, `protein`, `water`, `sleep` (numbers) and `dinner`, `veg` (booleans), plus `notes`. A habit counts as "met" when its number clears its goal (10,000 steps / 80g protein / 4L water / 7h sleep) or its checkbox is checked. Daily score is met-habits out of 6. Weekly/monthly averages, best/focus habit, and the progress chart are all derived from these entries — nothing needs manual averaging.

All data stays in `chrome.storage.local` (this browser profile only). Use **Export Data (JSON)** in the dashboard or settings page to back it up, and **Import Data (JSON)** to restore it.

## Reminders

Notifications only fire while the browser is running (no server-side push). Enable the daily/weekly/monthly toggles in Settings and pick a time; the service worker polls every 60 minutes and skips the daily nudge if that day is already fully logged (6/6).
