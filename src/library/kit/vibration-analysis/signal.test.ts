import { bandLevels, crestFactor, findPeaks, isoZone, machineComponents, orbitPoints, overall, readPeak, synthSpectrum, synthWaveform } from './signal';

describe('vibration signal maths', () => {
  const components = machineComponents(25, { unbalance: 3, misalignment: 1, bearing: { hz: 89, amplitude: 0.8 } });

  it('puts the unbalance at running speed and the defect at the bearing frequency', () => {
    expect(components[0]).toEqual({ hz: 25, amplitude: 3 });
    expect(components.some((component) => component.hz === 89)).toBe(true);
    expect(overall([{ hz: 1, amplitude: 3 }, { hz: 2, amplitude: 4 }])).toBe(5);
  });

  it('builds the same spectrum for the same seed, with the strongest peak at 1×', () => {
    const lines = synthSpectrum(components, { maxHz: 400, seed: 3 });
    expect(synthSpectrum(components, { maxHz: 400, seed: 3 })).toEqual(lines);
    const [top] = findPeaks(lines, 3, 0.5);
    expect(Math.abs(top.hz - 25)).toBeLessThan(2);
    expect(bandLevels(lines, [{ label: '1×', fromHz: 15, toHz: 35, alarm: 2 }])[0]).toBeGreaterThan(2);
  });

  it('names peaks by order and by bearing frequency', () => {
    const context = { runningHz: 25, bearingHz: 89, vanes: 5 };
    expect(readPeak(25.2, context).label).toBe('1×');
    expect(readPeak(50, context).label).toBe('2×');
    expect(readPeak(125, context).label).toBe('Vane pass');
    expect(readPeak(178, context).label).toBe('2× BPFO');
    expect(readPeak(61, context).label).toBe('2.44×');
  });

  it('raises the crest factor when impacts ride on the waveform', () => {
    const smooth = synthWaveform([{ hz: 25, amplitude: 2 }], { seconds: 0.2, noise: 0 });
    const impacting = synthWaveform([{ hz: 25, amplitude: 2 }], { seconds: 0.2, noise: 0, impacts: { hz: 89, amplitude: 9 } });
    expect(crestFactor(smooth)).toBeCloseTo(Math.SQRT2, 1);
    expect(crestFactor(impacting)).toBeGreaterThan(crestFactor(smooth));
  });

  it('sorts a velocity into its ISO zone', () => {
    expect([1, 3, 5, 9].map((value) => isoZone(value))).toEqual(['A', 'B', 'C', 'D']);
  });

  it('closes the orbit after one revolution', () => {
    const points = orbitPoints({ xAmplitude: 30, yAmplitude: 20, phaseDeg: 90 });
    expect(points[0].x).toBeCloseTo(points[points.length - 1].x, 6);
    expect(points).toHaveLength(121);
  });
});
