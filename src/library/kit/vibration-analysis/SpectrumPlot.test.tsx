import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { synthSpectrum } from './signal';
import { SpectrumPlot } from './SpectrumPlot';

const LINES = synthSpectrum([{ hz: 25, amplitude: 3 }, { hz: 50, amplitude: 1 }], { maxHz: 200, lines: 100 });

describe(SpectrumPlot.name, () => {
  it('labels the named lines and the legend for mask and baseline', () => {
    render(
      <SpectrumPlot
        label="Velocity spectrum"
        lines={LINES}
        maxHz={200}
        markers={[{ hz: 25, label: '1×' }, { hz: 50, label: '2×' }]}
        mask={[{ fromHz: 0, toHz: 200, level: 2 }]}
        baseline={{ label: 'Baseline', lines: LINES }}
      />
    );

    expect(screen.getByRole('img', { name: 'Velocity spectrum' })).toBeInTheDocument();
    expect(screen.getByText('1×')).toBeInTheDocument();
    expect(screen.getByText('Alarm mask')).toBeInTheDocument();
    expect(screen.getByText('Baseline')).toBeInTheDocument();
  });

  it('lets a peak be picked and reads the picked one off', () => {
    const onSelect = vi.fn();
    const peak = { hz: 25, amplitude: 3 };
    render(<SpectrumPlot label="Spectrum" lines={LINES} maxHz={200} peaks={[peak]} selectedHz={25} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Peak at 25.0 Hz, 3.00 mm/s' }));

    expect(onSelect).toHaveBeenCalledWith(25);
    expect(screen.getByText('25.0 Hz · 3.00 mm/s')).toBeInTheDocument();
  });

  it('draws blocks in poster and stems on a blueprint', () => {
    const { container, rerender } = render(
      <LookScope look="poster">
        <SpectrumPlot label="Spectrum" lines={LINES} maxHz={200} />
      </LookScope>
    );
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(10);

    rerender(
      <LookScope look="blueprint">
        <SpectrumPlot label="Spectrum" lines={LINES} maxHz={200} />
      </LookScope>
    );
    expect(container.querySelectorAll('rect')).toHaveLength(0);
    expect(container.querySelectorAll('polyline')).toHaveLength(0);
  });
});
