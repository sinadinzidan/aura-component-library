import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { Hero } from './Hero';

describe(Hero.name, () => {
  it('shows the eyebrow, headline, lead, actions and proof', () => {
    render(
      <Hero
        eyebrow="Nordkapp Operations"
        title="Run the plant from one screen."
        lead="Alarms, trends and work in one place."
        actions={<button type="button">Book a demo</button>}
        proof="Used at 4 sites"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Run the plant from one screen.' })).toBeInTheDocument();
    expect(screen.getByText('Nordkapp Operations')).toBeInTheDocument();
    expect(screen.getByText('Alarms, trends and work in one place.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Book a demo' })).toBeInTheDocument();
    expect(screen.getByText('Used at 4 sites')).toBeInTheDocument();
  });

  it('takes the display scale of the look', () => {
    render(
      <LookScope look="poster">
        <Hero title="One screen." />
      </LookScope>,
    );

    expect(screen.getByRole('heading', { name: 'One screen.' })).toHaveClass('text-7xl');
  });
});
