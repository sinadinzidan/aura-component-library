import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import type { StatusDescriptor, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';

export type AreaBlockProps = {
  name: string;
  /** Area code or tag, set in monospace. */
  tag?: string;
  /** State of the area as dot + label. */
  status?: StatusDescriptor;
  /** Active alarms in the area. Zero is not shown. */
  alarmCount?: number;
  /** Tone of the alarm count: the worst active severity. */
  alarmTone?: Tone;
  /** Tints the whole block. Only for an area that needs attention now. */
  tone?: 'neutral' | 'warning' | 'critical';
  selected?: boolean;
  /** Makes the block a toggle button. */
  onSelect?: () => void;
  /** Extra content under the name: a reading, a level, a count. */
  children?: ReactNode;
  className?: string;
};

const SURFACE: Record<NonNullable<AreaBlockProps['tone']>, string> = {
  neutral: 'bg-muted-background',
  warning: 'bg-warning-background',
  critical: 'bg-critical-background',
};

/**
 * One area on a schematic plot plan: a labelled block with its state and alarm count. Size and
 * place it with grid classes; it fills the cell it is given. Selection is an outline, so it
 * never competes with status colour.
 */
export function AreaBlock({ name, tag, status, alarmCount = 0, alarmTone = 'critical', tone = 'neutral', selected = false, onSelect, children, className }: AreaBlockProps) {
  const content = (
    <>
      <span className="flex min-w-0 flex-col gap-0.5">
        {tag ? <span className="font-mono text-xs text-muted-foreground">{tag}</span> : null}
        <span className="truncate text-sm font-medium text-base-foreground">{name}</span>
      </span>
      {children}
      {status || alarmCount > 0 ? (
        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          {status ? <StatusIndicator size="sm" {...status} /> : null}
          {alarmCount > 0 ? (
            <StatusIndicator size="sm" tone={alarmTone} shape="diamond" label={`${alarmCount} ${alarmCount === 1 ? 'alarm' : 'alarms'}`} />
          ) : null}
        </span>
      ) : null}
    </>
  );
  const classes = cn(
    'flex min-h-20 min-w-0 flex-col gap-2 rounded-lg border p-3 text-left',
    SURFACE[tone],
    selected ? 'border-emphasized' : 'border-transparent',
    className
  );

  if (onSelect) {
    return (
      <button
        type="button"
        data-slot="area-block"
        data-tone={tone}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(classes, 'cursor-pointer outline-none transition-colors hover:border-default focus-visible:shadow-focus-ring', selected && 'hover:border-emphasized')}
      >
        {content}
      </button>
    );
  }

  return (
    <div data-slot="area-block" data-tone={tone} data-selected={selected} className={classes}>
      {content}
    </div>
  );
}
