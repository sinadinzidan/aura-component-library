import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type PanelProps = {
  title?: string;
  /** One line under or beside the title: the scope, the period, the count. */
  subtitle?: string;
  /** Leading icon, usually an `IconChip`. */
  icon?: ReactNode;
  /** Controls at the end of the header. */
  actions?: ReactNode;
  /** A closing line: a link, a summary, a timestamp. */
  footer?: ReactNode;
  /** Colours the panel the way the look does it: a wash in studio, the title strip in console, the whole tile in signal. */
  tone?: Tone;
  /** `none` for content that runs to the panel edge, such as a table or a map. */
  padding?: 'default' | 'tight' | 'none';
  /** Layout classes: the grid span. */
  className?: string;
  children: ReactNode;
};

/**
 * The container of a kit screen. Its anatomy — border, shadow, fill, header style, padding and
 * radius — comes from the look, and it always fills the height of its grid cell so rows line up.
 */
export function Panel({ title, subtitle, icon, actions, footer, tone = 'neutral', padding = 'default', className, children }: PanelProps) {
  const look = useLook();
  const titleId = useId();
  const hasHead = Boolean(title || actions || icon);

  return (
    <section aria-labelledby={title ? titleId : undefined} data-look={look} data-tone={tone} data-pad={padding} className={cx('kit-panel', className)}>
      {hasHead ? (
        <header className="kit-panel-head">
          {icon ? <span className="kit-panel-icon">{icon}</span> : null}
          <div className="kit-panel-heading">
            {title ? (
              <h3 id={titleId} className="kit-panel-title">
                {title}
              </h3>
            ) : null}
            {subtitle ? <p className="kit-panel-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="kit-panel-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="kit-panel-body">{children}</div>
      {footer ? <footer className="kit-panel-foot">{footer}</footer> : null}
    </section>
  );
}
