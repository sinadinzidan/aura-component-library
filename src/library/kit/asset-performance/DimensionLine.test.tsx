import { render, screen } from '@testing-library/react';

import { DimensionLine } from './DimensionLine';

describe(DimensionLine.name, () => {
  it('is a meter that reads the written value', () => {
    render(<DimensionLine label="Health score" value={72} max={100} display="72 / 100" />);

    const meter = screen.getByRole('meter', { name: 'Health score' });
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuetext', '72 / 100');
    expect(screen.getByText('72 / 100')).toBeInTheDocument();
  });

  it('names the limit in the value text and on the line', () => {
    render(<DimensionLine label="MTBF" value={212} max={600} display="212 h" limit={{ value: 450, label: 'Target' }} />);

    expect(screen.getByRole('meter', { name: 'MTBF' })).toHaveAttribute('aria-valuetext', '212 h, target 450');
    expect(screen.getByText('Target 450')).toBeInTheDocument();
  });

  it('never draws past the scale', () => {
    const { container } = render(<DimensionLine label="Downtime" value={900} max={600} display="900 h" />);

    const line = container.querySelector<HTMLElement>('.border-t-2');
    expect(line?.style.width).toBe('100%');
  });
});
