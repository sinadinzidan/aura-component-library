import {
  decimalsForMagnitude,
  formatAmount,
  formatCompact,
  formatCount,
  formatDateTimeUtc,
  formatDateWithYear,
  formatDuration,
  formatEngineering,
  formatMeasurement,
  formatPercent,
  formatRange,
  formatShare,
  formatSmartTime,
  formatTableTimestamp,
  formatTimeRange,
} from './formatters';

const NBSP = String.fromCharCode(0x00a0);
const MINUS = String.fromCharCode(0x2212);
const EN_DASH = String.fromCharCode(0x2013);
const EM_DASH = String.fromCharCode(0x2014);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

describe(decimalsForMagnitude.name, () => {
  it.each([
    [182400, 0],
    [412, 0],
    [100, 0],
    [48.6, 1],
    [10, 1],
    [6.82, 2],
    [1, 2],
    [0.042, 3],
    [0, 3],
    [-48.6, 1],
  ])('gives %d %d decimals', (value, decimals) => {
    expect(decimalsForMagnitude(value)).toBe(decimals);
  });

  it('gives no decimals for a non-finite value', () => {
    expect(decimalsForMagnitude(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe(formatMeasurement.name, () => {
  it('keeps about three significant digits', () => {
    expect(formatMeasurement(182400)).toBe('182,400');
    expect(formatMeasurement(48.62)).toBe('48.6');
    expect(formatMeasurement(6.816)).toBe('6.82');
    expect(formatMeasurement(0.0421)).toBe('0.042');
  });

  it('uses a real minus sign', () => {
    expect(formatMeasurement(-12.34)).toBe(`${MINUS}12.3`);
  });

  it('shows an em dash without a value', () => {
    expect(formatMeasurement(null)).toBe(EM_DASH);
    expect(formatMeasurement(Number.NaN)).toBe(EM_DASH);
  });
});

describe(formatCompact.name, () => {
  it('leaves values under a thousand whole', () => {
    expect(formatCompact(412)).toBe('412');
  });

  it('abbreviates thousands, millions and billions', () => {
    expect(formatCompact(182400)).toBe('182.4k');
    expect(formatCompact(4380000)).toBe('4.4M');
    expect(formatCompact(2500000000)).toBe('2.5B');
  });

  it('drops a trailing zero decimal', () => {
    expect(formatCompact(12000)).toBe('12k');
  });

  it('respects the decimals argument', () => {
    expect(formatCompact(182400, 0)).toBe('182k');
  });

  it('keeps the sign with a real minus', () => {
    expect(formatCompact(-1500)).toBe(`${MINUS}1.5k`);
  });

  it('shows an em dash without a value', () => {
    expect(formatCompact(undefined)).toBe(EM_DASH);
  });
});

describe(formatPercent.name, () => {
  it('puts a non-breaking space before the sign', () => {
    expect(formatPercent(96.4)).toBe(`96.4${NBSP}%`);
  });

  it('respects decimals', () => {
    expect(formatPercent(82.66, 0)).toBe(`83${NBSP}%`);
  });

  it('shows an em dash without a value', () => {
    expect(formatPercent(null)).toBe(EM_DASH);
  });
});

describe(formatShare.name, () => {
  it('formats a part of a total', () => {
    expect(formatShare(3, 12)).toBe(`25${NBSP}%`);
  });

  it('shows an em dash when the total is zero', () => {
    expect(formatShare(0, 0)).toBe(EM_DASH);
  });
});

describe(formatRange.name, () => {
  it('joins with an en dash and writes the unit once', () => {
    expect(formatRange(40, 52, 'barg')).toBe(`40${EN_DASH}52${NBSP}barg`);
  });

  it('works without a unit and with decimals', () => {
    expect(formatRange(7.1, 11, undefined, 1)).toBe(`7.1${EN_DASH}11.0`);
  });

  it('uses "to" when a bound is negative, so the dash is not read as a minus', () => {
    expect(formatRange(-20, 40, '°C')).toBe(`${MINUS}20 to 40${NBSP}°C`);
  });
});

describe(formatEngineering.name, () => {
  it('scales up to kilo, mega and giga', () => {
    expect(formatEngineering(3500, 'W')).toBe(`3.50${NBSP}kW`);
    expect(formatEngineering(1250000, 'W')).toBe(`1.25${NBSP}MW`);
    expect(formatEngineering(2.4e9, 'Wh', 1)).toBe(`2.4${NBSP}GWh`);
  });

  it('scales down to milli and micro', () => {
    expect(formatEngineering(0.0047, 'A')).toBe(`4.70${NBSP}mA`);
    expect(formatEngineering(0.000012, 'm', 0)).toBe(`12${NBSP}µm`);
  });

  it('leaves values between 1 and 999 unprefixed', () => {
    expect(formatEngineering(86.2, 'A', 1)).toBe(`86.2${NBSP}A`);
  });

  it('handles zero, negatives and missing values', () => {
    expect(formatEngineering(0, 'W')).toBe(`0${NBSP}W`);
    expect(formatEngineering(-3500, 'W', 1)).toBe(`${MINUS}3.5${NBSP}kW`);
    expect(formatEngineering(null, 'W')).toBe(EM_DASH);
  });
});

describe(formatDuration.name, () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(45_000)).toBe(`45${NBSP}s`);
  });

  it('shows minutes under an hour', () => {
    expect(formatDuration(38 * MINUTE)).toBe(`38${NBSP}min`);
  });

  it('shows hours and minutes under a day', () => {
    expect(formatDuration(3 * HOUR + 20 * MINUTE)).toBe(`3${NBSP}h 20${NBSP}min`);
  });

  it('drops a zero second unit', () => {
    expect(formatDuration(2 * HOUR)).toBe(`2${NBSP}h`);
    expect(formatDuration(3 * DAY)).toBe(`3${NBSP}d`);
  });

  it('shows days and hours from a day up', () => {
    expect(formatDuration(2 * DAY + 4 * HOUR)).toBe(`2${NBSP}d 4${NBSP}h`);
  });

  it('shows an em dash for a missing or negative duration', () => {
    expect(formatDuration(null)).toBe(EM_DASH);
    expect(formatDuration(-1)).toBe(EM_DASH);
  });
});

describe('dates and times', () => {
  it('writes a date with its year', () => {
    expect(formatDateWithYear(NOW)).toBe('12 Mar 2026');
  });

  it('writes date and time with the zone', () => {
    expect(formatDateTimeUtc(NOW - 14 * MINUTE)).toBe(`12 Mar 2026 at 13:46${NBSP}UTC`);
  });

  it('writes a sortable table timestamp', () => {
    expect(formatTableTimestamp(NOW - 14 * MINUTE)).toBe('2026-03-12 13:46:00');
  });

  it('writes a time range with an en dash and one zone label', () => {
    expect(formatTimeRange(NOW - 8 * HOUR, NOW)).toBe(`06:00${EN_DASH}14:00${NBSP}UTC`);
  });
});

describe(formatSmartTime.name, () => {
  it('says "Just now" under a minute', () => {
    expect(formatSmartTime(NOW - 20_000, NOW)).toBe('Just now');
  });

  it('is relative in minutes under an hour', () => {
    expect(formatSmartTime(NOW - 14 * MINUTE, NOW)).toBe(`14${NBSP}min ago`);
  });

  it('is relative in hours up to a day', () => {
    expect(formatSmartTime(NOW - 5 * HOUR, NOW)).toBe(`5${NBSP}h ago`);
    expect(formatSmartTime(NOW - DAY, NOW)).toBe(`24${NBSP}h ago`);
  });

  it('is absolute with the year beyond a day', () => {
    expect(formatSmartTime(NOW - 2 * DAY, NOW)).toBe('10 Mar 2026');
  });

  it('handles times in the future', () => {
    expect(formatSmartTime(NOW + 6 * HOUR, NOW)).toBe(`in 6${NBSP}h`);
    expect(formatSmartTime(NOW + 4 * DAY, NOW)).toBe('16 Mar 2026');
  });
});

describe(formatCount.name, () => {
  it('uses the singular for one', () => {
    expect(formatCount(1, 'alarm')).toBe('1 alarm');
  });

  it('uses the plural for zero and many', () => {
    expect(formatCount(0, 'alarm')).toBe('0 alarms');
    expect(formatCount(1204, 'alarm')).toBe('1,204 alarms');
  });

  it('accepts an irregular plural', () => {
    expect(formatCount(3, 'time series', 'time series')).toBe('3 time series');
  });
});

describe(formatAmount.name, () => {
  it('writes the code before the amount', () => {
    expect(formatAmount(12400)).toBe(`USD${NBSP}12,400`);
  });

  it('accepts another currency and decimals', () => {
    expect(formatAmount(1250.5, 'NOK', 2)).toBe(`NOK${NBSP}1,250.50`);
  });

  it('shows an em dash without a value', () => {
    expect(formatAmount(null)).toBe(EM_DASH);
  });
});
