import { render, screen } from '@testing-library/react';

import { BarrierStack, barrierState, type Barrier } from './BarrierStack';

const BARRIERS: Barrier[] = [
  { id: 'esd', name: 'Emergency shutdown', role: 'Control', passed: 10, degraded: 0, failed: 0 },
  { id: 'gas', name: 'Gas detection', role: 'Detect', passed: 8, degraded: 2, failed: 0 },
  { id: 'deluge', name: 'Deluge', role: 'Mitigate', passed: 5, degraded: 0, failed: 1 },
];

describe(BarrierStack.name, () => {
  it('takes the state of the worst element', () => {
    expect(BARRIERS.map((barrier) => barrierState(barrier).word)).toEqual(['Healthy', 'Degraded', 'Impaired']);
  });

  it('draws one block per element and says the state in words', () => {
    render(<BarrierStack label="Barriers" barriers={BARRIERS} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('img', { name: '8 passed, 2 degraded, 0 failed' }).children).toHaveLength(10);
    expect(screen.getByText('Impaired')).toBeInTheDocument();
  });
});
