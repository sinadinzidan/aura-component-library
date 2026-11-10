import { render, screen, within } from '@testing-library/react';

import { AlarmRow } from './AlarmRow';
import type { OperationsAlarm } from './alarms';

describe(AlarmRow.name, () => {
  it('shows severity in words, the message, the tag and the age', () => {
    render(<ul><AlarmRow alarm={ALARM} age="14 min ago" assetName="Recompressor" /></ul>);

    const row = screen.getByRole('listitem');
    expect(within(row).getByText('Critical')).toBeInTheDocument();
    expect(within(row).getByText('Recompressor tripped on high vibration')).toBeInTheDocument();
    expect(within(row).getByText('23-VT-92740')).toHaveClass('font-mono');
    expect(within(row).getByText('14 min ago')).toBeInTheDocument();
  });

  it('shows the value against its limit and the state at full density', () => {
    render(<ul><AlarmRow alarm={ALARM} age="14 min ago" /></ul>);

    expect(screen.getByText('11.6 mm/s')).toBeInTheDocument();
    expect(screen.getByText('Limit 11.0 mm/s')).toBeInTheDocument();
    expect(screen.getByText('Unacknowledged')).toBeInTheDocument();
  });

  it('drops the limit and state columns when compact', () => {
    render(<ul><AlarmRow alarm={ALARM} age="14 min ago" density="compact" /></ul>);

    expect(screen.queryByText('Limit 11.0 mm/s')).not.toBeInTheDocument();
    expect(screen.queryByText('Unacknowledged')).not.toBeInTheDocument();
  });

  it('pulses only an unacknowledged critical alarm', () => {
    const { container, rerender } = render(<ul><AlarmRow alarm={ALARM} age="14 min ago" /></ul>);
    expect(container.querySelector('[data-slot="status-dot-pulse"]')).toBeInTheDocument();

    rerender(<ul><AlarmRow alarm={{ ...ALARM, state: 'acknowledged' }} age="14 min ago" /></ul>);

    expect(container.querySelector('[data-slot="status-dot-pulse"]')).not.toBeInTheDocument();
  });

  it('marks a chattering alarm with its repeat count', () => {
    render(<ul><AlarmRow alarm={ALARM} age="2 min ago" repeatCount={14} /></ul>);

    expect(screen.getByLabelText('Chattering: 14 times in 10 min')).toBeInTheDocument();
  });

  it('does not mark a single occurrence as chattering', () => {
    render(<ul><AlarmRow alarm={ALARM} age="2 min ago" repeatCount={1} /></ul>);

    expect(screen.queryByLabelText(/Chattering/)).not.toBeInTheDocument();
  });

  it('marks the first-out alarm', () => {
    render(<ul><AlarmRow alarm={ALARM} age="14 min ago" firstOut /></ul>);

    expect(screen.getByText('First out')).toBeInTheDocument();
  });

  it('renders the actions it is given', () => {
    render(<ul><AlarmRow alarm={ALARM} age="14 min ago" actions={<button type="button">Acknowledge</button>} /></ul>);

    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });
});

const ALARM: OperationsAlarm = {
  id: 'alm-4812',
  severity: 'critical',
  message: 'Recompressor tripped on high vibration',
  sensorTag: '23-VT-92740',
  state: 'active',
  raisedAt: 1_000,
  value: '11.6 mm/s',
  limit: '11.0 mm/s',
};
