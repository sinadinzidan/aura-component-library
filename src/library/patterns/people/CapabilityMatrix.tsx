import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import { IconCheck, IconMinus } from '@cognite/aura/icons';
import { Fragment } from 'react';

export type MatrixRole = { id: string; label: string };
export type MatrixCapability = { id: string; label: string; description?: string };
export type MatrixGroup = { label: string; capabilities: readonly MatrixCapability[] };

type CapabilityMatrixProps = {
  /** Names the table: "What each role can do". */
  caption: string;
  /** Columns, least to most privileged. */
  roles: readonly MatrixRole[];
  /** Rows, grouped by the resource they act on. */
  groups: readonly MatrixGroup[];
  /** Capability ids granted to each role id. */
  grants: Readonly<Record<string, readonly string[]>>;
  /** Makes the cells checkboxes. Without it the matrix is read-only. */
  onToggle?: (roleId: string, capabilityId: string, granted: boolean) => void;
  /** Roles whose column stays read-only while the rest are editable, such as built-in roles. */
  lockedRoleIds?: readonly string[];
};

/**
 * Roles across, capabilities down. A granted cell is a check and a withheld one a dash, each with
 * a spoken equivalent, so the grid reads without colour. With `onToggle` the cells become
 * checkboxes named "role: capability", which is how a custom role is edited in place.
 */
export function CapabilityMatrix({ caption, roles, groups, grants, onToggle, lockedRoleIds = [] }: CapabilityMatrixProps) {
  const isGranted = (roleId: string, capabilityId: string) => grants[roleId]?.includes(capabilityId) ?? false;

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
            Capability
          </th>
          {roles.map((role) => (
            <th key={role.id} scope="col" className="w-24 px-2 py-2 text-center text-xs font-medium text-muted-foreground">
              {role.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {groups.map((group) => (
          <Fragment key={group.label}>
            <tr>
              <th
                scope="colgroup"
                colSpan={roles.length + 1}
                className="pt-4 pb-1 text-left text-xs font-medium text-muted-foreground"
              >
                {group.label}
              </th>
            </tr>
            {group.capabilities.map((capability) => (
              <tr key={capability.id} className="border-b border-default last:border-b-0">
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  <span className="block font-medium text-base-foreground">{capability.label}</span>
                  {capability.description ? (
                    <span className="block text-xs text-muted-foreground">{capability.description}</span>
                  ) : null}
                </th>
                {roles.map((role) => {
                  const granted = isGranted(role.id, capability.id);
                  const editable = onToggle !== undefined && !lockedRoleIds.includes(role.id);
                  return (
                    <td key={role.id} className="px-2 py-2 text-center">
                      {editable ? (
                        <span className="inline-flex align-middle">
                          <CheckboxItemControl
                            aria-label={`${role.label}: ${capability.label}`}
                            checked={granted}
                            onCheckedChange={(checked) => onToggle(role.id, capability.id, checked)}
                          />
                        </span>
                      ) : granted ? (
                        <>
                          <IconCheck aria-hidden="true" className="inline size-4 text-base-foreground" />
                          <span className="sr-only">Allowed</span>
                        </>
                      ) : (
                        <>
                          <IconMinus aria-hidden="true" className="inline size-4 text-base-foreground-disabled" />
                          <span className="sr-only">Not allowed</span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}
