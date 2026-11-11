import { COLOR_KEY_BG, COLOR_KEY_TOKENS, COLOR_MODES, colorKeyFor, legendFor, legendInUse, systemLabel } from './colorBy';
import { VIEWER_PARTS, findPart } from './viewerModel';

const part = (id: string) => {
  const found = findPart(id);
  if (!found) throw new Error(id);
  return found;
};

describe('colorKeyFor', () => {
  it('leaves everything steel in material mode', () => {
    expect(VIEWER_PARTS.every((candidate) => colorKeyFor(candidate, 'none') === 'steel')).toBe(true);
  });

  it('colours by run state', () => {
    expect(colorKeyFor(part('motor'), 'status')).toBe('success');
    expect(colorKeyFor(part('cooler'), 'status')).toBe('info');
    expect(colorKeyFor(part('antisurge'), 'status')).toBe('critical');
  });

  it('colours by health', () => {
    expect(colorKeyFor(part('motor'), 'health')).toBe('success');
    expect(colorKeyFor(part('compressor'), 'health')).toBe('warning');
    expect(colorKeyFor(part('antisurge'), 'health')).toBe('critical');
  });

  it('gives each system its own colour', () => {
    const keys = ['separator', 'compressor', 'cooler', 'suction-line', 'base-frame'].map((id) => colorKeyFor(part(id), 'system'));
    expect(new Set(keys).size).toBe(5);
  });
});

describe('legends', () => {
  it('has none in material mode and one entry per colour otherwise', () => {
    expect(legendFor('none')).toEqual([]);
    expect(legendFor('status').map((entry) => entry.label)).toEqual(['Running', 'Standby', 'Stopped', 'Tripped']);
    expect(legendFor('health')).toHaveLength(3);
    expect(legendFor('system')).toHaveLength(5);
  });

  it('lists only colours that are in use', () => {
    expect(legendInUse('status', VIEWER_PARTS).map((entry) => entry.label)).toEqual(['Running', 'Standby', 'Tripped']);
    expect(legendInUse('status', [part('motor')]).map((entry) => entry.label)).toEqual(['Running']);
  });

  it('maps every key to a token and a swatch class', () => {
    for (const key of Object.keys(COLOR_KEY_TOKENS) as (keyof typeof COLOR_KEY_TOKENS)[]) {
      expect(COLOR_KEY_TOKENS[key]).not.toBe('');
      expect(COLOR_KEY_BG[key]).toMatch(/^bg-/);
    }
  });

  it('names the modes and systems', () => {
    expect(COLOR_MODES.map((mode) => mode.value)).toEqual(['none', 'status', 'system', 'health']);
    expect(systemLabel('cooling')).toBe('Cooling and lube');
  });
});
