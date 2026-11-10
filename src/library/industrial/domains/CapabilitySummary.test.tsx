import { render, screen } from '@testing-library/react';

import { CapabilitySummary } from './CapabilitySummary';

// Mean 10, sample standard deviation exactly 1.
const VALUES = [9, 10, 11];

describe(CapabilitySummary.name, () => {
  it('prints Cp and Cpk to two decimals', () => {
    const { container } = render(<CapabilitySummary label="Wobbe index" values={VALUES} lsl={4} usl={13} />);

    expect(container.querySelector('[data-slot="cp"]')).toHaveTextContent('1.50');
    expect(container.querySelector('[data-slot="cpk"]')).toHaveTextContent('1.00');
  });

  it('gives a capable verdict from Cpk 1.33', () => {
    render(<CapabilitySummary label="Wobbe index" values={VALUES} lsl={4} usl={16} />);

    expect(screen.getByText('Capable')).toBeInTheDocument();
  });

  it('gives a marginal verdict between 1.00 and 1.33', () => {
    render(<CapabilitySummary label="Wobbe index" values={VALUES} lsl={4} usl={13} />);

    expect(screen.getByText('Marginal')).toBeInTheDocument();
  });

  it('gives a not capable verdict below 1.00', () => {
    render(<CapabilitySummary label="Wobbe index" values={VALUES} lsl={8} usl={12} />);

    expect(screen.getByText('Not capable')).toBeInTheDocument();
  });

  it('marks histogram bars outside the specification', () => {
    const { container } = render(<CapabilitySummary label="Wobbe index" values={[9, 10, 11, 14]} lsl={8} usl={12} bins={10} />);

    expect(container.querySelectorAll('[data-slot="histogram-bar"]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-slot="histogram-bar"][data-outside="true"]').length).toBeGreaterThan(0);
  });

  it('labels both specification limits', () => {
    render(<CapabilitySummary label="Wobbe index" values={VALUES} lsl={4} usl={16} />);

    expect(screen.getByText('LSL 4.0')).toBeInTheDocument();
    expect(screen.getByText('USL 16.0')).toBeInTheDocument();
  });

  it('describes the result in the histogram name', () => {
    render(<CapabilitySummary label="Wobbe index" values={[9, 10, 11, 14]} lsl={8} usl={12} unit="MJ/Sm³" />);

    expect(screen.getByRole('img')).toHaveAccessibleName(/^Wobbe index capability: Cp .*not capable; mean 11\.0 MJ\/Sm³, 1 of 4 outside 8\.0 to 12\.0 MJ\/Sm³$/);
  });
});
