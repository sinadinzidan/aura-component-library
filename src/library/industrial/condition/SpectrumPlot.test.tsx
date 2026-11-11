import { render, screen } from '@testing-library/react';

import { harmonicFamily } from './harmonics';
import { SpectrumPlot } from './SpectrumPlot';

const spectrum = Array.from({ length: 60 }, (_, index) => ({ frequencyHz: index * 5, amplitude: index === 10 ? 4 : 0.2 }));

describe(SpectrumPlot.name, () => {
  it('draws the trace with an accessible name', () => {
    const { container } = render(<SpectrumPlot label="Velocity spectrum" spectrum={spectrum} unit="mm/s RMS" />);

    expect(screen.getByRole('img', { name: 'Velocity spectrum' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="spectrum-line"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="spectrum-area"]')).toBeInTheDocument();
  });

  it('labels harmonic cursors and named markers on separate rows', () => {
    render(<SpectrumPlot label="Spectrum" spectrum={spectrum} unit="mm/s" cursors={harmonicFamily(50)} markers={[{ frequencyHz: 178, label: 'BPFO' }]} />);

    expect(screen.getByText('2×')).toBeInTheDocument();
    expect(screen.getByText('BPFO')).toHaveClass('top-4');
  });

  it('redraws lines above the alarm mask in the critical colour', () => {
    const { container } = render(<SpectrumPlot label="Spectrum" spectrum={spectrum} unit="mm/s" mask={[{ fromHz: 0, toHz: 300, limit: 1 }]} />);

    expect(container.querySelectorAll('[data-slot="spectrum-exceedance"]')).toHaveLength(1);
    expect(container.querySelector('[data-slot="spectrum-mask"]')).toBeInTheDocument();
  });

  it('draws a baseline instead of an area fill', () => {
    const { container } = render(<SpectrumPlot label="Spectrum" spectrum={spectrum} baseline={spectrum} unit="mm/s" />);

    expect(container.querySelector('[data-slot="spectrum-baseline"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="spectrum-area"]')).not.toBeInTheDocument();
  });

  it('marks the readout cursor on the nearest line', () => {
    const { container } = render(<SpectrumPlot label="Spectrum" spectrum={spectrum} unit="mm/s" cursorHz={52} />);

    expect(container.querySelector('[data-slot="spectrum-cursor-dot"]')).toBeInTheDocument();
  });

  it('adds an order axis when the running speed is given', () => {
    const { container } = render(<SpectrumPlot label="Spectrum" spectrum={spectrum} unit="mm/s" runningHz={50} />);

    expect(container.querySelector('[data-slot="spectrum-orders"]')?.textContent).toContain('1×');
  });
});
