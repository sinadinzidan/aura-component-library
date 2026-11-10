import { Button } from '@cognite/aura/components/button';

import { cn } from '../../../lib/utils';
import { TONE_TEXT } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';

import { CAUTION_LEVEL, CAUTION_LEVELS, countCautions, sortCautions } from './cautions';
import type { CautionItem } from './cautions';

export type CautionStripProps = {
  /** Any order; the strip sorts by level, then newest first. */
  items: readonly CautionItem[];
  /** Rows shown before the rest is summarised as a count. */
  limit?: number;
  /** Adds an acknowledge action to rows that are not yet acknowledged. */
  onAcknowledge?: (id: string) => void;
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

/**
 * A crew-alerting list in the manner of an aircraft cockpit: every abnormal condition as one
 * line, the most urgent level on top, each level named in words and repeated in shape and
 * colour. Pick it as the single place an operator looks to learn what is wrong, in order.
 */
export function CautionStrip({ items, limit = 4, onAcknowledge, label = 'Crew alerting', className }: CautionStripProps) {
  const sorted = sortCautions(items);
  const shown = sorted.slice(0, limit);
  const hidden = sorted.length - shown.length;
  const counts = countCautions(items);

  return (
    <div data-slot="caution-strip" className={cn('flex min-w-0 flex-col gap-2', className)}>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {CAUTION_LEVELS.map((level) => (
          <span key={level} data-slot="caution-count" className="inline-flex items-center gap-1.5 tabular-nums">
            <StatusDot tone={CAUTION_LEVEL[level].tone} shape={CAUTION_LEVEL[level].shape} size="sm" />
            {counts[level]} {CAUTION_LEVEL[level].label.toLowerCase()}
          </span>
        ))}
      </p>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No cautions or warnings.</p>
      ) : (
        <ul aria-label={label} className="flex min-w-0 flex-col">
          {shown.map((item) => {
            const level = CAUTION_LEVEL[item.level];
            return (
              <li
                key={item.id}
                data-level={item.level}
                data-acknowledged={item.acknowledged ?? false}
                className={cn('flex min-w-0 items-center gap-3 py-1', item.acknowledged && 'opacity-60')}
              >
                <span className={cn('inline-flex w-24 shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide', TONE_TEXT[level.tone])}>
                  <StatusDot tone={level.tone} shape={level.shape} size="sm" pulse={item.level === 'warning' && !item.acknowledged} />
                  {level.label}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{item.message}</span>
                <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">{item.source}</span>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{item.time}</span>
                {onAcknowledge ? (
                  <span className="flex w-28 shrink-0 justify-end">
                    {item.acknowledged ? (
                      <span className="text-xs text-muted-foreground">Acknowledged</span>
                    ) : (
                      <Button variant="outline" size="sm" aria-label={`Acknowledge ${item.message}`} onClick={() => onAcknowledge(item.id)}>
                        Acknowledge
                      </Button>
                    )}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {hidden > 0 ? <p className="text-xs tabular-nums text-muted-foreground">{hidden} more of lower priority</p> : null}
    </div>
  );
}
