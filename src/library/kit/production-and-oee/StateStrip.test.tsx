import { render, screen } from '@testing-library/react';

import { StateStrip } from './StateStrip';

const ROWS = [
  {
    label: 'Train A',
    detail: '22.5 h running',
    segments: [
      { from: 0, to: 9, state: 'Running', tone: 'success' as const },
      { from: 9, to: 10.5, state: 'Unplanned stop', tone: 'critical' as const },
      { from: 10.5, to: 24, state: 'Running', tone: 'success' as const },
    ],
  },
];

describe(StateStrip.name, () => {
  it('draws one segment per state change with row label and axis ticks', () => {
    const { container } = render(<StateStrip label="Running state, 12 March" rows={ROWS} start={0} end={24} ticks={[{ at: 0, label: '00:00' }, { at: 12, label: '12:00' }, { at: 24, label: '24:00' }]} />);

    expect(screen.getByRole('img', { name: 'Running state, 12 March' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-state]')).toHaveLength(3);
    expect(container.querySelector('[data-state="Unplanned stop"]')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('Train A')).toBeInTheDocument();
    expect(screen.getByText('22.5 h running')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('marks now and shows a legend when given', () => {
    render(<StateStrip label="Shift so far" rows={ROWS} start={0} end={24} ticks={[]} now={{ at: 14, label: 'Now 14:00' }} legend={[{ label: 'Running', tone: 'success' }]} />);

    expect(screen.getByText('Now 14:00')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });
});
