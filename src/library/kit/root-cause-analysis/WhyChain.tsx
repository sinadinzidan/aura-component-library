import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type WhyStep = {
  /** The answer at this level: "The drive-end bearing had worn." */
  answer: string;
  /** Evidence reference: "E-03 · bearing inspection". */
  evidence?: string;
};

type WhyChainProps = {
  /** The problem the chain starts from. */
  problem: string;
  steps: readonly WhyStep[];
  /** The last answer is the root cause; set false while the chain is unfinished. */
  concluded?: boolean;
  className?: string;
};

const SOLID_LOOKS = ['console', 'poster', 'signal'];

/**
 * Five whys as a staircase: each answer is indented one step further and becomes the question of
 * the next, so the reader follows the reasoning down to the root cause, which is set apart at the
 * bottom. Every answer can cite its evidence.
 */
export function WhyChain({ problem, steps, concluded = true, className }: WhyChainProps) {
  const look = useLook();
  const solid = SOLID_LOOKS.includes(look);

  return (
    <div data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      <p className="text-xs font-medium text-(--kit-text-2)">Problem</p>
      <p className="text-base leading-6 font-semibold">{problem}</p>
      <ol aria-label={`Why: ${problem}`} className="mt-3 flex flex-col gap-2">
        {steps.map((step, index) => {
          const root = concluded && index === steps.length - 1;
          return (
            <li
              key={step.answer}
              data-tone={root ? 'critical' : 'neutral'}
              data-root={root ? '' : undefined}
              className={cx(
                'flex items-start gap-3 rounded-(--kit-radius-sm) px-3 py-2.5',
                root ? (solid ? 'bg-(--t-solid) text-(--t-on-solid)' : 'border border-(--t-line) bg-(--t-soft)') : 'border border-(--kit-rule) bg-(--kit-halo)',
              )}
              style={{ marginLeft: `${index * 1.5}rem` }}
            >
              <span className={cx('shrink-0 text-sm leading-5 font-semibold whitespace-nowrap tabular-nums', root ? '' : 'text-(--kit-text-2)')}>Why {index + 1}</span>
              <span className="min-w-0 flex-1">
                {root ? <span className="block text-xs leading-4 font-semibold">Root cause</span> : null}
                <span className={cx('block text-sm leading-5', root ? 'font-semibold' : 'font-medium')}>{step.answer}</span>
                {step.evidence ? <span className={cx('block text-xs leading-4 tabular-nums', root && solid ? '' : 'text-(--kit-text-2)')}>{step.evidence}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
