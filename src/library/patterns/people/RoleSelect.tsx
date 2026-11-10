import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconLock } from '@cognite/aura/icons';

export type RoleOption = {
  value: string;
  label: string;
  /** What the role can do, in a few words. Shown under the label in the list. */
  description?: string;
};

type RoleSelectProps = {
  roles: readonly RoleOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name: "Role for Aisha Khan". */
  label: string;
  size?: 'sm' | 'default';
  /**
   * When set, the role cannot be changed here. The select is replaced by the role name with a
   * lock, and this sentence is its tooltip: "The owner role is transferred, not changed."
   */
  lockedReason?: string;
};

/**
 * The role control in a member or access row: a compact select whose options say what each role
 * can do. A role that cannot be changed is shown as locked text with the reason, rather than as a
 * disabled control nobody can ask about.
 */
export function RoleSelect({ roles, value, onValueChange, label, size = 'sm', lockedReason }: RoleSelectProps) {
  const current = roles.find((role) => role.value === value);

  if (lockedReason !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={`${label}: ${current?.label ?? value}. ${lockedReason}`}
              className="flex h-7 cursor-default items-center gap-1.5 rounded-md px-2 text-sm font-medium text-medium-foreground outline-none focus-visible:shadow-focus-ring"
            />
          }
        >
          <IconLock aria-hidden="true" className="size-3.5 text-muted-foreground" />
          {current?.label ?? value}
        </TooltipTrigger>
        <TooltipContent>{lockedReason}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Select
      items={roles.map((role) => ({ value: role.value, label: role.label }))}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger aria-label={label} size={size}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            <span className="flex flex-col py-0.5">
              <span>{role.label}</span>
              {role.description ? (
                <span className="text-xs font-normal text-muted-foreground">{role.description}</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
