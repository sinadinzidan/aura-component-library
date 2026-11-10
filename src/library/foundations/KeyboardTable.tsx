import { Kbd } from '@cognite/aura/components/kbd';

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
};

/**
 * The keyboard contract of each component family: which keys it answers to and what they do.
 * Use it in documentation and in help panels, so shortcuts are written the same way everywhere.
 */
export function KeyboardTable({ caption, patterns }: KeyboardTableProps) {
  return (
    <table data-slot="keyboard-table" className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground">
            Component
          </th>
          <th scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">
            Keys and what they do
          </th>
        </tr>
      </thead>
      <tbody>
        {patterns.map((pattern) => (
          <tr key={pattern.id} className="border-b border-default align-top last:border-b-0">
            <th scope="row" className="py-3 pr-3 text-sm font-medium whitespace-nowrap text-base-foreground">
              {pattern.component}
            </th>
            <td className="px-3 py-3">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {pattern.bindings.map((binding) => (
                  <li key={binding.action} className="flex items-center gap-2 text-sm text-medium-foreground">
                    <span className="flex items-center gap-1">
                      {binding.keys.map((key, index) => (
                        <span key={key} className="flex items-center gap-1">
                          {index > 0 ? <span className="text-xs text-muted-foreground">or</span> : null}
                          <Kbd>{key}</Kbd>
                        </span>
                      ))}
                    </span>
                    {binding.action}
                  </li>
                ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
