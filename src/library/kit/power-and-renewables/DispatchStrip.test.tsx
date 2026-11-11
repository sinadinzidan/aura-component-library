import { render, screen, within } from '@testing-library/react';

import { DispatchStrip, type DispatchRow } from './DispatchStrip';

const ROWS: DispatchRow[] = [
  {
    id: 'battery',
    label: 'Battery',
    detail: '20 MWh',
    segments: [
      { id: 'charge', from: 1, to: 5, label: 'Charge 4 MW', tone: 'info' },
      { id: 'blip', from: 9, to: 9.5, label: 'Frequency response', tone: 'purple' },
    ],
  },
];

describe(DispatchStrip.name, () => {
  it('names every instruction with its hours', () => {
    render(<DispatchStrip label="Dispatch schedule" rows={ROWS} now={14} />);

    const row = screen.getByRole('list', { name: 'Battery instructions' });
    expect(within(row).getByLabelText('Charge 4 MW, 01:00 to 05:00')).toBeInTheDocument();
    expect(within(row).getByLabelText('Frequency response, 09:00 to 09:30')).toBeInTheDocument();
  });

  it('prints the instruction only on a block wide enough to hold it', () => {
    render(<DispatchStrip label="Dispatch schedule" rows={ROWS} />);

    expect(screen.getByText('Charge 4 MW')).toBeInTheDocument();
    expect(screen.queryByText('Frequency response')).toBeNull();
  });

  it('marks now on the axis', () => {
    const { container } = render(<DispatchStrip label="Dispatch schedule" rows={ROWS} now={14} />);

    expect(screen.getByText('Now 14:00')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="dispatch-now"]')).not.toBeNull();
  });
});
