import {
  PIPELINE_ANOMALIES,
  PIPELINE_BLOCK_VALVES,
  PIPELINE_HYDRAULICS,
  PIPELINE_LEAK,
  PIPELINE_MAOP,
  PIPELINE_STATIONS,
  PIPELINE_TOTAL_KM,
  anomalySeverity,
  buildPipelineRoute,
  elevationAt,
  elevationProfile,
  leakIsolation,
  nextLeakStage,
  pipelineDips,
  pipelineGround,
  positionAtKp,
  scenarioPressureAt,
  scenarioProfile,
  stationValves,
} from './pipelineData';

describe('stations', () => {
  it('are ordered along the line, inside it, with unique ids', () => {
    const kps = PIPELINE_STATIONS.map((station) => station.kp);

    expect(kps).toEqual([...kps].sort((a, b) => a - b));
    expect(kps[0]).toBe(0);
    expect(kps[kps.length - 1]).toBe(PIPELINE_TOTAL_KM);
    expect(new Set(PIPELINE_STATIONS.map((station) => station.id)).size).toBe(PIPELINE_STATIONS.length);
  });

  it('cover every kind the corridor needs', () => {
    const kinds = new Set(PIPELINE_STATIONS.map((station) => station.kind));

    expect([...kinds].sort()).toEqual(['compressor', 'crossing', 'launcher', 'metering', 'terminal', 'valve']);
    expect(PIPELINE_STATIONS.some((station) => station.crossing === 'river')).toBe(true);
    expect(PIPELINE_STATIONS.some((station) => station.crossing === 'road')).toBe(true);
  });

  it('puts the compressor station where the hydraulics add pressure', () => {
    const compressor = PIPELINE_STATIONS.find((station) => station.kind === 'compressor');

    expect(PIPELINE_HYDRAULICS.boosters?.[0].kp).toBe(compressor?.kp);
  });
});

describe('hydraulics', () => {
  it('stay under the maximum allowable pressure along the whole line', () => {
    for (let kp = 0; kp <= PIPELINE_TOTAL_KM; kp += 2) expect(scenarioPressureAt('off', kp)).toBeLessThan(PIPELINE_MAOP);
  });
});

describe(anomalySeverity.name, () => {
  it('judges metal loss by depth', () => {
    expect(anomalySeverity({ ...PIPELINE_ANOMALIES[0], depth: 45 })).toBe('high');
    expect(anomalySeverity({ ...PIPELINE_ANOMALIES[0], depth: 30 })).toBe('medium');
    expect(anomalySeverity({ ...PIPELINE_ANOMALIES[0], depth: 10 })).toBe('low');
  });

  it('judges dents on their own scale', () => {
    expect(anomalySeverity({ ...PIPELINE_ANOMALIES[1], depth: 3.4 })).toBe('medium');
    expect(anomalySeverity({ ...PIPELINE_ANOMALIES[1], depth: 2.1 })).toBe('low');
  });

  it('gives the inspection at least one finding of each of three grades', () => {
    expect(new Set(PIPELINE_ANOMALIES.map(anomalySeverity))).toEqual(new Set(['high', 'medium', 'low']));
  });
});

describe(nextLeakStage.name, () => {
  it('cycles off, detected, isolated, off', () => {
    expect(nextLeakStage('off')).toBe('detected');
    expect(nextLeakStage('detected')).toBe('isolated');
    expect(nextLeakStage('isolated')).toBe('off');
  });
});

describe(leakIsolation.name, () => {
  it('shuts the leak in between the block valves either side of it', () => {
    const pair = leakIsolation();

    expect(pair?.upstream.id).toBe('bv-02');
    expect(pair?.downstream.id).toBe('bv-03');
    expect(pair?.upstream.kp).toBeLessThan(PIPELINE_LEAK.kp);
    expect(pair?.downstream.kp).toBeGreaterThan(PIPELINE_LEAK.kp);
  });

  it('has no isolation for a leak before the first valve', () => {
    expect(leakIsolation(3)).toBeNull();
  });
});

