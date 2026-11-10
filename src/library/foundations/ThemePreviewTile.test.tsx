import { render, screen } from '@testing-library/react';

import { ThemePreviewTile } from './ThemePreviewTile';

describe(ThemePreviewTile.name, () => {
  it('captions the tile with the preset name', () => {
    render(<ThemePreviewTile preset="control-room">Sample</ThemePreviewTile>);

    expect(screen.getByRole('figure')).toHaveTextContent('Control room');
  });

  it('renders the sample inside the preset scope', () => {
    render(<ThemePreviewTile preset="control-room">Sample</ThemePreviewTile>);

    const scope = screen.getByText('Sample');
    expect(scope).toHaveAttribute('data-theme-scope', 'control-room');
    expect(scope).toHaveClass('dark');
  });

  it('says a dark preset is always dark', () => {
    render(<ThemePreviewTile preset="aura-dark">Sample</ThemePreviewTile>);

    expect(screen.getByText('Always dark')).toBeInTheDocument();
  });

  it('says a light preset follows the page mode and does not force dark', () => {
    render(<ThemePreviewTile preset="fjord">Sample</ThemePreviewTile>);

    expect(screen.getByText('Follows page mode')).toBeInTheDocument();
    expect(screen.getByText('Sample')).not.toHaveClass('dark');
  });

  it('falls back to the id for an unknown preset and accepts a custom caption', () => {
    const { rerender } = render(<ThemePreviewTile preset="not-a-preset">Sample</ThemePreviewTile>);
    expect(screen.getByText('not-a-preset')).toBeInTheDocument();

    rerender(
      <ThemePreviewTile preset="fjord" caption="Brand blue">
        Sample
      </ThemePreviewTile>
    );

    expect(screen.getByText('Brand blue')).toBeInTheDocument();
  });
});
