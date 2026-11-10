import { parseFilterQuery } from './parseFilterQuery';
import type { FilterTerm } from './parseFilterQuery';

const VOCABULARY: readonly FilterTerm[] = [
  { property: 'Severity', value: 'Critical', phrases: ['critical'] },
  { property: 'Severity', value: 'High', phrases: ['high'] },
  { property: 'Area', value: 'Gas compression', phrases: ['gas compression', 'compression'] },
  { property: 'Period', value: 'Last 24 hours', phrases: ['last 24 hours', 'today'] },
  { property: 'State', value: 'Active', phrases: ['active', 'open'] },
];

describe(parseFilterQuery.name, () => {
  it('turns known phrases into filters in the order they were written', () => {
    const result = parseFilterQuery('active critical alarms in gas compression', VOCABULARY);

    expect(result.filters.map((filter) => `${filter.property}: ${filter.value}`)).toEqual([
      'State: Active',
      'Severity: Critical',
      'Area: Gas compression',
    ]);
  });

  it('keeps what it did not understand as free text', () => {
    expect(parseFilterQuery('critical alarms on the recompressor today', VOCABULARY).rest).toBe('alarms on the recompressor');
  });

  it('prefers the longest phrase', () => {
    const result = parseFilterQuery('gas compression', VOCABULARY);

    expect(result.filters).toEqual([{ property: 'Area', value: 'Gas compression', matched: 'gas compression' }]);
    expect(result.rest).toBe('');
  });

  it('ignores case and reports the text as typed', () => {
    expect(parseFilterQuery('CRITICAL Today', VOCABULARY).filters).toEqual([
      { property: 'Severity', value: 'Critical', matched: 'CRITICAL' },
      { property: 'Period', value: 'Last 24 hours', matched: 'Today' },
    ]);
  });

  it('applies each property once', () => {
    const result = parseFilterQuery('critical and high alarms', VOCABULARY);

    expect(result.filters).toHaveLength(1);
    expect(result.filters[0].value).toBe('Critical');
    expect(result.rest).toBe('and high alarms');
  });

  it('matches whole words only', () => {
    expect(parseFilterQuery('highlight reopened items', VOCABULARY)).toEqual({ filters: [], rest: 'highlight reopened items' });
  });

  it('returns nothing for an empty query or vocabulary', () => {
    expect(parseFilterQuery('   ', VOCABULARY)).toEqual({ filters: [], rest: '' });
    expect(parseFilterQuery('critical', [])).toEqual({ filters: [], rest: 'critical' });
  });

  it('treats special characters in phrases literally', () => {
    const result = parseFilterQuery('show p&id (pdf) files', [{ property: 'Type', value: 'P&ID', phrases: ['p&id (pdf)'] }]);

    expect(result.filters[0].value).toBe('P&ID');
    expect(result.rest).toBe('show files');
  });
});
