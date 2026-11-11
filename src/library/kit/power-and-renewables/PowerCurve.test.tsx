import { render, screen } from '@testing-library/react';

import { PowerCurve } from './PowerCurve';

const CURVE = [
  { windSpeed: 3, power: 0 },
  { windSpeed: 12, power: 4.2 },
  { windSpeed: 20, power: 4.2 },
];

const POINTS = [
  { windSpeed: 12, power: 4.1 },
  { windSpeed: 14, power: 3.0 },
  { windSpeed: 8, power: 2.3 },
];

describe(PowerCurve.name, () => {
  it('plots every point and counts the ones under the curve', () => {
    const { container } = render(<PowerCurve label="Power curve of WTG-08" curve={CURVE} points={POINTS} ratedPower={4.2} />);

    expect(container.querySelectorAll('[data-point]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-point="under"]')).toHaveLength(1);
    expect(container.querySelector('[data-slot="curve-count"]')).toHaveTextContent('1 of 3 points more than 15 % under');
  });

  it('describes the chart for assistive technology', () => {
    render(<PowerCurve label="Power curve of WTG-08" curve={CURVE} points={POINTS} ratedPower={4.2} />);

    expect(screen.getByRole('img', { name: /Power curve of WTG-08\. 1 of 3 points/ })).toBeInTheDocument();
    expect(screen.getByText('Rated 4.2 MW')).toBeInTheDocument();
  });
});
