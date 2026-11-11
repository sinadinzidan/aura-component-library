import { render, screen } from '@testing-library/react';

import { EventRail } from './EventRail';

describe(EventRail.name, () => {
  it('lists events in order with time, offset, tag and detail', () => {
    render(
      <EventRail
        label="Sequence of events to the trip"
        events={[
          { time: '13:31:40', offset: '−15 min', title: 'Vibration alarm high', tag: '23-VT-92740', detail: '7.4 mm/s', tone: 'warning' },
          { time: '13:46:12', offset: 'T0', title: 'Recompressor tripped', tone: 'critical', key: true },
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(screen.getByRole('list', { name: 'Sequence of events to the trip' })).toBeInTheDocument();
    expect(items[0]).toHaveTextContent('13:31:40');
    expect(items[0]).toHaveTextContent('−15 min');
    expect(items[0]).toHaveTextContent('23-VT-92740 · 7.4 mm/s');
    expect(items[0]).toHaveAttribute('data-tone', 'warning');
    expect(items[1]).toHaveAttribute('data-key');
  });
});
