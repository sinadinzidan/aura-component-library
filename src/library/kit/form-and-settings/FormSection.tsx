import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './forms.css';

type FormSectionProps = {
  title: string;
  /** What the group of fields is for and what it affects. */
  description?: string;
  /** Leading icon, usually an `IconChip`. */
  icon?: ReactNode;
  /** `aside` puts the title and description in a column beside the fields; `stacked` above them. */
  layout?: 'stacked' | 'aside';
  className?: string;
  /** The fields. */
  children: ReactNode;
};

/**
 * A named group of fields. Consecutive sections separate themselves with a rule; the look decides
 * its weight, and editorial numbers the sections.
 */
export function FormSection({ title, description, icon, layout = 'stacked', className, children }: FormSectionProps) {
  const look = useLook();
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} data-look={look} data-layout={layout} className={cx('form-section', className)}>
      <div className="form-section-head">
        {icon}
        <div className="min-w-0">
          <h3 id={titleId} className="form-section-title">
            {title}
          </h3>
          {description ? <p className="form-section-description">{description}</p> : null}
        </div>
      </div>
      <div className="form-section-fields">{children}</div>
    </section>
  );
}
