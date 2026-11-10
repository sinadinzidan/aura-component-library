import { Badge } from '@cognite/aura/components/badge';
import { IconCrown, IconEye, IconPencil, IconShield, IconWorld } from '@cognite/aura/icons';

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';

type RoleBadgeProps = {
  role: MemberRole;
  /** Overrides the default label, for example a translated or organisation-specific role name. */
  label?: string;
  /** Hide the icon only where the same role repeats down a dense column. */
  showIcon?: boolean;
};

const ROLES: Record<MemberRole, { label: string; icon: typeof IconEye; outline: boolean }> = {
  owner: { label: 'Owner', icon: IconCrown, outline: false },
  admin: { label: 'Admin', icon: IconShield, outline: false },
  editor: { label: 'Editor', icon: IconPencil, outline: true },
  viewer: { label: 'Viewer', icon: IconEye, outline: true },
  guest: { label: 'Guest', icon: IconWorld, outline: true },
};

/**
 * A role as a badge. Roles are a rank, not a status, so they stay neutral: the icon and the label
 * tell them apart, and the two roles that can manage others are filled while the rest are outlined.
 */
export function RoleBadge({ role, label, showIcon = true }: RoleBadgeProps) {
  const { label: defaultLabel, icon: Icon, outline } = ROLES[role];

  return (
    <Badge variant="secondary" outline={outline}>
      {showIcon ? <Icon aria-hidden="true" /> : null}
      {label ?? defaultLabel}
    </Badge>
  );
}
