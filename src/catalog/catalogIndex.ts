import rawIndex from 'virtual:catalog-index';

export type IndexedSpecimen = { id: string; title: string; note: string; origin: string };
export type IndexedSection = { id: string; title: string; specimens: IndexedSpecimen[] };
export type IndexedPage = { area: string; id: string; title: string; sections: IndexedSection[] };

export type SearchHit =
  | { kind: 'page'; pageId: string; title: string; detail: string }
  | { kind: 'specimen'; pageId: string; specimenId: string; title: string; detail: string };

export type CatalogIndex = {
  pages: readonly IndexedPage[];
  specimenCount: (pageId: string) => number;
  totalSpecimens: number;
  search: (query: string, limit: number) => SearchHit[];
};

function matches(haystack: string, terms: readonly string[]): boolean {
  const lower = haystack.toLowerCase();
  return terms.every((term) => lower.includes(term));
}

export function createCatalogIndex(pages: readonly IndexedPage[]): CatalogIndex {
  const counts = new Map(
    pages.map((page) => [page.id, page.sections.reduce((sum, section) => sum + section.specimens.length, 0)])
  );
  const totalSpecimens = [...counts.values()].reduce((sum, count) => sum + count, 0);

  return {
    pages,
    specimenCount: (pageId) => counts.get(pageId) ?? 0,
    totalSpecimens,
    search: (query, limit) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length === 0) return [];
      const hits: SearchHit[] = [];
      for (const page of pages) {
        if (matches(page.title, terms)) {
          hits.push({ kind: 'page', pageId: page.id, title: page.title, detail: `${counts.get(page.id) ?? 0} variants` });
        }
      }
      for (const page of pages) {
        for (const section of page.sections) {
          for (const specimen of section.specimens) {
            if (hits.length >= limit) return hits;
            if (matches(`${page.title} ${specimen.title} ${specimen.note}`, terms)) {
              hits.push({
                kind: 'specimen',
                pageId: page.id,
                specimenId: specimen.id,
                title: specimen.title,
                detail: `${page.title} · ${section.title}`,
              });
            }
          }
        }
      }
      return hits.slice(0, limit);
    },
  };
}

export const catalogIndex: CatalogIndex = createCatalogIndex(rawIndex);
