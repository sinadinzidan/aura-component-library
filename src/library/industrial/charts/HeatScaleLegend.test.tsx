import { render, screen } from '@testing-library/react';

import { HeatScaleLegend } from './HeatScaleLegend';

describe(HeatScaleLegend.name, () => {
  it('shows the four density steps between the end labels', () => {
    const { container } = render(<HeatScaleLegend lowLabel="0" highLabel="12 alarms" />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('12 alarms')).toBeInTheDocument();
    const steps = container.querySelectorAll('[data-slot="heat-step"]');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveClass('bg-heat-map-mild');
    expect(steps[3]).toHaveClass('bg-heat-map-intense');
  });

  it('prints the title and the no-data key when given', () => {
    render(<HeatScaleLegend lowLabel="Fewer" highLabel="More" title="Alarms per hour" emptyLabel="No data" />);

    expect(screen.getByText('Alarms per hour')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
