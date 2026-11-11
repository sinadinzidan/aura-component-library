import { COMPRESSION_DRAWING, COMPRESSION_INFO, COMPRESSION_LINKS, COMPRESSION_PIPES, COMPRESSION_SCENE, drawingItemFor, drawingTags, sceneItemFor, sceneTags } from './compressionArea';
import { diffTagSets } from './modelCheck';
import { counterpartId, idsOn, mappingProblems, tagsOn } from './tagMapping';

describe('the mapping table', () => {
  it('has no duplicate tags or ids and no empty rows', () => {
    expect(mappingProblems(COMPRESSION_LINKS)).toEqual([]);
  });

  it('lists exactly the ids the drawing uses', () => {
    expect(idsOn(COMPRESSION_LINKS, 'drawing').sort()).toEqual(COMPRESSION_DRAWING.map((item) => item.id).sort());
  });

  it('lists exactly the ids the model uses', () => {
    expect(idsOn(COMPRESSION_LINKS, 'scene').sort()).toEqual(COMPRESSION_SCENE.map((item) => item.id).sort());
  });

  it('agrees with the tags on each item', () => {
    for (const item of COMPRESSION_DRAWING) expect(tagsOn(COMPRESSION_LINKS, 'drawing')).toContain(item.tag);
    for (const item of COMPRESSION_SCENE) expect(tagsOn(COMPRESSION_LINKS, 'scene')).toContain(item.tag);
  });

  it('maps each drawing symbol to the model object with the same tag', () => {
    for (const item of COMPRESSION_DRAWING) {
      const sceneId = counterpartId(COMPRESSION_LINKS, item.id, 'drawing');
      const scene = COMPRESSION_SCENE.find((candidate) => candidate.id === sceneId);

      if (item.tag === '23-HV-9162') expect(scene).toBeUndefined();
      else expect(scene?.tag).toBe(item.tag);
    }
  });

  it('describes every tag', () => {
    for (const link of COMPRESSION_LINKS) expect(COMPRESSION_INFO[link.tag]).toBeDefined();
  });
});

describe('the model check on this area', () => {
  const diff = diffTagSets(drawingTags(), sceneTags());

  it('finds a valve on the drawing that is not in the model', () => {
    expect(diff.drawingOnly).toEqual(['23-HV-9162']);
  });

  it('finds a valve in the model that is not on the drawing, and the turbine', () => {
    expect(diff.modelOnly).toEqual(['23-GT-9001', '23-XV-9171']);
  });

  it('matches the five machines and valves both sides have', () => {
    expect(diff.matched).toHaveLength(5);
  });
});

describe('the scene layout', () => {
  it('keeps every object clear of the others on the plan', () => {
    for (let a = 0; a < COMPRESSION_SCENE.length; a += 1) {
      for (let b = a + 1; b < COMPRESSION_SCENE.length; b += 1) {
        const distance = Math.hypot(COMPRESSION_SCENE[a].position[0] - COMPRESSION_SCENE[b].position[0], COMPRESSION_SCENE[a].position[2] - COMPRESSION_SCENE[b].position[2]);

        expect(distance).toBeGreaterThan(5);
      }
    }
  });

  it('has pipework with at least two points each', () => {
    for (const pipe of COMPRESSION_PIPES) expect(pipe.length).toBeGreaterThanOrEqual(2);
  });

  it('looks items up by tag on either side', () => {
    expect(drawingItemFor('23-KA-9101')?.id).toBe('S-103');
    expect(sceneItemFor('23-KA-9101')?.id).toBe('N-4103');
    expect(drawingItemFor('23-GT-9001')).toBeNull();
    expect(sceneItemFor('23-HV-9162')).toBeNull();
    expect(sceneItemFor(null)).toBeNull();
  });
});

describe('the drawing layout', () => {
  it('reads left to right along one line', () => {
    const line = COMPRESSION_DRAWING.filter((item) => item.cy === 170).map((item) => item.cx);

    expect(line).toEqual([...line].sort((a, b) => a - b));
  });
});
