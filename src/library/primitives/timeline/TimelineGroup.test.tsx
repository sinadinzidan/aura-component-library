import { render, screen, within } from '@testing-library/react';

import { Timeline } from './Timeline';
import { TimelineGroup } from './TimelineGroup';
import { TimelineItem } from './TimelineItem';

describe(TimelineGroup.name, () => {
  it('names its list of events after the heading', () => {
    render(
      <Timeline label="Activity">
        <TimelineGroup heading="Today" meta="2 events">
          <TimelineItem title="Work order created" />
          <TimelineItem title="Alarm acknowledged" />
        </TimelineGroup>
        <TimelineGroup heading="Yesterday">
          <TimelineItem title="Calibration done" />
        </TimelineGroup>
      </Timeline>
    );

    const today = screen.getByRole('list', { name: 'Today' });
    expect(within(today).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 events')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Yesterday' })).getAllByRole('listitem')).toHaveLength(1);
  });
});
