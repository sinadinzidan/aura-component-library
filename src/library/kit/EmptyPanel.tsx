import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx } from './tones';

type EmptyPanelProps = {
  title: string;
  /** Why it is empty and what will fill it. */
  description?: string;
  /** Icon element shown above the title. */
  icon?: ReactNode;
  /** One action that resolves the empty state. */
  action?: ReactNode;
  className?: string;
};

/** The body of a panel with nothing to show yet. It fills the panel so the grid keeps its shape. */
export function EmptyPanel({ title, description, icon, action, className }: EmptyPanelProps) {
  const look = useLook();
  return (
    <div data-look={look} className={cx('kit-empty', className)}>
      {icon ? (
        <span aria-hidden="true" data-look={look} data-tone="neutral" data-size="lg" className="kit-chip">
          {icon}
        </span>
      ) : null}
      <p className="kit-empty-title">{title}</p>
      {description ? <p className="kit-empty-text">{description}</p> : null}
      {action}
    </div>
  );
}
