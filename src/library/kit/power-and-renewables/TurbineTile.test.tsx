import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { TurbineTile } from './TurbineTile';

describe(TurbineTile.name, () => {
  it('shows power against rating and the wind', () => {
    render(<TurbineTile name="WTG-05" state="generating" power={3.8} ratedPower={4.2} windSpeed={11.4} rotorSpeed={13.1} />);

    expect(screen.getByRole('article', { name: 'WTG-05, generating' })).toHaveAttribute('data-tone', 'success');
    expect(screen.getByRole('meter', { name: 'WTG-05 power against rating' })).toHaveAttribute('aria-valuenow', '3.8');
    expect(screen.getByText('11.4 m/s')).toBeInTheDocument();
  });

  it('says why a turbine is not generating and feathers the blades', () => {
    const { container } = render(<TurbineTile name="WTG-11" state="fault" power={0} ratedPower={4.2} windSpeed={11.2} rotorSpeed={null} detail="Gearbox oil temperature high" />);

    expect(screen.getByText('Gearbox oil temperature high')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(container.querySelector('[data-feathered]')).not.toBeNull();
  });

  it('writes the state as a word on a filled tile', () => {
    const { container } = render(
      <LookScope look="signal">
        <TurbineTile name="WTG-06" state="curtailed" power={2} ratedPower={4.2} />
      </LookScope>
    );

    expect(container.querySelector('.kit-pill')).toBeNull();
    expect(screen.getByText('Curtailed')).toBeInTheDocument();
  });
});
