import { render, screen } from '@testing-library/react';

import { TurbineTile } from './TurbineTile';

describe(TurbineTile.name, () => {
  it('names the turbine, its state and its power', () => {
    render(<TurbineTile name="WTG-07" state="generating" power={3.4} ratedPower={4.2} windSpeed={10.8} />);

    expect(screen.getByRole('article', { name: 'Turbine WTG-07: generating, 3.4 of 4.2 MW' })).toBeInTheDocument();
    expect(screen.getByText('Generating')).toBeInTheDocument();
  });

  it('prints power, rating and wind speed', () => {
    render(<TurbineTile name="WTG-07" state="generating" power={3.4} ratedPower={4.2} windSpeed={10.8} rotorSpeed={12.6} />);

    expect(screen.getByText('3.4')).toBeInTheDocument();
    expect(screen.getByText('4.2 MW')).toBeInTheDocument();
    expect(screen.getByText('10.8 m/s')).toBeInTheDocument();
    expect(screen.getByText('12.6 rpm')).toBeInTheDocument();
  });

  it('says why a turbine is not generating', () => {
    render(<TurbineTile name="WTG-11" state="fault" power={0} ratedPower={4.2} windSpeed={11.2} detail="Gearbox oil temperature high" />);

    expect(screen.getByText('Fault')).toBeInTheDocument();
    expect(screen.getByText('Gearbox oil temperature high')).toBeInTheDocument();
  });

  it('prints a dash when the turbine reports nothing', () => {
    render(<TurbineTile name="WTG-03" state="maintenance" power={null} ratedPower={4.2} windSpeed={null} />);

    expect(screen.getByRole('article', { name: 'Turbine WTG-03: maintenance' })).toBeInTheDocument();
    expect(screen.getByText('— m/s')).toBeInTheDocument();
  });

  it('shows power in a generating cell', () => {
    render(<TurbineTile variant="cell" name="07" state="generating" power={3.4} ratedPower={4.2} />);

    expect(screen.getByRole('img', { name: 'Turbine 07: generating, 3.4 of 4.2 MW' })).toHaveTextContent('3.4');
  });

  it('shows the state in words in a cell that is not generating', () => {
    render(<TurbineTile variant="cell" name="11" state="idle" power={0} ratedPower={4.2} />);

    expect(screen.getByRole('img')).toHaveTextContent('Idle');
    expect(screen.getByRole('img')).toHaveAttribute('data-state', 'idle');
  });
});
