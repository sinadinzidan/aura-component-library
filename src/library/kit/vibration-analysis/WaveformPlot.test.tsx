import { render, screen } from '@testing-library/react';

import { WaveformPlot } from './WaveformPlot';

describe(WaveformPlot.name, () => {
  it('marks the RMS level and the peak', () => {
    render(<WaveformPlot label="Time waveform" samples={[0, 2, 0, -2, 0, 6, 0, -2]} milliseconds={200} />);

    expect(screen.getByRole('img', { name: 'Time waveform' })).toBeInTheDocument();
    expect(screen.getByText('Peak 6.00')).toBeInTheDocument();
    expect(screen.getByText(/^RMS/)).toBeInTheDocument();
  });

  it('leaves the levels out on request', () => {
    render(<WaveformPlot label="Time waveform" samples={[0, 1, 0, -1]} milliseconds={100} showLevels={false} />);

    expect(screen.queryByText(/^Peak/)).not.toBeInTheDocument();
  });
});
