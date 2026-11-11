import { IconCircleCheck, IconCircleDashed } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { Meter } from '../Meter';
import { cx } from '../tones';

import type { PasswordRule } from './passwordRulesLogic';

const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

type PasswordRulesProps = {
  /** The policy with what is met so far, from `checkPassword`. */
  rules: readonly PasswordRule[];
  className?: string;
};

/**
 * The password policy as a live checklist with a strength meter: each rule turns from a dashed
 * circle to a tick as it is met, and the word next to the meter says where the password stands.
 */
export function PasswordRules({ rules, className }: PasswordRulesProps) {
  const look = useLook();
  const met = rules.filter((rule) => rule.met).length;
  const word = STRENGTH[Math.round((met / Math.max(rules.length, 1)) * (STRENGTH.length - 1))] ?? STRENGTH[0];
  return (
    <div data-look={look} className={cx('flex flex-col gap-4', className)}>
      <Meter
        label={`Strength: ${word}`}
        value={met}
        max={rules.length}
        unit={`of ${rules.length}`}
        hideScale
        tone={met === rules.length ? 'success' : met >= rules.length / 2 ? 'warning' : 'critical'}
      />
      <ul className="flex flex-col gap-2.5">
        {rules.map((rule) => (
          <li key={rule.id} data-met={rule.met ? '' : undefined} className="group flex items-center gap-2.5 text-sm text-(color:--kit-text-2) data-met:text-(color:--kit-text)">
            {rule.met ? (
              <IconCircleCheck aria-hidden="true" className="size-5 shrink-0 text-(color:--kit-line-success)" />
            ) : (
              <IconCircleDashed aria-hidden="true" className="size-5 shrink-0 text-(color:--kit-text-3)" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{rule.met ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
