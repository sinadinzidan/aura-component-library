import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { confidenceLevel, type ConfidenceLevel } from './forecast';

const LEVELS: Record<ConfidenceLevel, { bars: number; word: string; tone: Tone }> = {
  high: { bars: 3, word: 'High confidence', tone: 'success' },
  medium: { bars: 2, word: 'Medium confidence', tone: 'info' },
  low: { bars: 1, word: 'Low confidence', tone: 'warning' },
};

type ConfidenceMeterProps = {
  /** 0–100. */
  percent: number;
  /** Why it is what it is: "30 days of history, 4 similar events". */
  detail?: string;
  /** `inline` is one line for a row or a caption; `block` adds the detail underneath. */
  variant?: 'inline' | 'block';
  className?: string;
};

/**
 * How far to trust a prediction, as three rising bars, a word and the score — never colour alone,
 * and never a bare percentage that looks like precision.
 */
export function ConfidenceMeter({ percent, detail, variant = 'inline', className }: ConfidenceMeterProps) {
  const look = useLook();
  const level = LEVELS[confidenceLevel(percent)];
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const bars = (
    <span aria-hidden="true" className="flex shrink-0 items-end gap-[3px]">
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          data-on={bar <= level.bars}
          className="w-1.5"
          style={{
            height: 4 + bar * 4,
            borderRadius: square ? 0 : 2,
            background: bar <= level.bars ? 'var(--t-line)' : 'var(--kit-track)',
            boxShadow: bar > level.bars ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined,
          }}
        />
      ))}
    </span>
  );

  return (
    <div
      role="img"
      aria-label={`${level.word}, ${Math.round(percent)} %${detail ? `. ${detail}` : ''}`}
      data-look={look}
      data-tone={level.tone}
      data-level={confidenceLevel(percent)}
      className={cx('min-w-0 text-(--kit-text)', variant === 'inline' ? 'inline-flex items-center gap-2' : 'flex flex-col gap-1', className)}
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
        {bars}
        {level.word}
        <span className="text-(--kit-text-3) tabular-nums">{Math.round(percent)} %</span>
      </span>
      {variant === 'block' && detail ? <span className="text-xs text-(--kit-text-3)">{detail}</span> : null}
    </div>
  );
}
