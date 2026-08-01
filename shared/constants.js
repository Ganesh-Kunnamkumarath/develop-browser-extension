export const HABIT_KEYS = ['steps', 'dinner', 'protein', 'veg', 'water', 'sleep'];

export const HABIT_LABELS = {
  steps: '10,000 Steps',
  dinner: 'Dinner Before 6 PM',
  protein: '80g+ Protein',
  veg: 'Vegetables & Fiber',
  water: '4L Water',
  sleep: '7+ Hours Sleep',
};

// Habits backed by a number input, checked automatically against a goal.
export const NUMERIC_HABITS = {
  steps: { goal: 10000, unit: '', step: 100 },
  protein: { goal: 80, unit: 'g', step: 1 },
  water: { goal: 4, unit: 'L', step: 0.1 },
  sleep: { goal: 7, unit: 'h', step: 0.5 },
};

// Habits backed by a plain checkbox.
export const BOOLEAN_HABITS = ['dinner', 'veg'];

export const STORAGE_KEYS = {
  SETTINGS: 'settings',
  ENTRIES: 'entries',
  MONTHS: 'months',
  REMINDER_STATE: 'reminderState',
};

export const DEFAULT_SETTINGS = {
  targetWeight: null,
  reminders: {
    daily: { enabled: false, time: '20:00' },
    weekly: { enabled: false, day: 0, time: '18:00' }, // day: 0=Sun .. 6=Sat
    monthly: { enabled: false, time: '09:00' }, // fires on the 1st
  },
};

export const FEELING_KEYS = ['energy', 'fitness', 'sleep', 'mental', 'overall'];

export const FEELING_LABELS = {
  energy: 'Energy Levels',
  fitness: 'Fitness',
  sleep: 'Sleep Quality',
  mental: 'Mental Well-being',
  overall: 'Overall Health',
};
