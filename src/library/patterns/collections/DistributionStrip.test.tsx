import { render, screen } from '@testing-library/react';

import { DistributionStrip } from './DistributionStrip';

const SEGMENTS = [
  { id: 'running', label: 'Running', value: 6 },
  { id: 'standby', label: 'Standby', value: 2 },
  { id: 'stopped', label: 'Stopped', value: 0 },
];

function widths(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('[data-slot="distribution-segment"]')].map((segment) => segment.style.width);
}

describe(DistributionStrip.name, () => {
  it('describes the whole split in its accessible name', () => {
    render(<DistributionStrip label="Equipment by state" segments={SEGMENTS} />);

    expect(screen.getByRole('img', { name: 'Equipment by state: Running 6, Standby 2, Stopped 0' })).toBeInTheDocument();
  });

  it('sizes segments by their share and skips empty ones', () => {
    const { container } = render(<DistributionStrip label="Equipment by state" segments={SEGMENTS} />);

    expect(widths(container)).toEqual(['75%', '25%']);
  });

  it('keeps empty segments in the legend', () => {
    render(<DistributionStrip label="Equipment by state" segments={SEGMENTS} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('can show shares instead of values', () => {
    render(<DistributionStrip label="Equipment by state" segments={SEGMENTS} legend="shares" />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('hides the legend when asked', () => {
    render(<DistributionStrip label="Equipment by state" segments={SEGMENTS} legend="none" />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('uses the status colour of a toned segment', () => {
    const { container } = render(
      <DistributionStrip label="Equipment by state" segments={[{ id: 'tripped', label: 'Tripped', value: 1, tone: 'critical' }]} />
    );

    expect(container.querySelector('[data-slot="distribution-segment"]')?.className).toContain('bg-chart-critical-450');
  });
});
