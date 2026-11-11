export type PasswordRule = { id: string; label: string; met: boolean };

/** Checks a password against the account policy and says which rules it meets. */
export function checkPassword(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: 'At least 12 characters',
      met: password.length >= 12,
    },
    {
      id: 'case',
      label: 'Upper and lower case letters',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { id: 'digit', label: 'A number', met: /\d/.test(password) },
    {
      id: 'symbol',
      label: 'A symbol such as # or !',
      met: /[^A-Za-z0-9\s]/.test(password),
    },
  ];
}