describe(scenarioProfile.name, () => {
  const lowest = (points: { pressure: number }[]) => Math.min(...points.map((point) => point.pressure));

  it('shows a pressure dip at the leak while the wave spreads', () => {
    expect(lowest(scenarioProfile('detected'))).toBeLessThan(lowest(scenarioProfile('off')) - 1);
  });

  it('settles the isolated segment and leaves the rest alone', () => {
    const base = scenarioProfile('off');
    const isolated = scenarioProfile('isolated');

    expect(isolated.find((point) => point.kp === 60)?.pressure).toBe(PIPELINE_LEAK.settledPressure);
    expect(isolated.find((point) => point.kp === 10)?.pressure).toBe(base.find((point) => point.kp === 10)?.pressure);
  });
});

describe(scenarioPressureAt.name, () => {
  it('is lowest at the leak and back to normal outside the wave', () => {
    expect(scenarioPressureAt('detected', PIPELINE_LEAK.kp)).toBeCloseTo(scenarioPressureAt('off', PIPELINE_LEAK.kp) - PIPELINE_LEAK.drop, 9);
    expect(scenarioPressureAt('detected', 5)).toBe(scenarioPressureAt('off', 5));
  });

  it('reads the settled pressure inside the isolated segment', () => {
    expect(scenarioPressureAt('isolated', 60)).toBe(PIPELINE_LEAK.settledPressure);
    expect(scenarioPressureAt('isolated', 80)).toBe(scenarioPressureAt('off', 80));
  });
});

describe(stationValves.name, () => {
  const station = (id: string) => PIPELINE_STATIONS.find((candidate) => candidate.id === id)!;

  it('leaves valves as they are outside the isolated stage', () => {
    expect(stationValves(station('bv-02'), 'detected')[0].position).toBe('open');
  });

  it('closes the main valve of the two block valve stations around the leak', () => {
    expect(stationValves(station('bv-02'), 'isolated')[0].position).toBe('closed');
    expect(stationValves(station('bv-03'), 'isolated')[0].position).toBe('closed');
    expect(stationValves(station('bv-01'), 'isolated')[0].position).toBe('open');
  });

  it('only has block valves as isolation candidates', () => {
    expect(PIPELINE_BLOCK_VALVES.map((valve) => valve.id)).toEqual(['bv-01', 'bv-02', 'bv-03']);
  });
});

describe('elevation', () => {
  it('interpolates between waypoints and clamps', () => {
    expect(elevationAt(0)).toBe(12);
    expect(elevationAt(3)).toBe(28);
    expect(elevationAt(500)).toBe(18);
    expect(elevationAt(-4)).toBe(12);
  });

  it('gives a profile from end to end', () => {
    const profile = elevationProfile(1);

    expect(profile[0].kp).toBe(0);
    expect(profile[profile.length - 1]).toEqual({ kp: 84, value: 18 });
  });
});

describe(buildPipelineRoute.name, () => {
  const route = buildPipelineRoute();

  it('runs steadily east, so ground height can be looked up by x', () => {
    for (let index = 1; index < route.samples.length; index += 1) expect(route.samples[index].position[0]).toBeGreaterThan(route.samples[index - 1].position[0]);
  });

  it('is longer than its straight east-west extent', () => {
    expect(route.length).toBeGreaterThan(84 * 5);
  });

  it('puts a chainage at the matching x', () => {
    expect(positionAtKp(route, 42).position[0]).toBeCloseTo(210, 0);
  });

  it('keeps the ground below the pipe along the whole line', () => {
    for (const sample of route.samples) expect(pipelineGround(route, sample.position[0], sample.position[2])).toBeLessThan(sample.position[1]);
  });

  it('dips the ground at the river and the road', () => {
    const [river, road] = pipelineDips();

    expect(river.x).toBe(135);
    expect(road.x).toBe(330);
    const at = positionAtKp(route, 27).position;

    expect(pipelineGround(route, at[0], at[2])).toBeLessThan(at[1] - 5);
  });
});
