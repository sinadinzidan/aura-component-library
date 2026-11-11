import { checkQuery, closestName, editDistance, runQuery } from './sqlEvaluator';
import { formatSql } from './sqlFormat';
import { parseSql } from './sqlParser';
import { tokenizeSql } from './sqlTokenizer';
import type { Database } from './sqlTypes';

const DB: Database = [
  {
    name: 'sensors',
    columns: [
      { name: 'tag', type: 'text' },
      { name: 'unit', type: 'text' },
      { name: 'value', type: 'number' },
      { name: 'high_limit', type: 'number' },
      { name: 'bad', type: 'boolean' },
    ],
    rows: [
      { tag: '23-PT-92531', unit: 'barg', value: 48.6, high_limit: 52, bad: false },
      { tag: '23-PT-92530', unit: 'barg', value: 12.4, high_limit: 15, bad: false },
      { tag: '23-TT-92532', unit: '°C', value: 141.2, high_limit: 145, bad: false },
      { tag: '40-TT-40015', unit: '°C', value: null, high_limit: 75, bad: true },
    ],
  },
  { name: 'empty_table', columns: [{ name: 'id', type: 'number' }], rows: [] },
];

const rowsOf = (sql: string) => {
  const result = runQuery(sql, DB);
  if (!result.ok) throw new Error(result.error.message);
  return result.rows;
};
const errorOf = (sql: string) => {
  const result = runQuery(sql, DB);
  if (result.ok) throw new Error('Expected an error');
  return result.error;
};

describe(tokenizeSql.name, () => {
  it('reads keywords, identifiers, strings, numbers and operators with positions', () => {
    const result = tokenizeSql("SELECT tag FROM sensors WHERE value >= 1.5 AND unit = 'barg'");
    if (!result.ok) throw new Error('should tokenize');

    const meaningful = result.tokens.filter((token) => token.type !== 'whitespace').map((token) => [token.type, token.text]);
    expect(meaningful).toEqual([
      ['keyword', 'SELECT'],
      ['identifier', 'tag'],
      ['keyword', 'FROM'],
      ['identifier', 'sensors'],
      ['keyword', 'WHERE'],
      ['identifier', 'value'],
      ['operator', '>='],
      ['number', '1.5'],
      ['keyword', 'AND'],
      ['identifier', 'unit'],
      ['operator', '='],
      ['string', "'barg'"],
    ]);
    expect(result.tokens[0]).toMatchObject({ start: 0, end: 6 });
  });

  it('treats keywords in any case as keywords', () => {
    const result = tokenizeSql('select 1');
    expect(result.ok && result.tokens[0].type).toBe('keyword');
  });

  it('keeps comments as tokens up to the end of the line', () => {
    const result = tokenizeSql('-- limits\nSELECT');
    expect(result.ok && result.tokens[0]).toMatchObject({ type: 'comment', text: '-- limits' });
  });

  it('reads an escaped quote inside a string', () => {
    const result = tokenizeSql("'it''s'");
    expect(result.ok && result.tokens[0].text).toBe("'it''s'");
  });

  it('reports an unclosed string at its opening quote', () => {
    expect(tokenizeSql("SELECT 'abc")).toEqual({ ok: false, error: expect.objectContaining({ start: 7, end: 11 }) });
  });

  it('reports a character it does not know', () => {
    expect(tokenizeSql('SELECT @x')).toEqual({ ok: false, error: { message: 'Unexpected character "@".', start: 7, end: 8 } });
  });

  it('rejects a number that runs into letters', () => {
    expect(tokenizeSql('LIMIT 5x').ok).toBe(false);
  });
});

