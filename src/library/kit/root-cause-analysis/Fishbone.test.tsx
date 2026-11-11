import { render, screen } from '@testing-library/react';

import { Fishbone } from './Fishbone';

const CATEGORIES = [
  { name: 'Equipment', causes: [{ label: 'Bearing wear', state: 'confirmed' as const }] },
  { name: 'Method', causes: [{ label: 'Filter change interval', state: 'contributing' as const }] },
  { name: 'Measurement', causes: [{ label: 'Probe fault', state: 'ruled-out' as const }] },
  { name: 'Environment', causes: [] },
];

describe(Fishbone.name, () => {
  it('puts the effect at the head and one rib per category', () => {
    const { container } = render(<Fishbone effect="Recompressor tripped on high vibration" categories={CATEGORIES} />);

    expect(screen.getByRole('group', { name: 'Causes of: Recompressor tripped on high vibration' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-category]')).toHaveLength(4);
    expect(screen.getByText('Equipment')).toBeInTheDocument();
  });

  it('carries the state of each cause', () => {
    render(<Fishbone effect="Trip" categories={CATEGORIES} />);

    expect(screen.getByText('Bearing wear').closest('li')).toHaveAttribute('data-state', 'confirmed');
    expect(screen.getByText('Probe fault')).toHaveClass('line-through');
    expect(screen.getByText('Probe fault')).toHaveTextContent('Probe fault, ruled out');
  });
});
