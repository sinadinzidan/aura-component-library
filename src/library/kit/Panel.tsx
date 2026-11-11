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
  /**
   * `floating` is for a panel over a 3D scene, a map or an image: an opaque-enough ground for the
   * look, a lifted shadow and a blur of what is behind it.
   */
  variant?: 'default' | 'floating';
  /** Layout classes: the grid span, or `h-auto` to size to the content. */
  className?: string;
  children: ReactNode;
};

/**
 * The container of a kit screen. Its anatomy — border, shadow, fill, header style, padding and
 * radius — comes from the look. It fills the height of its grid cell so rows line up; pass
 * `className="h-auto"` (with `flex-1` in a flex column) when it should size to its content.
 * In a narrow panel the actions wrap under the title instead of squeezing it.
 */
export function Panel({ title, subtitle, icon, actions, footer, tone = 'neutral', padding = 'default', variant = 'default', className, children }: PanelProps) {
  const look = useLook();
  const titleId = useId();
  const hasHead = Boolean(title || actions || icon);

  return (
    <section aria-labelledby={title ? titleId : undefined} data-look={look} data-tone={tone} data-pad={padding} data-variant={variant} className={cx('kit-panel', className)}>
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
