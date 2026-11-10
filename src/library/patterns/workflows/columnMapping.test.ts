import { duplicateTargets, mappingRowStatus, missingRequiredFields, normalizeHeader, suggestMapping } from './columnMapping';
import type { TargetField } from './columnMapping';

const FIELDS: readonly TargetField[] = [
  { id: 'tag', label: 'Tag', required: true, aliases: ['tag no', 'functional location'] },
  { id: 'description', label: 'Description', required: true },
  { id: 'unit', label: 'Unit' },
];

describe(normalizeHeader.name, () => {
  it('drops case, spacing and punctuation', () => {
    expect(normalizeHeader('Tag No.')).toBe('tagno');
    expect(normalizeHeader('tag_no')).toBe('tagno');
  });
});

describe(suggestMapping.name, () => {
  it('maps a column whose header matches a field label', () => {
    expect(suggestMapping(['Description'], FIELDS)).toEqual({ Description: 'description' });
  });

  it('maps a column through an alias', () => {
    expect(suggestMapping(['TAG_NO'], FIELDS)).toEqual({ TAG_NO: 'tag' });
  });

  it('leaves an unknown column unmapped', () => {
    expect(suggestMapping(['Comment'], FIELDS)).toEqual({ Comment: null });
  });

  it('gives a field to the first matching column only', () => {
    expect(suggestMapping(['Tag', 'Tag no'], FIELDS)).toEqual({ Tag: 'tag', 'Tag no': null });
  });
});

describe(missingRequiredFields.name, () => {
  it('lists required fields without a column', () => {
    const missing = missingRequiredFields({ TAG_NO: 'tag', Comment: null }, FIELDS);

    expect(missing.map((field) => field.id)).toEqual(['description']);
  });

  it('is empty when every required field is mapped', () => {
    expect(missingRequiredFields({ a: 'tag', b: 'description' }, FIELDS)).toEqual([]);
  });
});

describe(duplicateTargets.name, () => {
  it('lists fields mapped from more than one column', () => {
    expect(duplicateTargets({ a: 'tag', b: 'tag', c: 'unit', d: null, e: null })).toEqual(['tag']);
  });
});

describe(mappingRowStatus.name, () => {
  const suggested = { Tag: 'tag', Desc: null, Unit: 'unit', Extra: null };

  it('reports a kept suggestion as auto', () => {
    expect(mappingRowStatus('Tag', { ...suggested }, suggested)).toBe('auto');
  });

  it('reports a hand-picked field as manual', () => {
    expect(mappingRowStatus('Desc', { ...suggested, Desc: 'description' }, suggested)).toBe('manual');
  });

  it('reports a column without a field as skipped', () => {
    expect(mappingRowStatus('Extra', suggested, suggested)).toBe('skipped');
  });

  it('reports a field used twice as duplicate', () => {
    expect(mappingRowStatus('Extra', { ...suggested, Extra: 'unit' }, suggested)).toBe('duplicate');
  });
});
