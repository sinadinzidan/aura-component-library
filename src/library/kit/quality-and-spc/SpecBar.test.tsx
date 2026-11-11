import { render, screen } from '@testing-library/react';

import { SpecBar } from './SpecBar';

describe(SpecBar.name, () => {
  it('reports an in-spec result neutrally with its specification', () => {
    const { container } = render(<SpecBar label="CO₂ content" value={2.1} lsl={0} usl={2.5} min={0} max={4} unit="mol %" decimals={1} method="GPA 2261" />);

    expect(screen.getByText('In spec')).toBeInTheDocument();
    expect(screen.getByText('Spec 0.0 – 2.5 mol %')).toBeInTheDocument();
    expect(screen.getByText('GPA 2261')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'CO₂ content' })).toHaveAttribute('aria-valuetext', '2.1 mol %, in spec');
    expect(container.firstElementChild).toHaveAttribute('data-verdict', 'ok');
  });

  it('flags a result above a one-sided limit', () => {
    const { container } = render(<SpecBar label="Water dew point" value={-6.2} usl={-8} min={-20} max={0} unit="°C" decimals={1} />);

    expect(screen.getByText('Above spec')).toBeInTheDocument();
    expect(screen.getByText('Spec max -8.0 °C')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
  });
});
