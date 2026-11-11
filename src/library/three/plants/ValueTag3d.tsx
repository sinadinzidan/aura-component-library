import { Html } from '@react-three/drei';

import { cn } from '../../../lib/utils';
import { TONE_BORDER, TONE_VALUE_TEXT } from '../../industrial/status';
import type { DotShape, Tone } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';
import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';

export type ValueTag3dProps = {
  /** Anchor point in the scene: the instrument or the machine the reading belongs to. */
  position: Vec3;
  /** What is measured, e.g. "Vibration". */
  label: string;
  /** The reading with its unit, already formatted: "11.6 mm/s". */
  value: string;
  /** Judged state of the reading. Neutral readings stay in the normal text colour. */
  tone?: Tone;
  shape?: DotShape;
  /** Which way the tag hangs off its anchor, to keep neighbouring tags apart. */
  side?: 'left' | 'right';
  /** Fade the tag, e.g. for readings away from the action. */
  dimmed?: boolean;
};

/**
 * A live reading floating next to a piece of equipment: a small glass card with a label and a
 * value, pinned to a point in the scene by a leader line. It is HTML, so the number stays sharp
 * at any zoom. Hidden from assistive technology — show the same readings in a panel or list.
 */
export function ValueTag3d({ position, label, value, tone = 'neutral', shape = 'dot', side = 'right', dimmed = false }: ValueTag3dProps) {
  const abnormal = tone !== 'neutral';

  return (
    <Html position={toTuple(position)} zIndexRange={[18, 0]} style={{ pointerEvents: 'none' }}>
      <div
        data-slot="value-tag"
        data-tone={tone}
        aria-hidden="true"
        className={cn('flex items-center font-sans', side === 'left' ? '-translate-x-full flex-row-reverse' : '', '-translate-y-1/2', dimmed && 'opacity-50')}
      >
        <span className="size-1.5 shrink-0 rounded-full bg-[var(--primary-background)]" />
        <span className={cn('h-px w-6 shrink-0', abnormal ? 'bg-emphasized' : 'bg-emphasized')} />
        <span
          className={cn(
            'flex flex-col gap-0.5 whitespace-nowrap rounded-md border px-2 py-1 backdrop-blur-sm',
            'bg-[color-mix(in_oklab,var(--card-background)_84%,transparent)]',
            abnormal ? TONE_BORDER[tone] : 'border-default'
          )}
        >
          <span className="flex items-center gap-1.5 text-xs leading-none text-muted-foreground">
            {abnormal ? <StatusDot tone={tone} shape={shape} size="sm" /> : null}
            {label}
          </span>
          <span className={cn('text-sm font-semibold leading-none tabular-nums', TONE_VALUE_TEXT[tone])}>{value}</span>
        </span>
      </div>
    </Html>
  );
}
