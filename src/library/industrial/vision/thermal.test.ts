import { HEAT_STEPS, heatStep, hottestSpot, scaleEdges, temperatureAt, thermalGrid } from './thermal';

const spots = [
  { id: 'a', label: 'Bearing', x: 0.25, y: 0.5, peak: 90, radius: 0.1 },
  { id: 'b', label: 'Casing', x: 0.75, y: 0.5, peak: 60, radius: 0.1 },
];

describe('temperatureAt', () => {
  it('reaches the peak at a spot centre', () => {
    expect(temperatureAt({ x: 0.25, y: 0.5 }, spots, 30)).toBeCloseTo(90);
  });

  it('falls back to ambient far from every spot', () => {
    expect(temperatureAt({ x: 0.5, y: 0.05 }, [spots[0]], 30)).toBeCloseTo(30, 0);
  });

  it('takes the hotter of overlapping spots', () => {
    expect(temperatureAt({ x: 0.75, y: 0.5 }, spots, 30)).toBeCloseTo(60);
  });
});

describe('heatStep', () => {
  it('maps a scale to the four heat-map steps', () => {
    expect(HEAT_STEPS).toBe(4);
    expect([20, 40, 60, 80].map((value) => heatStep(value, 20, 100))).toEqual([0, 1, 2, 3]);
  });

  it('clamps outside the scale and survives a flat scale', () => {
    expect(heatStep(-50, 20, 100)).toBe(0);
    expect(heatStep(500, 20, 100)).toBe(3);
    expect(heatStep(50, 10, 10)).toBe(0);
  });
});

describe('thermalGrid', () => {
  const grid = thermalGrid(spots, { columns: 32, rows: 18, ambient: 30, min: 30, max: 90 });

  it('has the requested size', () => {
    expect(grid).toHaveLength(18);
    expect(grid[0]).toHaveLength(32);
  });

  it('is hottest near the strongest spot and coolest at the edges', () => {
    expect(Math.max(...grid.flat())).toBe(3);
    expect(grid[0][20]).toBeLessThan(grid[9][8]);
  });

  it('is deterministic', () => {
    expect(thermalGrid(spots, { columns: 32, rows: 18, ambient: 30, min: 30, max: 90 })).toEqual(grid);
  });
});

describe('scale and hottest spot', () => {
  it('lists the edges of each step', () => {
    expect(scaleEdges(20, 100)).toEqual([20, 40, 60, 80, 100]);
  });

  it('finds the hottest spot', () => {
    expect(hottestSpot(spots)?.id).toBe('a');
    expect(hottestSpot([])).toBeNull();
  });
});
