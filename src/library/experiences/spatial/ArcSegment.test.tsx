import { render, screen } from '@testing-library/react';

import { ArcSegment } from './ArcSegment';

const BASE = { cx: 100, cy: 100, innerRadius: 40, outerRadius: 50, startAngle: 0, endAngle: 90, label: 'Discharge pressure: 48.6 barg' };

describe(ArcSegment.name, () => {
  it('is a named image', () => {
    render(
      <svg>
        <ArcSegment {...BASE} fraction={0.5} />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'Discharge pressure: 48.6 barg' })).toBeInTheDocument();
  });

  it('fills the given share of the segment from its start', () => {
    const { container } = render(
      <svg>
        <ArcSegment {...BASE} fraction={0.5} />
      </svg>
    );

    expect(container.querySelector('[data-slot="arc-segment-fill"]')?.getAttribute('d')).toContain('M 100 50 A 50 50 0 0 1 135.36 64.64');
  });

  it('draws only the track for an empty reading', () => {
    const { container } = render(
      <svg>
        <ArcSegment {...BASE} fraction={0} />
      </svg>
    );

    expect(container.querySelector('[data-slot="arc-segment-track"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="arc-segment-fill"]')).toBeNull();
  });

  it('clamps an overfull reading to the whole segment', () => {
    const { container } = render(
      <svg>
        <ArcSegment {...BASE} fraction={1.4} />
      </svg>
    );

    expect(container.querySelector('[data-slot="arc-segment-fill"]')?.getAttribute('d')).toBe(
      container.querySelector('[data-slot="arc-segment-track"]')?.getAttribute('d')
    );
  });

  it('prints its marker and carries its tone', () => {
    render(
      <svg>
        <ArcSegment {...BASE} fraction={0.9} marker="2" tone="warning" />
      </svg>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('data-tone', 'warning');
  });
});
