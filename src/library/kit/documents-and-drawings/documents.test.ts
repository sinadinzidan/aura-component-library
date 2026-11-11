import { countByApproval, filterDocuments, stepZoom, type DocumentRecord } from './documents';

const DOCS: DocumentRecord[] = [
  { id: 'NK-23-PID-0103', kind: 'pid', title: 'Gas compression, recompressor', revision: 'D', date: '4 Feb 2026', approval: 'approved', pages: 1 },
  { id: 'NK-23-PR-0012', kind: 'procedure', title: 'Compressor start-up procedure', revision: '05', date: '12 Jan 2026', approval: 'in-review', pages: 14 },
  { id: 'NK-23-DS-9103', kind: 'datasheet', title: 'Recompressor data sheet', revision: 'B', date: '3 Jun 2024', approval: 'approved', pages: 6 },
];

describe('document helpers', () => {
  it('filters by kind', () => {
    expect(filterDocuments(DOCS, { kind: 'pid' }).map((document) => document.id)).toEqual(['NK-23-PID-0103']);
    expect(filterDocuments(DOCS, { kind: 'all' })).toHaveLength(3);
  });

  it('matches the query against number and title, ignoring case', () => {
    expect(filterDocuments(DOCS, { query: 'recompressor' })).toHaveLength(2);
    expect(filterDocuments(DOCS, { query: ' pr-0012 ' }).map((document) => document.id)).toEqual(['NK-23-PR-0012']);
    expect(filterDocuments(DOCS, { kind: 'pid', query: 'data sheet' })).toEqual([]);
  });

  it('counts documents per approval state', () => {
    expect(countByApproval(DOCS)).toEqual({ draft: 0, 'in-review': 1, approved: 2, superseded: 0 });
  });

  it('steps zoom inside its range', () => {
    expect(stepZoom(100, 1)).toBe(125);
    expect(stepZoom(400, 1)).toBe(400);
    expect(stepZoom(100, -1, { min: 100 })).toBe(100);
    expect(stepZoom(100, 1, { step: 50 })).toBe(150);
  });
});
