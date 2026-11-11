import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { RiskItem } from './risk';
import { RiskMatrix } from './RiskMatrix';

const ITEMS: RiskItem[] = [
  { id: 'a', label: 'R-01', likelihood: 4, consequence: 5 },
  { id: 'b', label: 'R-02', likelihood: 4, consequence: 5 },
  { id: 'c', label: 'R-03', likelihood: 1, consequence: 1 },
];

describe(RiskMatrix.name, () => {
  it('draws twenty-five cells and prints the count of occupied ones', () => {
    const { container } = render(<RiskMatrix label="Open risks, gas compression" items={ITEMS} />);

    expect(screen.getByRole('group', { name: 'Open risks, gas compression' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-level]')).toHaveLength(25);
    expect(container.querySelector('[data-count="2"]')).toHaveTextContent('2');
    expect(container.querySelector('[data-count="2"]')).toHaveAttribute('data-level', 'extreme');
  });

  it('lists the risks by name in names mode', () => {
    render(<RiskMatrix label="Risks" items={ITEMS} mode="names" />);

    expect(screen.getByText('R-01')).toBeInTheDocument();
    expect(screen.getByText('R-03')).toBeInTheDocument();
  });

  it('writes both axes', () => {
    render(<RiskMatrix label="Risks" items={ITEMS} />);

    expect(screen.getByText('Likelihood')).toBeInTheDocument();
    expect(screen.getByText('Consequence')).toBeInTheDocument();
    expect(screen.getByText('Almost certain')).toBeInTheDocument();
    expect(screen.getByText('Catastrophic')).toBeInTheDocument();
  });

  it('reports the picked cell and marks the selected one', async () => {
    const onSelect = vi.fn();
    render(<RiskMatrix label="Risks" items={ITEMS} selected={{ likelihood: 4, consequence: 5 }} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: 'Likely, Catastrophic: 2 risks, extreme' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Rare, Minor: 1 risk, low' }));
    expect(onSelect).toHaveBeenCalledWith({ likelihood: 1, consequence: 1 });
  });
});
