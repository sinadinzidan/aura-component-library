import { render, screen } from '@testing-library/react';

import { TimeRing } from './TimeRing';
import type { TimeRingEvent } from './TimeRing';

const EVENTS: readonly TimeRingEvent[] = [
  { id: 'e1', hour: 13.75, kind: 'trip', label: 'Recompressor tripped at 13:46' },
  { id: 'e2', hour: 9, kind: 'alarm', label: 'Cooler outlet temperature high at 09:00' },
];

describe(TimeRing.name, () => {
  it('draws a tick for each of the 24 hours', () => {
    const { container } = render(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} />
      </svg>
    );

    expect(container.querySelectorAll('[data-slot="time-ring-hour"]')).toHaveLength(24);
  });

  it('numbers every third hour by default', () => {
    render(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} />
      </svg>
    );

    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.queryByText('01')).not.toBeInTheDocument();
  });

  it('marks events as named images with a shape per kind', () => {
    render(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} events={EVENTS} />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'Recompressor tripped at 13:46' })).toHaveAttribute('data-kind', 'trip');
    expect(screen.getByRole('img', { name: 'Cooler outlet temperature high at 09:00' })).toHaveAttribute('data-kind', 'alarm');
  });

  it('places an event at its hour on the ring', () => {
    render(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} events={[{ id: 'e', hour: 6, kind: 'note', label: 'Shift handover' }]} />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'Shift handover' })).toHaveAttribute('transform', 'translate(334 200)');
  });

  it('draws the cursor and the now marker only when given', () => {
    const { container, rerender } = render(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} />
      </svg>
    );
    expect(container.querySelector('[data-slot="time-ring-cursor"]')).toBeNull();
    expect(container.querySelector('[data-slot="time-ring-now"]')).toBeNull();

    rerender(
      <svg>
        <TimeRing cx={200} cy={200} radius={150} cursorHour={10} nowHour={14} />
      </svg>
    );

    expect(container.querySelector('[data-slot="time-ring-cursor"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="time-ring-now"]')).not.toBeNull();
  });
});
