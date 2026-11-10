import { render, screen } from '@testing-library/react';

import { GlowText } from './GlowText';

describe(GlowText.name, () => {
  it('renders its text with the tone it was given', () => {
    render(<GlowText tone="critical">Tripped</GlowText>);

    expect(screen.getByText('Tripped')).toHaveAttribute('data-tone', 'critical');
  });

  it('adds a halo by default and drops it on request', () => {
    const { rerender } = render(<GlowText>Online</GlowText>);
    expect(screen.getByText('Online').className).toContain('text-shadow');

    rerender(<GlowText glow={false}>Online</GlowText>);
    expect(screen.getByText('Online').className).not.toContain('text-shadow');
  });

  it('styles the label variant as an upper-case caption', () => {
    render(<GlowText variant="label">System status</GlowText>);

    expect(screen.getByText('System status')).toHaveClass('uppercase', 'tracking-widest');
  });
});
