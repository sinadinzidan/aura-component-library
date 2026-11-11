import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { MicroTrend } from './MicroTrend';

const VALUES = [4, 6, 5, 8, 7, 9];

describe(MicroTrend.name, () => {
  it('draws the form the look chooses and marks the last value', () => {
    const { container } = render(<MicroTrend values={VALUES} label="Vibration, last 6 hours" />);

    expect(screen.getByRole('img', { name: 'Vibration, last 6 hours' })).toHaveAttribute('data-variant', 'area');
    expect(container.querySelector('[data-part="area"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-part="marker"]')).toHaveLength(1);
  });

  it('draws bars in poster and colours the ones at or above the limit', () => {
    const { container } = render(
      <LookScope look="poster">
        <MicroTrend values={VALUES} label="Flaring" limit={8} overTone="warning" />
      </LookScope>,
    );

    expect(container.querySelectorAll('[data-part="bar"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-part="bar"][data-over="true"]')).toHaveLength(2);
    expect(container.querySelector('[data-part="limit"]')).toHaveAttribute('data-tone', 'warning');
    expect(container.querySelector('[data-part="marker"]')).toBeNull();
  });

  it('breaks at gaps, shades the band and marks the extremes', () => {
    const { container } = render(<MicroTrend values={[4, 6, null, 8, 7]} label="Level" variant="line" band={[5, 7]} marker="extremes" />);

    expect(container.querySelectorAll('[data-part="line"]')).toHaveLength(2);
    expect(container.querySelector('[data-part="band"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-part="marker"]')).toHaveLength(2);
  });

  it('says when there is no data', () => {
    const { container } = render(<MicroTrend values={[null, null]} label="Bearing temperature" />);

    expect(screen.getByRole('img', { name: 'Bearing temperature: no data' })).toHaveAttribute('data-empty', 'true');
    expect(container.querySelector('[data-part="empty"]')).not.toBeNull();
  });

  it('draws dots and steps on request', () => {
    const { container, rerender } = render(<MicroTrend values={VALUES} label="Samples" variant="dots" />);
    expect(container.querySelectorAll('[data-part="dot"]')).toHaveLength(6);

    rerender(<MicroTrend values={VALUES} label="Samples" variant="step" ink />);
    expect(container.querySelector('[data-part="line"]')?.getAttribute('d')).toContain('H');
  });
});
