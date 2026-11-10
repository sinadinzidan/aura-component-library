import type { ReactNode } from 'react';

export type FormatExampleRow = {
  id: string;
  /** What is being formatted: "Flow rate", "Missing value". */
  label: string;
  /** The call or rule that produces the output, shown in monospace. */
  code?: string;
  /** The correctly formatted result. */
  output: ReactNode;
  /** A common wrong form, shown struck through and announced as "Avoid". */
  avoid?: string;
  /** Short reason or rule. */
  note?: string;
};

export type FormatExamplesProps = {
  /** Accessible caption for the table. */
  caption: string;
  rows: readonly FormatExampleRow[];
  /** Header of the output column. */
  outputHeader?: string;
  /** Header of the code column. Leave the column out by giving no row a `code`. */
  codeHeader?: string;
};

/**
 * Formatting rules as a table: what it is, the function or rule, the result, and optionally the
 * form to avoid. Results are right-aligned with tabular figures so digits line up down the column.
 */
export function FormatExamples({ caption, rows, outputHeader = 'Result', codeHeader = 'Function' }: FormatExamplesProps) {
  const hasCode = rows.some((row) => row.code !== undefined);
  const hasAvoid = rows.some((row) => row.avoid !== undefined);
  const hasNote = rows.some((row) => row.note !== undefined);
  const head = 'px-3 py-2 text-xs font-medium text-muted-foreground';

  return (
    <table data-slot="format-examples" className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className={`${head} pl-0`}>
            Case
          </th>
          {hasCode ? (
            <th scope="col" className={head}>
              {codeHeader}
            </th>
          ) : null}
          <th scope="col" className={`${head} text-right`}>
            {outputHeader}
          </th>
          {hasAvoid ? (
            <th scope="col" className={`${head} text-right`}>
              Avoid
            </th>
          ) : null}
          {hasNote ? (
            <th scope="col" className={head}>
              Rule
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-3 text-sm font-normal text-medium-foreground">
              {row.label}
            </th>
            {hasCode ? (
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{row.code}</td>
            ) : null}
            <td className="px-3 py-2 text-right font-medium whitespace-nowrap text-base-foreground tabular-nums">
              {row.output}
            </td>
            {hasAvoid ? (
              <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground tabular-nums">
                {row.avoid ? (
                  <>
                    <span className="sr-only">Avoid: </span>
                    <s>{row.avoid}</s>
                  </>
                ) : null}
              </td>
            ) : null}
            {hasNote ? <td className="px-3 py-2 text-xs text-muted-foreground">{row.note}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
