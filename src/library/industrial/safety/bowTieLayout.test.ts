import { COMPACT_METRICS, DEFAULT_METRICS, barrierCoverage, barriersOf, bowTieLayout, bowTieSummary, pathState, pathStrengths, weakenedPaths, wrapLabel } from './bowTieLayout';
import type { BowTieModel, Box } from './bowTieLayout';

const MODEL: BowTieModel = {
  hazard: 'Hydrocarbon gas under pressure',
  topEvent: 'Loss of containment',
  barriers: [
    { id: 'trip', name: 'High pressure trip', type: 'engineered', state: 'healthy' },
    { id: 'psv', name: 'Relief valve', type: 'engineered', state: 'degraded', escalation: 'Recertification overdue' },
    { id: 'procedure', name: 'Start-up procedure', type: 'procedural', state: 'healthy' },
    { id: 'detection', name: 'Gas detection', type: 'engineered', state: 'impaired' },
    { id: 'esd', name: 'Emergency shutdown', type: 'engineered', state: 'healthy' },
    { id: 'muster', name: 'Muster and evacuation', type: 'human', state: 'healthy' },
  ],
  threats: [
    { id: 't-overpressure', name: 'Overpressure from blocked outlet', barrierIds: ['trip', 'psv'] },
    { id: 't-startup', name: 'Operating error during start-up', barrierIds: ['procedure'] },
    { id: 't-corrosion', name: 'Internal corrosion', barrierIds: [] },
  ],
  consequences: [
    { id: 'c-fire', name: 'Jet fire', severity: 'severe', barrierIds: ['detection', 'esd'] },
    { id: 'c-injury', name: 'Injury to personnel', severity: 'major', barrierIds: ['esd', 'muster'] },
  ],
};

const centreY = (box: Box): number => box.y + box.height / 2;
const overlaps = (a: Box, b: Box): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe(wrapLabel.name, () => {
  it('keeps a short label on one line', () => {
    expect(wrapLabel('Relief valve', 16)).toEqual(['Relief valve']);
  });

  it('breaks on a space when the label is too long', () => {
    expect(wrapLabel('High pressure trip', 14)).toEqual(['High pressure', 'trip']);
  });

  it('ends in an ellipsis when the text does not fit in the lines allowed', () => {
    expect(wrapLabel('Overpressure from a blocked outlet downstream', 14, 2)).toEqual(['Overpressure', 'from a blocked…']);
  });

  it('keeps a single long word whole', () => {
    expect(wrapLabel('Depressurisation', 8)).toEqual(['Depressurisation']);
  });

  it('returns nothing for empty text', () => {
    expect(wrapLabel('   ', 10)).toEqual([]);
  });
});

describe(barriersOf.name, () => {
  it('returns the barriers in path order and skips unknown ids', () => {
    const barriers = barriersOf(MODEL, { id: 'x', name: 'x', barrierIds: ['psv', 'missing', 'trip'] });

    expect(barriers.map((barrier) => barrier.id)).toEqual(['psv', 'trip']);
  });
});

describe(pathState.name, () => {
  it('is the worst state of the barriers on the path', () => {
    expect(pathState(MODEL, MODEL.threats[0])).toBe('degraded');
    expect(pathState(MODEL, MODEL.threats[1])).toBe('healthy');
    expect(pathState(MODEL, MODEL.consequences[0])).toBe('impaired');
  });

  it('treats a path without barriers as impaired', () => {
    expect(pathState(MODEL, MODEL.threats[2])).toBe('impaired');
  });
});

describe(weakenedPaths.name, () => {
  it('keeps only paths with a degraded, impaired or missing barrier', () => {
    const filtered = weakenedPaths(MODEL);

    expect(filtered.threats.map((path) => path.id)).toEqual(['t-overpressure', 't-corrosion']);
    expect(filtered.consequences.map((path) => path.id)).toEqual(['c-fire']);
  });

  it('keeps the hazard, the top event and the barrier list', () => {
    const filtered = weakenedPaths(MODEL);

    expect(filtered.topEvent).toBe(MODEL.topEvent);
    expect(filtered.barriers).toBe(MODEL.barriers);
  });
});

describe(pathStrengths.name, () => {
  it('counts barriers per state and grades every path', () => {
    const strengths = pathStrengths(MODEL);

    expect(strengths.map((entry) => [entry.id, entry.level])).toEqual([
      ['t-overpressure', 'single'],
      ['t-startup', 'intact'],
      ['t-corrosion', 'unprotected'],
      ['c-fire', 'single'],
      ['c-injury', 'intact'],
    ]);
    expect(strengths[0]).toMatchObject({ total: 2, healthy: 1, degraded: 1, impaired: 0, side: 'threat' });
  });

  it('grades a path with several healthy barriers and one weak one as weakened', () => {
    const model: BowTieModel = { ...MODEL, threats: [{ id: 't', name: 'T', barrierIds: ['trip', 'procedure', 'psv'] }], consequences: [] };

    expect(pathStrengths(model)[0].level).toBe('weakened');
  });
});

describe(barrierCoverage.name, () => {
  it('lists only the barriers used on that side, in model order', () => {
    expect(barrierCoverage(MODEL, 'threat').barriers.map((barrier) => barrier.id)).toEqual(['trip', 'psv', 'procedure']);
  });

  it('marks each cell with the barrier state or null', () => {
    const { rows } = barrierCoverage(MODEL, 'consequence');

    expect(rows[0].cells).toEqual(['impaired', 'healthy', null]);
    expect(rows[1].cells).toEqual([null, 'healthy', 'healthy']);
    expect(rows.map((row) => row.healthy)).toEqual([1, 2]);
  });
});

