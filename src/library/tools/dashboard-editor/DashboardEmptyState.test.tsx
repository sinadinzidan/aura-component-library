import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardEmptyState } from './DashboardEmptyState';

describe(DashboardEmptyState.name, () => {
  it('says the dashboard is empty and what to do', () => {
    render(<DashboardEmptyState />);

    expect(screen.getByText('This dashboard has no widgets')).toBeInTheDocument();
  });

  it('adds a suggested widget in one click', async () => {
    const onAdd = vi.fn();
    render(<DashboardEmptyState suggestions={[{ type: 'kpi', label: 'KPI' }]} onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: 'KPI' }));

    expect(onAdd).toHaveBeenCalledWith('kpi');
  });

  it('opens the full widget list', async () => {
    const onBrowse = vi.fn();
    render(<DashboardEmptyState onBrowse={onBrowse} />);

    await userEvent.click(screen.getByRole('button', { name: 'Browse all widgets' }));

    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it('offers no actions when it has none', () => {
    render(<DashboardEmptyState />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
