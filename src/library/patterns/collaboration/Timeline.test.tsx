import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Timeline } from './Timeline';
import { TimelineGap } from './TimelineGap';
import { TimelineItem } from './TimelineItem';

describe(Timeline.name, () => {
  it('is a named ordered list of its events', () => {
    render(
      <Timeline label="Incident timeline">
        <TimelineItem title="Trip" time="13:46" />
        <TimelineItem title="Restart" time="15:10" />
      </Timeline>
    );

    const list = screen.getByRole('list', { name: 'Incident timeline' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('passes its layout to the items', () => {
    render(
      <Timeline label="Log" layout="time-start">
        <TimelineItem title="Trip" time="13:46" />
      </Timeline>
    );

    expect(screen.getByRole('list')).toHaveAttribute('data-layout', 'time-start');
    expect(screen.getByText('13:46').parentElement).toHaveClass('text-right');
  });
});

describe(TimelineItem.name, () => {
  it('shows the title, time and description', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="Alarm raised" time="13:46" description="23-VT-92740 reached 11.6 mm/s" />
      </Timeline>
    );

    expect(screen.getByText('Alarm raised')).toBeInTheDocument();
    expect(screen.getByText('13:46')).toBeInTheDocument();
    expect(screen.getByText('23-VT-92740 reached 11.6 mm/s')).toBeInTheDocument();
  });

  it('marks the current event for assistive tech and in words', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="In progress" state="current" />
      </Timeline>
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('(Current)')).toBeInTheDocument();
  });

  it('says in words that a pending event has not happened', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="Close out" state="pending" />
      </Timeline>
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'pending');
    expect(screen.getByText('(Not yet)')).toBeInTheDocument();
  });

  it('adds no state words to an event that simply happened', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="Alarm raised" />
      </Timeline>
    );

    expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-current');
    expect(screen.queryByText(/\(Current\)|\(Not yet\)/)).not.toBeInTheDocument();
  });

  it('renders a group heading above the item', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="Alarm raised" heading="Today" />
      </Timeline>
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders rich content under the title', () => {
    render(
      <Timeline label="Log">
        <TimelineItem title="Comment added">
          <p>Bearing replaced.</p>
        </TimelineItem>
      </Timeline>
    );

    expect(screen.getByText('Bearing replaced.')).toBeInTheDocument();
  });

  it('dashes the line below a pending event', () => {
    const { container } = render(
      <Timeline label="Log">
        <TimelineItem title="Close out" state="pending" />
      </Timeline>
    );

    expect(container.querySelector('[data-slot="timeline-connector"]')).toHaveClass('border-dashed');
  });
});

describe(TimelineGap.name, () => {
  it('says how many events are hidden', () => {
    render(
      <Timeline label="Log">
        <TimelineGap count={8} onExpand={vi.fn()} />
      </Timeline>
    );

    expect(screen.getByRole('button', { name: 'Show 8 earlier events' })).toBeInTheDocument();
  });

  it('uses the singular for one event', () => {
    render(
      <Timeline label="Log">
        <TimelineGap count={1} onExpand={vi.fn()} />
      </Timeline>
    );

    expect(screen.getByRole('button', { name: 'Show 1 earlier event' })).toBeInTheDocument();
  });

  it('asks the owner to expand', async () => {
    const onExpand = vi.fn();
    render(
      <Timeline label="Log">
        <TimelineGap count={8} onExpand={onExpand} label={(count) => `Show ${count} more`} />
      </Timeline>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Show 8 more' }));

    expect(onExpand).toHaveBeenCalledTimes(1);
  });
});
