import { render, screen } from '@testing-library/react';

import { PerspectiveGrid } from './PerspectiveGrid';

const VIEW = { width: 800, height: 500, horizonY: 140 };

describe(PerspectiveGrid.name, () => {
  it('is a labelled group', () => {
    render(<PerspectiveGrid view={VIEW} label="Plant floor" />);

    expect(screen.getByRole('group', { name: 'Plant floor' })).toBeInTheDocument();
  });

  it('draws one more line than cells in each direction, plus a horizon', () => {
    const { container } = render(<PerspectiveGrid view={VIEW} label="Plant floor" columns={4} rows={3} />);

    expect(container.querySelectorAll('[data-slot="grid-line"]')).toHaveLength(5 + 4);
    expect(container.querySelector('[data-slot="horizon"]')).toHaveAttribute('y1', '140');
  });

  it('draws half rings behind the horizon on request', () => {
    const { container } = render(<PerspectiveGrid view={VIEW} label="Plant floor" horizonRings={3} />);

    expect(container.querySelectorAll('[data-slot="horizon-ring"]')).toHaveLength(3);
  });

  it('renders children on the floor', () => {
    render(
      <PerspectiveGrid view={VIEW} label="Plant floor">
        <circle data-testid="marker" cx={10} cy={10} r={2} />
      </PerspectiveGrid>
    );

    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });
});