describe(parseSql.name, () => {
  it('parses a full query', () => {
    const result = parseSql("SELECT tag, value FROM sensors WHERE unit = 'barg' ORDER BY value DESC, tag LIMIT 2;");
    if (!result.ok) throw new Error(result.error.message);

    expect(result.query.columns?.map((column) => column.name)).toEqual(['tag', 'value']);
    expect(result.query.table.name).toBe('sensors');
    expect(result.query.orderBy.map((term) => [term.column.name, term.direction])).toEqual([
      ['value', 'desc'],
      ['tag', 'asc'],
    ]);
    expect(result.query.limit?.value).toBe(2);
  });

  it('reads * as all columns', () => {
    const result = parseSql('SELECT * FROM sensors');
    expect(result.ok && result.query.columns).toBeNull();
  });

  it('gives AND higher precedence than OR', () => {
    const result = parseSql('SELECT * FROM t WHERE a = 1 OR b = 2 AND c = 3');
    expect(result.ok && result.query.where?.kind).toBe('or');
  });

  it('honours parentheses', () => {
    const result = parseSql('SELECT * FROM t WHERE (a = 1 OR b = 2) AND c = 3');
    expect(result.ok && result.query.where?.kind).toBe('and');
  });

  it('ignores comments', () => {
    expect(parseSql('-- all\nSELECT * FROM sensors -- done').ok).toBe(true);
  });

  it.each([
    ['', 'Expected SELECT at the start but found the end of the query.', 0],
    ['SELECT FROM sensors', 'Expected a column name or * but found "FROM".', 7],
    ['SELECT tag sensors', 'Expected FROM after the column list but found "sensors".', 11],
    ['SELECT tag FROM', 'Expected a table name but found the end of the query.', 15],
    ['SELECT tag FROM sensors WHERE value', 'Expected a comparison (=, <, >, LIKE, IS NULL) after "value" but found the end of the query.', 35],
    ['SELECT tag FROM sensors WHERE value >', 'Expected a column or a value but the query ends.', 37],
    ['SELECT tag FROM sensors LIMIT x', 'Expected a whole number after LIMIT but found "x".', 30],
    ['SELECT tag FROM sensors LIMIT 1.5', 'Expected a whole number after LIMIT but found "1.5".', 30],
    ['SELECT tag FROM sensors extra', 'Unexpected "extra". The query should end here.', 24],
    ['SELECT tag FROM sensors WHERE (value > 1', 'Expected ")" but found the end of the query.', 40],
    ['SELECT tag FROM sensors ORDER value', 'Expected BY after ORDER but found "value".', 24 + 6],
  ])('reports %j as "%s" at offset %i', (sql, message, start) => {
    const result = parseSql(sql);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ message, start });
  });
});

