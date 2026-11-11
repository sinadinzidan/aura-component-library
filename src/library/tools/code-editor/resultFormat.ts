/** Row and column counts as one phrase: "3 rows · 4 columns". */
export function describeRows(rowCount: number, columnCount: number): string {
  return `${rowCount.toLocaleString('en-US')} ${rowCount === 1 ? 'row' : 'rows'} · ${columnCount} ${columnCount === 1 ? 'column' : 'columns'}`;
}

