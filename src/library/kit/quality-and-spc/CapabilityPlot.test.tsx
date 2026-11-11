import { render, screen } from '@testing-library/react';

import { CapabilityPlot } from './CapabilityPlot';

describe(CapabilityPlot.name, () => {
  it('marks the specification limits, the target and the mean', () => {
    render(<CapabilityPlot label="Dew point capability" values={[9, 10, 11, 10, 10]} lsl={7} usl={13} target={10} unit="°C" decimals={1} />);

    expect(screen.getByRole('img', { name: 'Dew point capability' })).toBeInTheDocument();
    expect(screen.getByText('LSL 7.0')).toBeInTheDocument();
    expect(screen.getByText('USL 13.0')).toBeInTheDocument();
    expect(screen.getByText('Target 10.0')).toBeInTheDocument();
    expect(screen.getByText(/Mean 10.0 °C · σ 0.71/)).toBeInTheDocument();
  });

  it('draws one bar per bin and colours the bins outside the limits', () => {
    const { container } = render(<CapabilityPlot label="Capability" values={[9, 10, 11, 14.5]} lsl={8} usl={12} bins={10} />);

    const bars = [...container.querySelectorAll('[data-bin]')];
    expect(bars).toHaveLength(10);
    expect(bars.reduce((sum, bar) => sum + Number(bar.getAttribute('data-bin')), 0)).toBe(4);
    const outside = bars.filter((bar) => bar.getAttribute('data-tone') === 'critical' && bar.getAttribute('data-bin') !== '0');
    expect(outside).toHaveLength(1);
  });
});
