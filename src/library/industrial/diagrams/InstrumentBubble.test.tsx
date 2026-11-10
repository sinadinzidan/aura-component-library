import { render, screen } from '@testing-library/react';

import { InstrumentBubble } from './InstrumentBubble';

describe(InstrumentBubble.name, () => {
  it('names itself from the letters and loop number', () => {
    render(<InstrumentBubble letters="PT" loop="92531" />);

    expect(screen.getByRole('img', { name: 'PT 92531' })).toBeInTheDocument();
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('92531')).toBeInTheDocument();
  });

  it('shows letters alone without a loop number', () => {
    render(<InstrumentBubble letters="TT" />);

    expect(screen.getByRole('img', { name: 'TT' })).toBeInTheDocument();
  });

  it('takes a custom accessible name', () => {
    render(<InstrumentBubble letters="LT" loop="10012" label="Separator level transmitter" />);

    expect(screen.getByRole('img', { name: 'Separator level transmitter' })).toBeInTheDocument();
  });

  it('draws the centre line only for panel mounting', () => {
    const { container, rerender } = render(<InstrumentBubble letters="FT" />);
    expect(container.querySelector('[data-slot="instrument-panel-line"]')).not.toBeInTheDocument();

    rerender(<InstrumentBubble letters="FT" mounting="panel" />);

    expect(container.querySelector('[data-slot="instrument-panel-line"]')).toBeInTheDocument();
  });

  it('takes the status colour for an abnormal reading', () => {
    render(<InstrumentBubble letters="TT" tone="warning" />);

    expect(screen.getByRole('img')).toHaveClass('text-warning-foreground-strong');
  });

  it('uses a size utility on its own and diagram units when nested', () => {
    const { rerender } = render(<InstrumentBubble letters="PT" size="lg" />);
    expect(screen.getByRole('img')).toHaveClass('size-12');

    rerender(
      <svg>
        <InstrumentBubble letters="PT" size={28} cx={50} cy={30} />
      </svg>
    );

    expect(screen.getByRole('img', { name: 'PT' })).toHaveAttribute('x', '36');
    expect(screen.getByRole('img', { name: 'PT' })).toHaveAttribute('width', '28');
  });
});
