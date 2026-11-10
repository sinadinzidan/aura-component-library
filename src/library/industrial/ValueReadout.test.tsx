import { render, screen } from '@testing-library/react';

import { ValueReadout } from './ValueReadout';

describe(ValueReadout.name, () => {
  it('prints the value with fixed decimals and its unit', () => {
    render(<ValueReadout value={48.6} unit="barg" decimals={1} />);

    expect(screen.getByText('48.6')).toHaveClass('tabular-nums');
    expect(screen.getByText('barg')).toHaveClass('text-muted-foreground');
  });

  it('colours the number by tone', () => {
    render(<ValueReadout value={146.3} decimals={1} tone="warning" />);

    expect(screen.getByText('146.3')).toHaveClass('text-warning-foreground-strong');
  });

  it('shows a muted em dash when there is no value', () => {
    render(<ValueReadout value={null} unit="°C" tone="critical" />);

    expect(screen.getByText('\u2014')).toHaveClass('text-muted-foreground');
  });

  it('stacks the unit under the number when asked', () => {
    const { container } = render(<ValueReadout value={12} unit="rpm" stacked />);

    expect(container.firstChild).toHaveClass('flex-col');
  });
});
