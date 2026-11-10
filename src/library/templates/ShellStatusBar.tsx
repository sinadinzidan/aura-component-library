import type { Tone } from '../industrial/status';
import { StatusDot } from '../industrial/StatusDot';

export type ShellStatusItem = {
  id: string;
  /** What the figure is: "Historian", "Last sample". */
  label: string;
  /** The current value, already formatted: "Connected", "14:00:05 UTC". */
  value: string;
  /** Adds a status dot before the value. Leave out for plain facts. */
  tone?: Tone;
};

type ShellStatusBarProps = {
  /** Accessible name of the bar. */
  label?: string;
  /** Facts at the start of the bar: connections and data freshness. */
  items: readonly ShellStatusItem[];
  /** Facts at the end of the bar: user, shift, clock. */
  endItems?: readonly ShellStatusItem[];
};

function StatusItem({ item }: { item: ShellStatusItem }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      <dt className="text-muted-foreground">{item.label}</dt>
      <dd className="flex items-center gap-1.5 font-medium tabular-nums text-medium-foreground">
        {item.tone ? <StatusDot tone={item.tone} size="sm" /> : null}
        {item.value}
      </dd>
    </div>
  );
}

/**
 * The thin strip along the bottom of a console-style screen: connection state, data freshness,
 * who is on shift. Each fact is a label and a value, so a coloured dot is never the only thing
 * that says a connection is down.
 */
export function ShellStatusBar({ label = 'Status bar', items, endItems = [] }: ShellStatusBarProps) {
  return (
    <footer
      aria-label={label}
      data-slot="shell-status-bar"
      className="flex min-h-7 w-full min-w-0 items-center justify-between gap-6 border-t border-default bg-muted-background px-3 py-1 text-xs"
    >
      <dl className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1">
        {items.map((item) => (
          <StatusItem key={item.id} item={item} />
        ))}
      </dl>
      {endItems.length > 0 ? (
        <dl className="flex shrink-0 items-center gap-x-5">
          {endItems.map((item) => (
            <StatusItem key={item.id} item={item} />
          ))}
        </dl>
      ) : null}
    </footer>
  );
}
