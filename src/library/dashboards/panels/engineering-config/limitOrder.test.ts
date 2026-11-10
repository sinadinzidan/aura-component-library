import { checkDeadband, checkLimitOrder, parseLimit, validateLimits } from './limitOrder';

describe(checkLimitOrder.name, () => {
  it('should report nothing when LL < L < H < HH', () => {
    expect(checkLimitOrder({ ll: 80, l: 90, h: 145, hh: 155 })).toEqual([]);
  });

  it('should report the pair that is out of order', () => {
    const issues = checkLimitOrder({ ll: 80, l: 90, h: 160, hh: 155 });

    expect(issues).toHaveLength(1);
    expect(issues[0].keys).toEqual(['h', 'hh']);
    expect(issues[0].message).toBe('H (160) must be below HH (155)');
  });

  it('should treat equal limits as out of order', () => {
    expect(checkLimitOrder({ ll: 90, l: 90, h: 145, hh: 155 })[0].keys).toEqual(['ll', 'l']);
  });

  it('should compare across a limit that is not configured', () => {
    const issues = checkLimitOrder({ ll: null, l: 40, h: null, hh: 35 });

    expect(issues).toHaveLength(1);
    expect(issues[0].keys).toEqual(['l', 'hh']);
  });

  it('should report every clashing pair', () => {
    expect(checkLimitOrder({ ll: 100, l: 90, h: 80, hh: 155 }).map((issue) => issue.keys)).toEqual([
      ['ll', 'l'],
      ['l', 'h'],
    ]);
  });

  it('should accept a tag with one or no limits', () => {
    expect(checkLimitOrder({ ll: null, l: null, h: 52, hh: null })).toEqual([]);
    expect(checkLimitOrder({ ll: null, l: null, h: null, hh: null })).toEqual([]);
  });
});

describe(checkDeadband.name, () => {
  const limits = { ll: 80, l: 90, h: 145, hh: 155 };

  it('should accept a deadband inside the L to H band', () => {
    expect(checkDeadband(limits, 2)).toEqual([]);
  });

  it('should reject a deadband of zero or less', () => {
    expect(checkDeadband(limits, 0)[0].message).toBe('Deadband (0) must be above 0');
  });

  it('should reject a deadband as wide as the band', () => {
    expect(checkDeadband({ ll: null, l: 10, h: 15, hh: null }, 5)[0].message).toBe(
      'Deadband (5) must be smaller than the L to H band (5)'
    );
  });

  it('should skip the band check when L or H is missing or out of order', () => {
    expect(checkDeadband({ ll: null, l: null, h: 15, hh: null }, 50)).toEqual([]);
    expect(checkDeadband({ ll: null, l: 20, h: 15, hh: null }, 50)).toEqual([]);
  });
});

describe(validateLimits.name, () => {
  it('should list order problems before deadband problems', () => {
    const issues = validateLimits({ ll: 95, l: 90, h: 145, hh: 155 }, 0);

    expect(issues.map((issue) => issue.kind)).toEqual(['order', 'deadband']);
  });

  it('should return an empty list for a valid configuration', () => {
    expect(validateLimits({ ll: 30, l: 40, h: 52, hh: 55 }, 0.5)).toEqual([]);
  });
});

describe(parseLimit.name, () => {
  it('should parse decimals with a point or a comma', () => {
    expect(parseLimit(' 7.1 ')).toBe(7.1);
    expect(parseLimit('7,1')).toBe(7.1);
    expect(parseLimit('-5')).toBe(-5);
  });

  it('should read empty text and a dash as not configured', () => {
    expect(parseLimit('')).toBeNull();
    expect(parseLimit('—')).toBeNull();
  });

  it('should return undefined for text that is not a number', () => {
    expect(parseLimit('12a')).toBeUndefined();
    expect(parseLimit('1.2.3')).toBeUndefined();
  });
});
