export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function monthId(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function parseMonthId(id) {
  const [y, m] = id.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function currentMonthId() {
  const now = new Date();
  return monthId(now.getFullYear(), now.getMonth());
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function dateForDay(year, month, day) {
  return toISODate(new Date(year, month, day));
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Weekly check-in buckets matching the paper template: 1-7, 8-14, 15-21, 22-end.
export function weekBuckets(year, month) {
  const total = daysInMonth(year, month);
  const buckets = [
    { label: 'Week 1', range: [1, 7] },
    { label: 'Week 2', range: [8, 14] },
    { label: 'Week 3', range: [15, 21] },
    { label: 'Week 4', range: [22, total] },
  ];
  return buckets.map((b, i) => ({
    ...b,
    label: `${b.label} (Days ${b.range[0]}-${b.range[1]})`,
    days: Array.from({ length: b.range[1] - b.range[0] + 1 }, (_, k) => b.range[0] + k),
    index: i,
  }));
}

export function weekIdForDate(date) {
  // ISO-ish week id: year + week number (Sunday-start weeks, good enough for reminder de-duplication).
  const d = new Date(date);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d - onejan) / 86400000);
  const week = Math.floor((dayOfYear + onejan.getDay()) / 7);
  return `${d.getFullYear()}-W${week}`;
}
