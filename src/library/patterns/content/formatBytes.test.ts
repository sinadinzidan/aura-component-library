import { formatBytes } from './formatBytes';

describe(formatBytes.name, () => {
  it('shows whole bytes below one kilobyte', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(999)).toBe('999 B');
  });

  it('uses one decimal below 100 of a unit', () => {
    expect(formatBytes(1000)).toBe('1.0 kB');
    expect(formatBytes(2_400_000)).toBe('2.4 MB');
    expect(formatBytes(86_500)).toBe('86.5 kB');
  });

  it('drops the decimal from 100 of a unit', () => {
    expect(formatBytes(318_000)).toBe('318 kB');
    expect(formatBytes(412_000_000)).toBe('412 MB');
  });

  it('moves to the next unit instead of showing 1000', () => {
    expect(formatBytes(999_950)).toBe('1.0 MB');
  });

  it('reaches gigabytes and terabytes and stops there', () => {
    expect(formatBytes(1_500_000_000)).toBe('1.5 GB');
    expect(formatBytes(2_000_000_000_000)).toBe('2.0 TB');
    expect(formatBytes(5_000_000_000_000_000)).toBe('5000 TB');
  });

  it('shows the placeholder for sizes that are not a number', () => {
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.POSITIVE_INFINITY, 'Unknown')).toBe('Unknown');
  });
});
