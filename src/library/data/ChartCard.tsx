import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { useState } from 'react';
import type { ReactNode } from 'react';

export type ChartCardSeries = {
  /** The data key of the series, as used in the chart config. */
  key: string;
  label: string;
  /** A chart colour token, for example `chartSeriesColor(1)` or `var(--color-chart-2-450)`. */
  color: string;
};

type ChartCardProps = {
  title: string;
  description?: string;
  /** One or two sentences with what the chart shows. Visible, so it also serves people who cannot read the plot. */
  summary: string;
  /** Legend entries, in series order. Leave out for a single series named by the title. */
  series?: readonly ChartCardSeries[];
  /** Lets people hide and show series from the legend. The last visible series cannot be hidden. */
  toggleable?: boolean;
  /** Controls for the header's end slot, such as a time range picker. */
  actions?: ReactNode;
  /** The chart. Pass a function to learn which series are visible when `toggleable` is on. */
  children: ReactNode | ((isVisible: (key: string) => boolean) => ReactNode);
};

function Swatch({ color, hidden }: { color: string; hidden: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-xs border"
      style={{ borderColor: color, backgroundColor: hidden ? 'transparent' : color }}
    />
  );
}

/**
 * The frame every dashboard chart sits in: title, optional controls, the plot, a legend and a
 * one-line text summary. With `toggleable`, legend entries become buttons that hide and show
 * their series.
 */
export function ChartCard({
  title,
  description,
  summary,
  series = [],
  toggleable = false,
  actions,
  children,
}: ChartCardProps) {
  const [hiddenKeys, setHiddenKeys] = useState<readonly string[]>([]);
  const isVisible = (key: string) => !hiddenKeys.includes(key);
  const visibleCount = series.filter((entry) => isVisible(entry.key)).length;

  const toggle = (key: string) => {
    setHiddenKeys((current) => {
      if (current.includes(key)) return current.filter((hidden) => hidden !== key);
      // Never leave the chart empty.
      return visibleCount <= 1 ? current : [...current, key];
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeaderCenter>
        {actions ? <CardHeaderEnd>{actions}</CardHeaderEnd> : null}
      </CardHeader>
      <CardContent>
        <div className="w-full">{typeof children === 'function' ? children(isVisible) : children}</div>
        {series.length > 0 ? (
          <ul aria-label="Legend" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {series.map((entry) => {
              const hidden = !isVisible(entry.key);
              return (
                <li key={entry.key}>
                  {toggleable ? (
                    <button
                      type="button"
                      aria-pressed={!hidden}
                      onClick={() => toggle(entry.key)}
                      className={`flex items-center gap-1.5 rounded-sm outline-none focus-visible:shadow-focus-ring ${hidden ? 'text-muted-foreground line-through' : 'text-medium-foreground'}`}
                    >
                      <Swatch color={entry.color} hidden={hidden} />
                      {entry.label}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-medium-foreground">
                      <Swatch color={entry.color} hidden={false} />
                      {entry.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardContent>
    </Card>
  );
}
