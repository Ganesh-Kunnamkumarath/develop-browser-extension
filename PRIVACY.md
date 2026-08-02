# Privacy Policy — Health Tracker

**Last updated:** 2026-08-02

Health Tracker is a browser extension for personal habit tracking. This policy explains, in full, what it does with your data: essentially nothing leaves your device.

## What data the extension handles

Everything you type into the popup or the dashboard — daily weight, steps, protein, water, sleep, checkboxes, notes, weekly highlights, monthly reflections, star ratings, target weight, and your reminder preferences — is stored **only** in your browser's local extension storage (`chrome.storage.local`), scoped to this extension and this browser profile.

## What the extension does *not* do

- It does not send any data to a server. The extension makes **no network requests** of any kind.
- It does not use analytics, telemetry, or crash reporting.
- It does not share, sell, or transmit your data to any third party.
- It does not require or support signing in — there are no accounts.
- It does not read data from any other website or extension.

## Permissions and why they're needed

| Permission | Why it's used |
|---|---|
| `storage` | Save your daily entries, monthly reflections, and settings locally so they persist between browser sessions. |
| `alarms` | Wake up periodically (about once an hour) to check whether a reminder you've configured is due. |
| `notifications` | Show the local reminder notification you asked for (daily/weekly/monthly). No notification is shown unless you enable it in Settings. |

No host permissions are requested — the extension cannot read or modify the content of any web page.

## Data retention & deletion

Your data stays in `chrome.storage.local` until you remove it yourself, either by:

- Using **Clear This Month** in the dashboard for a specific month, or
- Removing/uninstalling the extension (which clears its local storage), or
- Clearing site/extension data for it via your browser's settings.

Use **Export Data (JSON)** at any time to keep your own backup outside the browser.

## Changes to this policy

If this policy changes, the update will be committed to this file in the extension's public repository, with a new "Last updated" date above.

## Contact

Questions about this policy or the extension can be raised via the project's GitHub repository: https://github.com/Ganesh-Kunnamkumarath/develop-browser-extension