describe(runQuery.name, () => {
  it('selects columns in the order asked', () => {
    expect(rowsOf('SELECT unit, tag FROM sensors LIMIT 1')).toEqual([['barg', '23-PT-92531']]);
  });

  it('returns every column for *', () => {
    const result = runQuery('SELECT * FROM sensors LIMIT 1', DB);
    expect(result.ok && result.columns).toEqual(['tag', 'unit', 'value', 'high_limit', 'bad']);
  });

  it('is case insensitive about table and column names', () => {
    expect(rowsOf('select TAG from SENSORS limit 1')).toEqual([['23-PT-92531']]);
  });

  it('filters with equality on text', () => {
    expect(rowsOf("SELECT tag FROM sensors WHERE unit = '°C'")).toEqual([['23-TT-92532'], ['40-TT-40015']]);
  });

  it('filters with number comparisons', () => {
    expect(rowsOf('SELECT tag FROM sensors WHERE value > 40')).toEqual([['23-PT-92531'], ['23-TT-92532']]);
    expect(rowsOf('SELECT tag FROM sensors WHERE value <= 12.4')).toEqual([['23-PT-92530']]);
  });

  it('treats a missing value as matching no comparison', () => {
    expect(rowsOf('SELECT tag FROM sensors WHERE value < 1000')).toHaveLength(3);
  });

  it('supports != and <>', () => {
    expect(rowsOf("SELECT tag FROM sensors WHERE unit != 'barg'")).toHaveLength(2);
    expect(rowsOf("SELECT tag FROM sensors WHERE unit <> 'barg'")).toHaveLength(2);
  });

  it('combines conditions with AND, OR, NOT and parentheses', () => {
    expect(rowsOf("SELECT tag FROM sensors WHERE unit = 'barg' AND value > 20")).toEqual([['23-PT-92531']]);
    expect(rowsOf("SELECT tag FROM sensors WHERE value > 100 OR tag = '40-TT-40015'")).toEqual([['23-TT-92532'], ['40-TT-40015']]);
    expect(rowsOf("SELECT tag FROM sensors WHERE NOT unit = 'barg'")).toHaveLength(2);
    expect(rowsOf("SELECT tag FROM sensors WHERE (unit = 'barg' OR unit = '°C') AND value > 100")).toEqual([['23-TT-92532']]);
  });

  it('matches LIKE patterns', () => {
    expect(rowsOf("SELECT tag FROM sensors WHERE tag LIKE '23-PT%'")).toHaveLength(2);
    expect(rowsOf("SELECT tag FROM sensors WHERE tag LIKE '%-TT-%'")).toHaveLength(2);
    expect(rowsOf("SELECT tag FROM sensors WHERE tag LIKE '23-PT-9253_'")).toHaveLength(2);
  });

  it('does not let LIKE patterns inject regular expression syntax', () => {
    expect(rowsOf("SELECT tag FROM sensors WHERE tag LIKE '(.*)'")).toEqual([]);
  });

  it('supports IS NULL and IS NOT NULL', () => {
    expect(rowsOf('SELECT tag FROM sensors WHERE value IS NULL')).toEqual([['40-TT-40015']]);
    expect(rowsOf('SELECT tag FROM sensors WHERE value IS NOT NULL')).toHaveLength(3);
  });

  it('compares booleans', () => {
    expect(rowsOf('SELECT tag FROM sensors WHERE bad = TRUE')).toEqual([['40-TT-40015']]);
  });

  it('sorts ascending with missing values last', () => {
    expect(rowsOf('SELECT tag FROM sensors ORDER BY value')).toEqual([['23-PT-92530'], ['23-PT-92531'], ['23-TT-92532'], ['40-TT-40015']]);
  });

  it('sorts descending with missing values first, as SQL databases do', () => {
    expect(rowsOf('SELECT tag FROM sensors ORDER BY value DESC')).toEqual([['40-TT-40015'], ['23-TT-92532'], ['23-PT-92531'], ['23-PT-92530']]);
  });

  it('sorts by several columns', () => {
    expect(rowsOf('SELECT tag FROM sensors ORDER BY unit, value DESC')).toEqual([['23-PT-92531'], ['23-PT-92530'], ['40-TT-40015'], ['23-TT-92532']]);
  });

  it('limits the rows after sorting', () => {
    expect(rowsOf('SELECT tag FROM sensors ORDER BY value DESC LIMIT 2')).toHaveLength(2);
    expect(rowsOf('SELECT tag FROM sensors LIMIT 0')).toEqual([]);
  });

  it('returns the row count', () => {
    const result = runQuery("SELECT tag FROM sensors WHERE unit = 'barg'", DB);
    expect(result.ok && result.rowCount).toBe(2);
  });

  it('returns no rows for an empty table without failing', () => {
    expect(runQuery('SELECT * FROM empty_table', DB)).toMatchObject({ ok: true, rowCount: 0 });
  });

  it('names an unknown table, suggests the closest, and points at it', () => {
    const error = errorOf('SELECT tag FROM sensor');
    expect(error.message).toBe('Table "sensor" does not exist. Did you mean sensors?');
    expect([error.start, error.end]).toEqual([16, 22]);
  });

  it('lists the tables when nothing is close', () => {
    expect(errorOf('SELECT * FROM xyz').message).toBe('Table "xyz" does not exist. Available: sensors, empty_table.');
  });

  it('names an unknown column and points at it', () => {
    const error = errorOf('SELECT tag, valu FROM sensors');
    expect(error.message).toBe('Column "valu" does not exist in sensors. Did you mean value?');
    expect(error.start).toBe(12);
  });

  it('finds an unknown column in WHERE and ORDER BY', () => {
    expect(errorOf('SELECT tag FROM sensors WHERE nope = 1').start).toBe(30);
    expect(errorOf('SELECT tag FROM sensors ORDER BY nope').start).toBe(33);
  });

  it('reports a mistake in the conditions even when the table is empty', () => {
    expect(errorOf("SELECT * FROM empty_table WHERE id = 'x'").message).toBe('Cannot compare number with text. Quote text values and leave numbers bare.');
  });

  it('refuses to compare text with a number', () => {
    const error = errorOf('SELECT tag FROM sensors WHERE unit > 5');
    expect(error.message).toBe('Cannot compare text with number. Quote text values and leave numbers bare.');
    expect([error.start, error.end]).toEqual([30, 38]);
  });

  it('refuses LIKE on numbers', () => {
    expect(errorOf("SELECT tag FROM sensors WHERE value LIKE '4%'").message).toBe('LIKE compares text with text.');
  });

  it('returns syntax errors as results rather than throwing', () => {
    expect(runQuery('SELECT', DB)).toMatchObject({ ok: false });
  });
});

