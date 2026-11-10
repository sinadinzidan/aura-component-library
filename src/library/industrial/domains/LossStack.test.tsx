import { render, screen } from '@testing-library/react';

import { LossStack } from './LossStack';

const PROPS = {
  label: 'OEE losses',
  start: { label: 'Planned time', value: 100 },
  losses: [
    { label: 'Availability loss', value: 10 },
    { label: 'Performance loss', value: 9 },
  ],
  resultLabel: 'OEE',
  unit: '%',
};

describe(LossStack.name, () => {
  it('describes the result and every loss in its accessible name', () => {
    render(<LossStack {...PROPS} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'OEE losses: OEE 81.0 % of 100.0 %; Availability loss 10.0 %, Performance loss 9.0 %'
    );
  });

  it('renders a row for the start, each loss and the result as a waterfall', () => {
    const { container } = render(<LossStack {...PROPS} />);

    const kinds = [...container.querySelectorAll<HTMLElement>('[data-slot="loss-row"]')].map((row) => row.dataset.kind);
    expect(kinds).toEqual(['start', 'loss', 'loss', 'result']);
  });

  it('hangs each loss bar from the end of the one before', () => {
    const { container } = render(<LossStack {...PROPS} />);

    const bars = [...container.querySelectorAll<HTMLElement>('[data-slot="loss-row"] .absolute')];
    expect(bars[1].style.left).toBe('90%');
    expect(bars[2].style.left).toBe('81%');
    expect(bars[2].style.width).toBe('9%');
  });

  it('prints losses with a minus sign', () => {
    render(<LossStack {...PROPS} />);

    expect(screen.getByText(/−10\.0/)).toBeInTheDocument();
  });

  it('sizes the stack segments by their share of the start', () => {
    const { container } = render(<LossStack {...PROPS} variant="stack" />);

    expect(container.querySelector<HTMLElement>('[data-slot="loss-result"]')?.style.width).toBe('81%');
    const segments = [...container.querySelectorAll<HTMLElement>('[data-slot="loss-segment"]')];
    expect(segments.map((segment) => segment.style.width)).toEqual(['10%', '9%']);
  });

  it('lists the result and losses with values under the stack', () => {
    render(<LossStack {...PROPS} variant="stack" />);

    expect(screen.getByText('Availability loss')).toBeInTheDocument();
    expect(screen.getByText('81.0 %')).toBeInTheDocument();
  });
});
