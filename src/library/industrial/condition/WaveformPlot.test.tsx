import { render, screen } from '@testing-library/react';

import { WaveformPlot } from './WaveformPlot';

const samples = Array.from({ length: 100 }, (_, index) => Math.sin(index / 5));

describe(WaveformPlot.name, () => {
  it('draws the trace under its accessible name', () => {
    const { container } = render(<WaveformPlot label="Time waveform" samples={samples} sampleRateHz={1000} unit="mm/s" />);

    expect(screen.getByRole('img', { name: 'Time waveform' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="waveform-line"]')).toBeInTheDocument();
  });

  it('marks each shaft revolution when the speed is known', () => {
    const { container } = render(<WaveformPlot label="Waveform" samples={samples} sampleRateHz={1000} unit="mm/s" runningHz={50} />);

    expect(container.querySelectorAll('[data-slot="waveform-revolution"]').length).toBeGreaterThanOrEqual(5);
  });

  it('draws the level lines above and below zero', () => {
    const { container } = render(<WaveformPlot label="Waveform" samples={samples} sampleRateHz={1000} unit="mm/s" level={{ value: 0.7, label: 'RMS 0.7' }} />);

    expect(container.querySelectorAll('[data-slot="waveform-level"]')).toHaveLength(2);
    expect(screen.getByText('RMS 0.7')).toBeInTheDocument();
  });
});
