import {
  TEMPERATURE_RAMP_KEYS,
  TEMPERATURE_RAMP_TOKENS,
  TEMPERATURE_RAMP_VARS,
  formatTemperature,
  temperatureAt,
  temperatureBands,
  temperatureFraction,
  temperatureGradient,
  temperatureRampKey,
  temperatureStep,
} from './temperatureRamp';

const LNG = { warm: 30, cold: -162 };

describe('temperature ramp tokens', () => {
  it('names one token and one CSS variable per step, in the same order', () => {
    for (const key of TEMPERATURE_RAMP_KEYS) {
      expect(TEMPERATURE_RAMP_VARS[key]).toBe(`var(--${TEMPERATURE_RAMP_TOKENS[key]})`);
    }
  });
});

describe(temperatureFraction.name, () => {
  it('runs from 0 at the warm end to 1 at the cold end', () => {
    expect(temperatureFraction(30, LNG)).toBe(0);
    expect(temperatureFraction(-66, LNG)).toBe(0.5);
    expect(temperatureFraction(-162, LNG)).toBe(1);
  });

  it('clamps temperatures outside the scale', () => {
    expect(temperatureFraction(80, LNG)).toBe(0);
    expect(temperatureFraction(-200, LNG)).toBe(1);
  });

  it('returns 0 for a scale without a span or a missing reading', () => {
    expect(temperatureFraction(10, { warm: 5, cold: 5 })).toBe(0);
    expect(temperatureFraction(Number.NaN, LNG)).toBe(0);
  });
});

describe(temperatureAt.name, () => {
  it('is the inverse of the fraction', () => {
    expect(temperatureAt(0, LNG)).toBe(30);
    expect(temperatureAt(0.5, LNG)).toBe(-66);
    expect(temperatureAt(1, LNG)).toBe(-162);
    expect(temperatureAt(2, LNG)).toBe(-162);
  });
});

describe(temperatureStep.name, () => {
  it('puts ambient gas in the warmest step and LNG in the coldest', () => {
    expect(temperatureStep(28, LNG)).toBe(0);
    expect(temperatureStep(-162, LNG)).toBe(4);
  });

  it('moves one step per fifth of the scale', () => {
    expect(temperatureStep(-10, LNG)).toBe(1);
    expect(temperatureStep(-50, LNG)).toBe(2);
    expect(temperatureStep(-90, LNG)).toBe(3);
    expect(temperatureStep(-130, LNG)).toBe(4);
  });

  it('supports another number of steps', () => {
    expect(temperatureStep(-162, LNG, 3)).toBe(2);
    expect(temperatureStep(-162, LNG, 1)).toBe(0);
  });
});

describe(temperatureRampKey.name, () => {
  it('names the step', () => {
    expect(temperatureRampKey(22, LNG)).toBe('step0');
    expect(temperatureRampKey(-155, LNG)).toBe('step4');
  });
});

describe(temperatureBands.name, () => {
  it('covers the scale without gaps, warm to cold', () => {
    const bands = temperatureBands(LNG);

    expect(bands).toHaveLength(5);
    expect(bands[0].from).toBe(30);
    expect(bands[4].to).toBe(-162);
    bands.slice(1).forEach((band, index) => expect(band.from).toBeCloseTo(bands[index].to));
  });

  it('agrees with the step of a temperature inside each band', () => {
    for (const [index, band] of temperatureBands(LNG).entries()) {
      expect(temperatureStep((band.from + band.to) / 2, LNG)).toBe(index);
    }
  });
});

describe(temperatureGradient.name, () => {
  it('runs through every step from tokens, warm first', () => {
    const gradient = temperatureGradient('to right');

    expect(gradient.startsWith('linear-gradient(to right, var(--chart-warning-450)')).toBe(true);
    expect(gradient.endsWith('var(--chart-info-450))')).toBe(true);
    expect(gradient.match(/var\(/g)).toHaveLength(5);
  });
});

describe(formatTemperature.name, () => {
  it('uses a real minus sign and a non-breaking space', () => {
    expect(formatTemperature(-162)).toBe('\u2212162\u00a0°C');
    expect(formatTemperature(28)).toBe('28\u00a0°C');
  });

  it('rounds to the given decimals and never prints minus zero', () => {
    expect(formatTemperature(-161.46, 1)).toBe('\u2212161.5\u00a0°C');
    expect(formatTemperature(-0.2)).toBe('0\u00a0°C');
  });
});
