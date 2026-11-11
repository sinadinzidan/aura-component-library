import { judgeReading, nextCheckpoint, roundProgress } from './rounds';

describe('rounds', () => {
  it('asks for a reading when there is none', () => {
    expect(judgeReading(undefined, 40, 52)).toEqual({ result: 'pending', tone: 'neutral', text: 'Enter a reading' });
    expect(judgeReading(Number.NaN, 40, 52).result).toBe('pending');
  });

  it('passes a reading inside its limits', () => {
    expect(judgeReading(48.6, 40, 52)).toEqual({ result: 'pass', tone: 'success', text: 'Within limits' });
    expect(judgeReading(52, 40, 52).result).toBe('pass');
  });

  it('fails a reading outside its limits and says by how much', () => {
    expect(judgeReading(53.3, 40, 52).text).toBe('1.3 above the high limit');
    expect(judgeReading(38, 40, 52, 0).text).toBe('2 below the low limit');
    expect(judgeReading(9, undefined, 7.1).result).toBe('fail');
  });

  it('counts a round', () => {
    expect(roundProgress(['pass', 'pass', 'fail', 'skipped', 'pending', 'pending'])).toEqual({ total: 6, done: 4, passed: 2, failed: 1, skipped: 1, percent: 67 });
    expect(roundProgress([]).percent).toBe(0);
  });

  it('finds the next checkpoint to do', () => {
    const checkpoints = [
      { id: 'a', result: 'pass' as const },
      { id: 'b', result: 'pending' as const },
      { id: 'c', result: 'pending' as const },
    ];
    expect(nextCheckpoint(checkpoints)?.id).toBe('b');
    expect(nextCheckpoint([{ id: 'a', result: 'pass' as const }])).toBeUndefined();
  });
});
