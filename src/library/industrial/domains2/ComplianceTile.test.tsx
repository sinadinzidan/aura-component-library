import { render, screen } from '@testing-library/react';

import { ComplianceTile } from './ComplianceTile';

describe(ComplianceTile.name, () => {
  it('states the reading, the limit and the verdict', () => {
    render(<ComplianceTile label="Turbidity" value={0.31} unit="NTU" decimals={2} limit={{ max: 1 }} />);

    expect(screen.getByText('0.31')).toBeInTheDocument();
    expect(screen.getByText('Limit ≤ 1 NTU')).toBeInTheDocument();
    expect(screen.getByText('Within limit')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName('Turbidity: 0.31 NTU, limit ≤ 1 ntu, within limit');
  });

  it('keeps the number neutral while the limit is met with margin', () => {
    render(<ComplianceTile label="Turbidity" value={0.31} unit="NTU" decimals={2} limit={{ max: 1 }} />);

    expect(screen.getByText('0.31')).toHaveClass('text-base-foreground');
  });

  it('warns when close to the limit', () => {
    const { container } = render(<ComplianceTile label="Turbidity" value={0.94} unit="NTU" decimals={2} limit={{ max: 1 }} />);

    expect(container.querySelector('[data-slot="compliance-tile"]')).toHaveAttribute('data-verdict', 'close');
    expect(screen.getByText('Close to limit')).toBeInTheDocument();
    expect(screen.getByText('0.94')).toHaveClass('text-warning-foreground-strong');
  });

  it('is critical past the limit', () => {
    render(<ComplianceTile label="Turbidity" value={1.3} unit="NTU" decimals={1} limit={{ max: 1 }} />);

    expect(screen.getByText('Limit exceeded')).toBeInTheDocument();
    expect(screen.getByText('1.3')).toHaveClass('text-critical-foreground-strong');
  });

  it('describes a minimum and a band', () => {
    const { rerender } = render(<ComplianceTile label="Free chlorine" value={0.42} unit="mg/L" decimals={2} limit={{ min: 0.2 }} />);
    expect(screen.getByText('Limit ≥ 0.20 mg/L')).toBeInTheDocument();

    rerender(<ComplianceTile label="pH" value={7.6} decimals={1} limit={{ min: 6.5, max: 9.5 }} />);

    expect(screen.getByText('Limit 6.5–9.5')).toBeInTheDocument();
  });

  it('draws a tick per limit on the scale', () => {
    const { container } = render(<ComplianceTile label="pH" value={7.5} decimals={1} limit={{ min: 6.5, max: 9.5 }} scaleMin={5} scaleMax={10} />);

    const ticks = [...container.querySelectorAll<HTMLElement>('[data-slot="compliance-limit"]')].map((tick) => tick.style.left);
    expect(ticks).toEqual(['30%', '90%']);
    expect(container.querySelector<HTMLElement>('[data-slot="compliance-fill"]')?.style.width).toBe('50%');
  });

  it('prints the sample count and the basis', () => {
    render(
      <ComplianceTile label="Turbidity" value={0.31} unit="NTU" decimals={2} limit={{ max: 1 }} samples={{ compliant: 358, total: 360 }} basis="Drinking water regulation · 30-day rolling" />
    );

    expect(screen.getByText('358 of 360 samples compliant')).toBeInTheDocument();
    expect(screen.getByText('Drinking water regulation · 30-day rolling')).toBeInTheDocument();
  });
});
