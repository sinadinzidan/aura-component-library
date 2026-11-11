import { render, screen, within } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { EventTimeline, type TimelineEvent } from './EventTimeline';

const EVENTS: TimelineEvent[] = [
  { id: 'a', time: '13:31', kind: 'Alarm', tone: 'warning', icon: <svg />, title: 'Vibration high', detail: '9.4 mm/s' },
  { id: 'b', time: '13:46', kind: 'Trip', tone: 'critical', icon: <svg />, title: 'Recompressor tripped' },
];

describe(EventTimeline.name, () => {
  it('renders the events in order with time, kind, title and detail', () => {
    render(<EventTimeline label="Trip sequence" events={EVENTS} />);

    const items = within(screen.getByRole('list', { name: 'Trip sequence' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('13:31');
    expect(items[0]).toHaveTextContent('Vibration high');
    expect(items[0]).toHaveTextContent('Alarm · 9.4 mm/s');
    expect(items[1]).toHaveTextContent('Recompressor tripped');
  });

  it('carries each event tone', () => {
    render(<EventTimeline label="Trip sequence" events={EVENTS} />);

    expect(screen.getAllByRole('listitem')[1]).toHaveAttribute('data-tone', 'critical');
  });

  it('becomes a ledger with the time first in console', () => {
    render(
      <LookScope look="console">
        <EventTimeline label="Trip sequence" events={EVENTS} />
      </LookScope>
    );

    const first = screen.getAllByRole('listitem')[0];
    expect(first.firstElementChild).toHaveTextContent('13:31');
    expect(first).toHaveTextContent('9.4 mm/s');
  });
});
