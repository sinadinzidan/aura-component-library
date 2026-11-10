import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { SidebarNav } from './SidebarNav';
import type { SidebarNavGroup } from './SidebarNav';

const GROUPS: readonly SidebarNavGroup[] = [
  {
    id: 'operate',
    items: [
      { id: 'overview', label: 'Overview', icon: <svg data-testid="overview-icon" /> },
      { id: 'alarms', label: 'Alarms', count: 4 },
      {
        id: 'assets',
        label: 'Assets',
        children: [
          { id: 'compression', label: 'Gas compression' },
          { id: 'export', label: 'Gas export' },
        ],
      },
    ],
  },
  {
    id: 'maintain',
    label: 'Maintain',
    collapsible: true,
    items: [
      { id: 'work-orders', label: 'Work orders', href: 'https://example.test/work-orders' },
      { id: 'reports', label: 'Reports', disabled: true },
    ],
  },
];

describe(SidebarNav.name, () => {
  it('renders a named navigation with labelled groups', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} />);

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Maintain' })).getByRole('link', { name: 'Work orders' })).toHaveAttribute(
      'href',
      'https://example.test/work-orders'
    );
  });

  it('marks the current page', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} activeId="alarms" />);

    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('reports the row the user picks', async () => {
    const onSelect = vi.fn();
    renderNav(<SidebarNav label="Main" groups={GROUPS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Alarms/ }));

    expect(onSelect).toHaveBeenCalledWith('alarms');
  });

  it('shows the count on its row', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} />);

    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveTextContent('4');
  });

  it('does not select a disabled row', async () => {
    const onSelect = vi.fn();
    renderNav(<SidebarNav label="Main" groups={GROUPS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Reports' }));

    expect(screen.getByRole('button', { name: 'Reports' })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('expands a parent row without navigating', async () => {
    const onSelect = vi.fn();
    renderNav(<SidebarNav label="Main" groups={GROUPS} onSelect={onSelect} />);
    expect(screen.queryByRole('button', { name: 'Gas compression' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Assets' }));

    expect(screen.getByRole('button', { name: 'Assets' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Gas compression' })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keeps the parent of the current page expanded', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} activeId="export" />);

    expect(screen.getByRole('button', { name: 'Gas export' })).toHaveAttribute('aria-current', 'page');
  });

  it('starts with the given parents expanded', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} defaultExpandedIds={['assets']} />);

    expect(screen.getByRole('button', { name: 'Gas compression' })).toBeInTheDocument();
  });

  it('folds and unfolds a collapsible group', async () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Maintain' }));

    expect(screen.getByRole('button', { name: 'Maintain' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Work orders' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Maintain' }));

    expect(screen.getByRole('link', { name: 'Work orders' })).toBeInTheDocument();
  });

  it('starts with the given groups folded', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} defaultCollapsedGroupIds={['maintain']} />);

    expect(screen.queryByRole('link', { name: 'Work orders' })).not.toBeInTheDocument();
  });

  it('keeps every row named when collapsed to a rail', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} collapsed />);

    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alarms' })).not.toHaveTextContent('4');
    expect(screen.queryByText('Maintain')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Maintain' })).toBeInTheDocument();
  });

  it('marks the parent of the current page in the rail and selects it on press', async () => {
    const onSelect = vi.fn();
    renderNav(<SidebarNav label="Main" groups={GROUPS} collapsed activeId="export" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Assets' }));

    expect(screen.getByRole('button', { name: 'Assets' }).className).toContain('bg-secondary-background');
    expect(onSelect).toHaveBeenCalledWith('assets');
  });

  it('uses the fixed-dark tokens for dark chrome', () => {
    renderNav(<SidebarNav label="Main" groups={GROUPS} tone="dark" activeId="alarms" />);

    expect(screen.getByRole('button', { name: /Alarms/ }).className).toContain('bg-secondary-background-fixed-dark');
    expect(screen.getByRole('button', { name: 'Overview' }).className).toContain('text-medium-foreground-fixed-dark');
  });
});

function renderNav(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
