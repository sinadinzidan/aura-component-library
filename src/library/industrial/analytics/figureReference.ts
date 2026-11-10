/** The reference text for a numbered figure or table, for use in running text: "Figure 2". */
export function figureReference(number: number | string, kind: 'Figure' | 'Table' = 'Figure'): string {
  return `${kind} ${number}`;
}
