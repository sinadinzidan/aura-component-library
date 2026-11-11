import { describe, expect, it } from 'vitest';

import { COMPRESSION_LINKS } from '../../three/fields/compressionArea';
import { tagRefs } from '../../tools/pid/pidModel';

import { COMPRESSION_SHEET, COMPRESSION_SHEET_ALARMS, COMPRESSION_SHEET_READINGS, pinsForTags, sheetElementOfTag, sheetTags, tagOfSheetElement } from './compressionSheet';

describe('compressionSheet', () => {
  it('draws every tag the link table says is on the drawing, under the same id', () => {
    for (const link of COMPRESSION_LINKS) {
      expect(sheetElementOfTag(COMPRESSION_SHEET, link.tag), link.tag).toBe(link.drawingId);
    }
  });

  it('lists the sheet tags in drawing order', () => {
    expect(sheetTags(COMPRESSION_SHEET)).toEqual(['23-XV-9111', '23-VA-9120', '23-KA-9101', '23-HA-9114', '23-KA-9102', '23-HV-9162']);
  });

  it('resolves an element to its functional location tag', () => {
    expect(tagOfSheetElement(COMPRESSION_SHEET, 'S-103')).toBe('23-KA-9101');
    expect(tagOfSheetElement(COMPRESSION_SHEET, 'S-106')).toBe('23-HV-9162');
    expect(tagOfSheetElement(COMPRESSION_SHEET, 'pt-92531')).toBe('23-KA-9101');
    expect(tagOfSheetElement(COMPRESSION_SHEET, 'tt-91141')).toBe('23-HA-9114');
    expect(tagOfSheetElement(COMPRESSION_SHEET, 'nope')).toBeNull();
  });

  it('keeps every element inside the sheet', () => {
    for (const ref of tagRefs(COMPRESSION_SHEET)) {
      expect(ref.bounds.x, ref.tag).toBeGreaterThanOrEqual(0);
      expect(ref.bounds.y, ref.tag).toBeGreaterThanOrEqual(0);
      expect(ref.bounds.x + ref.bounds.width, ref.tag).toBeLessThanOrEqual(COMPRESSION_SHEET.width);
      expect(ref.bounds.y + ref.bounds.height, ref.tag).toBeLessThanOrEqual(COMPRESSION_SHEET.height);
    }
    for (const line of COMPRESSION_SHEET.lines) {
      for (const point of line.points) {
        expect(point.x).toBeLessThanOrEqual(COMPRESSION_SHEET.width);
        expect(point.y).toBeLessThanOrEqual(COMPRESSION_SHEET.height);
      }
    }
  });

  it('has a reading and limits for every instrument, and alarms that point at real elements', () => {
    for (const instrument of COMPRESSION_SHEET.instruments) {
      expect(COMPRESSION_SHEET_READINGS[instrument.id], instrument.tag).toBeTypeOf('number');
    }
    const ids = tagRefs(COMPRESSION_SHEET).map((ref) => ref.id);
    for (const alarm of COMPRESSION_SHEET_ALARMS) expect(ids).toContain(alarm.tagId);
  });

  it('pins the tags it is given and skips the ones the sheet does not show', () => {
    const pins = pinsForTags(COMPRESSION_SHEET, ['23-HV-9162', '23-GT-9001', '23-KA-9102'], 'Not in the 3D model');
    expect(pins.map((pin) => pin.id)).toEqual(['pin-1', 'pin-3']);
    expect(pins[0]).toMatchObject({ x: 276, y: 34, note: 'Not in the 3D model' });
  });
});
