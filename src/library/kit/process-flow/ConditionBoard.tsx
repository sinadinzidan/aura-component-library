import { IconCheck, IconLockOpen, IconX } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { BLOCK_ANATOMY, blockStyle } from './anatomy';
import { summariseConditions, type ConditionState } from './flow';

export type ConditionItem = {
  id: string;
  label: string;
  /** The tag and the reading that decides it. */
  detail?: string;
  state: ConditionState;
};

type ConditionBoardProps = {
  /** What the conditions guard: "Start permissives, recompressor". */
  label: string;
  items: readonly ConditionItem[];
  /** Words for the three states; permissives are met, interlocks are healthy. */
  words?: Record<ConditionState, string>;
  /** `tiles` is a grid of blocks, `rows` a checklist. */
  layout?: 'rows' | 'tiles';
  /** Columns of the tile grid. */
  columns?: number;
  /** Hides the counted summary line above the conditions. */
  hideSummary?: boolean;
  className?: string;
};

const STATE_TONE: Record<ConditionState, Tone> = { met: 'success', unmet: 'critical', bypassed: 'warning' };

const DEFAULT_WORDS: Record<ConditionState, string> = { met: 'Met', unmet: 'Not met', bypassed: 'Bypassed' };

function StateIcon({ state }: { state: ConditionState }) {
  if (state === 'met') return <IconCheck aria-hidden="true" />;
  if (state === 'unmet') return <IconX aria-hidden="true" />;
  return <IconLockOpen aria-hidden="true" />;
}

/**
 * Permissives or interlocks as a checklist with a counted verdict. Every condition shows an icon
 * and a word, never colour alone; the one that blocks is the heaviest thing on the board. As tiles
 * each condition is a block in the look's own anatomy — filled with its state in poster and signal.
 */
export function ConditionBoard({ label, items, words = DEFAULT_WORDS, layout = 'rows', columns = 3, hideSummary = false, className }: ConditionBoardProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const summary = summariseConditions(items.map((item) => item.state));
  const verdictTone: Tone = summary.clear ? (summary.bypassed > 0 ? 'warning' : 'success') : 'critical';

  const mark = (state: ConditionState, filled: boolean) => (
    <span
      className="flex size-6 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:stroke-[2.5]"
      style={{
        borderRadius: anatomy === 'card' || anatomy === 'tint' ? 999 : 'var(--kit-radius-sm)',
        background: filled ? 'transparent' : anatomy === 'outline' || anatomy === 'rule' ? 'transparent' : 'var(--t-solid)',
        color: filled ? 'currentColor' : anatomy === 'outline' || anatomy === 'rule' ? 'var(--t-ink)' : 'var(--t-on-solid)',
        boxShadow: filled ? 'inset 0 0 0 2px currentColor' : anatomy === 'outline' || anatomy === 'rule' ? 'inset 0 0 0 1.5px var(--t-line)' : undefined,
      }}
    >
      <StateIcon state={state} />
    </span>
  );

  return (
    <div data-look={look} data-layout={layout} className={cx('flex w-full min-w-0 flex-col gap-3', className)}>
      {hideSummary ? null : (
        <p data-tone={verdictTone} data-slot="condition-summary" className="flex flex-wrap items-baseline gap-x-2 text-sm text-(--kit-text-2)">
          <span className="text-2xl text-(--kit-text) tabular-nums" style={{ fontWeight: 'var(--kit-figure-weight)', letterSpacing: 'var(--kit-figure-tracking)' }}>
            {summary.met} of {summary.total}
          </span>
          <span>{words.met.toLowerCase()}</span>
          {summary.bypassed > 0 ? <span>· {summary.bypassed} bypassed</span> : null}
          <span className="font-semibold" style={{ color: 'var(--t-ink)' }}>
            · {summary.clear ? 'Nothing blocking' : `${summary.unmet} blocking`}
          </span>
        </p>
      )}
      {layout === 'tiles' ? (
        <ul aria-label={label} className="grid min-w-0 gap-(--kit-gap)" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <li key={item.id} data-tone={STATE_TONE[item.state]} data-state={item.state} className={cx('flex min-w-0 flex-col gap-2 p-3', anatomy === 'rule' && 'px-0')} style={blockStyle(look)}>
              <div className="flex items-center gap-2 text-(--kit-text)">
                {mark(item.state, anatomy === 'solid')}
                <span className={cx('font-bold', anatomy === 'solid' ? 'text-lg' : 'text-sm')} style={{ color: anatomy === 'solid' ? undefined : 'var(--t-ink)' }}>
                  {words[item.state]}
                </span>
              </div>
              <span className="text-sm font-semibold text-(--kit-text)">{item.label}</span>
              {item.detail ? <span className="text-xs text-(--kit-text-3) tabular-nums">{item.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-label={label} className="flex min-w-0 flex-col">
          {items.map((item) => (
            <li key={item.id} data-tone={STATE_TONE[item.state]} data-state={item.state} className="flex min-w-0 items-center gap-3 border-t border-(--kit-rule) py-2.5 first:border-t-0">
              {mark(item.state, false)}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cx('text-sm text-(--kit-text)', item.state === 'met' ? 'font-medium' : 'font-semibold')}>{item.label}</span>
                {item.detail ? <span className="text-xs text-(--kit-text-3) tabular-nums">{item.detail}</span> : null}
              </div>
              <span className="shrink-0 text-xs font-semibold" style={{ color: item.state === 'met' ? 'var(--kit-text-3)' : 'var(--t-ink)' }}>
                {words[item.state]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
