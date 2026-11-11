import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { SymbolGlyph } from './SymbolGlyph';

describe(SymbolGlyph.name, () => {
  it('is an image named after its symbol', () => {
    render(<SymbolGlyph kind="centrifugal-pump" />);

    expect(screen.getByRole('img', { name: 'Centrifugal pump' })).toHaveAttribute('data-fill', 'none');
  });

  it('takes a name of its own, or none when text beside it names it', () => {
    const { container, rerender } = render(<SymbolGlyph kind="compressor" label="1st stage compressor, running" />);
    expect(screen.getByRole('img', { name: '1st stage compressor, running' })).toBeInTheDocument();

    rerender(<SymbolGlyph kind="compressor" label={null} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lets the look decide how a state fills the body', () => {
    const { container } = render(
      <>
        <SymbolGlyph kind="motor" tone="success" />
        <LookScope look="console">
          <SymbolGlyph kind="motor" tone="success" />
        </LookScope>
        <LookScope look="blueprint">
          <SymbolGlyph kind="motor" tone="success" />
        </LookScope>
      </>
    );

    expect([...container.querySelectorAll('svg')].map((svg) => svg.getAttribute('data-fill'))).toEqual(['soft', 'solid', 'none']);
  });

  it('marks a fault and replaces the letters', () => {
    const { container } = render(<SymbolGlyph kind="instrument" text="TT" fault />);

    expect(screen.getByText('TT')).toBeInTheDocument();
    expect(container.querySelector('[data-part="fault"]')).not.toBeNull();
  });
});
