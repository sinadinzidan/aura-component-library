import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './boards.css';

type CalloutProps = {
  /** The finding in one line: "Four days exceeded the tolerance". */
  title: string;
  /** The evidence or what to do about it. */
  children?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  /** One follow-up action. */
  action?: ReactNode;
  className?: string;
};

/**
 * What a dashboard wants the reader to take away, in words: an insight beside a chart, a warning
 * above a board. A toned note in studio, a solid block in poster and signal, a pull quote in
 * editorial.
 */
export function Callout({ title, children, tone = 'accent', icon, action, className }: CalloutProps) {
  const look = useLook();
  return (
    <div role="note" data-look={look} data-tone={tone} className={cx('dash-callout', className)}>
      {icon ? (
        <span aria-hidden="true" className="dash-callout-icon">
          {icon}
        </span>
      ) : null}
      <div className="dash-callout-text">
        <p className="dash-callout-title">{title}</p>
        {children ? <div className="dash-callout-body">{children}</div> : null}
        {action ? <div className="dash-callout-action">{action}</div> : null}
      </div>
    </div>
  );
}