describe(bowTieSummary.name, () => {
  it('returns one row per threat and consequence with its barriers and worst state', () => {
    const rows = bowTieSummary(MODEL);

    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ side: 'threat', path: 'Overpressure from blocked outlet', state: 'degraded' });
    expect(rows[3]).toMatchObject({ side: 'consequence', severity: 'severe', state: 'impaired' });
    expect(rows[3].barriers.map((barrier) => barrier.name)).toEqual(['Gas detection', 'Emergency shutdown']);
  });
});

describe(bowTieLayout.name, () => {
  const layout = bowTieLayout(MODEL);

  it('puts the top event in the centre of the drawing', () => {
    expect(layout.topEvent.x + layout.topEvent.width / 2).toBeCloseTo(layout.width / 2);
    expect(centreY(layout.topEvent)).toBeCloseTo(layout.height / 2);
  });

  it('puts the hazard above the top event', () => {
    expect(layout.hazard.y + layout.hazard.height).toBeLessThan(layout.topEvent.y);
    expect(layout.hazard.y).toBeGreaterThanOrEqual(0);
  });

  it('puts threats left of the top event and consequences right of it', () => {
    for (const threat of layout.threats) expect(threat.x + threat.width).toBeLessThan(layout.topEvent.x);
    for (const consequence of layout.consequences) expect(consequence.x).toBeGreaterThan(layout.topEvent.x + layout.topEvent.width);
  });

  it('keeps every box inside the drawing', () => {
    const boxes: Box[] = [layout.hazard, layout.topEvent, ...layout.threats, ...layout.consequences, ...layout.barriers, ...layout.barriers.flatMap((node) => (node.escalation ? [node.escalation] : []))];

    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(layout.width);
      expect(box.y + box.height).toBeLessThanOrEqual(layout.height);
    }
  });

  it('never overlaps two boxes', () => {
    const boxes: Box[] = [layout.hazard, layout.topEvent, ...layout.threats, ...layout.consequences, ...layout.barriers, ...layout.barriers.flatMap((node) => (node.escalation ? [node.escalation] : []))];

    boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false)));
  });

  it('places prevention barriers between the threat and the top event, in order', () => {
    const [trip, psv] = layout.barriers.filter((node) => node.pathId === 't-overpressure');
    const threat = layout.threats[0];

    expect(trip.x).toBeGreaterThan(threat.x + threat.width);
    expect(psv.x).toBeGreaterThan(trip.x + trip.width);
    expect(psv.x + psv.width).toBeLessThan(layout.topEvent.x);
  });

  it('places mitigation barriers between the top event and the consequence, the last one nearest the consequence', () => {
    const [detection, esd] = layout.barriers.filter((node) => node.pathId === 'c-fire');
    const consequence = layout.consequences[0];

    expect(detection.x).toBeGreaterThan(layout.topEvent.x + layout.topEvent.width);
    expect(esd.x).toBeGreaterThan(detection.x + detection.width);
    expect(consequence.x - (esd.x + esd.width)).toBe(DEFAULT_METRICS.lead);
  });

  it('centres each barrier on the line of its path', () => {
    for (const node of layout.barriers) {
      const path = [...layout.threats, ...layout.consequences].find((entry) => entry.id === node.pathId);
      expect(path).toBeDefined();
      if (path) expect(centreY(node)).toBeCloseTo(centreY(path));
    }
  });

  it('draws a barrier shared by two paths once on each', () => {
    expect(layout.barriers.filter((node) => node.barrier.id === 'esd').map((node) => node.key)).toEqual(['c-fire:esd', 'c-injury:esd']);
  });

  it('hangs the escalation factor under its barrier and gives the row room for it', () => {
    const psv = layout.barriers.find((node) => node.key === 't-overpressure:psv');

    expect(psv?.escalation).toBeDefined();
    expect(psv?.escalation?.y).toBe((psv?.y ?? 0) + DEFAULT_METRICS.barrierHeight + DEFAULT_METRICS.escalationGap);
    expect(layout.threats[1].y).toBeGreaterThan((psv?.escalation?.y ?? 0) + DEFAULT_METRICS.escalationHeight);
  });

  it('draws one line per path, ending on the top event', () => {
    const y = layout.height / 2;

    expect(layout.lines.map((line) => line.id)).toEqual(['t-overpressure', 't-startup', 't-corrosion', 'c-fire', 'c-injury']);
    expect(layout.lines[0].d.endsWith(`L ${layout.topEvent.x} ${y}`)).toBe(true);
    expect(layout.lines[3].d.startsWith(`M ${layout.topEvent.x + layout.topEvent.width} ${y}`)).toBe(true);
  });

  it('stays symmetric: both sides are equally wide', () => {
    const left = layout.topEvent.x;
    const right = layout.width - (layout.topEvent.x + layout.topEvent.width);

    expect(left).toBeCloseTo(right);
  });

  it('is deterministic', () => {
    expect(bowTieLayout(MODEL)).toEqual(layout);
  });

  it('lays out a bow-tie with no paths as just the hazard and the top event', () => {
    const empty = bowTieLayout({ ...MODEL, threats: [], consequences: [] });

    expect(empty.barriers).toEqual([]);
    expect(empty.lines).toEqual([]);
    expect(empty.hazard.y).toBeGreaterThanOrEqual(0);
  });

  it('is smaller and drops escalation factors in the compact form', () => {
    const compact = bowTieLayout(MODEL, COMPACT_METRICS);

    expect(compact.width).toBeLessThan(layout.width);
    expect(compact.height).toBeLessThan(layout.height);
    expect(compact.barriers.every((node) => node.escalation === undefined)).toBe(true);
  });
});
