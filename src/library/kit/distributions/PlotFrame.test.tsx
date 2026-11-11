import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { PlotFrame } from './PlotFrame';

const X = { min: 0, max: 10, ticks: [0, 5, 10], title: 'Flow, t/h' };
const Y = { min: 0, max: 100, ticks: [0, 50, 100], title: 'Efficiency, %' };

describe(PlotFrame.name, () => {
  it('names the plot and writes both axis titles and tick labels', () => {
    render(
      <PlotFrame label="Efficiency against flow" x={X} y={Y}>
        <span>mark</span>
      </PlotFrame>
    );

    expect(screen.getByRole('img', { name: 'Efficiency against flow' })).toBeInTheDocument();
    expect(screen.getByText('Flow, t/h')).toBeInTheDocument();
    expect(screen.getByText('Efficiency, %')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('mark')).toBeInTheDocument();
  });

  it('draws grid lines the way the look does', () => {
    const { container, rerender } = render(
      <LookScope look="blueprint">
        <PlotFrame label="Plot" x={X} y={Y}>
          <span />
        </PlotFrame>
      </LookScope>
    );
    expect(container.querySelectorAll('[data-grid="y"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-grid="x"]')).toHaveLength(2);

    rerender(
      <LookScope look="poster">
        <PlotFrame label="Plot" x={X} y={Y}>
          <span />
        </PlotFrame>
      </LookScope>
    );
    expect(container.querySelectorAll('[data-grid]')).toHaveLength(0);
  });
});
