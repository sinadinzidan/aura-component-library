import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SchedEvent } from './conflicts';
import { CREW_TONES, EventBlock } from './EventBlock';

const JOB: SchedEvent = { id: 'a', title: 'Inspect drive-end bearing', dayId: '2026-03-12', resourceId: 'mechanical', start: 480, end: 720, kind: 'job', reference: '23-KA-9103' };

function renderBlock(props: Partial<Parameters<typeof EventBlock>[0]> = {}) {
  return render(<EventBlock event={JOB} tone={CREW_TONES[0]} crewName="Mechanical" {...props} />);
}

describe(EventBlock.name, () => {
  it('is a button named by title, time, reference and crew', () => {
    renderBlock();

    expect(screen.getByRole('button', { name: 'Inspect drive-end bearing, 08:00–12:00, 23-KA-9103, Mechanical' })).toBeInTheDocument();
  });

  it('shows the time and the reference as text', () => {
    renderBlock();

    expect(screen.getByText('08:00–12:00')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
  });

  it('shows only the title when there is room for one line', () => {
    renderBlock({ lines: 1 });

    expect(screen.queryByText('08:00–12:00')).not.toBeInTheDocument();
  });

  it('adds the word Conflict and the reason when it clashes', () => {
    renderBlock({ conflict: 'Mechanical is already booked', lines: 4 });

    expect(screen.getByText('Conflict')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAccessibleName(/conflict: Mechanical is already booked/);
  });

  it('reports a press', async () => {
    const onActivate = vi.fn();
    renderBlock({ onActivate });

    await userEvent.click(screen.getByRole('button'));

    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('marks the selected block as pressed', () => {
    renderBlock({ selected: true });

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('has a resize handle, except for all-day items and previews', () => {
    const { unmount } = renderBlock();
    expect(document.querySelector('[data-sched-resize="a"]')).toBeInTheDocument();
    unmount();
    renderBlock({ event: { ...JOB, allDay: true } });
    expect(document.querySelector('[data-sched-resize]')).not.toBeInTheDocument();
  });

  it('hides a drop preview from assistive technology', () => {
    renderBlock({ ghost: true });

    expect(document.querySelector('[aria-hidden="true"][tabindex="-1"]')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
