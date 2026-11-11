import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './forms.css';

type SettingRowProps = {
  title: string;
  /** What turning it on or changing it does. */
  description?: string;
  /** Next to the title: a pill such as "Admin only". */
  badge?: ReactNode;
  /** The control: a switch, a select, a button. Give it an accessible name that matches the title. */
  control: ReactNode;
  /** State of the setting, for looks that fill the row with it. */
  tone?: Tone;
  className?: string;
};

/** One setting: what it is, what it does, and its control at the end of the row. */
export function SettingRow({ title, description, badge, control, tone = 'neutral', className }: SettingRowProps) {
  const look = useLook();
  return (
    <div data-look={look} data-tone={tone} className={cx('form-setting', className)}>
      <div className="form-setting-text">
        <p className="form-setting-title">
          {title}
          {badge}
        </p>
        {description ? <p className="form-setting-description">{description}</p> : null}
      </div>
      <div className="form-setting-control">{control}</div>
    </div>
  );
}
