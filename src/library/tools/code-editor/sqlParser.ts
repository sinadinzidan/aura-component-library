import { tokenizeSql } from './sqlTokenizer';
import type { SqlError, Token } from './sqlTypes';

export type Ref = { name: string; start: number; end: number };

export type Literal = { kind: 'literal'; value: string | number | boolean | null; start: number; end: number };
export type ColumnRef = { kind: 'column'; name: string; start: number; end: number };
export type Operand = Literal | ColumnRef;
export type CompareOp = '=' | '!=' | '<>' | '<' | '<=' | '>' | '>=' | 'LIKE' | 'IS';

export type Expr =
  | { kind: 'compare'; op: CompareOp; negate: boolean; left: Operand; right: Operand; start: number; end: number }
  | { kind: 'and' | 'or'; left: Expr; right: Expr }
  | { kind: 'not'; operand: Expr };

export type OrderTerm = { column: Ref; direction: 'asc' | 'desc' };

export type SelectQuery = {
  /** `null` stands for `*`. */
  columns: readonly Ref[] | null;
  table: Ref;
  where: Expr | null;
  orderBy: readonly OrderTerm[];
  limit: { value: number; start: number; end: number } | null;
};

export type ParseResult = { ok: true; query: SelectQuery } | { ok: false; error: SqlError };

class Failure extends Error {
  constructor(readonly error: SqlError) {
    super(error.message);
  }
}

const describe = (token: Token | undefined): string => (token ? `"${token.text}"` : 'the end of the query');

/**
 * Reads the supported subset: `SELECT cols | * FROM table [WHERE …] [ORDER BY col [ASC|DESC], …]
 * [LIMIT n]`, with `AND`, `OR`, `NOT`, parentheses and the comparisons `= != <> < <= > >= LIKE`
 * and `IS [NOT] NULL`. Every error carries the offset of the token that broke the rule.
 */
