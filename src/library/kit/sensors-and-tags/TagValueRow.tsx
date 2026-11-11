import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { SparkLine } from '../SparkLine';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx, formatNumber } from '../tones';

import { LimitScale } from './LimitScale';
import { judgeValue, qualityStatus, type TagLimits, type TagQuality } from './tags';

type TagValueRowProps = {
  tag: string;
  name: string;
  value: number;
  unit: string;
  decimals?: number;
  limits: TagLimits;
  range: readonly [number, number];
  quality?: TagQuality;
  /** Recent values for the trend column. */
  trend?: readonly number[];
  /** Hide the limit scale column when the row is narrow. */
  compact?: boolean;
  /** Age of the value when it is not live, e.g. `14 min old`. */
  age?: string;
  /** A checkbox, pin button or icon in front of the row. */
  leading?: ReactNode;
  /** Actions at the end of the row. */
  trailing?: ReactNode;
  className?: string;
};

/**
 * One tag on one line with aligned columns: name and tag id, trend, position against limits,
 * the live value and a state word. A bad or stale signal dims the figure and says why instead
 * of judging it against limits. Console and signal looks carry the state as an edge bar.
 */
export function TagValueRow({ tag, name, value, unit, decimals = 1, limits, range, quality = 'good', trend, compact = false, age, leading, trailing, className }: TagValueRowProps) {
  const look = useLook();
  const trusted = quality === 'good' || quality === 'uncertain';
  const judgement = trusted && quality === 'good' ? judgeValue(value, limits) : qualityStatus(quality);
  const word = quality === 'good' ? judgement.word : `${qualityStatus(quality).word} signal`;
  const edge = look === 'console' || look === 'signal' || look === 'poster';

  return (
    <li
      data-look={look}
      data-tone={judgement.tone}
      data-quality={quality}
      className={cx('flex min-w-0 items-center gap-4 py-3', edge ? 'pl-3' : '', className)}
      style={{ borderTop: '1px solid var(--kit-rule)', boxShadow: edge ? 'inset 4px 0 0 var(--t-line)' : undefined }}
    >
      {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
      <div className="min-w-0 flex-[1.4]">
        <p className="text-sm font-semibold text-(--kit-text)">{name}</p>
        <p className="flex items-center gap-2 text-xs text-(--kit-text-3)">
          <TagId>{tag}</TagId>
          {age ? <span>{age}</span> : null}
        </p>
      </div>
      {trend ? (
        <div className="w-24 shrink-0">
          <SparkLine values={trend} label={`${name}, recent trend`} tone={judgement.tone === 'success' ? 'accent' : judgement.tone} className="h-8" />
        </div>
      ) : null}
      {compact ? null : (
        <div className="min-w-0 flex-1">{trusted ? <LimitScale label={`${name} against limits`} value={value} min={range[0]} max={range[1]} unit={unit} decimals={decimals} limits={limits} bare /> : <span className="text-xs text-(--kit-text-3)">No trusted value</span>}</div>
      )}
      <p className="w-28 shrink-0 text-right tabular-nums" style={{ opacity: trusted ? 1 : 0.45 }}>
        <span className="text-(--kit-text)" style={{ fontSize: '1.25rem', lineHeight: 1.1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
          {trusted ? formatNumber(value, decimals) : '—'}
        </span>
        <span className="ml-1 text-xs font-medium text-(--kit-text-3)">{unit}</span>
      </p>
      <div className="flex w-32 shrink-0 justify-end">
        <StatusPill tone={judgement.tone}>{word}</StatusPill>
      </div>
      {trailing ? <div className="flex shrink-0 items-center gap-1">{trailing}</div> : null}
    </li>
  );
}
