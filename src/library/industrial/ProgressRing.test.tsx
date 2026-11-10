import { render, screen } from '@testing-library/react';

import { ProgressRing } from './ProgressRing';

describe(ProgressRing.name, () => {
  it('names the share it shows', () => {
    render(<ProgressRing label="Availability" value={96.4} decimals={1} />);

    expect(screen.getByRole('img', { name: 'Availability: 96.4\u00a0%' })).toBeInTheDocument();
  });

  it('draws the value as a share of the circumference', () => {
    const { container } = render(<ProgressRing label="Work order progress" value={50} size="md" />);

    expect(container.querySelector('[data-slot="ring-value"]')).toHaveAttribute('stroke-dasharray', '91.11 182.21');
  });

  it('measures against a custom maximum', () => {
    const { container } = render(<ProgressRing label="Days since incident" value={365} max={365} unit="d" />);

    expect(container.querySelector('[data-slot="ring-value"]')).toHaveAttribute('stroke-linecap', 'butt');
  });

  it('uses the status ramp for a toned ring', () => {
    const { container } = render(<ProgressRing label="Health score" value={41} tone="critical" />);

    expect(container.querySelector('[data-slot="ring-value"]')).toHaveClass('stroke-chart-critical-450');
  });

  it('draws only the track at zero or without a value', () => {
    const { container } = render(<ProgressRing label="Progress" value={null} />);

    expect(container.querySelector('[data-slot="ring-track"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="ring-value"]')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Progress: no data' })).toBeInTheDocument();
  });

  it('hides the number and shows the label when asked', () => {
    render(<ProgressRing label="Health score" value={72} showValue={false} showLabel />);

    expect(screen.queryByText('72')).not.toBeInTheDocument();
    expect(screen.getByText('Health score')).toBeInTheDocument();
  });
});
