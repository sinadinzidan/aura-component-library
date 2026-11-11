import { render, screen } from '@testing-library/react';

import { PlotFrame } from './PlotFrame';

describe(PlotFrame.name, () => {
  it('names the plot and draws tick labels from the axes', () => {
    const { container } = render(
      <PlotFrame label="Test plot" x={{ domain: [0, 100], ticks: [0, 50, 100] }} y={{ domain: [0, 10], ticks: [0, 5, 10], title: 'Level, mm/s' }}>
        {() => null}
      </PlotFrame>
    );

    expect(screen.getByRole('img', { name: 'Test plot' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="plot-x-axis"] span')).toHaveLength(3);
    expect(screen.getByText('Level, mm/s')).toBeInTheDocument();
  });

  it('becomes a group when it holds controls', () => {
    render(
      <PlotFrame label="Cursor plot" interactive x={{ domain: [0, 1] }} y={{ domain: [0, 1] }}>
        {() => null}
      </PlotFrame>
    );

    expect(screen.getByRole('group', { name: 'Cursor plot' })).toBeInTheDocument();
  });

  it('omits axes and grid when bare', () => {
    const { container } = render(
      <PlotFrame label="Bare" bare x={{ domain: [0, 1] }} y={{ domain: [0, 1] }}>
        {() => null}
      </PlotFrame>
    );

    expect(container.querySelector('[data-slot="plot-x-axis"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="plot-grid"]')).not.toBeInTheDocument();
  });

  it('passes one scale to marks and overlay', () => {
    render(
      <PlotFrame label="Scaled" x={{ domain: [0, 10] }} y={{ domain: [0, 10] }} overlay={(scale) => <span>{`x5=${scale.x(5)}`}</span>}>
        {() => null}
      </PlotFrame>
    );

    expect(screen.getByText('x5=50')).toBeInTheDocument();
  });
});
