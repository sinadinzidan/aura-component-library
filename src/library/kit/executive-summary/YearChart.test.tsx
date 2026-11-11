import { fireEvent, render, screen } from '@testing-library/react';

import type { YearPoint } from './annotations';
import { YearChart } from './YearChart';

const POINTS: YearPoint[] = [
  { id: 'jan', label: 'Jan', name: 'January 2026', value: 4.53, group: '2026' },
  { id: 'feb', label: 'Feb', name: 'February 2026', value: 4.36, annotated: true },
  { id: 'mar', label: 'Mar', name: 'March 2026', value: 4.34, annotated: true },
];

function renderChart(selected = 'mar', onSelect = vi.fn()) {
  const view = render(<YearChart label="Average gas export per month" points={POINTS} selected={selected} onSelect={onSelect} plan={4.5} unit="MSm³/d" />);
  return { ...view, onSelect };
}

describe(YearChart.name, () => {
  it('names the chart and offers one button per month with its value', () => {
    renderChart();

    expect(screen.getByRole('group', { name: 'Average gas export per month' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'February 2026: 4.36 MSm³/d' })).toBeInTheDocument();
  });

  it('puts one month in focus and calls out its value', () => {
    const { container } = renderChart('feb');

    expect(screen.getByRole('button', { name: /February 2026/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /March 2026/ })).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('[data-current]')).toHaveLength(1);
    expect(container.querySelector('[data-current]')).toHaveTextContent('4.36');
  });

  it('switches month on click', () => {
    const { onSelect } = renderChart();

    fireEvent.click(screen.getByRole('button', { name: /January 2026/ }));

    expect(onSelect).toHaveBeenCalledWith('jan');
  });

  it('numbers the annotated months and labels the plan', () => {
    const { container } = renderChart();

    expect([...container.querySelectorAll('[data-annotation]')].map((mark) => mark.textContent)).toEqual(['1', '2']);
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('4.50')).toBeInTheDocument();
  });

  it('writes the axis labels and the group line', () => {
    renderChart();

    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
  });
});
