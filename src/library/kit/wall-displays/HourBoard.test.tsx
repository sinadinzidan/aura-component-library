import { render, screen, within } from '@testing-library/react';

import { HourBoard } from './HourBoard';

const ROWS = [
  { hour: '06–07', plan: 120, actual: 124 },
  { hour: '07–08', plan: 120, actual: 96, note: 'Filler jam' },
  { hour: '08–09', plan: 120, actual: null },
];

describe(HourBoard.name, () => {
  it('writes the signed gap per hour and totals the hours that have run', () => {
    render(<HourBoard label="Line 2 hour by hour" rows={ROWS} current="07–08" />);

    const table = screen.getByRole('table', { name: 'Line 2 hour by hour' });
    expect(within(table).getByText('+4')).toHaveAttribute('data-tone', 'success');
    expect(within(table).getByText('−24')).toHaveAttribute('data-tone', 'critical');
    expect(within(table).getByText('Filler jam')).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: /Shift so far/ })).toHaveTextContent('240220−20');
  });

  it('marks the running hour', () => {
    const { container } = render(<HourBoard label="Hours" rows={ROWS} current="07–08" />);

    expect(container.querySelectorAll('[data-current="true"]')).toHaveLength(1);
    expect(screen.getByText('now')).toBeInTheDocument();
  });
});
