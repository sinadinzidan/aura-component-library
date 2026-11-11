import { render, screen } from '@testing-library/react';

import { Delta } from './Delta';

describe(Delta.name, () => {
  it('writes the sign of a rise and judges it positive', () => {
    render(<Delta value={0.17} decimals={2} />);

    expect(screen.getByText(/\+0\.17/)).toHaveAttribute('data-sentiment', 'positive');
  });

  it('judges a fall positive when down is good', () => {
    render(<Delta value={-1.4} good="down" />);

    expect(screen.getByText(/−1\.4/)).toHaveAttribute('data-sentiment', 'positive');
  });

  it('judges a fall negative when up is good', () => {
    render(<Delta value={-0.7} />);

    expect(screen.getByText(/−0\.7/)).toHaveAttribute('data-sentiment', 'negative');
  });

  it('stays neutral for no change', () => {
    render(<Delta value={0} unit=" %" />);

    expect(screen.getByText(/0\.0 %/)).toHaveAttribute('data-sentiment', 'neutral');
  });
});
