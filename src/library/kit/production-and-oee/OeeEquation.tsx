import { Fragment } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { oeeOf, type OeeFactor } from './oee';

type OeeEquationProps = {
  /** The factors that multiply to the result, in the order losses occur. */
  factors: readonly OeeFactor[];
  /** Name of the product: "OEE". */
  resultLabel?: string;
  resultTarget?: number;
  resultTone?: Tone;
  decimals?: number;
  /** `sm` for a card, `md` for a hero row. */
  size?: 'sm' | 'md';
  className?: string;
};

const SOLID_LOOKS = ['console', 'poster', 'signal'];
const LINE_LOOKS = ['editorial', 'blueprint'];

function gapText(value: number, target: number, decimals: number): string {
  const gap = value - target;
  return Math.abs(gap) < 0.05 ? 'on target' : `${formatNumber(Math.abs(gap), decimals)} pts ${gap < 0 ? 'short' : 'over'}`;
}

/**
 * OEE written as the multiplication it is: each factor as a tile with its figure, a track against
 * target and what it lost, then the product. The product is computed from the factors, so the
 * tiles can never disagree with it. Tiles are tinted by default, solid blocks in the block-built
 * looks and ruled columns in editorial and blueprint.
 */
export function OeeEquation({ factors, resultLabel = 'OEE', resultTarget, resultTone = 'accent', decimals = 1, size = 'md', className }: OeeEquationProps) {
  const look = useLook();
  const solid = SOLID_LOOKS.includes(look);
  const lined = LINE_LOOKS.includes(look);
  const result = oeeOf(factors);
  const figure = size === 'md' ? 'text-4xl leading-none' : 'text-2xl leading-none';
  const operator = cx('flex shrink-0 items-center font-semibold text-(--kit-text-2)', size === 'md' ? 'px-3 text-2xl' : 'px-2 text-xl');
  const tile = cx(
    'flex min-w-0 flex-1 flex-col',
    size === 'md' ? 'gap-3 p-4' : 'gap-2 p-3',
    lined ? 'border-t-2 border-(--t-solid) px-0' : 'rounded-(--kit-radius-sm)',
    look === 'blueprint' && 'border border-t-2 border-(--kit-rule-strong) px-3',
  );

  return (
    <div
      role="group"
      aria-label={`${resultLabel} ${formatNumber(result, decimals)} %`}
      data-look={look}
      data-anatomy={solid ? 'solid' : lined ? 'line' : 'soft'}
      className={cx('flex items-stretch text-(--kit-text)', className)}
    >
      {factors.map((factor, index) => (
        <Fragment key={factor.label}>
          {index > 0 ? (
            <span aria-hidden="true" className={operator}>
              ×
            </span>
          ) : null}
          <div data-tone={factor.tone} className={cx(tile, solid ? 'bg-(--t-solid) text-(--t-on-solid)' : lined ? '' : 'bg-(--t-soft)')}>
            <span className={cx('text-sm font-medium', solid ? '' : 'text-(--kit-text-2)')}>{factor.label}</span>
            <span className={cx(figure, 'font-semibold tracking-tight tabular-nums')}>
              {formatNumber(factor.value, decimals)}
              <span className="ml-1 text-base font-medium">%</span>
            </span>
            <span aria-hidden="true" className={cx('relative h-2', solid ? 'bg-(--t-on-solid)/25' : 'rounded-full bg-(--kit-track)')}>
              <span className={cx('absolute inset-y-0 left-0', solid ? 'bg-(--t-on-solid)' : 'rounded-full bg-(--t-solid)')} style={{ width: `${Math.min(100, factor.value)}%` }} />
              {factor.target !== undefined ? (
                <span className={cx('absolute -inset-y-1 w-0.5', solid ? 'bg-(--t-on-solid)' : 'bg-(--kit-text)')} style={{ left: `${Math.min(100, factor.target)}%` }} />
              ) : null}
            </span>
            <span className={cx('text-xs leading-4', solid ? '' : 'text-(--kit-text-2)')}>
              {factor.target !== undefined ? `Target ${formatNumber(factor.target, decimals)} · ${gapText(factor.value, factor.target, decimals)}` : null}
              {factor.target !== undefined && factor.detail ? <br /> : null}
              {factor.detail}
            </span>
          </div>
        </Fragment>
      ))}
      <span aria-hidden="true" className={operator}>
        =
      </span>
      <div
        data-tone={resultTone}
        data-result=""
        className={cx(tile, 'justify-between', lined ? '' : 'bg-(--t-solid) text-(--t-on-solid)', look === 'poster' && 'border-2 border-(--kit-text)')}
      >
        <span className="text-sm font-semibold">{resultLabel}</span>
        <span className={cx(size === 'md' ? 'text-5xl leading-none' : 'text-3xl leading-none', 'font-semibold tracking-tight tabular-nums')}>
          {formatNumber(result, decimals)}
          <span className="ml-1 text-lg font-medium">%</span>
        </span>
        <span className="text-xs leading-4">
          {resultTarget !== undefined ? `Target ${formatNumber(resultTarget, decimals)} · ${gapText(result, resultTarget, decimals)}` : 'Product of the factors'}
        </span>
      </div>
    </div>
  );
}
