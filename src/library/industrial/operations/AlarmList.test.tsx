import { render, screen, within } from '@testing-library/react';

import { AlarmList } from './AlarmList';
import type { OperationsAlarm } from './alarms';

describe(AlarmList.name, () => {
  it('lists the most severe alarm first', () => {
    render(<AlarmList alarms={ALARMS} label="Active alarms" formatAge={formatAge} />);

    const rows = within(screen.getByRole('list', { name: 'Active alarms' })).getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-severity'))).toEqual(['critical', 'high', 'low']);
  });

  it('keeps the given order when sorting is off', () => {
    render(<AlarmList alarms={ALARMS} label="Alarm journal" formatAge={formatAge} sort="none" />);

    const rows = screen.getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-severity'))).toEqual(['low', 'critical', 'high']);
  });

  it('formats the age of each alarm with the given formatter', () => {
    render(<AlarmList alarms={ALARMS} label="Active alarms" formatAge={formatAge} />);

    expect(screen.getByText('t-20')).toBeInTheDocument();
  });

  it('marks the first-out alarm and chattering alarms', () => {
    render(<AlarmList alarms={ALARMS} label="Active alarms" formatAge={formatAge} firstOutId="b" repeatCounts={{ c: 9 }} />);

    expect(screen.getByText('First out')).toBeInTheDocument();
    expect(screen.getByLabelText('Chattering: 9 times in 10 min')).toBeInTheDocument();
  });

  it('renders actions per alarm', () => {
    render(
      <AlarmList
        alarms={ALARMS}
        label="Active alarms"
        formatAge={formatAge}
        renderActions={(alarm) => <button type="button">Acknowledge {alarm.id}</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Acknowledge b' })).toBeInTheDocument();
  });

  it('shows the empty content instead of a list when there are no alarms', () => {
    render(<AlarmList alarms={[]} label="Active alarms" formatAge={formatAge} empty="No active alarms" />);

    expect(screen.getByText('No active alarms')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

const formatAge = (raisedAt: number) => `t-${raisedAt}`;

const alarm = (id: string, severity: OperationsAlarm['severity'], raisedAt: number): OperationsAlarm => ({
  id,
  severity,
  message: `Alarm ${id}`,
  sensorTag: `23-PT-${id}`,
  state: 'active',
  raisedAt,
  value: '1.0 barg',
  limit: '0.9 barg',
});

const ALARMS: readonly OperationsAlarm[] = [alarm('a', 'low', 10), alarm('b', 'critical', 20), alarm('c', 'high', 30)];
