import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SchedEvent } from './conflicts';
import { EventDetailPanel } from './EventDetailPanel';

const JOB: SchedEvent = { id: 'a', title: 'Inspect drive-end bearing', dayId: '2026-03-12', resourceId: 'mechanical', start: 480, end: 720, kind: 'job', reference: '23-KA-9103' };

function renderPanel(props: Partial<Parameters<typeof EventDetailPanel>[0]> = {}) {
  return render(
    <TooltipProvider>
      <EventDetailPanel event={JOB} crewName="Mechanical" conflicts={[]} onClose={() => undefined} {...props} />
    </TooltipProvider>
  );
}

describe(EventDetailPanel.name, () => {
  it('shows the day, time, crew and asset', () => {
    renderPanel();

    expect(screen.getByRole('region', { name: 'Details of Inspect drive-end bearing' })).toBeInTheDocument();
    expect(screen.getByText('Thursday 12 March')).toBeInTheDocument();
    expect(screen.getByText('08:00–12:00 (4 h)')).toBeInTheDocument();
    expect(screen.getByText('Mechanical')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
  });

  it('lists every conflict with its reason', () => {
    renderPanel({ conflicts: [{ kind: 'double-booked', message: 'Mechanical is already booked' }, { kind: 'outside-hours', message: 'Outside working hours' }] });

    expect(screen.getByText('2 conflicts')).toBeInTheDocument();
    expect(screen.getByText('Mechanical is already booked')).toBeInTheDocument();
    expect(screen.getByText('Outside working hours')).toBeInTheDocument();
  });

  it('shows no conflict section for a clean job', () => {
    renderPanel();

    expect(screen.queryByRole('group', { name: 'Conflicts' })).not.toBeInTheDocument();
  });

  it('labels a permit reference as a permit', () => {
    renderPanel({ event: { ...JOB, kind: 'permit', allDay: true, reference: 'PTW-2291' } });

    expect(screen.getByText('Permit', { selector: 'dt' })).toBeInTheDocument();
    expect(screen.getByText('All day')).toBeInTheDocument();
  });

  it('deletes and closes', async () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    renderPanel({ onDelete, onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Delete job' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no delete action when it is not given one', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: 'Delete job' })).not.toBeInTheDocument();
  });
});
