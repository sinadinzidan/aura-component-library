import { render, screen } from '@testing-library/react';

import { NeonSparkline } from './NeonSparkline';

describe(NeonSparkline.name, () => {
  it('describes the latest value and the range', () => {
    render(<NeonSparkline values={[70, 82, 78]} label="Load, last 24 hours" unit="%" decimals={0} />);

    expect(screen.getByRole('img', { name: 'Load, last 24 hours: latest 78 %, range 70 to 82' })).toBeInTheDocument();
  });

  it('draws a line, a fade and a dot on the latest value', () => {
    const { container } = render(<NeonSparkline values={[1, 2, 3]} label="Trend" />);

    expect(container.querySelector('[data-slot="neon-sparkline-line"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="neon-sparkline-area"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="neon-sparkline-last"]')).toBeInTheDocument();
  });

  it('draws a limit line when given one', () => {
    const { container } = render(<NeonSparkline values={[1, 2, 3]} label="Trend" limit={2.5} />);

    expect(container.querySelector('[data-slot="neon-sparkline-limit"]')).toBeInTheDocument();
  });

  it('says so when there is no data', () => {
    render(<NeonSparkline values={[]} label="Trend" />);

    expect(screen.getByRole('img', { name: 'Trend: no data' })).toBeInTheDocument();
  });
});
