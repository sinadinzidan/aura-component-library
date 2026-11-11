import { deckAlarmCount, deckTone } from './deckLevels';
import type { DeckStackLevel } from './deckLevels';

const QUIET: DeckStackLevel = { id: 'cellar', name: 'Cellar deck', elevation: '+12 m', people: 4, alarms: [] };

const BUSY: DeckStackLevel = {
  id: 'main',
  name: 'Main deck',
  elevation: '+18 m',
  people: 9,
  alarms: [
    { tone: 'critical', count: 1, label: 'critical' },
    { tone: 'warning', count: 2, label: 'warning' },
  ],
};

describe(deckTone.name, () => {
  it('takes the tone of the most severe alarm', () => {
    expect(deckTone(BUSY)).toBe('critical');
  });

  it('skips alarm classes with a count of zero', () => {
    expect(deckTone({ ...BUSY, alarms: [{ tone: 'critical', count: 0, label: 'critical' }, { tone: 'info', count: 1, label: 'advisory' }] })).toBe('info');
  });

  it('is neutral without alarms', () => {
    expect(deckTone(QUIET)).toBe('neutral');
  });
});

describe(deckAlarmCount.name, () => {
  it('adds up every alarm class', () => {
    expect(deckAlarmCount(BUSY)).toBe(3);
  });

  it('is zero for a quiet level', () => {
    expect(deckAlarmCount(QUIET)).toBe(0);
  });
});