describe(checkQuery.name, () => {
  it('finds name problems without reading rows', () => {
    const parsed = parseSql('SELECT nope FROM sensors');
    if (!parsed.ok) throw new Error('should parse');
    expect(checkQuery(parsed.query, DB)?.message).toContain('nope');
  });

  it('returns null for a valid query', () => {
    const parsed = parseSql('SELECT tag FROM sensors');
    if (!parsed.ok) throw new Error('should parse');
    expect(checkQuery(parsed.query, DB)).toBeNull();
  });
});

describe('name suggestions', () => {
  it('measures edit distance', () => {
    expect(editDistance('sensor', 'sensors')).toBe(1);
    expect(editDistance('abc', 'abc')).toBe(0);
    expect(editDistance('', 'abc')).toBe(3);
  });

  it('suggests only close names', () => {
    expect(closestName('alarm', ['alarms', 'assets'])).toBe('alarms');
    expect(closestName('zzzzzz', ['alarms', 'assets'])).toBeNull();
  });
});

describe(formatSql.name, () => {
  it('puts each clause on its own line and upper-cases keywords', () => {
    expect(formatSql("select tag,value from sensors where unit='barg' order by value desc limit 5")).toBe(
      "SELECT tag, value\nFROM sensors\nWHERE unit = 'barg'\nORDER BY value DESC\nLIMIT 5"
    );
  });

  it('indents AND and OR under WHERE', () => {
    expect(formatSql("SELECT * FROM sensors WHERE a = 1 AND b > 2 OR c = 'x'")).toBe("SELECT *\nFROM sensors\nWHERE a = 1\n  AND b > 2\n  OR c = 'x'");
  });

  it('keeps AND inside parentheses on the same line', () => {
    expect(formatSql('SELECT * FROM t WHERE (a = 1 AND b = 2)')).toBe('SELECT *\nFROM t\nWHERE (a = 1 AND b = 2)');
  });

  it('puts a long column list one column per line', () => {
    const columns = Array.from({ length: 9 }, (_, index) => `column_number_${index}`).join(', ');
    const formatted = formatSql(`SELECT ${columns} FROM t`);
    expect(formatted.split('\n').slice(0, 3)).toEqual(['SELECT', '  column_number_0,', '  column_number_1,']);
  });

  it('keeps comments on their own lines', () => {
    expect(formatSql('-- hot tags\nselect * from sensors')).toBe('-- hot tags\nSELECT *\nFROM sensors');
  });

  it('returns text it cannot read unchanged', () => {
    expect(formatSql("select 'open")).toBe("select 'open");
  });

  it('is idempotent', () => {
    const once = formatSql("select tag from sensors where unit='barg' and value>1 order by tag");
    expect(formatSql(once)).toBe(once);
  });

  it('produces a query that returns the same rows', () => {
    const sql = "select tag from sensors where unit='barg' or value>100 order by tag";
    expect(runQuery(formatSql(sql), DB)).toEqual(runQuery(sql, DB));
  });
});
