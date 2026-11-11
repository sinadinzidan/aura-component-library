import { Kbd } from '@cognite/aura/components/kbd';

import { Table } from '../primitives/table/Table';
import type { TableProps } from '../primitives/table/Table';
import { TableBody } from '../primitives/table/TableBody';
import { TableCaption } from '../primitives/table/TableCaption';
import { TableCell } from '../primitives/table/TableCell';
import { TableHead } from '../primitives/table/TableHead';
import { TableHeader } from '../primitives/table/TableHeader';
import { TableRow } from '../primitives/table/TableRow';

export type KeyboardBinding = {
  /** Keys that do the same thing, shown as alternatives: `['Enter', 'Space']`. */
  keys: readonly string[];
  /** What happens, in a few words. */
  action: string;
};

export type KeyboardPattern = {
  id: string;
  /** Component family: "Tabs", "Menu", "Dialog". */
  component: string;
  bindings: readonly KeyboardBinding[];
};

export type KeyboardTableProps = {
  /** Accessible caption for the table. */
  caption: string;
  patterns: readonly KeyboardPattern[];
  /** The surface the table sits on, so its rows match it. */
  surface?: TableProps['surface'];
};

/**
 * The keyboard contract of each component family: which keys it answers to and what they do.
 * Use it in documentation and in help panels, so shortcuts are written the same way everywhere.
 */
export function KeyboardTable({
  caption,
  patterns,
  surface = 'base',
}: KeyboardTableProps) {
  return (
    <div data-slot="keyboard-table" className="w-full min-w-0">
      <Table density="comfortable" hover={false} surface={surface}>
        <TableCaption srOnly>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Keys and what they do</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patterns.map((pattern) => (
            <TableRow key={pattern.id}>
              <TableCell rowHeader wrap="nowrap" className="align-top">
                {pattern.component}
              </TableCell>
              <TableCell className="align-top">
                <ul className="flex flex-wrap gap-x-6 gap-y-2">
                  {pattern.bindings.map((binding) => (
                    <li
                      key={binding.action}
                      className="flex items-center gap-2 text-sm text-medium-foreground"
                    >
                      <span className="flex items-center gap-1">
                        {binding.keys.map((key, index) => (
                          <span key={key} className="flex items-center gap-1">
                            {index > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                or
                              </span>
                            ) : null}
                            <Kbd>{key}</Kbd>
                          </span>
                        ))}
                      </span>
                      {binding.action}
                    </li>
                  ))}
                </ul>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
