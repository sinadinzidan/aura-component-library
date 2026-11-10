import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CapabilityMatrix } from './CapabilityMatrix';

const ROLES = [
  { id: 'viewer', label: 'Viewer' },
  { id: 'editor', label: 'Editor' },
];
const GROUPS = [
  {
    label: 'Time series',
    capabilities: [
      { id: 'ts:read', label: 'Read time series' },
      { id: 'ts:write', label: 'Write time series', description: 'Create, update and delete' },
    ],
  },
];
const GRANTS = { viewer: ['ts:read'], editor: ['ts:read', 'ts:write'] };

describe(CapabilityMatrix.name, () => {
  it('is a captioned table with a column per role', () => {
    render(<CapabilityMatrix caption="What each role can do" roles={ROLES} groups={GROUPS} grants={GRANTS} />);

    expect(screen.getByRole('table', { name: 'What each role can do' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Viewer' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Editor' })).toBeInTheDocument();
  });

  it('says in text whether each cell is allowed', () => {
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={GRANTS} />);

    const cells = within(rowOf('Write time series')).getAllByRole('cell');

    expect(cells[0]).toHaveTextContent('Not allowed');
    expect(cells[1]).toHaveTextContent('Allowed');
  });

  it('shows the group label and the capability description', () => {
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={GRANTS} />);

    expect(screen.getByText('Time series')).toBeInTheDocument();
    expect(screen.getByText('Create, update and delete')).toBeInTheDocument();
  });

  it('treats a role without grants as allowed nothing', () => {
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={{}} />);

    expect(screen.getAllByText('Not allowed')).toHaveLength(4);
  });

  it('is read-only without a toggle handler', () => {
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={GRANTS} />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('turns cells into named checkboxes when editable', async () => {
    const onToggle = vi.fn();
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={GRANTS} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Viewer: Write time series' }));

    expect(onToggle).toHaveBeenCalledWith('viewer', 'ts:write', true);
  });

  it('reports a withdrawn capability', async () => {
    const onToggle = vi.fn();
    render(<CapabilityMatrix caption="Roles" roles={ROLES} groups={GROUPS} grants={GRANTS} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Editor: Write time series' }));

    expect(onToggle).toHaveBeenCalledWith('editor', 'ts:write', false);
  });

  it('keeps locked roles read-only', () => {
    render(
      <CapabilityMatrix
        caption="Roles"
        roles={ROLES}
        groups={GROUPS}
        grants={GRANTS}
        onToggle={vi.fn()}
        lockedRoleIds={['viewer']}
      />
    );

    expect(screen.queryByRole('checkbox', { name: /^Viewer:/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: /^Editor:/ })).toHaveLength(2);
  });
});

function rowOf(capability: string): HTMLElement {
  const row = screen.getByRole('rowheader', { name: new RegExp(capability) }).closest('tr');
  if (row === null) throw new Error(`No row for ${capability}`);
  return row;
}
