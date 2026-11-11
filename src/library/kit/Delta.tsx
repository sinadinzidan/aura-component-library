import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@cognite/aura/icons';

import { useLook } from '../looks/useLook';

import { cx, formatNumber } from './tones';

export type DeltaProps = {
  /** The signed change, already computed. */
  value: number;
  decimals?: number;
  /** Unit after the number, for example `%` or ` pts`. */
  unit?: string;
  /** Which direction is good news. `none` reports the change without judging it. */
  good?: 'up' | 'down' | 'none';
  className?: string;
};

/**
 * A signed change with a judgement: arrow, sign and colour agree, and the sign is always written
 * so the meaning never rests on colour alone.
 */
export function Delta({ value, decimals = 1, unit = '', good = 'up', className }: DeltaProps) {
  const look = useLook();
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const sentiment = direction === 'flat' || good === 'none' ? 'neutral' : direction === good ? 'positive' : 'negative';
  const Icon = direction === 'up' ? IconArrowUpRight : direction === 'down' ? IconArrowDownRight : IconMinus;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return (
    <span data-look={look} data-sentiment={sentiment} data-direction={direction} className={cx('kit-delta', className)}>
      <Icon aria-hidden="true" />
      {sign}
      {formatNumber(Math.abs(value), decimals)}
      {unit}
    </span>
  );
}
