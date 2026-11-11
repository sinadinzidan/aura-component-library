/** Keeps the digits of what was typed or pasted, cut to the length of the code. */
export function toCode(input: string, length: number): string {
  return input.replace(/\D/g, '').slice(0, length);
}
