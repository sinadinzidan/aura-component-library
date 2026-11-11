import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { BandScale } from './BandScale';

describe(BandScale.name, () => {
  it('reads the value and its band', () => {
    render(<BandScale label="Suction pressure" value={12.4} max={20} low={10} high={15} unit="barg" decimals={1} />);

    expect(screen.getByRole('meter', { name: 'Suction pressure' })).toHaveAttribute('aria-valuetext', '12.4 barg, band 10.0 to 15.0');
    expect(screen.getByText('12.4')).toBeInTheDocument();
  });

  it('labels the ticks from min to max', () => {
    render(<BandScale label="Level" value={54} max={100} low={30} high={70} ticks={5} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('writes the band as a dimension on a blueprint', () => {
    const { container } = render(
      <LookScope look="blueprint">
        <BandScale label="Level" value={54} max={100} low={30} high={70} />
      </LookScope>
    );

    expect(container.querySelector('[data-anatomy="dimension"]')).not.toBeNull();
    expect(screen.getByText('30–70')).toBeInTheDocument();
  });

  it('drops the heading and ticks when compact', () => {
    render(<BandScale compact label="Level" value={54} max={100} low={30} high={70} />);

    expect(screen.queryByText('Level')).not.toBeInTheDocument();
  });
});
