import { render, screen } from '@testing-library/react';

import { ConcentricRings } from './ConcentricRings';

const RINGS = [
  { id: 'availability', label: 'Availability', value: 96.4 },
  { id: 'performance', label: 'Performance', value: 88.1 },
  { id: 'quality', label: 'Quality', value: 0 },
];

describe(ConcentricRings.name, () => {
  it('names the headline and every ring', () => {
    render(
      <svg>
        <ConcentricRings cx={100} cy={100} radius={90} rings={RINGS} value={82.7} unit="%" caption="OEE" />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'OEE: 82.7 %. Availability 96.4 %, Performance 88.1 %, Quality 0.0 %' })).toBeInTheDocument();
  });

  it('prints the headline and its caption', () => {
    render(
      <svg>
        <ConcentricRings cx={100} cy={100} radius={90} rings={RINGS} value={82.7} caption="OEE" />
      </svg>
    );

    expect(screen.getByText('82.7')).toBeInTheDocument();
    expect(screen.getByText('OEE')).toBeInTheDocument();
  });

  it('nests one track per ring and skips the arc of an empty ring', () => {
    const { container } = render(
      <svg>
        <ConcentricRings cx={100} cy={100} radius={90} rings={RINGS} value={82.7} caption="OEE" />
      </svg>
    );

    const radii = [...container.querySelectorAll('[data-slot="concentric-ring"] circle')].map((circle) => circle.getAttribute('r'));
    expect(radii).toEqual(['84', '66', '48']);
    expect(container.querySelectorAll('[data-slot="concentric-ring-value"]')).toHaveLength(2);
  });

  it('gives each ring its own series colour', () => {
    const { container } = render(
      <svg>
        <ConcentricRings cx={100} cy={100} radius={90} rings={RINGS} value={82.7} caption="OEE" />
      </svg>
    );

    const arcs = container.querySelectorAll('[data-slot="concentric-ring-value"]');
    expect(arcs[0]).toHaveClass('stroke-chart-1-450');
    expect(arcs[1]).toHaveClass('stroke-chart-2-450');
  });
});
