import { render, screen } from '@testing-library/react';

import { NeonPanel } from './NeonPanel';

describe(NeonPanel.name, () => {
  it('is a region named by its title', () => {
    render(<NeonPanel title="Area readout">Body</NeonPanel>);

    expect(screen.getByRole('region', { name: 'Area readout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Area readout' })).toBeInTheDocument();
  });

  it('shows the meta text and the body', () => {
    render(
      <NeonPanel title="Area readout" meta="NK-23">
        <p>Gas compression</p>
      </NeonPanel>
    );

    expect(screen.getByText('NK-23')).toBeInTheDocument();
    expect(screen.getByText('Gas compression')).toBeInTheDocument();
  });

  it('carries its tone for styling', () => {
    render(
      <NeonPanel title="Trip" tone="critical">
        Body
      </NeonPanel>
    );

    expect(screen.getByRole('region', { name: 'Trip' })).toHaveAttribute('data-tone', 'critical');
  });
});
