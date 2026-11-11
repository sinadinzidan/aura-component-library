import { render, screen, within } from '@testing-library/react';

import { Timeline } from './Timeline';
import { TimelineItem } from './TimelineItem';

describe(Timeline.name, () => {
  it('is a named ordered list of events', () => {
    render(
      <Timeline label="Incident timeline">
        <TimelineItem title="Alarm raised" time="13:46" />
        <TimelineItem title="Acknowledged" time="13:48" />
      </Timeline>
    );

    const list = screen.getByRole('list', { name: 'Incident timeline' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });

  it('is a vertical, plain timeline by default', () => {
    render(<Timeline label="Incident timeline">{null}</Timeline>);

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('data-orientation', 'vertical');
    expect(list).toHaveAttribute('data-layout', 'plain');
  });

  it('lays items out in a row when horizontal', () => {
    render(
      <Timeline label="Alarm life cycle" orientation="horizontal">
        <TimelineItem title="Raised" />
      </Timeline>
    );

    const list = screen.getByRole('list');
    expect(list).toHaveClass('flex-row');
    expect(list).not.toHaveAttribute('data-layout');
  });

  it('gives items a time column in the time-start layout', () => {
    const { container } = render(
      <Timeline label="Shift log" layout="time-start">
        <TimelineItem title="Handover" time="06:00" duration="15 min" />
      </Timeline>
    );

    const column = container.querySelector('[data-slot="timeline-time-column"]');
    expect(column).toHaveTextContent('06:00');
    expect(column).toHaveTextContent('15 min');
  });
});
