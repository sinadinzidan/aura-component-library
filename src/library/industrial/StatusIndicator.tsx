import { Badge } from '@cognite/aura/components/badge';

import { cn } from '../../lib/utils';

import type { DotShape, Tone } from './status';
import { StatusDot } from './StatusDot';

export type StatusIndicatorProps = {
  tone: Tone;
  /** The state in words. Always shown: colour alone never carries a state. */
  label: string;
  shape?: DotShape;
  /** `plain` is a dot and text for dense rows; `badge` is a tinted Aura Badge for headers. */
  variant?: 'plain' | 'badge';
  size?: 'sm' | 'md';
  /** Quiet secondary text after the label, such as "since 13:46" or a count. */
  detail?: string;
  pulse?: boolean;
  className?: string;
};

const BADGE_VARIANT = {
  neutral: 'archived',
  success: 'success',
  warning: 'warning',
  critical: 'error',
  info: 'inProgress',
} as const;

/**
 * A state as dot + label. Spread a descriptor from `status.ts` into it:
 * `<StatusIndicator {...runStateStatus(asset.state)} />`.
 */
export function StatusIndicator({
  tone,
  label,
  shape = 'dot',
  variant = 'plain',
  size = 'md',
  detail,
  pulse = false,
  className,
}: StatusIndicatorProps) {
  if (variant === 'badge') {
    return (
      <Badge data-slot="status-indicator" data-tone={tone} variant={BADGE_VARIANT[tone]} className={className}>
        {label}
        {detail ? ` · ${detail}` : null}
      </Badge>
    );
  }

  return (
    <span
      data-slot="status-indicator"
      data-tone={tone}
      className={cn(
        'inline-flex items-center whitespace-nowrap text-base-foreground',
        size === 'sm' ? 'gap-1.5 text-xs' : 'gap-2 text-sm',
        className
      )}
    >
      <StatusDot tone={tone} shape={shape} size={size} pulse={pulse} />
      <span>{label}</span>
      {detail ? <span className="text-muted-foreground tabular-nums">{detail}</span> : null}
    </span>
  );
}
