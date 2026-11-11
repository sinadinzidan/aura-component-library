export type JsonError = { message: string; offset: number; line: number; column: number };

export type JsonCheck = { ok: true; value: unknown } | { ok: false; error: JsonError };

/** Line and column (both from 1) of an offset in a text. */
export function lineColumn(text: string, offset: number): { line: number; column: number } {
  const before = text.slice(0, Math.max(0, Math.min(offset, text.length)));
  const line = before.split('\n').length;
  return { line, column: before.length - (before.lastIndexOf('\n') + 1) + 1 };
}

class Stop extends Error {
  constructor(
    message: string,
    readonly offset: number
  ) {
    super(message);
  }
}

/**
 * A strict JSON reader that, unlike `JSON.parse`, says exactly where it stopped and in the same
 * words in every browser. It accepts only standard JSON: no comments, no trailing commas, no
 * single quotes.
 */
export function checkJson(text: string): JsonCheck {
  let index = 0;
  const skip = () => {
    while (index < text.length && /\s/.test(text[index])) index += 1;
  };
  const describe = () => (index >= text.length ? 'the end of the text' : `"${text[index]}"`);
  const expect = (char: string, context: string) => {
    skip();
    if (text[index] !== char) throw new Stop(`Expected "${char}" ${context} but found ${describe()}.`, index);
    index += 1;
  };

  const string = (): string => {
    const start = index;
    index += 1;
    let out = '';
    for (;;) {
      const char = text[index];
      if (char === undefined) throw new Stop('This string is not closed. Add a closing quote.', start);
      if (char === '"') {
        index += 1;
        return out;
      }
      if (char === '\n') throw new Stop('A string cannot span lines. Use \\n inside the string.', index);
      if (char === '\\') {
        const next = text[index + 1];
        if (next === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 2, index + 6))) throw new Stop('A \\u escape needs four hex digits.', index);
          out += String.fromCharCode(parseInt(text.slice(index + 2, index + 6), 16));
          index += 6;
        } else if (next !== undefined && '"\\/bfnrt'.includes(next)) {
          out += { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }[next] ?? next;
          index += 2;
        } else throw new Stop(`"\\${next ?? ''}" is not a valid escape.`, index);
      } else {
        out += char;
        index += 1;
      }
    }
  };

  const value = (): unknown => {
    skip();
    const char = text[index];
    if (char === '{') {
      index += 1;
      const object: Record<string, unknown> = {};
      skip();
      if (text[index] === '}') {
        index += 1;
        return object;
      }
      for (;;) {
        skip();
        if (text[index] !== '"') throw new Stop(`Expected a property name in quotes but found ${describe()}.`, index);
        const key = string();
        expect(':', 'after the property name');
        object[key] = value();
        skip();
        if (text[index] === ',') {
          const comma = index;
          index += 1;
          skip();
          if (text[index] === '}') throw new Stop('A trailing comma is not allowed in JSON.', comma);
        } else if (text[index] === '}') {
          index += 1;
          return object;
        } else throw new Stop(`Expected "," or "}" after the property value but found ${describe()}.`, index);
      }
    }
    if (char === '[') {
      index += 1;
      const list: unknown[] = [];
      skip();
      if (text[index] === ']') {
        index += 1;
        return list;
      }
      for (;;) {
        list.push(value());
        skip();
        if (text[index] === ',') {
          const comma = index;
          index += 1;
          skip();
          if (text[index] === ']') throw new Stop('A trailing comma is not allowed in JSON.', comma);
        } else if (text[index] === ']') {
          index += 1;
          return list;
        } else throw new Stop(`Expected "," or "]" after the item but found ${describe()}.`, index);
      }
    }
    if (char === '"') return string();
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(index));
    if (number) {
      index += number[0].length;
      return Number(number[0]);
    }
    for (const [word, result] of [
      ['true', true],
      ['false', false],
      ['null', null],
    ] as const) {
      if (text.startsWith(word, index)) {
        index += word.length;
        return result;
      }
    }
    throw new Stop(char === "'" ? 'Use double quotes. JSON does not allow single quotes.' : `Expected a value but found ${describe()}.`, index);
  };

  try {
    const result = value();
    skip();
    if (index < text.length) throw new Stop(`Unexpected ${describe()} after the value.`, index);
    return { ok: true, value: result };
  } catch (error) {
    if (error instanceof Stop) return { ok: false, error: { message: error.message, offset: error.offset, ...lineColumn(text, error.offset) } };
    throw error;
  }
}

/** Re-indents valid JSON with two spaces; text that is not valid comes back unchanged. */
export function prettyJson(text: string, indent = 2): string {
  const checked = checkJson(text);
  return checked.ok ? JSON.stringify(checked.value, null, indent) : text;
}

/** Collapses valid JSON onto one line; text that is not valid comes back unchanged. */
export function minifyJson(text: string): string {
  const checked = checkJson(text);
  return checked.ok ? JSON.stringify(checked.value) : text;
}
