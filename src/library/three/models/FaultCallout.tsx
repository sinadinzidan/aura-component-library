import { Html } from '@react-three/drei';

import { cn } from '../../../lib/utils';
import { toTuple } from '../cameraTargets';
import type { Vec3 } from '../cameraTargets';

export type FaultCalloutProps = {
  /** The faulted spot, in scene coordinates. */
  position: Vec3;
  /** Short name of what is wrong, e.g. "Drive-end bearing". */
  title: string;
  /** One line under it, e.g. "Fault · 94 % confidence". */
  detail?: string;
  /** Which way the leader line runs from the spot. */
  side?: 'left' | 'right';
  /** Length of the leader line in pixels. */
  reach?: number;
  onClick?: () => void;
};

/**
 * A callout pinned to a point on a model: a dot on the spot, a leader line running sideways and a
 * tag in the critical colour at its end. It points towards the panel that explains the fault, so
 * the eye travels from the machine to the diagnosis. Hidden from assistive technology; the panel
 * carries the content.
 */
export function FaultCallout({ position, title, detail, side = 'right', reach = 120, onClick }: FaultCalloutProps) {
  const right = side === 'right';
  const tag = 'pointer-events-auto flex flex-col gap-0.5 whitespace-nowrap border border-critical-foreground-strong bg-[color-mix(in_oklab,var(--card-background)_85%,transparent)] px-2 py-1 text-left backdrop-blur-sm';

  return (
    <Html position={toTuple(position)} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div data-slot="fault-callout" aria-hidden="true" className={cn('flex -translate-y-1/2 items-center font-sans', right ? 'flex-row' : '-translate-x-full flex-row-reverse')}>
        <span className="size-2 shrink-0 rotate-45 bg-critical-foreground-strong" />
        <span className="h-px shrink-0 bg-critical-foreground-strong" style={{ width: reach }} />
        {onClick ? (
          <button type="button" tabIndex={-1} onClick={onClick} className={cn(tag, 'cursor-pointer rounded-md')}>
            <span className="text-xs font-medium text-critical-foreground-strong">{title}</span>
            {detail ? <span className="text-xs tabular-nums text-medium-foreground">{detail}</span> : null}
          </button>
        ) : (
          <div className={cn(tag, 'rounded-md')}>
            <span className="text-xs font-medium text-critical-foreground-strong">{title}</span>
            {detail ? <span className="text-xs tabular-nums text-medium-foreground">{detail}</span> : null}
          </div>
        )}
      </div>
    </Html>
  );
}
