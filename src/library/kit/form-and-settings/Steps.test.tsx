import { render, screen } from '@testing-library/react';

import { Steps } from './Steps';

const ITEMS = [
  { id: 'a', label: 'Details' },
  { id: 'b', label: 'Stops', description: 'Pick equipment' },
  { id: 'c', label: 'Review' },
];

describe(Steps.name, () => {
  it('marks earlier steps done, the current step and later steps upcoming', () => {
    render(<Steps label="Create round" items={ITEMS} current={1} />);

    const steps = screen.getAllByRole('listitem');
    expect(screen.getByRole('list', { name: 'Create round' })).toHaveAttribute('data-orientation', 'horizontal');
    expect(steps[0]).toHaveAttribute('data-state', 'done');
    expect(steps[0]).toHaveTextContent('Details (done)');
    expect(steps[1]).toHaveAttribute('data-state', 'current');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    expect(steps[1]).toHaveTextContent('Pick equipment');
    expect(steps[2]).toHaveAttribute('data-state', 'upcoming');
    expect(steps[2]).not.toHaveAttribute('aria-current');
  });

  it('can run vertically', () => {
    render(<Steps label="Create round" items={ITEMS} current={0} orientation="vertical" />);

    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });
});
