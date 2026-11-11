import { IconCheck, IconCircle } from '@cognite/aura/icons';

import { DEFAULT_PASSWORD_RULES, scorePassword } from './passwordStrengthLogic';
import type { PasswordLevel, PasswordRule } from './passwordStrengthLogic';

type PasswordStrengthProps = {
  /** The password as typed. Nothing is stored or sent. */
  password: string;
  rules?: readonly PasswordRule[];
  /** The rule checklist under the meter. Turn off where the rules are listed elsewhere. */
  showRules?: boolean;
  /** Id of the root, so the password field can point at it with `aria-describedby`. */
  id?: string;
};

const SEGMENTS = [1, 2, 3, 4] as const;

const FILL: Record<PasswordLevel, string> = {
  empty: 'bg-medium-background',
  weak: 'bg-critical-foreground-strong',
  fair: 'bg-warning-foreground-strong',
  good: 'bg-success-foreground-strong',
  strong: 'bg-success-foreground-strong',
};

/**
 * A strength meter and rule checklist for a new password. The level is always written out next to
 * the bar and every rule carries a met / not met mark, so nothing depends on colour.
 */
export function PasswordStrength({
  password,
  rules = DEFAULT_PASSWORD_RULES,
  showRules = true,
  id,
}: PasswordStrengthProps) {
  const strength = scorePassword(password, rules);

  return (
    <div id={id} className="flex w-full flex-col gap-2 pt-2">
      <div className="flex items-center gap-3">
        <div
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={strength.score}
          aria-valuetext={strength.label === '' ? 'Not entered' : strength.label}
          className="flex flex-1 gap-1"
        >
          {SEGMENTS.map((segment) => (
            <span
              key={segment}
              className={`h-1 flex-1 rounded-full ${segment <= strength.score ? FILL[strength.level] : 'bg-medium-background'}`}
            />
          ))}
        </div>
        <span aria-hidden="true" className="w-12 text-right text-xs font-medium text-medium-foreground">
          {strength.label}
        </span>
      </div>
      {showRules ? (
        <ul className="flex flex-col gap-1">
          {strength.rules.map((rule) => (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-xs ${rule.met ? 'text-base-foreground' : 'text-muted-foreground'}`}
            >
              {rule.met ? (
                <IconCheck aria-hidden="true" className="size-3.5 shrink-0 text-success-foreground-strong" />
              ) : (
                <IconCircle aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              {rule.label}
              <span className="sr-only">{rule.met ? ', met' : ', not met'}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
