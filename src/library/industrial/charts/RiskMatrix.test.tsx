import { render, screen, within } from '@testing-library/react';

import { RiskMatrix, countByRiskLevel, riskLevel } from './RiskMatrix';
import type { RiskItem } from './RiskMatrix';

const ITEMS: readonly RiskItem[] = [
  { id: 'a', label: 'Recompressor', likelihood: 4, consequence: 5 },
  { id: 'b', label: 'Interstage cooler', likelihood: 3, consequence: 3 },
  { id: 'c', label: 'Cooling water pump', likelihood: 3, consequence: 3 },
  { id: 'd', label: 'Test separator', likelihood: 1, consequence: 2 },
];

describe(RiskMatrix.name, () => {
  it('renders a named 5 × 5 table with both axes labelled', () => {
    render(<RiskMatrix label="Equipment risk" items={ITEMS} />);

    const table = screen.getByRole('table', { name: 'Equipment risk' });
    expect(within(table).getAllByRole('rowheader')).toHaveLength(5);
    expect(within(table).getAllByRole('columnheader')).toHaveLength(5);
    expect(within(table).getAllByRole('cell').filter((cell) => cell.hasAttribute('data-level'))).toHaveLength(25);
  });

  it('puts the highest likelihood in the top row', () => {
    render(<RiskMatrix label="Equipment risk" items={ITEMS} />);

    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent('Almost certain');
  });

  it('counts the items in each cell', () => {
    const { container } = render(<RiskMatrix label="Equipment risk" items={ITEMS} />);

    const cell = container.querySelector('[title^="Possible × Serious"]');
    expect(cell).toHaveTextContent('2');
    expect(cell).toHaveAttribute('data-level', 'medium');
    expect(cell).toHaveAttribute('title', 'Possible × Serious: Medium risk, 2 items (Interstage cooler, Cooling water pump)');
  });

  it('colours cells by risk level', () => {
    const { container } = render(<RiskMatrix label="Equipment risk" items={ITEMS} />);

    expect(container.querySelector('[title^="Likely × Severe"]')).toHaveClass('bg-critical-background');
    expect(container.querySelector('[title^="Rare × Minor"]')).toHaveClass('bg-success-background');
  });

  it('prints item labels instead of counts when asked', () => {
    render(<RiskMatrix label="Equipment risk" items={ITEMS} showLabels />);

    expect(screen.getByText('Recompressor')).toBeInTheDocument();
  });

  it('totals the items per level in the legend', () => {
    render(<RiskMatrix label="Equipment risk" items={ITEMS} summary="One item is high risk." />);

    const legend = screen.getByRole('list', { name: 'Risk levels' });
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Low1', 'Medium2', 'High1']);
    expect(screen.getByText('One item is high risk.')).toBeInTheDocument();
  });
});

describe(riskLevel.name, () => {
  it('grades the score against the thresholds', () => {
    expect(riskLevel(1, 4)).toBe('low');
    expect(riskLevel(1, 5)).toBe('medium');
    expect(riskLevel(3, 5)).toBe('high');
  });

  it('accepts other thresholds', () => {
    expect(riskLevel(2, 2, { medium: 4, high: 9 })).toBe('medium');
  });
});

describe(countByRiskLevel.name, () => {
  it('counts items per level', () => {
    expect(countByRiskLevel(ITEMS)).toEqual({ low: 1, medium: 2, high: 1 });
  });
});
