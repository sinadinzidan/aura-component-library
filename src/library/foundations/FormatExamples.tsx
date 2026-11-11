import type { ReactNode } from 'react';

import { Table } from '../primitives/table/Table';
import type { TableProps } from '../primitives/table/Table';
import { TableBody } from '../primitives/table/TableBody';
import { TableCaption } from '../primitives/table/TableCaption';
import { TableCell } from '../primitives/table/TableCell';
import { TableHead } from '../primitives/table/TableHead';
import { TableHeader } from '../primitives/table/TableHeader';
import { TableRow } from '../primitives/table/TableRow';

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
  /** The surface the table sits on, so its rows match it. */
  surface?: TableProps['surface'];
};

/**
 * Formatting rules as a table: what it is, the function or rule, the result, and optionally the
 * form to avoid. Results are right-aligned with tabular figures so digits line up down the column.
 */
export function FormatExamples({
  caption,
  rows,
  outputHeader = 'Result',
  codeHeader = 'Function',
  surface = 'base',
}: FormatExamplesProps) {
  const hasCode = rows.some((row) => row.code !== undefined);
  const hasAvoid = rows.some((row) => row.avoid !== undefined);
  const hasNote = rows.some((row) => row.note !== undefined);

  return (
    <div data-slot="format-examples" className="w-full min-w-0">
      <Table hover={false} surface={surface}>
        <TableCaption srOnly>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Case</TableHead>
            {hasCode ? <TableHead>{codeHeader}</TableHead> : null}
            <TableHead numeric>{outputHeader}</TableHead>
            {hasAvoid ? <TableHead numeric>Avoid</TableHead> : null}
            {hasNote ? <TableHead>Rule</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell rowHeader>
                <span className="font-normal text-medium-foreground">
                  {row.label}
                </span>
              </TableCell>
              {hasCode ? (
                <TableCell mono muted wrap="wrap">
                  {row.code}
                </TableCell>
              ) : null}
              <TableCell numeric>
                <span className="font-medium text-base-foreground">
                  {row.output}
                </span>
              </TableCell>
              {hasAvoid ? (
                <TableCell numeric muted>
                  {row.avoid ? (
                    <>
                      <span className="sr-only">Avoid: </span>
                      <s>{row.avoid}</s>
                    </>
                  ) : null}
                </TableCell>
              ) : null}
              {hasNote ? (
                <TableCell muted>
                  <span className="text-xs">{row.note}</span>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
