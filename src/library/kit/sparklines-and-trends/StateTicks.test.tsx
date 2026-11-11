import { render, screen } from '@testing-library/react';

import { StateTicks } from './StateTicks';

describe(StateTicks.name, () => {
  it('draws one block per period and counts the ones outside normal', () => {
    const { container } = render(
      <StateTicks
        label="Flaring against the permit"
        axis={['27 Feb', '12 Mar']}
        ticks={[
          { label: '10 Mar', tone: 'success', word: 'Within permit' },
          { label: '11 Mar', tone: 'critical', word: 'Over permit' },
          { label: '12 Mar', tone: 'neutral', word: 'No data' },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Flaring against the permit: 1 of 3 outside normal' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-part="tick"]')).toHaveLength(3);
    expect(container.querySelector('[data-tone="critical"]')).toHaveAttribute('title', '11 Mar: Over permit');
    expect(screen.getByText('27 Feb')).toBeInTheDocument();
  });
});
