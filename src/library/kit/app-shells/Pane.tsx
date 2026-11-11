import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

type PaneProps = {
  title?: string;
  /** One line with the title: a count, a scope. */
  subtitle?: string;
  /** Controls at the end of the header. */
  actions?: ReactNode;
  /** Docked under the body: totals, a pager, form actions. */
  footer?: ReactNode;
  /** `well` is a quieter ground for navigation and inspectors; `canvas` lets the page backdrop show. */
  surface?: 'surface' | 'well' | 'canvas';
  /** `none` for a list or table that runs to the edge. */
  padding?: 'default' | 'tight' | 'none';
  /** Layout classes. */
  className?: string;
  children: ReactNode;
};

/** One region inside `Panes`, with an optional header strip and docked footer. */
export function Pane({ title, subtitle, actions, footer, surface = 'surface', padding = 'default', className, children }: PaneProps) {
  const look = useLook();
  const titleId = useId();
  return (
    <section aria-labelledby={title ? titleId : undefined} data-look={look} data-surface={surface} data-pad={padding} className={cx('shell-pane', className)}>
      {title || actions ? (
        <header className="shell-pane-head">
          <div className="shell-pane-heading">
            {title ? (
              <h3 id={titleId} className="shell-pane-title">
                {title}
              </h3>
            ) : null}
            {subtitle ? <p className="shell-pane-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="shell-pane-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="shell-pane-body">{children}</div>
      {footer ? <footer className="shell-pane-foot">{footer}</footer> : null}
    </section>
  );
}
