import { render, screen, within } from '@testing-library/react';

import { OeeBreakdown } from './OeeBreakdown';

describe(OeeBreakdown.name, () => {
  it('prints the three factors and the OEE they multiply to', () => {
    render(<OeeBreakdown availability={90} performance={90} quality={90} />);

    const group = screen.getByRole('group');
    expect(within(group).getAllByText('90.0')).toHaveLength(3);
    expect(within(group).getByText('72.9')).toBeInTheDocument();
  });

  it('names the whole equation for assistive technology', () => {
    render(<OeeBreakdown availability={96.4} performance={87.4} quality={98.2} />);

    expect(screen.getByRole('group')).toHaveAccessibleName(/^OEE 82\.7 %: availability 96\.4 % × performance 87\.4 % × quality 98\.2 %$/);
  });

  it('prints the target when given', () => {
    render(<OeeBreakdown availability={96.4} performance={87.4} quality={98.2} target={85} />);

    expect(screen.getByText(/Target 85\.0/)).toBeInTheDocument();
  });

  it('draws a ring per factor and one for the result in the rings layout', () => {
    render(<OeeBreakdown layout="rings" availability={96.4} performance={87.4} quality={98.2} />);

    expect(screen.getAllByRole('img')).toHaveLength(4);
    expect(screen.getByRole('img', { name: /^OEE: 82\.7/ })).toBeInTheDocument();
  });
});
