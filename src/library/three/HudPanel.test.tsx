import { render, screen } from '@testing-library/react';

import { HudPanel } from './HudPanel';

describe(HudPanel.name, () => {
  it('is a region named by its title', () => {
    render(<HudPanel title="Plant status">Body</HudPanel>);

    expect(screen.getByRole('region', { name: 'Plant status' })).toHaveTextContent('Body');
  });

  it('shows meta text and actions in the heading line', () => {
    render(
      <HudPanel title="Open alarms" meta="4" actions={<button type="button">Close</button>}>
        Body
      </HudPanel>
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('sets its title in sentence case in the UI typeface', () => {
    render(<HudPanel title="Selected unit">Body</HudPanel>);

    expect(screen.getByRole('heading', { name: 'Selected unit' }).className).not.toMatch(/uppercase|font-mono|tracking-wide/);
  });
});
