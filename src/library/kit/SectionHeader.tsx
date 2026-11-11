import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx } from './tones';

type SectionHeaderProps = {
  title: string;
  /** A short line above the title: the site, the report name. */
  eyebrow?: string;
  description?: string;
  /** Controls at the end: range switch, refresh, export. */
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Heading level to render, 1–4. */
  level?: 1 | 2 | 3 | 4;
  className?: string;
};

const HEADINGS = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4' } as const;

/** The heading of a screen or of a band inside it, sized and weighted by the look. */
export function SectionHeader({ title, eyebrow, description, actions, size = 'md', level = 2, className }: SectionHeaderProps) {
  const look = useLook();
  const Heading = HEADINGS[level];
  return (
    <header data-look={look} data-size={size} className={cx('kit-section', className)}>
      <div className="kit-section-text">
        {eyebrow ? <p className="kit-section-eyebrow">{eyebrow}</p> : null}
        <Heading className="kit-section-title">{title}</Heading>
        {description ? <p className="kit-section-description">{description}</p> : null}
      </div>
      {actions ? <div className="kit-section-actions">{actions}</div> : null}
    </header>
  );
}
