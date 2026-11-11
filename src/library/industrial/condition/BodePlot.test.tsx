import { render, screen } from '@testing-library/react';

import { BodePlot } from './BodePlot';
import { runUp } from './rotor';

const points = runUp({ criticalRpm: 3000, dampingRatio: 0.1, eccentricity: 10 }, 500, 6000, 50);

describe(BodePlot.name, () => {
  it('draws amplitude and phase on a shared speed axis', () => {
    const { container } = render(<BodePlot label="Run-up Bode plot" points={points} unit="µm" />);

    expect(screen.getByRole('img', { name: 'Run-up Bode plot' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="bode-amplitude"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="bode-phase"]')).toBeInTheDocument();
  });

  it('labels the critical speed and the operating speed', () => {
    render(<BodePlot label="Bode" points={points} unit="µm" operatingRpm={5400} />);

    expect(screen.getByText(/Critical 3,0\d\d rpm/)).toBeInTheDocument();
    expect(screen.getByText('Operating 5,400 rpm')).toBeInTheDocument();
  });

  it('leaves out the critical mark on request', () => {
    const { container } = render(<BodePlot label="Bode" points={points} unit="µm" markCritical={false} />);

    expect(container.querySelectorAll('[data-slot="bode-mark"]')).toHaveLength(0);
  });
});
