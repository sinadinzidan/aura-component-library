import { render, screen } from '@testing-library/react';

import { TwoPaneLayout } from './TwoPaneLayout';

describe(TwoPaneLayout.name, () => {
  it('shows both panes under their names', () => {
    render(<TwoPaneLayout primaryLabel="Work orders" secondaryLabel="Work order details" primary={<p>List</p>} secondary={<p>Detail</p>} />);

    expect(screen.getByRole('region', { name: 'Work orders' })).toHaveTextContent('List');
    expect(screen.getByRole('region', { name: 'Work order details' })).toHaveTextContent('Detail');
  });
});
