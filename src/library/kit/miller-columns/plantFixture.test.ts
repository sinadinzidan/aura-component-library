import { describe, expect, it } from 'vitest';

import { EXTRA_SENSORS } from './plantFixture';

describe('EXTRA_SENSORS', () => {
  it('has unique ids and tags', () => {
    expect(new Set(EXTRA_SENSORS.map((sensor) => sensor.id)).size).toBe(EXTRA_SENSORS.length);
    expect(new Set(EXTRA_SENSORS.map((sensor) => sensor.tag)).size).toBe(EXTRA_SENSORS.length);
  });

  it('keeps every value and limit inside the instrument range', () => {
    for (const sensor of EXTRA_SENSORS) {
      expect(sensor.value, sensor.tag).toBeGreaterThanOrEqual(sensor.rangeMin);
      expect(sensor.value, sensor.tag).toBeLessThanOrEqual(sensor.rangeMax);
      expect(sensor.lowLimit, sensor.tag).toBeLessThanOrEqual(sensor.highLimit);
      expect(sensor.highLimit, sensor.tag).toBeLessThanOrEqual(sensor.rangeMax);
    }
  });
});
