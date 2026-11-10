import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MasterDetailLayout } from './MasterDetailLayout';

const PANES = {
  master: <p>Asset list</p>,
  detail: <p>Asset detail</p>,
  masterLabel: 'Assets',
  detailLabel: 'Asset details',
};

describe(MasterDetailLayout.name, () => {
  it('shows both panes as named regions', () => {
    render(<MasterDetailLayout {...PANES} />);

    expect(screen.getByRole('region', { name: 'Assets' })).toHaveTextContent('Asset list');
    expect(screen.getByRole('region', { name: 'Asset details' })).toHaveTextContent('Asset detail');
  });

  it('renders the navigation column when given one', () => {
    render(<MasterDetailLayout {...PANES} navigation={<p>Areas</p>} navigationLabel="Plant areas" />);

    expect(screen.getByRole('navigation', { name: 'Plant areas' })).toHaveTextContent('Areas');
  });

  it('has no resize handle unless resizable', () => {
    render(<MasterDetailLayout {...PANES} />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('resizes the master pane with the arrow keys', () => {
    render(<MasterDetailLayout {...PANES} resizable masterWidth={40} />);
    const handle = screen.getByRole('separator', { name: 'Resize assets pane' });

    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '44');
    expect(screen.getByRole('region', { name: 'Assets' })).toHaveStyle({ width: '44%' });

    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '36');
  });

  it('keeps the width within its limits', () => {
    render(<MasterDetailLayout {...PANES} resizable />);
    const handle = screen.getByRole('separator');

    fireEvent.keyDown(handle, { key: 'Home' });
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle).toHaveAttribute('aria-valuenow', '24');

    fireEvent.keyDown(handle, { key: 'End' });
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle).toHaveAttribute('aria-valuenow', '60');
  });

  it('shows only the list in stacked mode', () => {
    render(<MasterDetailLayout {...PANES} mode="stacked" />);

    expect(screen.getByText('Asset list')).toBeInTheDocument();
    expect(screen.queryByText('Asset detail')).not.toBeInTheDocument();
  });

  it('shows the detail with a back button in stacked mode', async () => {
    const onBack = vi.fn();
    render(<MasterDetailLayout {...PANES} mode="stacked" detailOpen onBack={onBack} backLabel="Assets" />);

    expect(screen.queryByText('Asset list')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Assets' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
