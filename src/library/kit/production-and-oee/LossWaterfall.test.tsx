import { render, screen } from '@testing-library/react';

import { LossWaterfall } from './LossWaterfall';

describe(LossWaterfall.name, () => {
  it('draws a column for the total, each loss and the result with printed values', () => {
    const { container } = render(
      <LossWaterfall label="Time lost in March" total={{ label: 'Planned time', value: 720 }} losses={[{ label: 'Unplanned stops', value: 31 }, { label: 'Reduced rate', value: 52 }]} resultLabel="Effective time" unit="h" />,
    );

    expect(screen.getByRole('img', { name: 'Time lost in March' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-kind="loss"]')).toHaveLength(2);
    expect(screen.getByText('720 h')).toBeInTheDocument();
    expect(screen.getByText('−31 h')).toBeInTheDocument();
    expect(screen.getByText('637 h')).toBeInTheDocument();
    expect(screen.getByText('Effective time')).toBeInTheDocument();
  });

  it('says so when the value axis does not start at zero', () => {
    render(<LossWaterfall label="Losses" total={{ label: 'Planned', value: 100 }} losses={[{ label: 'Stops', value: 8 }]} resultLabel="OEE" unit="%" baseline={60} />);

    expect(screen.getByText(/Value axis starts at 60 %/)).toBeInTheDocument();
  });
});
