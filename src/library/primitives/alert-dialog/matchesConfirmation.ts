/** Whether what was typed matches the required text, ignoring surrounding spaces. */
export function matchesConfirmation(typed: string, text: string, ignoreCase = false): boolean {
  const left = typed.trim();
  const right = text.trim();
  return ignoreCase ? left.toLowerCase() === right.toLowerCase() : left === right;
}
