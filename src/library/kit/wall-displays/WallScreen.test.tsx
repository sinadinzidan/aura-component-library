import { render, screen } from '@testing-library/react';

import { WallScreen } from './WallScreen';

describe(WallScreen.name, () => {
  it('shows where, what and the time around the content', () => {
    render(
      <WallScreen site="Control room 1" title="Plant status" clock="14:00" meta="Day shift" footer={<p>Ticker</p>}>
        <p>Content</p>
      </WallScreen>
    );

    expect(screen.getByRole('heading', { name: 'Plant status' })).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('Day shift')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Ticker')).toBeInTheDocument();
  });
});
