import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EntityCard } from './EntityCard';

describe(EntityCard.name, () => {
  it('shows the title, description, status and body', () => {
    render(
      <EntityCard title="Compressor telemetry" description="Data set" status={<span>Healthy</span>}>
        <p>1,284 time series</p>
      </EntityCard>
    );

    expect(screen.getByRole('heading', { name: 'Compressor telemetry' })).toBeInTheDocument();
    expect(screen.getByText('Data set')).toBeInTheDocument();
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('1,284 time series')).toBeInTheDocument();
  });

  it('renders footer note and actions', () => {
    render(<EntityCard title="Daily report" footerNote="Updated 06:00" footerActions={<button type="button">Open report</button>} />);

    expect(screen.getByText('Updated 06:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open report' })).toBeInTheDocument();
  });

  it('renders media', () => {
    render(<EntityCard title="P&ID" media={<div data-testid="media" />} />);

    expect(screen.getByTestId('media')).toBeInTheDocument();
  });

  it('has no checkbox unless it is selectable', () => {
    render(<EntityCard title="Export pump A" />);

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('reports selection changes', async () => {
    const onChange = vi.fn();
    render(<EntityCard title="Export pump A" selection={{ checked: false, onChange, label: 'Select Export pump A' }} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Export pump A' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('marks the card while it is selected', () => {
    const { container } = render(
      <EntityCard title="Export pump A" selection={{ checked: true, onChange: vi.fn(), label: 'Select Export pump A' }} />
    );

    expect(container.querySelector('[data-slot="entity-card"]')).toHaveAttribute('data-selected');
  });
});
