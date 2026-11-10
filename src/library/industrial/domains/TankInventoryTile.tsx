import { Card } from '@cognite/aura/components/card';
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { LevelMeter } from '../LevelMeter';
import { LABEL_TEXT, formatReading, toneFromLimits } from '../status';
import type { Limits, StatusDescriptor } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { fillPercent, ullage } from './inventory';

export type TankMovement = {
  direction: 'filling' | 'emptying' | 'static';
  /** Net rate in `rateUnit`, always positive. */
  rate?: number;
  rateUnit?: string;
};

export type TankInventoryTileProps = {
  /** Tank tag, printed in monospace. */
  tag: string;
  /** What is stored. */
  product: string;
  /** Current volume and shell capacity in `unit`. */
  volume: number | null;
  capacity: number;
  unit?: string;
  decimals?: number;
  /** Level limits in percent of capacity. All four decide the state; the drawing marks low and high. */
  limits?: Limits;
  movement?: TankMovement;
  /** Overrides the state derived from the limits, e.g. "Out of service". */
  status?: StatusDescriptor;
  /** Height of the tank drawing in pixels. */
  height?: number;
  className?: string;
};

const MOVEMENT = {
  filling: { word: 'Filling', Icon: IconArrowUpRight },
  emptying: { word: 'Emptying', Icon: IconArrowDownRight },
  static: { word: 'Static', Icon: IconMinus },
} as const;

function limitStatus(level: number, limits: Limits): StatusDescriptor | undefined {
  const tone = toneFromLimits(level, limits);
  if (tone === 'neutral') return undefined;
  const high = limits.high !== undefined && level > limits.high;
  if (tone === 'critical') return { tone, label: high ? 'High-high level' : 'Low-low level', shape: 'diamond' };
  return { tone, label: high ? 'High level' : 'Low level', shape: 'square' };
}

/**
 * One storage tank: level as a drawing and a percentage, the volume in it and the ullage left to
 * fill. Level limits colour the tile only once they are crossed, and the state is then named.
 */
export function TankInventoryTile({
  tag,
  product,
  volume,
  capacity,
  unit = 'm³',
  decimals = 0,
  limits = {},
  movement,
  status,
  height = 112,
  className,
}: TankInventoryTileProps) {
  const hasVolume = volume !== null && Number.isFinite(volume);
  const level = hasVolume ? fillPercent(volume, capacity) : null;
  const resolvedStatus = status ?? (level === null ? undefined : limitStatus(level, limits));
  const tone = resolvedStatus?.tone ?? 'neutral';
  const Movement = movement ? MOVEMENT[movement.direction] : null;

  return (
    <Card data-slot="tank-inventory-tile" data-tone={tone} role="group" aria-label={`${product}, tank ${tag}`} className={cn('w-full min-w-0 gap-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-base-foreground">{product}</span>
          <span className="font-mono text-xs text-muted-foreground">{tag}</span>
        </div>
        {resolvedStatus ? <StatusIndicator size="sm" className="pt-0.5" {...resolvedStatus} /> : null}
      </div>

      <div className="flex items-stretch gap-4">
        <LevelMeter label={`${product} level`} value={level} limits={{ low: limits.low, high: limits.high }} tone={tone} height={height} decimals={1} showReadout={false} />
        <dl className="flex min-w-0 flex-1 flex-col justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <dt className={LABEL_TEXT}>Level</dt>
            <dd>
              <ValueReadout size="md" value={level} unit="%" decimals={1} tone={tone === 'info' ? 'neutral' : tone} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className={LABEL_TEXT}>Volume</dt>
            <dd>
              <ValueReadout size="xs" value={hasVolume ? volume : null} unit={unit} decimals={decimals} />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className={LABEL_TEXT}>Ullage</dt>
            <dd>
              <ValueReadout size="xs" value={hasVolume ? ullage(capacity, volume) : null} unit={unit} decimals={decimals} />
            </dd>
          </div>
        </dl>
      </div>

      {movement && Movement ? (
        <p data-slot="tank-movement" className={cn(LABEL_TEXT, 'flex items-center gap-1.5 tabular-nums')}>
          <Movement.Icon aria-hidden="true" className="size-3.5" />
          {Movement.word}
          {movement.rate !== undefined && movement.direction !== 'static' ? ` at ${formatReading(movement.rate, movement.rateUnit, 0)}` : null}
        </p>
      ) : null}
    </Card>
  );
}
