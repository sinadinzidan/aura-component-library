import { IconX } from '@cognite/aura/icons';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './records.css';

type SideSheetProps = {
  title: string;
  subtitle?: string;
  /** Next to the title: a status pill. */
  status?: ReactNode;
  /** Docked at the bottom: the actions on the record. */
  footer?: ReactNode;
  onClose?: () => void;
  /** Width in px. */
  width?: number;
  className?: string;
  children: ReactNode;
};

/**
 * A record opened over its list. Place it as the last child of a `relative` container: it dims
 * what is behind and docks to the end edge, so the list keeps its place while one row is read.
 */
export function SideSheet({ title, subtitle, status, footer, onClose, width = 440, className, children }: SideSheetProps) {
  const look = useLook();
  const titleId = useId();
  return (
    <>
      <div aria-hidden="true" className="rec-sheet-scrim" />
      <aside aria-labelledby={titleId} data-look={look} style={{ width }} className={cx('rec-sheet', className)}>
        <header className="rec-sheet-head">
          <div className="rec-sheet-heading">
            <h3 id={titleId} className="rec-sheet-title">
              {title}
            </h3>
            {subtitle ? <p className="rec-sheet-subtitle">{subtitle}</p> : null}
          </div>
          {status}
          <button type="button" className="rec-sheet-close" aria-label="Close" onClick={onClose}>
            <IconX aria-hidden="true" />
          </button>
        </header>
        <div className="rec-sheet-body">{children}</div>
        {footer ? <footer className="rec-sheet-foot">{footer}</footer> : null}
      </aside>
    </>
  );
}
