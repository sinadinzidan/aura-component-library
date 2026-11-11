import { counterpartId, idForTag, idsOn, linkForTag, mappingProblems, tagForId, tagsOn } from './tagMapping';
import type { TagLink } from './tagMapping';

const LINKS: TagLink[] = [
  { tag: '23-KA-9101', drawingId: 'd-ka-9101', sceneId: 's-ka-9101' },
  { tag: '23-HA-9114', drawingId: 'd-ha-9114', sceneId: 's-ha-9114' },
  { tag: '23-HV-9162', drawingId: 'd-hv-9162', sceneId: null },
  { tag: '23-XV-9171', drawingId: null, sceneId: 's-xv-9171' },
];

describe(linkForTag.name, () => {
  it('finds the row for a tag', () => {
    expect(linkForTag(LINKS, '23-HA-9114')?.sceneId).toBe('s-ha-9114');
  });

  it('returns null for an unknown tag or no tag', () => {
    expect(linkForTag(LINKS, '99-XX-0000')).toBeNull();
    expect(linkForTag(LINKS, null)).toBeNull();
  });
});

describe(idForTag.name, () => {
  it('returns the id on each side', () => {
    expect(idForTag(LINKS, '23-KA-9101', 'drawing')).toBe('d-ka-9101');
    expect(idForTag(LINKS, '23-KA-9101', 'scene')).toBe('s-ka-9101');
  });

  it('returns null where the item is missing', () => {
    expect(idForTag(LINKS, '23-HV-9162', 'scene')).toBeNull();
    expect(idForTag(LINKS, '23-XV-9171', 'drawing')).toBeNull();
  });
});

describe(tagForId.name, () => {
  it('resolves an id on its own side only', () => {
    expect(tagForId(LINKS, 's-ha-9114', 'scene')).toBe('23-HA-9114');
    expect(tagForId(LINKS, 's-ha-9114', 'drawing')).toBeNull();
  });

  it('returns null for no id', () => {
    expect(tagForId(LINKS, null, 'scene')).toBeNull();
  });
});

describe(counterpartId.name, () => {
  it('crosses from the drawing to the scene and back', () => {
    expect(counterpartId(LINKS, 'd-ka-9101', 'drawing')).toBe('s-ka-9101');
    expect(counterpartId(LINKS, 's-ka-9101', 'scene')).toBe('d-ka-9101');
  });

  it('returns null when the other side does not have the item', () => {
    expect(counterpartId(LINKS, 'd-hv-9162', 'drawing')).toBeNull();
    expect(counterpartId(LINKS, 's-xv-9171', 'scene')).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(counterpartId(LINKS, 'nope', 'drawing')).toBeNull();
  });
});

describe('side listings', () => {
  it('lists the tags present on a side', () => {
    expect(tagsOn(LINKS, 'drawing')).toEqual(['23-KA-9101', '23-HA-9114', '23-HV-9162']);
    expect(tagsOn(LINKS, 'scene')).toEqual(['23-KA-9101', '23-HA-9114', '23-XV-9171']);
  });

  it('lists the ids present on a side', () => {
    expect(idsOn(LINKS, 'scene')).toEqual(['s-ka-9101', 's-ha-9114', 's-xv-9171']);
  });
});

describe(mappingProblems.name, () => {
  it('finds nothing wrong with a clean table', () => {
    expect(mappingProblems(LINKS)).toEqual([]);
  });

  it('reports duplicate tags and ids', () => {
    const broken: TagLink[] = [...LINKS, { tag: '23-KA-9101', drawingId: 'd-ha-9114', sceneId: 's-xv-9171' }];

    expect(mappingProblems(broken)).toEqual(['Tag 23-KA-9101 is listed twice', 'Drawing id d-ha-9114 is mapped twice', 'Scene id s-xv-9171 is mapped twice']);
  });

  it('reports a row that is on neither side', () => {
    expect(mappingProblems([{ tag: '23-ZZ-0001', drawingId: null, sceneId: null }])).toEqual(['Tag 23-ZZ-0001 is on neither side']);
  });
});
