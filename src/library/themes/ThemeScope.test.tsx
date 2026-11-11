import { render, screen } from '@testing-library/react';

import { Canvas } from '../kit/Canvas';

import { DEFAULT_THEME } from './themes';
import { ThemeScope } from './ThemeScope';

describe(ThemeScope.name, () => {
  it('applies the attributes of a named preset and forces dark for a dark preset', () => {
    render(<ThemeScope preset="control-room">Console</ThemeScope>);

    const scope = screen.getByText('Console');
    expect(scope).toHaveAttribute('data-accent', 'nordic');
    expect(scope).toHaveAttribute('data-shape', 'sharp');
    expect(scope).toHaveAttribute('data-density', 'compact');
    expect(scope).toHaveClass('dark');
  });

  it('does not force a mode for a light preset', () => {
    render(<ThemeScope preset="blueprint">Tool</ThemeScope>);

    expect(screen.getByText('Tool')).not.toHaveClass('dark');
    expect(screen.getByText('Tool')).toHaveAttribute('data-surface', 'tinted');
  });

  it('prefers explicit settings over the preset', () => {
    render(
      <ThemeScope preset="control-room" settings={{ ...DEFAULT_THEME, accent: 'pink' }}>
        Custom
      </ThemeScope>
    );

    expect(screen.getByText('Custom')).toHaveAttribute('data-accent', 'pink');
    expect(screen.getByText('Custom')).not.toHaveClass('dark');
  });

  it('falls back to the default theme for an unknown preset', () => {
    render(<ThemeScope preset="no-such-theme">Fallback</ThemeScope>);

    expect(screen.getByText('Fallback')).toHaveAttribute('data-accent', 'mountain');
  });

  it('keeps layout classes passed by the caller', () => {
    render(
      <ThemeScope preset="aura" className="w-full">
        Sized
      </ThemeScope>
    );

    expect(screen.getByText('Sized')).toHaveClass('w-full');
  });

  it("gives kit components inside the preset's look", () => {
    render(
      <ThemeScope preset="control-room">
        <Canvas>Board</Canvas>
      </ThemeScope>
    );

    expect(screen.getByText('Board')).toHaveAttribute('data-look', 'console');
  });
});
