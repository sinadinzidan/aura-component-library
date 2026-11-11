import type { Tone } from '../tones';

export const LOG_CATEGORIES = ['safety', 'operations', 'equipment', 'maintenance', 'environment', 'instruction'] as const;
export type LogCategory = (typeof LOG_CATEGORIES)[number];

export type CategoryStyle = { label: string; tone: Tone };

const CATEGORY: Record<LogCategory, CategoryStyle> = {
  safety: { label: 'Safety', tone: 'pink' },
  operations: { label: 'Operations', tone: 'blue' },
  equipment: { label: 'Equipment', tone: 'amber' },
  maintenance: { label: 'Maintenance', tone: 'teal' },
  environment: { label: 'Environment', tone: 'green' },
  instruction: { label: 'Standing instruction', tone: 'purple' },
};

/** The label and colour family a log category is shown with. Categories are not statuses. */
export function categoryStyle(category: LogCategory): CategoryStyle {
  return CATEGORY[category];
}

export function isLogCategory(value: string): value is LogCategory {
  return LOG_CATEGORIES.some((category) => category === value);
}

export type ShiftName = 'Night' | 'Day' | 'Evening';

/** The shift an hour of the day belongs to: night 22–06, day 06–14, evening 14–22. */
export function shiftOfHour(hour: number): ShiftName {
  if (hour >= 6 && hour < 14) return 'Day';
  if (hour >= 14 && hour < 22) return 'Evening';
  return 'Night';
}

export type LogItem = { id: string; time: string; category: LogCategory; author: string; text: string };

/** Entries whose category is in `categories` (all when empty) and whose text or author matches the query. */
export function filterLog<Item extends LogItem>(items: readonly Item[], categories: readonly LogCategory[], query: string): Item[] {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => (categories.length === 0 || categories.includes(item.category)) && (needle === '' || `${item.text} ${item.author}`.toLowerCase().includes(needle)));
}

/** Groups entries by the shift their `HH:MM` time falls in, keeping the order they came in. */
export function groupByShift<Item extends LogItem>(items: readonly Item[]): Array<{ shift: ShiftName; items: Item[] }> {
  const groups: Array<{ shift: ShiftName; items: Item[] }> = [];
  for (const item of items) {
    const shift = shiftOfHour(Number(item.time.slice(0, 2)));
    const last = groups[groups.length - 1];
    if (last && last.shift === shift) last.items.push(item);
    else groups.push({ shift, items: [item] });
  }
  return groups;
}

/** Initials for an avatar chip: first letters of the first and last name. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}
