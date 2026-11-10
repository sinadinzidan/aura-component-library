import { render, screen } from '@testing-library/react';

import { DaysOfCover } from './DaysOfCover';

describe(DaysOfCover.name, () => {
  it('shows whole days of cover from stock and daily use', () => {
    render(<DaysOfCover label="Methanol" onHand={1850} dailyUse={100} leadTimeDays={5} />);

    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName('Methanol: 18 days of cover, lead time 5 days');
  });

  it('stays neutral with room beyond the lead time', () => {
    const { container } = render(<DaysOfCover label="Methanol" onHand={1800} dailyUse={100} leadTimeDays={5} />);

    expect(container.querySelector('[data-slot="days-of-cover"]')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.queryByText(/lead time$/)).not.toBeInTheDocument();
  });

  it('warns in words when cover is close to the lead time', () => {
    render(<DaysOfCover label="Methanol" onHand={600} dailyUse={100} leadTimeDays={5} />);

    expect(screen.getByText('Close to lead time')).toBeInTheDocument();
  });

  it('is critical in words when cover is shorter than the lead time', () => {
    const { container } = render(<DaysOfCover label="Methanol" onHand={300} dailyUse={100} leadTimeDays={5} />);

    expect(container.querySelector('[data-slot="days-of-cover"]')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('Shorter than lead time')).toBeInTheDocument();
  });

  it('says so when nothing is being consumed', () => {
    render(<DaysOfCover label="Methanol" onHand={300} dailyUse={0} leadTimeDays={5} />);

    expect(screen.getByText('No consumption')).toBeInTheDocument();
  });

  it('places the lead time tick on the scale', () => {
    const { container } = render(<DaysOfCover label="Methanol" onHand={1000} dailyUse={100} leadTimeDays={5} horizonDays={20} />);

    expect(container.querySelector<HTMLElement>('[data-slot="cover-lead-time"]')?.style.left).toBe('25%');
    expect(container.querySelector<HTMLElement>('[data-slot="cover-fill"]')?.style.width).toBe('50%');
  });

  it('renders a compact number for table rows', () => {
    render(<DaysOfCover variant="inline" label="Methanol" onHand={300} dailyUse={100} leadTimeDays={5} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('Methanol: 3 days of cover, lead time 5 days, shorter than lead time');
  });
});
