import { render, screen } from '@testing-library/react';

import { ScheduleStrip } from './ScheduleStrip';

const DAYS = ['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13'] as const;

describe(ScheduleStrip.name, () => {
  it('names the schedule and prints the column headings', () => {
    render(<ScheduleStrip label="Week 11 plan" columns={DAYS} bars={[]} />);

    expect(screen.getByRole('group', { name: 'Week 11 plan' })).toBeInTheDocument();
    expect(screen.getByText('Wed 11')).toBeInTheDocument();
  });

  it('places a bar by its start and end', () => {
    render(<ScheduleStrip label="Plan" columns={DAYS} bars={[{ id: 'a', label: 'WO-104482', start: 1, end: 3.5 }]} />);

    expect(screen.getByRole('img', { name: /WO-104482/ })).toHaveStyle({ left: '20%', width: '50%' });
  });

  it('describes a bar by the columns it spans', () => {
    render(<ScheduleStrip label="Plan" columns={DAYS} bars={[{ id: 'a', label: 'WO-104482', sublabel: 'Bearing inspection', start: 1, end: 3, text: 'Tomás Barros' }]} />);

    expect(screen.getByRole('img', { name: 'WO-104482, Bearing inspection: Tue 10 to Wed 11, Tomás Barros' })).toBeInTheDocument();
  });

  it('clamps a bar that runs outside the week', () => {
    render(<ScheduleStrip label="Plan" columns={DAYS} bars={[{ id: 'a', label: 'WO-104419', start: -2, end: 9 }]} />);

    expect(screen.getByRole('img', { name: /WO-104419/ })).toHaveStyle({ left: '0%', width: '100%' });
  });

  it('takes a tone for a state such as overdue and softens tentative work', () => {
    render(
      <ScheduleStrip
        label="Plan"
        columns={DAYS}
        bars={[
          { id: 'a', label: 'WO-1', start: 0, end: 1, tone: 'critical' },
          { id: 'b', label: 'WO-2', start: 2, end: 3, tentative: true },
        ]}
      />
    );

    expect(screen.getByRole('img', { name: /WO-1:/ })).toHaveClass('bg-chart-critical-450');
    expect(screen.getByRole('img', { name: /WO-2:/ })).toHaveClass('bg-chart-1-200');
  });

  it('prints the text of a short bar beside it instead of inside', () => {
    const { container } = render(
      <ScheduleStrip
        label="Plan"
        columns={DAYS}
        bars={[
          { id: 'a', label: 'WO-1', start: 1, end: 1.5, text: 'Tomás Barros' },
          { id: 'b', label: 'WO-2', start: 0, end: 3, text: 'Jonas Nyberg' },
        ]}
      />
    );

    const outside = container.querySelectorAll('[data-slot="schedule-bar-text"]');
    expect(outside).toHaveLength(1);
    expect(outside[0]).toHaveTextContent('Tomás Barros');
    expect(screen.getByRole('img', { name: /WO-2/ })).toHaveTextContent('Jonas Nyberg');
  });

  it('draws the now line on every row when given', () => {
    const { container } = render(
      <ScheduleStrip label="Plan" columns={DAYS} now={3.6} bars={[{ id: 'a', label: 'WO-1', start: 0, end: 1 }, { id: 'b', label: 'WO-2', start: 2, end: 3 }]} />
    );

    expect(container.querySelectorAll('[data-slot="schedule-now"]')).toHaveLength(2);
  });
});
