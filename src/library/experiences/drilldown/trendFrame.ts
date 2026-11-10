import type { TrendLimit } from '../../industrial/charts/TrendChart';
import { formatLimit } from '../../industrial/status';

import type { DrillReading } from './hierarchy';

export type TrendFrame = { lines: TrendLimit[]; bottom: number; top: number };

/**
 * The limits worth drawing and the y range that holds them. A limit far from the data is left
 * out, so a value hugging its high limit is not flattened by a low limit half a scale away.
 */
export function trendFrame(low: number, high: number, reading: Pick<DrillReading, 'limits' | 'decimals' | 'rangeMin'>): TrendFrame {
  const { limits, decimals, rangeMin } = reading;
  const band = (limits.high ?? high) - (limits.low ?? low);
  const near = Math.max(band * 0.4, high - low);
  const pad = Math.max(band * 0.06, (high - low) * 0.25, 10 ** -decimals);
  const lines: TrendLimit[] = [];
  let top = high;
  let bottom = low;

  if (limits.high !== undefined && limits.high - high <= near) {
    lines.push({ value: limits.high, label: `High ${formatLimit(limits.high, decimals)}`, tone: 'warning', align: 'left' });
    top = Math.max(top, limits.high);
    if (limits.highHigh !== undefined && limits.highHigh - high <= near) {
      lines.push({ value: limits.highHigh, label: `Trip ${formatLimit(limits.highHigh, decimals)}`, tone: 'critical', align: 'right' });
      top = Math.max(top, limits.highHigh);
    }
  }
  if (limits.low !== undefined && limits.low > rangeMin && low - limits.low <= near) {
    lines.push({ value: limits.low, label: `Low ${formatLimit(limits.low, decimals)}`, tone: 'neutral', align: 'left' });
    bottom = Math.min(bottom, limits.low);
  }
  return { lines, bottom: Math.max(rangeMin, bottom - pad), top: top + pad };
}
