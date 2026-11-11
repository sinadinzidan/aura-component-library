import { render, screen } from '@testing-library/react';

import { CoverStrip } from './CoverStrip';

describe(CoverStrip.name, () => {
  it('counts the days of cover and judges them against the lead time', () => {
    render(<CoverStrip label="Methanol" onHand={184} dailyUse={9.4} unit="m³" leadTimeDays={10} />);

    expect(screen.getByRole('img', { name: 'Methanol: 19 days of cover, lead time 10 days, covered' })).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('Covered')).toBeInTheDocument();
    expect(screen.getByText('184 m³ on hand · 9.4 m³ a day · delivery takes 10 days')).toBeInTheDocument();
  });

  it('fills one cell per covered day', () => {
    const { container } = render(<CoverStrip label="Diesel" onHand={21} dailyUse={3} unit="m³" leadTimeDays={5} horizonDays={14} />);

    expect(container.querySelectorAll('[data-covered]')).toHaveLength(7);
    expect(screen.getByRole('img')).toHaveAttribute('data-tone', 'warning');
  });

  it('warns when the stock runs out before a delivery can arrive', () => {
    render(<CoverStrip label="Corrosion inhibitor" onHand={12} dailyUse={2} unit="m³" leadTimeDays={14} />);

    expect(screen.getByText('Runs out before delivery')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-tone', 'critical');
  });

  it('caps the figure when nothing is used', () => {
    render(<CoverStrip label="Glycol" onHand={40} dailyUse={0} unit="m³" leadTimeDays={7} />);

    expect(screen.getByText('28+')).toBeInTheDocument();
  });
});
