import { tokenizeSql } from './sqlTokenizer';
import type { Token } from './sqlTypes';

const CLAUSES = ['FROM', 'WHERE', 'ORDER', 'LIMIT'];
const WIDTH = 72;

/**
 * Lays a query out one clause per line with upper-case keywords, `AND` and `OR` indented under
 * `WHERE`, and a long column list one column per line. Comments move to their own line. Text
 * that does not tokenize comes back unchanged, so formatting never loses what was typed.
 */
export function formatSql(text: string): string {
  const tokenized = tokenizeSql(text);
  if (!tokenized.ok) return text;
  const tokens: Token[] = tokenized.tokens.filter((token) => token.type !== 'whitespace');

  const lines: string[] = [];
  let line = '';
  let depth = 0;
  const flush = () => {
    if (line.trim() !== '') lines.push(line.trimEnd());
    line = '';
  };
  const append = (piece: string, spaceBefore: boolean) => {
    line += (spaceBefore && line !== '' && !line.endsWith('(') ? ' ' : '') + piece;
  };

  tokens.forEach((token, index) => {
    const upper = token.text.toUpperCase();
    const previous = tokens[index - 1];
    if (token.type === 'comment') {
      flush();
      lines.push(token.text.trimEnd());
      return;
    }
    if (token.type === 'keyword' && depth === 0 && CLAUSES.includes(upper)) {
      flush();
      append(upper, false);
    } else if (token.type === 'keyword' && depth === 0 && (upper === 'AND' || upper === 'OR')) {
      flush();
      line = `  ${upper}`;
    } else if (token.type === 'keyword') {
      append(upper, true);
    } else if (token.type === 'punct' && token.text === ',') {
      line += ',';
    } else if (token.type === 'punct' && token.text === ';') {
      line += ';';
    } else if (token.type === 'punct' && token.text === '(') {
      append('(', true);
      depth += 1;
    } else if (token.type === 'punct' && token.text === ')') {
      line += ')';
      depth = Math.max(0, depth - 1);
    } else if (token.type === 'punct' && token.text === '.') {
      line += '.';
    } else {
      append(token.text, previous?.text !== '.');
    }
  });
  flush();

  // A short column list stays on the SELECT line; a long one goes one column per line.
  const select = lines.findIndex((value) => value.startsWith('SELECT '));
  if (select !== -1 && lines[select].length > WIDTH) {
    const columns = lines[select].slice('SELECT '.length).split(/,\s*/);
    lines.splice(select, 1, 'SELECT', ...columns.map((column, index) => `  ${column}${index < columns.length - 1 ? ',' : ''}`));
  }
  return lines.join('\n');
}
