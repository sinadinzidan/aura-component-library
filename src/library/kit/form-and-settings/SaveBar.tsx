import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './forms.css';

type SaveBarProps = {
  /** State of the form in words: "3 unsaved changes", "All changes saved 14:00". */
  message: string;
  /** `warning` while there are unsaved changes, `success` right after saving. */
  tone?: 'neutral' | 'warning' | 'success';
  /** An icon instead of the tone mark. */
  icon?: ReactNode;
  /** The form's actions, primary last. */
  actions: ReactNode;
  className?: string;
};

/** Docked under a form: what state the form is in, and the actions that resolve it. */
export function SaveBar({ message, tone = 'neutral', icon, actions, className }: SaveBarProps) {
  const look = useLook();
  return (
    <div role="group" aria-label="Form actions" data-look={look} data-tone={tone} className={cx('form-savebar', className)}>
      <p role="status" className="form-savebar-message">
        {icon ?? (tone === 'neutral' ? null : <span aria-hidden="true" className="form-savebar-mark" />)}
        <span>{message}</span>
      </p>
      <div className="form-savebar-actions">{actions}</div>
    </div>
  );
}
