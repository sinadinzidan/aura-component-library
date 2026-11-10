import { render, screen } from '@testing-library/react';

import { HealthBreakdown } from './HealthBreakdown';

const INDICATORS = [
  { id: 'vibration', label: 'Vibration', score: 52, detail: '6.8 mm/s, rising' },
  { id: 'temperature', label: 'Temperature', score: 74 },
  { id: 'performance', label: 'Performance', score: 91 },
  { id: 'lubrication', label: 'Lubrication', score: null },
] as const;

describe(HealthBreakdown.name, () => {
  it('describes each indicator with its score and judgement', () => {
    render(<HealthBreakdown indicators={INDICATORS} />);

    expect(screen.getByRole('img', { name: 'Vibration: 52 of 100, poor' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Performance: 91 of 100, good' })).toBeInTheDocument();
  });

  it('colours only the indicators that need attention', () => {
    const { container } = render(<HealthBreakdown indicators={INDICATORS} />);

    const bars = Array.from(container.querySelectorAll('[data-slot="health-bar"]'));
    expect(bars[0]).toHaveClass('bg-chart-critical-450');
    expect(bars[1]).toHaveClass('bg-chart-warning-450');
    expect(bars[2]).toHaveClass('bg-chart-1-450');
  });

  it('sizes the bar by the score', () => {
    const { container } = render(<HealthBreakdown indicators={INDICATORS} />);

    expect(container.querySelector('[data-slot="health-bar"]')).toHaveStyle({ width: '52%' });
  });

  it('says so when an indicator has no data', () => {
    render(<HealthBreakdown indicators={INDICATORS} />);

    expect(screen.getByRole('img', { name: 'Lubrication: no data' })).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('judges against custom thresholds', () => {
    const { container } = render(<HealthBreakdown indicators={INDICATORS} thresholds={{ watch: 95, poor: 40 }} />);

    expect(container.querySelector('[data-health="poor"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-health="watch"]')).toHaveLength(3);
  });

  it('shows the finding beside the score', () => {
    render(<HealthBreakdown indicators={INDICATORS} />);

    expect(screen.getByText('6.8 mm/s, rising')).toBeInTheDocument();
  });
});
