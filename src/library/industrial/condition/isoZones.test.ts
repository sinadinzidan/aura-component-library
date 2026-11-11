import { ISO_10816_3, ISO_ZONES, ISO_ZONE_MEANING, ISO_ZONE_TONE, isoZone, isoZoneBands } from './isoZones';

const boundaries = ISO_10816_3.group1Rigid;

describe('isoZone', () => {
  it.each([
    [1, 'A'],
    [2.3, 'A'],
    [3, 'B'],
    [4.5, 'B'],
    [6, 'C'],
    [7.1, 'C'],
    [7.2, 'D'],
  ])('puts %s mm/s in zone %s', (value, zone) => {
    expect(isoZone(value, boundaries)).toBe(zone);
  });
});

describe('isoZoneBands', () => {
  it('covers 0 to the maximum without gaps', () => {
    const bands = isoZoneBands(boundaries, 12);
    expect(bands.map((band) => band.zone)).toEqual(['A', 'B', 'C', 'D']);
    expect(bands[0].from).toBe(0);
    expect(bands[3].to).toBe(12);
    bands.slice(1).forEach((band, index) => expect(band.from).toBe(bands[index].to));
  });

  it('leaves out zones above the maximum', () => {
    expect(isoZoneBands(boundaries, 5).map((band) => band.zone)).toEqual(['A', 'B', 'C']);
  });
});

describe('zone vocabulary', () => {
  it('judges only C and D', () => {
    expect(ISO_ZONES.map((zone) => ISO_ZONE_TONE[zone])).toEqual(['neutral', 'neutral', 'warning', 'critical']);
    expect(ISO_ZONES.every((zone) => ISO_ZONE_MEANING[zone].length > 0)).toBe(true);
  });
});
