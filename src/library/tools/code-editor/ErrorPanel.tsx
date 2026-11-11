import { IconAlertTriangle } from '@cognite/aura/icons';

import { lineColumn } from './jsonTools';

type ErrorPanelProps = {
  /** The text the error is about. */
  text: string;
  error: { message: string; start: number; end: number };
  /** What failed: "Query failed", "Invalid JSON". */
  title?: string;
};

/**
 * Says what is wrong, where (line and column), and shows the line with a marker under the
 * offending characters, so the fix can be found without counting.
 */
export function ErrorPanel({ text, error, title = 'Query failed' }: ErrorPanelProps) {
  const { line, column } = lineColumn(text, error.start);
  const lines = text.split('\n');
  const source = lines[line - 1] ?? '';
  const width = Math.max(1, Math.min(error.end, text.length || 1) - error.start, 1);
  const marker = `${' '.repeat(Math.max(0, column - 1))}${'^'.repeat(Math.min(width, Math.max(1, source.length - column + 2)))}`;

  return (
    <div role="alert" data-slot="error-panel" className="flex flex-col gap-2 rounded-lg bg-critical-background p-3 text-critical-foreground">
      <div className="flex items-center gap-2 text-sm font-medium">
        <IconAlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <span>{title}</span>
        <span className="font-normal tabular-nums">
          Line {line}, column {column}
        </span>
      </div>
      <p className="text-sm">{error.message}</p>
      <pre className="m-0 overflow-x-auto font-mono text-xs leading-5" aria-hidden="true">
        {source}
        {'\n'}
        {marker}
      </pre>
    </div>
  );
}
