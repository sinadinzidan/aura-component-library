import { render, screen } from '@testing-library/react';

import { PercentileBand } from './PercentileBand';

describe(PercentileBand.name, () => {
  it('describes the median and the range', () => {
    render(<PercentileBand label="Shaft power" p10={9.6} p50={10.3} p90={11.2} unit="MW" />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Shaft power: median 10.3 MW, 80 % range 9.6 to 11.2 MW');
  });

  it('prints the three percentiles', () => {
    render(<PercentileBand label="Shaft power" p10={9.6} p50={10.3} p90={11.2} unit="MW" />);

    expect(screen.getByText('P10').nextElementSibling).toHaveTextContent('9.6');
    expect(screen.getByText('P50').nextElementSibling).toHaveTextContent('10.3');
    expect(screen.getByText('P90').nextElementSibling).toHaveTextContent('11.2');
  });

  it('places the band and the median on the scale', () => {
    const { container } = render(<PercentileBand label="Shaft power" p10={20} p50={50} p90={80} min={0} max={100} />);

    const range = container.querySelector<HTMLElement>('[data-slot="band-range"]');
    expect(range?.style.left).toBe('20%');
    expect(range?.style.width).toBe('60%');
    expect(container.querySelector<HTMLElement>('[data-slot="band-median"]')?.style.left).toBe('50%');
  });

  it('marks and names a reference value', () => {
    const { container } = render(<PercentileBand label="Shaft power" p10={20} p50={50} p90={80} min={0} max={100} reference={{ value: 90, label: 'Driver limit' }} />);

    expect(container.querySelector<HTMLElement>('[data-slot="band-reference"]')?.style.left).toBe('90%');
    expect(screen.getByText('Driver limit').nextElementSibling).toHaveTextContent('90.0');
    expect(screen.getByRole('img')).toHaveAccessibleName(/driver limit 90\.0$/);
  });

  it('widens the default scale to include the reference', () => {
    const { container } = render(<PercentileBand label="Shaft power" p10={20} p50={50} p90={80} reference={{ value: 120, label: 'Driver limit' }} />);

    expect(parseFloat(container.querySelector<HTMLElement>('[data-slot="band-reference"]')?.style.left ?? '')).toBeLessThan(100);
  });
});
