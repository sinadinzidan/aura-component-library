export type ParsedEmails = {
  /** Well-formed addresses, lower-cased, in the order typed, without duplicates. */
  valid: string[];
  /** Entries that are not an address, as typed. */
  invalid: string[];
};

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Whether one entry looks like an email address. A shape check only; the server decides. */
export function isEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/**
 * Splits a pasted or typed list of addresses on commas, semicolons and whitespace, and sorts the
 * entries into valid and invalid. Used by invite forms that accept one address or many.
 */
export function parseEmails(text: string): ParsedEmails {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const entry of text.split(/[\s,;]+/)) {
    if (entry === '') continue;
    if (isEmail(entry)) {
      const email = entry.toLowerCase();
      if (!valid.includes(email)) valid.push(email);
    } else if (!invalid.includes(entry)) {
      invalid.push(entry);
    }
  }

  return { valid, invalid };
}
