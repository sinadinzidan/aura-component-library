import { render, screen } from '@testing-library/react';

import { PlotArea } from './PlotArea';

describe(PlotArea.name, () => {
  it('names the plot and writes both axes', () => {
    render(
      <PlotArea label="Velocity spectrum" yCaption="mm/s" xCaption="Hz" yTicks={[{ at: 0, label: '0' }, { at: 1, label: '4' }]} xTicks={[{ at: 0, label: '0' }, { at: 1, label: '400' }]}>
        <path d="M0 100 L100 0" />
      </PlotArea>
    );

    expect(screen.getByRole('img', { name: 'Velocity spectrum' })).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('mm/s')).toBeInTheDocument();
  });
});
