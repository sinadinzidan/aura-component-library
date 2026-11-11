import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BarrierTile } from './BarrierTile';

describe(BarrierTile.name, () => {
  it('writes the name, the state word and the detail', () => {
    render(<BarrierTile name="Gas detection" state="Degraded" tone="warning" detail="4 of 46 elements" mark="02" />);

    expect(screen.getByText('Gas detection')).toBeInTheDocument();
    expect(screen.getByText('Degraded')).toBeInTheDocument();
    expect(screen.getByText('4 of 46 elements')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('carries its state as a tone', () => {
    const { container } = render(<BarrierTile name="Containment" state="Healthy" tone="success" />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'success');
  });

  it('is a toggle button when selectable', async () => {
    const onSelect = vi.fn();
    render(<BarrierTile name="Active fire protection" state="Impaired" tone="critical" detail="2 elements" selected onSelect={onSelect} />);

    const tile = screen.getByRole('button', { name: 'Active fire protection: Impaired, 2 elements' });
    expect(tile).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(tile);
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
