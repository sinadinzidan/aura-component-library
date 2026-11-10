import { render, screen, within } from '@testing-library/react';

import { DashboardPanel } from './DashboardPanel';

describe(DashboardPanel.name, () => {
  it('groups its content under the panel title', () => {
    render(
      <DashboardPanel title="Active alarms" description="Sorted by severity">
        <p>Rows</p>
      </DashboardPanel>
    );

    const panel = screen.getByRole('group', { name: 'Active alarms' });
    expect(within(panel).getByRole('heading', { level: 4, name: 'Active alarms' })).toBeInTheDocument();
    expect(within(panel).getByText('Sorted by severity')).toBeInTheDocument();
    expect(within(panel).getByText('Rows')).toBeInTheDocument();
  });

  it('renders header actions and a footnote when given', () => {
    render(
      <DashboardPanel
        title="Gas export"
        actions={<button type="button">Open trend</button>}
        footnote="Export is 3% under plan for the day."
      >
        <p>Chart</p>
      </DashboardPanel>
    );

    expect(screen.getByRole('button', { name: 'Open trend' })).toBeInTheDocument();
    expect(screen.getByText('Export is 3% under plan for the day.')).toBeInTheDocument();
  });

  it('renders no footnote paragraph when none is given', () => {
    render(
      <DashboardPanel title="Gas export">
        <span>Chart</span>
      </DashboardPanel>
    );

    expect(screen.getByRole('group', { name: 'Gas export' }).querySelector('p.text-xs')).toBeNull();
  });
});
