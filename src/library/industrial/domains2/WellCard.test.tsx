import { render, screen } from '@testing-library/react';

import { WellCard } from './WellCard';

describe(WellCard.name, () => {
  it('names the well and its state', () => {
    render(<WellCard name="NK A-12 H" state="producing" rates={{ oil: 600, gas: 90, water: 400 }} choke={62} />);

    expect(screen.getByRole('article', { name: 'Well NK A-12 H, producing' })).toBeInTheDocument();
    expect(screen.getByText('Producing')).toBeInTheDocument();
  });

  it('prints the three phase rates', () => {
    render(<WellCard name="NK A-12 H" state="producing" rates={{ oil: 612, gas: 94, water: 388 }} choke={62} />);

    expect(screen.getByText('612')).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('388')).toBeInTheDocument();
  });

  it('derives water cut and gas-oil ratio from the rates', () => {
    render(<WellCard name="NK A-12 H" state="producing" rates={{ oil: 600, gas: 90, water: 400 }} choke={62} />);

    expect(screen.getByText('40.0 %')).toBeInTheDocument();
    expect(screen.getByText('150 Sm³/Sm³')).toBeInTheDocument();
  });

  it('prints dashes for a well that is not flowing', () => {
    render(<WellCard name="NK A-07" state="shut-in" choke={0} />);

    expect(screen.getByText('Shut in')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(5);
  });

  it('shows tubing head pressure only when given', () => {
    const { rerender } = render(<WellCard name="NK A-12 H" state="producing" choke={62} />);
    expect(screen.queryByText('Tubing head')).not.toBeInTheDocument();

    rerender(<WellCard name="NK A-12 H" state="producing" choke={62} tubingHeadPressure={84.5} />);

    expect(screen.getByText('84.5 barg')).toBeInTheDocument();
  });

  it('draws the oil trend when there is one', () => {
    render(<WellCard name="NK A-12 H" state="producing" choke={62} trend={[640, 630, 612]} trendLabel="Oil rate, 30 days" />);

    expect(screen.getByRole('img', { name: /Oil rate, 30 days/ })).toBeInTheDocument();
  });
});
