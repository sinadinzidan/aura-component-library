import { render, screen } from '@testing-library/react';

import { NumberCell } from './NumberCell';

describe(NumberCell.name, () => {
  it('formats with a fixed number of decimals', () => {
    render(<NumberCell value={48.6} decimals={2} />);

    expect(screen.getByText('48.60')).toBeInTheDocument();
  });

  it('adds thousands separators', () => {
    render(<NumberCell value={182400} />);

    expect(screen.getByText('182,400')).toBeInTheDocument();
  });

  it('shows the unit after the number', () => {
    render(<NumberCell value={9840} unit="rpm" />);

    expect(screen.getByText('rpm')).toHaveClass('text-muted-foreground');
  });

  it('uses tabular digits and right-aligns the number in a fixed-width box', () => {
    render(<NumberCell value={7} width={8} />);

    const number = screen.getByText('7');
    expect(number).toHaveClass('text-right');
    expect(number).toHaveStyle({ minWidth: '8ch' });
    expect(number.parentElement).toHaveClass('tabular-nums');
  });

  it.each([null, undefined, Number.NaN])('shows a placeholder and no unit for %s', (value) => {
    render(<NumberCell value={value} unit="barg" />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('barg')).not.toBeInTheDocument();
  });

  it('uses a custom placeholder', () => {
    render(<NumberCell value={null} placeholder="No signal" />);

    expect(screen.getByText('No signal')).toBeInTheDocument();
  });

  it('marks an out-of-limit value with colour and says why in text', () => {
    render(<NumberCell value={146.3} decimals={1} tone="critical" toneLabel="Above high limit" />);

    expect(screen.getByText('146.3')).toHaveClass('text-critical-foreground-strong');
    expect(screen.getByText(', Above high limit')).toHaveClass('sr-only');
  });
});
