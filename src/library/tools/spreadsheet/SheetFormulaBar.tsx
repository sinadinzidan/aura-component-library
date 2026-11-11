export type SheetFormulaBarProps = {
  /** Address of the active cell: "C4". */
  cell: string;
  /** The raw content of the active cell: the text, the number or the formula as typed. */
  content: string;
  /** What the formula evaluates to, shown after it. Leave out for plain cells. */
  result?: string;
};

/**
 * The line above a spreadsheet that shows what is really in the active cell: its address and its
 * raw content, so a formula can be read while the cell shows the result.
 */
export function SheetFormulaBar({ cell, content, result }: SheetFormulaBarProps) {
  return (
    <div data-slot="sheet-formula-bar" className="flex min-h-8 min-w-0 flex-1 items-center gap-2 text-sm">
      <span className="w-12 shrink-0 font-mono text-xs text-base-foreground">{cell}</span>
      <span aria-hidden="true" className="shrink-0 text-xs italic text-muted-foreground">
        fx
      </span>
      <span aria-label={`Content of ${cell}`} className="min-w-0 flex-1 truncate font-mono text-xs text-base-foreground">
        {content === '' ? <span className="font-sans text-muted-foreground">Empty</span> : content}
      </span>
      {result === undefined ? null : <span className="shrink-0 text-xs tabular-nums text-muted-foreground">= {result}</span>}
    </div>
  );
}
