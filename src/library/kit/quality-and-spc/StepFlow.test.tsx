import { render, screen } from '@testing-library/react';

import { StepFlow } from './StepFlow';

const STEPS = [
  { label: 'Taken', meta: '08:10 · Ingrid Haugen', state: 'done' as const },
  { label: 'Analysed', meta: 'GC running', state: 'current' as const },
  { label: 'Reviewed', state: 'pending' as const },
];

describe(StepFlow.name, () => {
  it('lists the steps in order with their state in words', () => {
    render(<StepFlow label="Sample S-26-0412" steps={STEPS} />);

    const list = screen.getByRole('list', { name: 'Sample S-26-0412' });
    const items = screen.getAllByRole('listitem');
    expect(list).toHaveAttribute('data-orientation', 'horizontal');
    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['done', 'current', 'pending']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveTextContent('Taken, done');
    expect(items[2]).toHaveTextContent('3');
    expect(screen.getByText('08:10 · Ingrid Haugen')).toBeInTheDocument();
  });

  it('marks a held step with the warning tone', () => {
    render(<StepFlow label="Sample" orientation="vertical" steps={[{ label: 'Reviewed', meta: 'Held for retest', state: 'held' }]} />);

    expect(screen.getByRole('listitem')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });
});
