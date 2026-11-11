import type { StatusTone } from '../tones';

export type DeckStackAlarm = { tone: StatusTone; count: number; label: string };

export type DeckStackLevel = {
  id: string;
  name: string;
  /** Where the level sits, in words: "+25 m". */
  elevation: string;
  /** What the level carries, in a few words: "Separation and export compression". */
  detail?: string;
  /** People on the level right now. */
  people: number;
  /** Open alarms raised from the level, most severe first. Empty means normal. */
  alarms: readonly DeckStackAlarm[];
  /** Relative height of the block, so tall levels read as tall. Defaults to 1. */
  weight?: number;
};

/** Total open alarms on a level. */
export function deckAlarmCount(level: DeckStackLevel): number {
  return level.alarms.reduce((total, alarm) => total + alarm.count, 0);
}

/** The tone of a level: that of its most severe alarm, or neutral when there is none. */
export function deckTone(level: DeckStackLevel): StatusTone {
  return level.alarms.find((alarm) => alarm.count > 0)?.tone ?? 'neutral';
}
