import type { ReactNode } from 'react';

import type { LookDefinition } from '../looks/looks';
import { useLookDefinition } from '../looks/useLook';

import { Canvas } from './Canvas';
import { cx } from './tones';

export type AppFrameNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** A count on the item, for example open alarms. */
  badge?: string;
};

type AppFrameProps = {
  /** Structure of the chrome. Leave out to use the one the look is usually paired with. */
  variant?: LookDefinition['chrome'];
  /** Product name and a detail line, such as the site. `mark` is the logo slot. */
  brand: { name: string; detail?: string; mark?: ReactNode };
  nav?: readonly AppFrameNavItem[];
  /** Id of the current nav item. */
  current?: string;
  onNavigate?: (id: string) => void;
  /** End of the nav: clock, shift, user. */
  tools?: ReactNode;
  /** Page title; leave out for chrome-only frames. */
  title?: string;
  subtitle?: string;
  /** Next to the title: the plant's state. */
  status?: ReactNode;
  /** End of the title bar: range switch, refresh. */
  actions?: ReactNode;
  /** Padding of the canvas inside the frame. */
  padding?: 'look' | 'none';
  className?: string;
  children: ReactNode;
};

/**
 * Page chrome for full-screen specimens: brand, navigation, a title bar and the canvas. The
 * variant sets the structure — sidebar, top bar, icon rail, masthead or none — and the look skins
 * it, from a white studio sidebar to a floating glass rail or a drawing's title block.
 */
export function AppFrame({
  variant,
  brand,
  nav = [],
  current,
  onNavigate,
  tools,
  title,
  subtitle,
  status,
  actions,
  padding = 'look',
  className,
  children,
}: AppFrameProps) {
  const { id: look, chrome } = useLookDefinition();
  const hasBar = Boolean(title || status || actions);

  return (
    <div data-look={look} data-variant={variant ?? chrome} className={cx('kit-frame', className)}>
      <nav aria-label={brand.name} className="kit-frame-nav">
        <div className="kit-frame-brand">
          {brand.mark ? (
            <span aria-hidden="true" className="kit-frame-mark">
              {brand.mark}
            </span>
          ) : null}
          <span className="kit-frame-brand-text">
            <span className="kit-frame-brand-name">{brand.name}</span>
            {brand.detail ? <span className="kit-frame-brand-detail">{brand.detail}</span> : null}
          </span>
        </div>
        {nav.length > 0 ? (
          <ul className="kit-frame-links">
            {nav.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="kit-frame-link"
                  aria-current={item.id === current ? 'page' : undefined}
                  onClick={() => onNavigate?.(item.id)}
                >
                  {item.icon}
                  <span className="kit-frame-link-label">{item.label}</span>
                  {item.badge ? <span className="kit-frame-badge">{item.badge}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {tools ? <div className="kit-frame-tools">{tools}</div> : null}
      </nav>
      <div className="kit-frame-main">
        {hasBar ? (
          <header className="kit-frame-bar">
            <div className="kit-frame-heading">
              {title ? <h2 className="kit-frame-title">{title}</h2> : null}
              {subtitle ? <p className="kit-frame-subtitle">{subtitle}</p> : null}
            </div>
            {status ? <div className="kit-frame-status">{status}</div> : null}
            {actions ? <div className="kit-frame-actions">{actions}</div> : null}
          </header>
        ) : null}
        <Canvas padding={padding}>{children}</Canvas>
      </div>
    </div>
  );
}
