export type ExprError = { message: string; start: number; end: number };

export type ExprResult = { ok: true; value: number } | { ok: false; error: ExprError };

type Tok = { kind: 'num' | 'id' | 'op' | 'end'; text: string; start: number; end: number };

class Fail extends Error {
  constructor(readonly error: ExprError) {
    super(error.message);
  }
}

/** Functions a calculated tag may call, with how many arguments each takes (`null` for any number of one or more). */
export const EXPRESSION_FUNCTIONS: Readonly<Record<string, { args: number | null; run: (values: readonly number[]) => number }>> = {
  abs: { args: 1, run: ([x]) => Math.abs(x) },
  sqrt: { args: 1, run: ([x]) => Math.sqrt(x) },
  round: { args: 2, run: ([x, digits]) => Math.round(x * 10 ** digits) / 10 ** digits },
  min: { args: null, run: (values) => Math.min(...values) },
  max: { args: null, run: (values) => Math.max(...values) },
  avg: { args: null, run: (values) => values.reduce((sum, value) => sum + value, 0) / values.length },
  if: { args: 3, run: ([condition, yes, no]) => (condition !== 0 ? yes : no) },
};

function tokenize(text: string): Tok[] {
  const tokens: Tok[] = [];
  let index = 0;
  while (index < text.length) {
    const char = text[index];
    if (/\s/.test(char)) index += 1;
    else if (/[0-9.]/.test(char)) {
      const match = /^(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/.exec(text.slice(index));
      if (!match) throw new Fail({ message: `"${char}" is not a number.`, start: index, end: index + 1 });
      tokens.push({ kind: 'num', text: match[0], start: index, end: index + match[0].length });
      index += match[0].length;
    } else if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(index));
      const word = match ? match[0] : char;
      tokens.push({ kind: 'id', text: word, start: index, end: index + word.length });
      index += word.length;
    } else {
      const two = text.slice(index, index + 2);
      const op = ['>=', '<=', '==', '!='].includes(two) ? two : '+-*/(),<>'.includes(char) ? char : null;
      if (!op) throw new Fail({ message: `Unexpected character "${char}".`, start: index, end: index + 1 });
      tokens.push({ kind: 'op', text: op, start: index, end: index + op.length });
      index += op.length;
    }
  }
  tokens.push({ kind: 'end', text: '', start: text.length, end: text.length });
  return tokens;
}

/**
 * Evaluates a calculated-tag expression: numbers, named inputs, `+ - * /`, comparisons,
 * parentheses and the functions in `EXPRESSION_FUNCTIONS`. Errors carry the offset of the
 * offending token; division by zero and unknown names are reported rather than returned as
 * `Infinity` or `NaN`.
 */
export function evaluateExpression(text: string, inputs: Readonly<Record<string, number>>): ExprResult {
  try {
    const tokens = tokenize(text);
    let position = 0;
    const peek = () => tokens[position];
    const describe = (token: Tok) => (token.kind === 'end' ? 'the end of the expression' : `"${token.text}"`);
    const fail = (message: string, token: Tok = peek()): never => {
      throw new Fail({ message, start: token.start, end: Math.max(token.end, token.start + (token.kind === 'end' ? 0 : 1)) });
    };

    const expression = (): number => comparison();
    const comparison = (): number => {
      let left = sum();
      while (peek().kind === 'op' && ['>', '<', '>=', '<=', '==', '!='].includes(peek().text)) {
        const op = tokens[position++].text;
        const right = sum();
        left = Number(op === '>' ? left > right : op === '<' ? left < right : op === '>=' ? left >= right : op === '<=' ? left <= right : op === '==' ? left === right : left !== right);
      }
      return left;
    };
    const sum = (): number => {
      let left = product();
      while (peek().kind === 'op' && (peek().text === '+' || peek().text === '-')) left = tokens[position++].text === '+' ? left + product() : left - product();
      return left;
    };
    const product = (): number => {
      let left = unary();
      while (peek().kind === 'op' && (peek().text === '*' || peek().text === '/')) {
        const op = tokens[position++];
        const divisor = unary();
        if (op.text === '/' && divisor === 0) return fail('Division by zero.', op);
        left = op.text === '*' ? left * divisor : left / divisor;
      }
      return left;
    };
    const unary = (): number => {
      if (peek().kind === 'op' && peek().text === '-') {
        position += 1;
        return -unary();
      }
      return primary();
    };
    const primary = (): number => {
      const token = tokens[position];
      if (token.kind === 'num') {
        position += 1;
        return Number(token.text);
      }
      if (token.kind === 'op' && token.text === '(') {
        position += 1;
        const inner = expression();
        if (peek().text !== ')') fail(`Expected ")" but found ${describe(peek())}.`);
        position += 1;
        return inner;
      }
      if (token.kind === 'id') {
        position += 1;
        if (peek().text === '(') {
          const fn = EXPRESSION_FUNCTIONS[token.text.toLowerCase()];
          if (!fn) return fail(`Unknown function "${token.text}". Use ${Object.keys(EXPRESSION_FUNCTIONS).join(', ')}.`, token);
          position += 1;
          const values: number[] = [];
          if (peek().text !== ')') {
            values.push(expression());
            while (peek().text === ',') {
              position += 1;
              values.push(expression());
            }
          }
          if (peek().text !== ')') fail(`Expected ")" but found ${describe(peek())}.`);
          const close = tokens[position];
          position += 1;
          if (fn.args !== null && values.length !== fn.args) return fail(`${token.text} takes ${fn.args} ${fn.args === 1 ? 'value' : 'values'} but got ${values.length}.`, close);
          if (fn.args === null && values.length === 0) return fail(`${token.text} needs at least one value.`, close);
          return fn.run(values);
        }
        const value = inputs[token.text];
        if (value === undefined) return fail(`Unknown input "${token.text}". Available: ${Object.keys(inputs).join(', ')}.`, token);
        return value;
      }
      return fail(`Expected a number, an input or "(" but found ${describe(token)}.`, token);
    };

    if (tokens.length === 1) return { ok: false, error: { message: 'Enter an expression.', start: 0, end: 0 } };
    const value = expression();
    if (peek().kind !== 'end') fail(`Unexpected ${describe(peek())}. The expression should end here.`);
    if (!Number.isFinite(value)) return { ok: false, error: { message: 'The result is not a number.', start: 0, end: text.length } };
    return { ok: true, value };
  } catch (error) {
    if (error instanceof Fail) return { ok: false, error: error.error };
    throw error;
  }
}
