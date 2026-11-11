import { render, screen } from '@testing-library/react';

import { synthSpectrum } from './signal';
import { WaterfallPlot } from './WaterfallPlot';

describe(WaterfallPlot.name, () => {
  it('draws one ridge per survey and labels each', () => {
    const rows = ['Week 2', 'Week 4', 'Week 6'].map((week, index) => ({ label: week, lines: synthSpectrum([{ hz: 25, amplitude: 1 + index }], { maxHz: 200, lines: 60 }) }));
    const { container } = render(<WaterfallPlot label="Spectra over six weeks" rows={rows} maxHz={200} />);

    expect(screen.getByRole('img', { name: 'Spectra over six weeks' })).toBeInTheDocument();
    expect(container.querySelectorAll('polyline')).toHaveLength(3);
    expect(screen.getByText('Week 6')).toBeInTheDocument();
  });
});
