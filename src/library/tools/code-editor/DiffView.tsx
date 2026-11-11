import { diffLines, diffSummary } from './diffLines';

type DiffViewProps = {
  before: string;
  after: string;
  /** Names the two sides for assistive technology: "Changes to the query". */
  label: string;
};

const ROW = {
  same: '',
  add: 'bg-success-background text-success-foreground',
  remove: 'bg-critical-background text-critical-foreground',
} as const;

const SIGN = { same: ' ', add: '+', remove: '−' } as const;
const SPOKEN = { same: 'Unchanged: ', add: 'Added: ', remove: 'Removed: ' } as const;

/**
 * A unified line diff of two texts. Added and removed lines carry a sign and a spoken prefix as
 * well as a tint, so the change reads without colour.
 */
export function DiffView({ before, after, label }: DiffViewProps) {
  const lines = diffLines(before, after);
  const { added, removed } = diffSummary(lines);

  return (
    <div className="flex min-w-0 flex-col gap-2" data-slot="diff-view">
      <output className="text-xs tabular-nums text-muted-foreground">{added === 0 && removed === 0 ? 'No changes' : `${added} added · ${removed} removed`}</output>
      <ol aria-label={label} className="overflow-x-auto rounded-lg border border-default font-mono text-xs leading-6">
        {lines.map((line, index) => (
          <li key={index} className={`flex min-w-max gap-3 px-3 ${ROW[line.type]}`}>
            <span aria-hidden="true" className="w-3 shrink-0 select-none">
              {SIGN[line.type]}
            </span>
            <span className="sr-only">{SPOKEN[line.type]}</span>
            <span className="whitespace-pre">{line.text || ' '}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
