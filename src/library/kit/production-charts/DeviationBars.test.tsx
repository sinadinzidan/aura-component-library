import { render, screen } from '@testing-library/react';

import { DeviationBars } from './DeviationBars';

describe(DeviationBars.name, () => {
  it('colours only the bars outside the tolerance', () => {
    const { container } = render(
      <DeviationBars label="Export against plan" categories={['Mon', 'Tue', 'Wed']} values={[0.02, -0.29, 0.12]} reference="Plan 4.50" unit="MSm³/d" decimals={2} tolerance={0.05} step={0.1} />,
    );

    expect(screen.getByRole('img', { name: 'Export against plan' })).toBeInTheDocument();
    const tones = [...container.querySelectorAll('[data-bar]')].map((bar) => bar.parentElement?.getAttribute('data-tone'));
    expect(tones).toEqual(['neutral', 'critical', 'success']);
    expect(screen.getByText('−0.29')).toBeInTheDocument();
    expect(screen.getByText('Plan 4.50 MSm³/d')).toBeInTheDocument();
  });

  it('treats below as good when asked', () => {
    const { container } = render(<DeviationBars label="Flaring against limit" categories={['Mon']} values={[-3]} reference="Limit 15" good="down" />);

    expect(container.querySelector('[data-bar]')?.parentElement).toHaveAttribute('data-tone', 'success');
  });
});
