import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './shells.css';

type PersonChipProps = {
  name: string;
  initials: string;
  /** Role or a detail line under the name. */
  role?: string;
  /** Family colour of the initials. */
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  /** Show only the initials; the name stays available to assistive technology. */
  compact?: boolean;
  className?: string;
};

/** A person as initials with their name and role: the signed-in user, an assignee, an approver. */
export function PersonChip({ name, initials, role, tone = 'blue', size = 'md', compact = false, className }: PersonChipProps) {
  const look = useLook();
  return (
    <span data-look={look} data-size={size} className={cx('shell-person', className)}>
      <span aria-hidden="true" data-tone={tone} className="shell-person-initials">
        {initials}
      </span>
      {compact ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className="shell-person-text">
          <span className="shell-person-name">{name}</span>
          {role ? <span className="shell-person-role">{role}</span> : null}
        </span>
      )}
    </span>
  );
}
