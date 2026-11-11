import { render, screen, within } from '@testing-library/react';

import { BalanceFlow, type BalanceStream } from './BalanceFlow';

const IN: BalanceStream[] = [{ id: 'feed', label: 'Well stream', value: 168, tone: 'blue' }];

const OUT: BalanceStream[] = [
  { id: 'gas', label: 'Export gas', value: 128.4, tone: 'teal' },
  { id: 'oil', label: 'Condensate', value: 29.6, tone: 'amber' },
  { id: 'water', label: 'Produced water', value: 9.8, tone: 'sky' },
];

describe(BalanceFlow.name, () => {
  it('lists what goes in and what comes out with shares', () => {
    render(<BalanceFlow label="Mass balance" inputs={IN} outputs={OUT} unit="t/h" />);

    expect(within(screen.getByRole('list', { name: 'In' })).getByText('Well stream')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Out' })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('76.5 %')).toBeInTheDocument();
  });

  it('draws one band from each feed to each product', () => {
    const { container } = render(<BalanceFlow label="Mass balance" inputs={IN} outputs={OUT} unit="t/h" />);

    expect(container.querySelectorAll('path')).toHaveLength(3);
  });

  it('says whether the balance closes', () => {
    const { container, rerender } = render(<BalanceFlow label="Mass balance" inputs={IN} outputs={OUT} unit="t/h" />);
    expect(container.querySelector('[data-slot="balance-closing"]')).toHaveTextContent('Balance closes, 0.2 t/h');

    rerender(<BalanceFlow label="Mass balance" inputs={IN} outputs={OUT.slice(0, 2)} unit="t/h" />);
    expect(container.querySelector('[data-slot="balance-closing"]')).toHaveAttribute('data-tone', 'warning');
  });
});