export function parseSql(text: string): ParseResult {
  const tokenized = tokenizeSql(text);
  if (!tokenized.ok) return tokenized;
  const tokens = tokenized.tokens.filter((token) => token.type !== 'whitespace' && token.type !== 'comment');
  let position = 0;

  const peek = (): Token | undefined => tokens[position];
  const fail = (message: string, token: Token | undefined = peek()): never => {
    const start = token ? token.start : text.length;
    throw new Failure({ message, start, end: token ? token.end : start });
  };
  const isKeyword = (word: string): boolean => peek()?.type === 'keyword' && peek()?.text.toUpperCase() === word;
  const isPunct = (char: string): boolean => peek()?.type === 'punct' && peek()?.text === char;
  const take = (): Token => {
    const token = peek();
    if (!token) return fail('The query ends too early.');
    position += 1;
    return token;
  };
  const expectKeyword = (word: string, context?: string): Token => {
    if (!isKeyword(word)) fail(`Expected ${word}${context ? ` ${context}` : ''} but found ${describe(peek())}.`);
    return take();
  };
  const identifier = (what: string): Ref => {
    const token = peek();
    if (token?.type !== 'identifier') return fail(`Expected ${what} but found ${describe(token)}.`);
    position += 1;
    return { name: token.text, start: token.start, end: token.end };
  };

  const operand = (): Operand => {
    const token = peek();
    if (!token) return fail('Expected a column or a value but the query ends.');
    if (token.type === 'identifier') {
      position += 1;
      return { kind: 'column', name: token.text, start: token.start, end: token.end };
    }
    if (token.type === 'string') {
      position += 1;
      return { kind: 'literal', value: token.text.slice(1, -1).replace(/''/g, "'"), start: token.start, end: token.end };
    }
    if (token.type === 'number') {
      position += 1;
      return { kind: 'literal', value: Number(token.text), start: token.start, end: token.end };
    }
    if (token.type === 'keyword' && ['TRUE', 'FALSE', 'NULL'].includes(token.text.toUpperCase())) {
      position += 1;
      const word = token.text.toUpperCase();
      return { kind: 'literal', value: word === 'NULL' ? null : word === 'TRUE', start: token.start, end: token.end };
    }
    return fail(`Expected a column or a value but found ${describe(token)}.`);
  };

  const comparison = (): Expr => {
    const left = operand();
    const token = peek();
    if (token?.type === 'operator') {
      position += 1;
      const right = operand();
      return { kind: 'compare', op: token.text === '<>' ? '!=' : token.text === '=' ? '=' : (token.text as CompareOp), negate: false, left, right, start: left.start, end: right.end };
    }
    if (isKeyword('LIKE')) {
      position += 1;
      const right = operand();
      return { kind: 'compare', op: 'LIKE', negate: false, left, right, start: left.start, end: right.end };
    }
    if (isKeyword('IS')) {
      position += 1;
      const negate = isKeyword('NOT');
      if (negate) position += 1;
      const nullToken = expectKeyword('NULL');
      return { kind: 'compare', op: 'IS', negate, left, right: { kind: 'literal', value: null, start: nullToken.start, end: nullToken.end }, start: left.start, end: nullToken.end };
    }
    return fail(`Expected a comparison (=, <, >, LIKE, IS NULL) after "${text.slice(left.start, left.end)}" but found ${describe(token)}.`);
  };

  const primary = (): Expr => {
    if (isPunct('(')) {
      position += 1;
      const inner = orExpr();
      if (!isPunct(')')) fail(`Expected ")" but found ${describe(peek())}.`);
      position += 1;
      return inner;
    }
    return comparison();
  };
  const notExpr = (): Expr => {
    if (isKeyword('NOT')) {
      position += 1;
      return { kind: 'not', operand: notExpr() };
    }
    return primary();
  };
  const andExpr = (): Expr => {
    let left = notExpr();
    while (isKeyword('AND')) {
      position += 1;
      left = { kind: 'and', left, right: notExpr() };
    }
    return left;
  };
  const orExpr = (): Expr => {
    let left = andExpr();
    while (isKeyword('OR')) {
      position += 1;
      left = { kind: 'or', left, right: andExpr() };
    }
    return left;
  };

  try {
    expectKeyword('SELECT', 'at the start');
    let columns: Ref[] | null;
    if (isPunct('*')) {
      position += 1;
      columns = null;
    } else {
      columns = [identifier('a column name or *')];
      while (isPunct(',')) {
        position += 1;
        columns.push(identifier('a column name after the comma'));
      }
    }
    expectKeyword('FROM', 'after the column list');
    const table = identifier('a table name');
    const where = isKeyword('WHERE') ? (position += 1, orExpr()) : null;
    const orderBy: OrderTerm[] = [];
    if (isKeyword('ORDER')) {
      position += 1;
      expectKeyword('BY', 'after ORDER');
      do {
        if (orderBy.length > 0) position += 1;
        const column = identifier('a column to sort by');
        const direction = isKeyword('DESC') ? 'desc' : 'asc';
        if (isKeyword('ASC') || isKeyword('DESC')) position += 1;
        orderBy.push({ column, direction });
      } while (isPunct(','));
    }
    let limit: SelectQuery['limit'] = null;
    if (isKeyword('LIMIT')) {
      position += 1;
      const token = peek();
      if (token?.type !== 'number' || !/^[0-9]+$/.test(token.text)) fail(`Expected a whole number after LIMIT but found ${describe(token)}.`);
      const amount = take();
      limit = { value: Number(amount.text), start: amount.start, end: amount.end };
    }
    if (isPunct(';')) position += 1;
    if (peek()) fail(`Unexpected ${describe(peek())}. The query should end here.`);
    return { ok: true, query: { columns, table, where, orderBy, limit } };
  } catch (error) {
    if (error instanceof Failure) return { ok: false, error: error.error };
    throw error;
  }
}
