import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { Panel } from '../Panel';
import { SparkLine } from '../SparkLine';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx, formatNumber } from '../tones';

import { LimitScale } from './LimitScale';
import { judgeValue, qualityStatus, type TagLimits, type TagQuality } from './tags';

type TagCardProps = {
  tag: string;
  name: string;
  /** The asset the tag belongs to. */
  asset?: string;
  value: number;
  unit: string;
  decimals?: number;
  limits: TagLimits;
  range: readonly [number, number];
  quality?: TagQuality;
  trend?: readonly number[];
  /** Short line under the figure, e.g. `93 % of high limit`. */
  caption?: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * A tag as a card: id and name, the live figure, a state word, the recent trend and the value
 * on its limit scale. The panel takes the tone of the judgement once it leaves normal, so a
 * near-limit tag is tinted in studio, title-stripped in console and filled in signal.
 */
export function TagCard({ tag, name, asset, value, unit, decimals = 1, limits, range, quality = 'good', trend, caption, actions, className }: TagCardProps) {
  const look = useLook();
  const trusted = quality === 'good' || quality === 'uncertain';
  const judgement = quality === 'good' ? judgeValue(value, limits) : qualityStatus(quality);
  const word = quality === 'good' ? judgement.word : `${qualityStatus(quality).word} signal`;
  const tone = judgement.tone === 'success' && look !== 'signal' ? 'neutral' : judgement.tone;
  const big = look === 'poster' || look === 'signal';

  return (
    <Panel tone={tone} className={cx('h-full', className)} footer={actions}>
      <div data-quality={quality} className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-(--kit-text)">{name}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-(--kit-text-3)">
              <TagId>{tag}</TagId>
              {asset ? <span>{asset}</span> : null}
            </p>
          </div>
          <StatusPill tone={judgement.tone} variant={look === 'signal' ? 'outline' : 'soft'}>
            {word}
          </StatusPill>
        </div>
        <div className="flex items-end justify-between gap-4">
          <p className="tabular-nums" style={{ opacity: trusted ? 1 : 0.45 }}>
            <span style={{ fontSize: big ? '3rem' : '2.25rem', lineHeight: 1, fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>{trusted ? formatNumber(value, decimals) : '—'}</span>
            <span className="ml-1.5 text-sm font-medium opacity-70">{unit}</span>
          </p>
          {trend && trusted ? (
            <div className="w-28 shrink-0">
              <SparkLine values={trend} label={`${name}, recent trend`} tone={judgement.tone === 'success' ? 'accent' : judgement.tone} />
            </div>
          ) : null}
        </div>
        {caption ? <p className="text-sm opacity-80">{caption}</p> : null}
        <div className="mt-auto pt-1">
          {trusted ? <LimitScale label={`${name} against limits`} value={value} min={range[0]} max={range[1]} unit={unit} decimals={decimals} limits={limits} /> : <p className="text-sm opacity-80">Limits are not judged while the signal cannot be trusted.</p>}
        </div>
      </div>
    </Panel>
  );
}
