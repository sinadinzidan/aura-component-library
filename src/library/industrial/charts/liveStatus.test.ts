import { liveStatusText } from './liveStatus';

const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

describe(liveStatusText.name, () => {
  it('describes a live view', () => {
    expect(liveStatusText({ live: true, lastUpdated: NOW, now: NOW })).toBe('Updated 14:00');
  });

  it('leaves out the lag when a paused view is less than a minute behind', () => {
    expect(liveStatusText({ live: false, lastUpdated: NOW - 5000, now: NOW })).toBe('Paused at 13:59');
  });
});

describe('paused lag', () => {
  it('says how far behind a paused view is', () => {
    expect(liveStatusText({ live: false, lastUpdated: NOW - 18 * 60_000, now: NOW })).toBe('Paused at 13:42, 18 min behind');
  });

  it('adds the interval while live', () => {
    expect(liveStatusText({ live: true, lastUpdated: NOW, now: NOW, interval: 'every 5 s' })).toBe('Updated 14:00, every 5 s');
  });
});
