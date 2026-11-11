import { render, screen } from '@testing-library/react';

import { WellSection } from './WellSection';
import type { WellSectionHorizon, WellSectionMark } from './WellSection';

const PATH = [
  { departure: 0, tvd: 0 },
  { departure: 0, tvd: 500 },
  { departure: 900, tvd: 1800 },
  { departure: 2100, tvd: 2450 },
];

const HORIZONS: readonly WellSectionHorizon[] = [
  { id: 'kai', name: 'Top Kai', points: [{ departure: 0, tvd: 780 }, { departure: 2500, tvd: 800 }] },
  { id: 'garn', name: 'Top Garn', points: [{ departure: 0, tvd: 2340 }, { departure: 2500, tvd: 2360 }] },
  { id: 'ile', name: 'Base Ile', points: [{ departure: 0, tvd: 2690 }, { departure: 2500, tvd: 2700 }] },
];

const MARKS: readonly WellSectionMark[] = [
  { id: 'kop', kind: 'kickoff', label: 'Kick-off 500 m', departure: 0, tvd: 500 },
  { id: 'shoe', kind: 'shoe', label: '13 3/8 in shoe', departure: 600, tvd: 1400 },
  { id: 'td', kind: 'td', label: 'TD 4 150 m MD', departure: 2100, tvd: 2450 },
];

function renderSection(plane?: { tvd: number; label: string }) {
  return render(
    <WellSection
      label="Vertical section of NK-A-01 H"
      path={PATH}
      horizons={HORIZONS}
      band={{ topId: 'garn', baseId: 'ile', label: 'Reservoir' }}
      marks={MARKS}
      plane={plane}
      maxDeparture={2500}
      maxDepth={3000}
      size={{ width: 480, height: 520 }}
    />
  );
}

describe(WellSection.name, () => {
  it('is one named image', () => {
    renderSection();

    expect(screen.getByRole('img', { name: 'Vertical section of NK-A-01 H' })).toBeInTheDocument();
  });

  it('names every horizon and the shaded interval', () => {
    renderSection();

    expect(screen.getByText('Top Kai')).toBeInTheDocument();
    expect(screen.getByText('Base Ile')).toBeInTheDocument();
    expect(screen.getByText('Reservoir')).toBeInTheDocument();
  });

  it('labels casing shoes, kick-off and total depth', () => {
    const { container } = renderSection();

    expect(screen.getByText('13 3/8 in shoe')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-kind="shoe"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-kind="kickoff"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-kind="td"]')).toHaveLength(1);
  });

  it('dimensions the departure and the depth the well reaches', () => {
    renderSection();

    expect(screen.getByText(/Departure 2,100 m/)).toBeInTheDocument();
    expect(screen.getByText(/TVD 2,450 m/)).toBeInTheDocument();
  });

  it('draws the reference plane only when given one', () => {
    const { container, rerender } = renderSection();
    expect(container.querySelector('[data-slot="section-plane"]')).toBeNull();

    rerender(
      <WellSection label="Vertical section" path={PATH} plane={{ tvd: 1240, label: '1,240 m' }} maxDeparture={2500} maxDepth={3000} size={{ width: 480, height: 520 }} />
    );

    expect(container.querySelector('[data-slot="section-plane"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="section-plane"] circle')).not.toBeNull();
  });

  it('draws the path in the size it is given', () => {
    const { container } = renderSection();

    expect(container.querySelector('svg')).toHaveAttribute('width', '480');
    expect(container.querySelector('[data-slot="section-well"]')?.getAttribute('d')).toMatch(/^M52\.0 44\.0 L/);
  });
});
