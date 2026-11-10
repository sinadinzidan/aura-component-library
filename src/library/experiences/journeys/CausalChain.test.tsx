import { render, screen } from '@testing-library/react';

import { CausalChain } from './CausalChain';
import type { CausalLink } from './CausalChain';

const LINKS: CausalLink[] = [
  { id: 'filter', time: '13:05', title: 'Lube oil filter clogs', detail: 'Differential pressure rises.' },
  { id: 'pressure', time: '13:22', title: 'Oil pressure falls', detail: 'Below 1.8 barg.' },
  { id: 'trip', time: '13:46', title: 'Trip', detail: 'High-high vibration.' },
];

describe(CausalChain.name, () => {
  it('lists every link under the chain name', () => {
    render(<CausalChain links={LINKS} revealed={3} label="What led to the trip" />);

    expect(screen.getByRole('list', { name: 'What led to the trip' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows only the links known so far', () => {
    render(<CausalChain links={LINKS} revealed={2} label="Chain" />);

    expect(screen.getByText('Lube oil filter clogs')).toBeInTheDocument();
    expect(screen.getByText('Oil pressure falls')).toBeInTheDocument();
    expect(screen.queryByText('Trip')).not.toBeInTheDocument();
    expect(screen.getByText('Not yet evident')).toBeInTheDocument();
  });

  it('marks the latest known link as current', () => {
    render(<CausalChain links={LINKS} revealed={2} label="Chain" />);

    const states = screen.getAllByRole('listitem').map((item) => item.getAttribute('data-state'));
    expect(states).toEqual(['known', 'latest', 'pending']);
    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step');
  });

  it('hides the time of a pending link', () => {
    render(<CausalChain links={LINKS} revealed={0} label="Chain" pendingText="Still unknown" />);

    expect(screen.queryByText('13:05')).not.toBeInTheDocument();
    expect(screen.getAllByText('Still unknown')).toHaveLength(3);
  });

  it('clamps a count beyond the chain', () => {
    render(<CausalChain links={LINKS} revealed={9} label="Chain" />);

    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-state'))).toEqual(['known', 'known', 'latest']);
  });
});
