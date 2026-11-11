import { render, screen } from '@testing-library/react';

import { ScatterPlot } from './ScatterPlot';

const X = { min: 0, max: 10, ticks: [0, 5, 10], title: 'Flow' };
const Y = { min: 0, max: 100, ticks: [0, 50, 100], title: 'Efficiency' };

describe(ScatterPlot.name, () => {
  it('draws one mark per point at its position', () => {
    const { container } = render(<ScatterPlot label="Efficiency against flow" points={[{ x: 5, y: 50 }, { x: 10, y: 100 }]} x={X} y={Y} />);

    expect(screen.getByRole('img', { name: 'Efficiency against flow' })).toBeInTheDocument();
    const marks = container.querySelectorAll<HTMLElement>('[data-point]');
    expect(marks).toHaveLength(2);
    expect(marks[0].style.left).toBe('50.00%');
    expect(marks[0].style.bottom).toBe('50.00%');
  });

  it('lists groups, the curve and the envelope in the legend', () => {
    const { container } = render(
      <ScatterPlot
        label="Plot"
        points={[{ x: 1, y: 1, group: 'day', label: '23-KA-9101' }]}
        groups={[{ id: 'day', label: 'Day shift', tone: 'blue' }]}
        x={X}
        y={Y}
        envelope={{ x: [2, 8], y: [20, 80], label: 'Normal envelope' }}
        curve={{ points: [{ x: 0, y: 0 }, { x: 10, y: 100 }], label: 'Design curve' }}
      />
    );

    expect(screen.getByText('Day shift')).toBeInTheDocument();
    expect(screen.getByText('Design curve')).toBeInTheDocument();
    expect(screen.getByText('Normal envelope')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(container.querySelector('[data-envelope]')).toBeInTheDocument();
    expect(container.querySelector('[data-curve]')?.getAttribute('points')).toBe('0.00,100.00 100.00,0.00');
  });

  it('calls out the highlighted point with its label', () => {
    const { container } = render(<ScatterPlot label="Plot" points={[]} x={X} y={Y} highlight={{ x: 5, y: 50, label: 'Now 80.6 %' }} />);

    expect(screen.getByText('Now 80.6 %')).toBeInTheDocument();
    expect(container.querySelector<HTMLElement>('[data-highlight]')?.style.left).toBe('50.00%');
  });
});
