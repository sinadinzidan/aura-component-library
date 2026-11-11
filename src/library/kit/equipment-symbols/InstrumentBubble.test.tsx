import { render, screen } from '@testing-library/react';

import { InstrumentBubble } from './InstrumentBubble';

describe(InstrumentBubble.name, () => {
  it('reads its letters, loop and mounting', () => {
    render(<InstrumentBubble letters="PT" loop="92531" />);

    expect(screen.getByRole('img', { name: 'PT 92531, field mounted' })).toBeInTheDocument();
    expect(screen.getByText('PT')).toBeInTheDocument();
    expect(screen.getByText('92531')).toBeInTheDocument();
  });

  it('draws a line through a panel instrument and a square around a control-system one', () => {
    const { container } = render(
      <>
        <InstrumentBubble letters="PI" loop="92531" mounting="panel" />
        <InstrumentBubble letters="PIC" loop="92531" mounting="dcs" />
      </>
    );

    const [panel, dcs] = container.querySelectorAll('svg');
    expect(panel.querySelector('rect')).toBeNull();
    expect(panel.querySelectorAll('path')).toHaveLength(1);
    expect(dcs.querySelector('rect')).not.toBeNull();
  });

  it('carries a state as its tone', () => {
    render(<InstrumentBubble letters="TAH" loop="92532" tone="warning" />);

    expect(screen.getByRole('img', { name: /TAH 92532/ })).toHaveAttribute('data-tone', 'warning');
  });
});
