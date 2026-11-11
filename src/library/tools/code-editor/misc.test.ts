import { diffLines, diffSummary } from './diffLines';
import { EXPRESSION_FUNCTIONS, evaluateExpression } from './expression';
import { checkJson, lineColumn, minifyJson, prettyJson } from './jsonTools';

describe(checkJson.name, () => {
  it.each(['{}', '[]', '{"a":1}', '[1, 2.5, -3, 1e3, true, false, null, "x"]', '{"a":{"b":[{"c":"\\u00e5\\n"}]}}', '  "text"  ', '0'])('accepts %s', (text) => {
    expect(checkJson(text).ok).toBe(true);
  });

  it('returns the parsed value', () => {
    expect(checkJson('{"limit": 52, "unit": "barg"}')).toEqual({ ok: true, value: { limit: 52, unit: 'barg' } });
  });

  it.each([
    ['{"a":1,}', 'A trailing comma is not allowed in JSON.', 6],
    ['[1,2,]', 'A trailing comma is not allowed in JSON.', 4],
    ["{'a':1}", 'Expected a property name in quotes but found "\'".', 1],
    ['{"a" 1}', 'Expected ":" after the property name but found "1".', 5],
    ['{"a":1 "b":2}', 'Expected "," or "}" after the property value but found """.', 7],
    ['[1 2]', 'Expected "," or "]" after the item but found "2".', 3],
    ['{"a":', 'Expected a value but found the end of the text.', 5],
    ['{"a":"x', 'This string is not closed. Add a closing quote.', 5],
    ['{"a":nul}', 'Expected a value but found "n".', 5],
    ['{} {}', 'Unexpected "{" after the value.', 3],
    ['"a\\qb"', '"\\q" is not a valid escape.', 2],
    ['"\\u12"', 'A \\u escape needs four hex digits.', 1],
    ['', 'Expected a value but found the end of the text.', 0],
    ['{"a":01}', 'Expected "," or "}" after the property value but found "1".', 6],
    ["[ 'x' ]", 'Use double quotes. JSON does not allow single quotes.', 2],
  ])('reports %j as "%s" at offset %i', (text, message, offset) => {
    const result = checkJson(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatchObject({ message, offset });
  });

  it('points a trailing comma at the comma even when white space follows it', () => {
    const result = checkJson('[\n  1,\n]');
    expect(result.ok === false && result.error).toMatchObject({ offset: 5, line: 2, column: 4 });
  });

  it('reports line and column', () => {
    const result = checkJson('{\n  "a": 1,\n  "b": ,\n}');
    expect(result.ok === false && result.error).toMatchObject({ line: 3, column: 8 });
  });
});

describe('json formatting', () => {
  it('pretty prints valid JSON with two spaces', () => {
    expect(prettyJson('{"a":[1,2],"b":{"c":null}}')).toBe('{\n  "a": [\n    1,\n    2\n  ],\n  "b": {\n    "c": null\n  }\n}');
  });

  it('minifies valid JSON', () => {
    expect(minifyJson('{ "a": [ 1, 2 ] }')).toBe('{"a":[1,2]}');
  });

  it('leaves invalid JSON untouched', () => {
    expect(prettyJson('{"a":')).toBe('{"a":');
    expect(minifyJson('{"a":')).toBe('{"a":');
  });

  it('computes line and column from an offset', () => {
    expect(lineColumn('ab\ncd', 4)).toEqual({ line: 2, column: 2 });
    expect(lineColumn('ab', 99)).toEqual({ line: 1, column: 3 });
  });
});

describe(evaluateExpression.name, () => {
  const inputs = { discharge: 48.6, suction: 12.4, flow: 182400, speed: 0 };
  const value = (text: string) => {
    const result = evaluateExpression(text, inputs);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };
  const error = (text: string) => {
    const result = evaluateExpression(text, inputs);
    if (result.ok) throw new Error('Expected an error');
    return result.error;
  };

  it('follows operator precedence', () => {
    expect(value('2 + 3 * 4')).toBe(14);
    expect(value('(2 + 3) * 4')).toBe(20);
    expect(value('10 - 4 - 3')).toBe(3);
    expect(value('100 / 10 / 2')).toBe(5);
  });

  it('supports unary minus', () => {
    expect(value('-3 + 5')).toBe(2);
    expect(value('--3')).toBe(3);
  });

  it('reads named inputs', () => {
    expect(value('discharge - suction')).toBeCloseTo(36.2);
    expect(value('discharge / suction')).toBeCloseTo(3.919, 3);
  });

  it('calls functions', () => {
    expect(value('abs(-4)')).toBe(4);
    expect(value('sqrt(16)')).toBe(4);
    expect(value('round(discharge / suction, 2)')).toBe(3.92);
    expect(value('max(1, 5, 3)')).toBe(5);
    expect(value('min(4, 2)')).toBe(2);
    expect(value('avg(2, 4, 9)')).toBe(5);
  });

  it('compares and branches', () => {
    expect(value('if(suction > 10, 1, 0)')).toBe(1);
    expect(value('if(flow < 100000, flow, 0)')).toBe(0);
    expect(value('3 == 3')).toBe(1);
    expect(value('3 != 3')).toBe(0);
  });

  it('accepts decimals and exponents', () => {
    expect(value('.5 + 1.5e1')).toBe(15.5);
  });

  it('names an unknown input, lists what exists, and points at it', () => {
    expect(error('discharge - suctio')).toMatchObject({ message: 'Unknown input "suctio". Available: discharge, suction, flow, speed.', start: 12, end: 18 });
  });

  it('names an unknown function', () => {
    expect(error('median(1, 2)').message).toContain('Unknown function "median"');
  });

  it('checks argument counts', () => {
    expect(error('abs(1, 2)').message).toBe('abs takes 1 value but got 2.');
    expect(error('max()').message).toBe('max needs at least one value.');
  });

  it('reports division by zero at the slash', () => {
    expect(error('flow / speed')).toMatchObject({ message: 'Division by zero.', start: 5 });
  });

  it('reports a missing parenthesis', () => {
    expect(error('(1 + 2').message).toBe('Expected ")" but found the end of the expression.');
  });

  it('reports a missing operand', () => {
    expect(error('1 +').message).toBe('Expected a number, an input or "(" but found the end of the expression.');
  });

  it('reports leftovers', () => {
    expect(error('1 2')).toMatchObject({ message: 'Unexpected "2". The expression should end here.', start: 2 });
  });

  it('reports a character it does not know', () => {
    expect(error('1 # 2')).toMatchObject({ message: 'Unexpected character "#".', start: 2 });
  });

  it('asks for an expression when empty', () => {
    expect(error('   ').message).toBe('Enter an expression.');
  });

  it('refuses results that are not numbers', () => {
    expect(error('sqrt(-1)').message).toBe('The result is not a number.');
  });

  it('lists its functions', () => {
    expect(Object.keys(EXPRESSION_FUNCTIONS)).toEqual(['abs', 'sqrt', 'round', 'min', 'max', 'avg', 'if']);
  });
});

describe(diffLines.name, () => {
  it('marks added and removed lines', () => {
    const lines = diffLines('SELECT *\nFROM sensors\nLIMIT 5', 'SELECT *\nFROM sensors\nWHERE value > 40\nLIMIT 5');
    expect(lines.map((line) => `${line.type}:${line.text}`)).toEqual(['same:SELECT *', 'same:FROM sensors', 'add:WHERE value > 40', 'same:LIMIT 5']);
  });

  it('shows a change as a removal then an addition', () => {
    const lines = diffLines('a\nb\nc', 'a\nB\nc');
    expect(lines.map((line) => line.type)).toEqual(['same', 'add', 'remove', 'same']);
  });

  it('numbers lines on both sides', () => {
    const lines = diffLines('a\nb', 'a\nc');
    expect(lines.find((line) => line.type === 'remove')).toMatchObject({ oldLine: 2, newLine: null });
    expect(lines.find((line) => line.type === 'add')).toMatchObject({ oldLine: null, newLine: 2 });
  });

  it('handles empty sides', () => {
    expect(diffLines('', 'a')).toEqual([{ type: 'add', text: 'a', oldLine: null, newLine: 1 }]);
    expect(diffLines('a', '')).toEqual([{ type: 'remove', text: 'a', oldLine: 1, newLine: null }]);
    expect(diffLines('', '')).toEqual([]);
  });

  it('reports no change for equal texts', () => {
    expect(diffSummary(diffLines('a\nb', 'a\nb'))).toEqual({ added: 0, removed: 0 });
  });

  it('counts added and removed lines', () => {
    expect(diffSummary(diffLines('a\nb\nc', 'a\nx\ny\nc'))).toEqual({ added: 2, removed: 1 });
  });
});
