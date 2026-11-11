import { render, screen } from '@testing-library/react';

import { Histogram } from './Histogram';

describe(Histogram.name, () => {
  it('draws one bar per bin and names the chart', () => {
    const { container } = render(<Histogram label="Pressure, last 30 days" counts={[1, 4, 2]} min={40} max={52} xTitle="Pressure, barg" yTitle="Hours" />);

    expect(screen.getByRole('img', { name: 'Pressure, last 30 days' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-bin]')).toHaveLength(3);
    expect(screen.getByText('Pressure, barg')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
  });

  it('labels a limit and colours the bins beyond it', () => {
    const { container } = render(
      <Histogram label="Pressure" counts={[3, 3, 3, 3]} min={0} max={4} limits={[{ value: 3, label: 'High limit', tone: 'critical', side: 'above' }]} />
    );

    expect(screen.getByText('High limit 3')).toBeInTheDocument();
    const tones = [...container.querySelectorAll('[data-bin]')].map((bar) => bar.getAttribute('data-tone'));
    expect(tones).toEqual(['accent', 'accent', 'accent', 'critical']);
  });

  it('lays a second distribution over the first and lists both in the legend', () => {
    const { container } = render(
      <Histogram label="Day against night" counts={[1, 2]} min={0} max={2} seriesLabel="Day" compare={{ label: 'Night', counts: [2, 1] }} />
    );

    expect(container.querySelectorAll('[data-compare]')).toHaveLength(2);
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Night')).toBeInTheDocument();
  });
});
