import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CrewTimeline, type TimelineColumn, type TimelineItem, type TimelineLane } from './CrewTimeline';

const COLUMNS: TimelineColumn[] = [
  { id: 'mon', label: 'Mon 9' },
  { id: 'tue', label: 'Tue 10', detail: 'Today' },
  { id: 'wed', label: 'Wed 11' },
];

const LANES: TimelineLane[] = [
  { id: 'mech', name: 'Mechanical', detail: '3 technicians', load: { planned: 70, capacity: 72 } },
  { id: 'inst', name: 'Instrument' },
];

const ITEMS: TimelineItem[] = [
  { id: 'a', laneId: 'mech', start: 0, span: 2, hours: 16, title: 'Bearing inspection', meta: '23-KA-9103 · 16 h', tone: 'pink', flag: 'P1' },
  { id: 'b', laneId: 'inst', start: 2, span: 1, hours: 4, title: 'Loop check', tone: 'teal', done: true },
  { id: 'c', laneId: 'inst', start: null, span: 1, hours: 4, title: 'Waiting order', tone: 'blue' },
];

describe(CrewTimeline.name, () => {
  it('names the timeline and draws a button per scheduled order', () => {
    render(<CrewTimeline label="Work orders by crew" columns={COLUMNS} lanes={LANES} items={ITEMS} />);

    expect(screen.getByRole('group', { name: 'Work orders by crew' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bearing inspection, 23-KA-9103 · 16 h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Loop check' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Waiting order' })).toBeNull();
  });

  it('marks the selected order and reports selection', async () => {
    const onSelect = vi.fn();
    render(<CrewTimeline label="Week" columns={COLUMNS} lanes={LANES} items={ITEMS} selectedId="a" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Bearing inspection/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Loop check' }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('writes the lane load in words', () => {
    render(<CrewTimeline label="Week" columns={COLUMNS} lanes={LANES} items={ITEMS} />);

    expect(screen.getByRole('meter', { name: 'Mechanical load' })).toHaveAttribute('aria-valuetext', '70 of 72 hours, tight');
    expect(screen.getByText('Tight · 97 %')).toBeInTheDocument();
  });

  it('draws a load meter per column when given', () => {
    render(
      <CrewTimeline
        label="Week"
        columns={COLUMNS}
        lanes={LANES}
        items={ITEMS}
        columnLoad={[
          { planned: 8, capacity: 40 },
          { planned: 44, capacity: 40 },
          { planned: 4, capacity: 40 },
        ]}
      />
    );

    expect(screen.getByRole('meter', { name: 'Tue 10 load' })).toHaveAttribute('aria-valuetext', '44 of 40 hours, over');
    expect(screen.getByText('Over')).toBeInTheDocument();
  });
});
