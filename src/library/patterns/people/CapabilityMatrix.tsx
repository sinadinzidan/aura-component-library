import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import { IconCheck, IconMinus } from '@cognite/aura/icons';
import { Fragment } from 'react';

import { Table } from '../../primitives/table/Table';
import type { TableProps } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCaption } from '../../primitives/table/TableCaption';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableRow } from '../../primitives/table/TableRow';
import { TableSectionRow } from '../../primitives/table/TableSectionRow';

export type MatrixRole = { id: string; label: string };
export type MatrixCapability = {
  id: string;
  label: string;
  description?: string;
};
export type MatrixGroup = {
  label: string;
  capabilities: readonly MatrixCapability[];
};

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
  /** The surface the matrix sits on, so its rows match it. */
  surface?: TableProps['surface'];
};

/**
 * Roles across, capabilities down. A granted cell is a check and a withheld one a dash, each with
 * a spoken equivalent, so the grid reads without colour. With `onToggle` the cells become
 * checkboxes named "role: capability", which is how a custom role is edited in place.
 */
export function CapabilityMatrix({
  caption,
  roles,
  groups,
  grants,
  onToggle,
  lockedRoleIds = [],
  surface = 'base',
}: CapabilityMatrixProps) {
  const isGranted = (roleId: string, capabilityId: string) =>
    grants[roleId]?.includes(capabilityId) ?? false;

  return (
    <Table hover={false} surface={surface}>
      <TableCaption srOnly>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Capability</TableHead>
          {roles.map((role) => (
            <TableHead key={role.id} align="center" className="w-24">
              {role.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <Fragment key={group.label}>
            <TableSectionRow colSpan={roles.length + 1}>
              {group.label}
            </TableSectionRow>
            {group.capabilities.map((capability) => (
              <TableRow key={capability.id}>
                <TableCell rowHeader>
                  <span className="block">{capability.label}</span>
                  {capability.description ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {capability.description}
                    </span>
                  ) : null}
                </TableCell>
                {roles.map((role) => {
                  const granted = isGranted(role.id, capability.id);
                  const editable =
                    onToggle !== undefined && !lockedRoleIds.includes(role.id);
                  return (
                    <TableCell key={role.id} align="center">
                      {editable ? (
                        <span className="inline-flex align-middle">
                          <CheckboxItemControl
                            aria-label={`${role.label}: ${capability.label}`}
                            checked={granted}
                            onCheckedChange={(checked) =>
                              onToggle(role.id, capability.id, checked)
                            }
                          />
                        </span>
                      ) : granted ? (
                        <>
                          <IconCheck
                            aria-hidden="true"
                            className="inline size-4 text-base-foreground"
                          />
                          <span className="sr-only">Allowed</span>
                        </>
                      ) : (
                        <>
                          <IconMinus
                            aria-hidden="true"
                            className="inline size-4 text-base-foreground-disabled"
                          />
                          <span className="sr-only">Not allowed</span>
                        </>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
