import { IconFileCheck, IconUpload } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './forms.css';

type DropAreaProps = {
  /** What to drop: "Drop a CSV or Excel file". */
  title: string;
  /** Limits and formats: "Up to 20 MB, one sheet". */
  hint?: string;
  /** The chosen file, when there is one. The area then shows the file instead of the prompt. */
  file?: { name: string; detail: string };
  /** A button to browse, or to replace the chosen file. */
  action?: ReactNode;
  className?: string;
};

/** The target of a file import: a dashed prompt while empty, the chosen file once there is one. */
export function DropArea({ title, hint, file, action, className }: DropAreaProps) {
  const look = useLook();
  return (
    <div data-look={look} data-state={file ? 'filled' : 'empty'} className={cx('form-drop', className)}>
      <span aria-hidden="true" className="form-drop-icon">
        {file ? <IconFileCheck /> : <IconUpload />}
      </span>
      <div className="form-drop-text">
        <p className="form-drop-title">{file ? file.name : title}</p>
        {file ? <p className="form-drop-hint">{file.detail}</p> : hint ? <p className="form-drop-hint">{hint}</p> : null}
      </div>
      {action ? <div className="form-drop-action">{action}</div> : null}
    </div>
  );
}
