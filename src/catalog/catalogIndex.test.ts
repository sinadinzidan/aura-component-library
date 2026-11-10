import { createCatalogIndex, type IndexedPage } from './catalogIndex';

const PAGES: IndexedPage[] = [
  {
    area: 'primitives',
    id: 'button',
    title: 'Button',
    sections: [
      {
        id: 'emphasis',
        title: 'Emphasis',
        specimens: [
          { id: 'ButtonPrimary', title: 'Primary', note: 'The main action on a view.', origin: 'aura' },
          { id: 'ButtonSplit', title: 'Split button', note: 'A default action plus related ones.', origin: 'custom' },
        ],
      },
    ],
  },
  {
    area: 'industrial',
    id: 'kpi-tiles',
    title: 'KPI tiles',
    sections: [
      {
        id: 'basic',
        title: 'Basic',
        specimens: [{ id: 'KpiPlain', title: 'Plain value', note: 'One number with its unit.', origin: 'custom' }],
      },
    ],
  },
];

describe(createCatalogIndex.name, () => {
  const index = createCatalogIndex(PAGES);

  it('counts specimens per page and in total', () => {
    expect(index.specimenCount('button')).toBe(2);
    expect(index.specimenCount('unknown')).toBe(0);
    expect(index.totalSpecimens).toBe(3);
  });

  it('returns nothing for a blank query', () => {
    expect(index.search('   ', 10)).toEqual([]);
  });

  it('lists matching pages before matching specimens', () => {
    const hits = index.search('button', 10);

    expect(hits[0]).toMatchObject({ kind: 'page', pageId: 'button' });
    expect(hits.slice(1).every((hit) => hit.kind === 'specimen')).toBe(true);
  });

  it('matches specimens on title and note, case-insensitively', () => {
    expect(index.search('SPLIT', 10)).toEqual([
      expect.objectContaining({ kind: 'specimen', specimenId: 'ButtonSplit', detail: 'Button · Emphasis' }),
    ]);
    expect(index.search('unit', 10)).toEqual([expect.objectContaining({ specimenId: 'KpiPlain' })]);
  });

  it('requires every term to match', () => {
    expect(index.search('button unit', 10)).toEqual([]);
  });

  it('respects the limit', () => {
    expect(index.search('button', 2)).toHaveLength(2);
  });
});
