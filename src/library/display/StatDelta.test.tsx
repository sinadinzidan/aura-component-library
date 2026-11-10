import { render, screen } from '@testing-library/react';

import { StatDelta } from './StatDelta';

describe(StatDelta.name, () => {
  it('shows the value with its unit and label', () => {
    render(<StatDelta label="Discharge pressure" value={48.6} previous={47.1} unit="barg" decimals={1} />);

    expect(screen.getByRole('status')).toHaveTextContent('48.6barg');
    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
  });

  it('shows a signed increase', () => {
    render(<StatDelta label="Open work orders" value={12} previous={9} />);

    expect(screen.getByText(/\+3/)).toBeInTheDocument();
  });

  it('shows a signed decrease', () => {
    render(<StatDelta label="Open work orders" value={9} previous={12} />);

    expect(screen.getByText(/−3/)).toBeInTheDocument();
  });

  it('marks a rise as better when higher is better', () => {
    render(<StatDelta label="Availability" value={97} previous={95} betterWhen="higher" />);

    expect(screen.getByText(/\+2/)).toHaveAttribute('data-outcome', 'better');
  });

  it('marks a rise as worse when lower is better', () => {
    render(<StatDelta label="Active alarms" value={7} previous={4} betterWhen="lower" />);

    expect(screen.getByText(/\+3/)).toHaveAttribute('data-outcome', 'worse');
  });

  it('keeps the change neutral when neither direction is better', () => {
    render(<StatDelta label="Shaft speed" value={9840} previous={9800} />);

    expect(screen.getByText(/\+40/)).toHaveAttribute('data-outcome', 'neutral');
  });

  it('says "No change" when the rounded values are equal', () => {
    render(<StatDelta label="Separator level" value={54.31} previous={54.33} decimals={1} betterWhen="lower" />);

    expect(screen.getByText(/No change/)).toHaveAttribute('data-outcome', 'neutral');
  });

  it('formats the value and the change with the given formatter', () => {
    const format = (value: number) => `${(value / 1000).toFixed(1)}k`;
    render(<StatDelta label="Gas flow" value={182400} previous={180000} format={format} />);

    expect(screen.getByRole('status')).toHaveTextContent('182.4k');
    expect(screen.getByText(/\+2\.4k/)).toBeInTheDocument();
  });
});
