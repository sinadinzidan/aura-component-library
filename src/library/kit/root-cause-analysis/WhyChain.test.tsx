import { render, screen } from '@testing-library/react';

import { WhyChain } from './WhyChain';

const STEPS = [{ answer: 'Vibration passed the trip limit.', evidence: 'E-01' }, { answer: 'The bearing had worn.' }, { answer: 'The lube oil filter was overdue.' }];

describe(WhyChain.name, () => {
  it('numbers the answers and sets the last one apart as the root cause', () => {
    render(<WhyChain problem="Recompressor tripped" steps={STEPS} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Why 1');
    expect(items[0]).toHaveTextContent('E-01');
    expect(items[2]).toHaveAttribute('data-root');
    expect(items[2]).toHaveTextContent('Root cause');
    expect(items[2].style.marginLeft).toBe('3rem');
  });

  it('names no root cause while the chain is unfinished', () => {
    render(<WhyChain problem="Recompressor tripped" steps={STEPS} concluded={false} />);

    expect(screen.queryByText('Root cause')).not.toBeInTheDocument();
  });
});
