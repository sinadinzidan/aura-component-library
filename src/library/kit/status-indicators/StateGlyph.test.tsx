import { render, screen } from '@testing-library/react';

import { StateGlyph } from './StateGlyph';

describe(StateGlyph.name, () => {
  it('is decorative next to a word', () => {
    const { container } = render(<StateGlyph shape="triangle" tone="critical" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-shape', 'triangle');
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
  });

  it('names itself when it stands alone and takes a size', () => {
    render(<StateGlyph shape="circle" tone="success" label="Running" size={20} attention />);

    const glyph = screen.getByRole('img', { name: 'Running' });
    expect(glyph).toHaveStyle({ width: '20px' });
    expect(glyph).toHaveAttribute('data-attention', 'true');
  });
});
