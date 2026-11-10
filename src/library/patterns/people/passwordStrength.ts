/** One requirement a password is checked against. */
export type PasswordRule = {
  id: string;
  /** Shown in the checklist: "At least 12 characters". */
  label: string;
  test: (password: string) => boolean;
};

export type PasswordLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrengthResult = {
  /** 0 (empty) to 4 (strong). Drives the meter. */
  score: 0 | 1 | 2 | 3 | 4;
  level: PasswordLevel;
  /** Human label for the level: "Weak", "Fair", "Good", "Strong". Empty string while empty. */
  label: string;
  rules: readonly { id: string; label: string; met: boolean }[];
  /** Every rule is met, so the form may be submitted. */
  valid: boolean;
};

/** Length at which a password that meets every rule counts as strong rather than good. */
export const STRONG_LENGTH = 16;

export const DEFAULT_PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: 'At least 12 characters', test: (password) => password.length >= 12 },
  {
    id: 'case',
    label: 'Upper and lower case letters',
    test: (password) => /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password),
  },
  { id: 'number', label: 'A number', test: (password) => /\d/.test(password) },
  { id: 'symbol', label: 'A symbol', test: (password) => /[^\p{L}\d\s]/u.test(password) },
];

const LABELS: Record<PasswordLevel, string> = {
  empty: '',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};

/**
 * Scores a password against a rule list. The score follows the share of rules met: at most a
 * quarter is weak, anything short of all is fair, all is good, and all plus `STRONG_LENGTH`
 * characters is strong. Pure, so the same result drives the meter, the checklist and validation.
 */
export function scorePassword(
  password: string,
  rules: readonly PasswordRule[] = DEFAULT_PASSWORD_RULES
): PasswordStrengthResult {
  const checked = rules.map((rule) => ({ id: rule.id, label: rule.label, met: rule.test(password) }));
  const met = checked.filter((rule) => rule.met).length;
  const valid = password.length > 0 && met === rules.length;

  let level: PasswordLevel;
  if (password.length === 0) level = 'empty';
  else if (valid) level = password.length >= STRONG_LENGTH ? 'strong' : 'good';
  else if (rules.length > 0 && met / rules.length <= 0.25) level = 'weak';
  else level = 'fair';

  const SCORES = { empty: 0, weak: 1, fair: 2, good: 3, strong: 4 } as const;

  return { score: SCORES[level], level, label: LABELS[level], rules: checked, valid };
}
