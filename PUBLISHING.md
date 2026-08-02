# Publishing to the Chrome Web Store

Everything on this page except the actual clicking-through-Google's-dashboard part is already done for you. The account creation and the one-time developer fee involve your Google account and a payment method, so those steps are yours to do directly in the browser — an AI assistant shouldn't be entering payment details or creating accounts on your behalf.

## What's already prepared

| Asset | Path | Use |
|---|---|---|
| Packaged extension | `health-tracker-extension.zip` | Upload this as the new item in the dashboard |
| Store icon | `icons/icon128.png` | 128×128, already referenced in the manifest |
| Screenshots (1280×800) | `store-assets/screenshot-1-dashboard-table.png` … `screenshot-4-settings.png` | Upload as listing screenshots (need 1–5) |
| Privacy policy | `PRIVACY.md` | Link to it (see step 4) |
| Listing copy | below | Paste into the dashboard's title/summary/description fields |

The zip contains only the runtime files (`manifest.json`, `background.js`, `popup/`, `dashboard/`, `options/`, `shared/`, `icons/`) — no README, screenshots, or dev files. If you change any source file, rebuild it before uploading:

```bash
cd /Users/gankunna/Documents/Learn/develop-browser-extension
rm -f health-tracker-extension.zip
zip -r -q health-tracker-extension.zip manifest.json background.js popup dashboard options shared icons
```

## 1. One-time developer account setup (you do this)

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with the Google account you want to publish under.
3. If this is your first item, you'll be asked to pay a **one-time $5 USD registration fee**. This is a per-account fee (not per-extension) and is handled entirely on Google's checkout — enter your own payment details there.

## 2. Create the item

1. Click **New Item**.
2. Upload `health-tracker-extension.zip`.
3. The dashboard will parse the manifest and create a draft listing.

## 3. Store listing copy

Paste these into the corresponding fields:

**Title** (max 45 chars)
```
Health Tracker — Habits & Weight
```

**Summary** (max 132 chars)
```
Daily habit tracker with weekly/monthly scoring, a weight progress chart, and update reminders.
```

**Category:** Productivity
**Language:** English

**Detailed description:**
```
Health Tracker turns a daily-habit checklist into a browser extension. Click the toolbar icon, log a few numbers (weight, steps, protein, water, sleep) plus two quick checkboxes, and it takes care of the rest:

• Auto-scored days — each habit is checked against a goal (10,000 steps, 80g protein, 4L water, 7+ hours sleep) automatically, so your daily score is never something you tally by hand.
• Streaks — see your current run of fully-completed days right in the popup.
• A full dashboard — an editable month table, four weekly check-in cards, and a monthly summary (starting/ending weight, days-goal-achieved, best habit, a suggested focus for next month) computed live from what you've logged.
• A weight progress chart and goal-progress bar.
• Five-star "how I felt this month" ratings for energy, fitness, sleep, mental well-being, and overall health.
• Reminders — independent daily, weekly, and monthly notification schedules, each with its own time.
• Export/Import as JSON, and Print/Save as PDF.

Everything is stored locally in your browser (chrome.storage.local). There is no account, no server, and no network request of any kind — see the linked privacy policy for details.
```

## 4. Privacy tab

- **Privacy policy URL:** `https://github.com/Ganesh-Kunnamkumarath/develop-browser-extension/blob/main/PRIVACY.md`
  (Optional nicer alternative: enable GitHub Pages for this repo and link the rendered page instead of the raw GitHub file view.)
- **Single purpose description:**
  ```
  Lets a user log daily health habits (weight, steps, protein, water, sleep, two checklist items) and view auto-computed daily/weekly/monthly scores, a weight trend chart, and reminders — entirely from local browser storage.
  ```
- **Permission justifications:**
  | Permission | Justification |
  |---|---|
  | `storage` | Persist the user's daily entries, monthly reflections, and settings locally between sessions. |
  | `alarms` | Periodically check (about hourly) whether a user-configured reminder is due. |
  | `notifications` | Show the local reminder notification the user explicitly enabled in Settings. |
- Data usage checkboxes: this extension does **not** collect or transmit personally identifiable information, health data, financial data, authentication info, personal communications, location, web history, or user activity to any server — everything stays in local browser storage. Answer the certification questions accordingly (truthfully, based on the extension actually making zero network requests).

## 5. Graphics

- **Store icon:** upload `icons/icon128.png`.
- **Screenshots:** upload some or all of `store-assets/screenshot-1-dashboard-table.png`, `screenshot-2-dashboard-summary.png`, `screenshot-3-popup.png`, `screenshot-4-settings.png` (each already sized to the required 1280×800).
- A promotional tile is optional in the current dashboard; skip it unless Google's UI asks for one.

## 6. Visibility & submit

1. Choose **Visibility**: *Public* (searchable in the store) or *Unlisted* (only reachable via direct link) — either works; pick Unlisted first if you want to test the real install flow before it's publicly searchable.
2. Click **Submit for review**.
3. Review typically takes anywhere from a few hours to a couple of weeks. You'll get an email when it's approved or if changes are requested. Common rejection reasons: missing/invalid privacy policy, requesting permissions the listing doesn't explain, or a description that doesn't match what the extension does — none of which should be an issue here given the above.

## Updating later

1. Bump `"version"` in `manifest.json` (e.g. `1.0.0` → `1.0.1`).
2. Rebuild the zip (command above).
3. In the dashboard, open the existing item → **Package** → upload the new zip → **Submit for review** again.
