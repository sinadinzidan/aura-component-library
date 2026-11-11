import { render, screen } from '@testing-library/react';

import { CapabilityHistogram } from './CapabilityHistogram';
import type { SpcLimits } from './spc';

const LIMITS: SpcLimits = { mean: 10, sigma: 1, ucl: 13, lcl: 7 };

describe(CapabilityHistogram.name, () => {
  it('names the histogram and writes both specification limits', () => {
    render(<CapabilityHistogram label="Results against the specification" values={[9, 10, 10.5, 11]} limits={LIMITS} spec={{ lsl: 6, usl: 14 }} />);

    expect(screen.getByRole('img', { name: 'Results against the specification' })).toBeInTheDocument();
    expect(screen.getByText('Lower spec 6.0')).toBeInTheDocument();
    expect(screen.getByText('Upper spec 14.0')).toBeInTheDocument();
  });

  it('draws one bar per bin and counts every value once', () => {
    const { container } = render(<CapabilityHistogram label="Histogram" values={[9, 10, 10.5, 11]} limits={LIMITS} spec={{ lsl: 6, usl: 14 }} bins={8} />);

    const bars = [...container.querySelectorAll('[data-bin]')];
    expect(bars).toHaveLength(8);
    expect(bars.reduce((sum, bar) => sum + Number(bar.getAttribute('data-bin')), 0)).toBe(4);
  });

  it('leaves out the limit a one-sided specification does not have', () => {
    const { container } = render(<CapabilityHistogram label="Histogram" values={[9, 10]} limits={LIMITS} spec={{ usl: 14 }} />);

    expect(container.querySelector('[data-limit="usl"]')).toBeInTheDocument();
    expect(container.querySelector('[data-limit="lsl"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-limit="mean"]')).toBeInTheDocument();
    expect(screen.queryByText(/Lower spec/)).not.toBeInTheDocument();
  });
});
