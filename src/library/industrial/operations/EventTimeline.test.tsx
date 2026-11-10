import { render, screen } from '@testing-library/react';

import { EventTimeline } from './EventTimeline';
import type { TimelineEvent } from './EventTimeline';

describe(EventTimeline.name, () => {
  it('lists events with their time and title', () => {
    render(<EventTimeline events={EVENTS} label="Alarm history" />);

    const list = screen.getByRole('list', { name: 'Alarm history' });
    expect(list).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('13:46')).toBeInTheDocument();
    expect(screen.getByText('Alarm raised')).toBeInTheDocument();
  });

  it('prints a group heading once for consecutive events in the same group', () => {
    const { container } = render(<EventTimeline events={EVENTS} label="Event log" />);

    const headings = Array.from(container.querySelectorAll('[data-slot="timeline-group"]')).map((node) => node.textContent);
    expect(headings).toEqual(['13:00', '14:00']);
  });

  it('colours a marker only when the event has a tone', () => {
    const { container } = render(<EventTimeline events={EVENTS} label="Event log" />);

    const tones = Array.from(container.querySelectorAll('[data-slot="status-dot"]')).map((node) => node.getAttribute('data-tone'));
    expect(tones).toEqual(['critical', 'neutral', 'neutral']);
  });

  it('draws a pending step hollow and says it is pending in the horizontal layout', () => {
    const { container } = render(<EventTimeline events={EVENTS} label="Life cycle" orientation="horizontal" />);

    const pending = container.querySelector('[data-pending="true"]');
    expect(pending?.querySelector('[data-slot="status-dot"]')).toHaveAttribute('data-shape', 'ring');
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows the detail of an event', () => {
    render(<EventTimeline events={EVENTS} label="Event log" />);

    expect(screen.getByText('Ingrid Haugen')).toBeInTheDocument();
  });
});

const EVENTS: readonly TimelineEvent[] = [
  { id: 'raised', time: '13:46', title: 'Alarm raised', tone: 'critical', shape: 'diamond', group: '13:00' },
  { id: 'ack', time: '13:52', title: 'Acknowledged', detail: 'Ingrid Haugen', group: '13:00' },
  { id: 'cleared', title: 'Cleared', pending: true, group: '14:00' },
];
