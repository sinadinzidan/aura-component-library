import type { SqlError, Token } from './sqlTypes';

export const SQL_KEYWORDS: ReadonlySet<string> = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'NOT',
  'ORDER',
  'BY',
  'ASC',
  'DESC',
  'LIMIT',
  'LIKE',
  'TRUE',
  'FALSE',
  'NULL',
  'IS',
]);

export type TokenizeResult = { ok: true; tokens: Token[] } | { ok: false; error: SqlError };

const OPERATORS = ['<=', '>=', '<>', '!=', '=', '<', '>'];

/**
 * Splits SQL text into tokens with their positions: keywords, identifiers, single-quoted
 * strings (`''` escapes a quote), numbers, comparison operators, punctuation and `--` comments.
 * White space and comments are kept as tokens so a formatter can see them; the parser skips them.
 * Stops at the first character it cannot read and says where.
 */
export function tokenizeSql(text: string): TokenizeResult {
  const tokens: Token[] = [];
  let index = 0;
  const push = (type: Token['type'], end: number) => {
    tokens.push({ type, text: text.slice(index, end), start: index, end });
    index = end;
  };

  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) {
      let end = index + 1;
      while (end < text.length && /\s/.test(text[end])) end += 1;
      push('whitespace', end);
    } else if (char === '-' && text[index + 1] === '-') {
      const newline = text.indexOf('\n', index);
      push('comment', newline === -1 ? text.length : newline);
    } else if (char === "'") {
      let end = index + 1;
      for (;;) {
        if (end >= text.length) return { ok: false, error: { message: 'This text value is not closed. Add a closing quote.', start: index, end: text.length } };
        if (text[end] === "'") {
          if (text[end + 1] === "'") end += 2;
          else break;
        } else end += 1;
      }
      push('string', end + 1);
    } else if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(text[index + 1] ?? ''))) {
      let end = index;
      while (end < text.length && /[0-9]/.test(text[end])) end += 1;
      if (text[end] === '.') {
        end += 1;
        while (end < text.length && /[0-9]/.test(text[end])) end += 1;
      }
      if (/[A-Za-z_]/.test(text[end] ?? '')) return { ok: false, error: { message: 'A number cannot run into letters. Separate them.', start: index, end: end + 1 } };
      push('number', end);
    } else if (/[A-Za-z_]/.test(char)) {
      let end = index + 1;
      while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) end += 1;
      push(SQL_KEYWORDS.has(text.slice(index, end).toUpperCase()) ? 'keyword' : 'identifier', end);
    } else {
      const operator = OPERATORS.find((candidate) => text.startsWith(candidate, index));
      if (operator) push('operator', index + operator.length);
      else if (',()*;.'.includes(char)) push('punct', index + 1);
      else return { ok: false, error: { message: `Unexpected character "${char}".`, start: index, end: index + 1 } };
    }
  }
  return { ok: true, tokens };
}
